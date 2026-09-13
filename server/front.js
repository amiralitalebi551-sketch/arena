#!/usr/bin/env node
/*
 * front.js — tiny TCP/HTTP router that sits in front of Xray inside the container.
 *
 * Why it exists:
 *   1. On ClawCloud/Cloudflare the TLS is terminated by the platform ingress, so the
 *      container only ever sees plain WebSocket. This forwards those bytes untouched
 *      to Xray (raw TCP pipe, no HTTP re-serialization => zero overhead, zero bugs).
 *   2. It answers the "is this endpoint alive?" sanity check the right way:
 *        GET /                -> 404
 *        broken WS upgrade    -> 400
 *        real WS on the path  -> proxied to Xray
 *   3. It runs the egress-IP watchdog. Every IP_SAMPLE_SECONDS it asks a few public
 *      echo services "what IP do you see?" and records the answer. That is how we
 *      PROVE the egress IP is static instead of assuming it. History survives restarts
 *      if you mount a volume at /data.
 *   4. It serves /__ip, /__sub, /__panel, /__health so you (and a GitHub Action cron)
 *      can read the proof and get the vless:// links without touching a terminal.
 *
 * Optional direct-TLS mode (TLS_PORT + TLS_CERT + TLS_KEY): the exact same code path,
 * just wrapped in TLS. Use that on a plain VPS / Oracle box where nothing terminates
 * TLS for you (Cloudflare SSL mode must then be "Full").
 */
'use strict';

const net = require('net');
const fs = require('fs');
const tls = require('tls');

const env = process.env;

const CFG = {
  port: parseInt(env.PORT || '80', 10),
  tlsPort: parseInt(env.TLS_PORT || '0', 10),
  tlsCert: env.TLS_CERT || '',
  tlsKey: env.TLS_KEY || '',
  xrayHost: env.XRAY_HOST || '127.0.0.1',
  xrayPort: parseInt(env.XRAY_PORT || '2087', 10),
  wsPath: env.WS_PATH || '/cf5d72f32b82',
  token: env.PANEL_TOKEN || 'cf5d72f32b82',
  uuid: env.UUID || 'bac2db35-df5b-47e1-a8e1-19ecd81c1ed5',
  publicPort: parseInt(env.PUBLIC_PORT || '443', 10),
  fp: env.FP || 'chrome',
  alpn: env.ALPN || 'http/1.1',
  cleanIPs: (env.CLEAN_IPS || '104.17.147.22,162.159.36.1,172.67.74.1,104.18.0.1')
    .split(',').map((s) => s.trim()).filter(Boolean),
  sampleMs: Math.max(60, parseInt(env.IP_SAMPLE_SECONDS || '900', 10)) * 1000,
  stateFile: env.STATE_FILE || ((env.STATE_DIR || '/data').replace(/\/+$/, '') + '/ip-state.json'),
  echo: (env.IP_ECHO_URLS ||
    'https://api.ipify.org,https://ifconfig.me/ip,https://api-ipv4.ip.sb/ip,https://ipv4.icanhazip.com,https://checkip.amazonaws.com')
    .split(',').map((s) => s.trim()).filter(Boolean),
  remark: env.REMARK || 'claw-vless',
  sites: (env.VERIFY_SITES || 'youtube.com,instagram.com,x.com,telegram.org,chat.openai.com,discord.com')
    .split(',').map((x) => x.trim()).filter(Boolean),
  speedURL: env.VERIFY_SPEED_URL || 'https://speed.cloudflare.com/__down?bytes=10000000',
  verifyEveryMs: Math.max(600, parseInt(env.VERIFY_EVERY_MINUTES || '360', 10)) * 60000,
};

const startedAt = Date.now();
const log = (...a) => console.log(new Date().toISOString(), '[front]', ...a);

/* ------------------------------------------------------------------ state */

let stateWarned = false;
let state = {
  createdAt: new Date().toISOString(),
  bootId: Math.random().toString(36).slice(2, 10),
  current: null,
  firstSeen: null,
  restarts: 0,
  verify: null,  // last self-test
  samples: [],   // [{ts, ip, via}]
  changes: [],   // [{ts, from, to}]
  errors: 0,
};

function loadState() {
  try {
    const raw = JSON.parse(fs.readFileSync(CFG.stateFile, 'utf8'));
    if (raw && Array.isArray(raw.samples)) {
      state = Object.assign(state, raw);
      state.restarts = (raw.restarts || 0) + 1;
      log('restored history from', CFG.stateFile, '| samples=', state.samples.length,
        '| current=', state.current, '| restarts=', state.restarts);
    }
  } catch (e) { /* first boot, no volume, or corrupt file — all fine */ }
}

function saveState() {
  try {
    fs.mkdirSync(require('path').dirname(CFG.stateFile), { recursive: true });
    const tmp = CFG.stateFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, CFG.stateFile);
  } catch (e) { if (!stateWarned) { stateWarned = true; log('state save failed (no writable volume?):', e.message); } }
}

/* --------------------------------------------------------------- watchdog */

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

async function askEcho(url) {
  const r = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: { 'user-agent': 'curl/8.5.0', accept: '*/*' },
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const t = (await r.text()).trim();
  if (IPV4.test(t) || (IPV6.test(t) && t.includes(':'))) return t;
  throw new Error('not an ip: ' + t.slice(0, 40));
}

async function sampleIP() {
  for (const u of CFG.echo) {
    try { return { ip: await askEcho(u), via: u }; } catch (e) { /* try next */ }
  }
  state.errors++;
  return null;
}

async function watchLoop() {
  for (;;) {
    const r = await sampleIP();
    const ts = new Date().toISOString();
    if (r) {
      const prev = state.current;
      state.current = r.ip;
      if (!state.firstSeen) state.firstSeen = ts;
      if (prev && prev !== r.ip) {
        state.changes.push({ ts, from: prev, to: r.ip });
        if (state.changes.length > 200) state.changes.splice(0, state.changes.length - 200);
        log('!!! EGRESS IP CHANGED', prev, '->', r.ip, '(', state.changes.length, 'changes )');
      } else {
        log('egress ip =', r.ip, 'via', r.via, '| changes so far =', state.changes.length);
      }
      state.samples.push({ ts, ip: r.ip, via: r.via });
      if (state.samples.length > 2000) state.samples.splice(0, state.samples.length - 2000);
    } else {
      log('ip sample failed (all echo services unreachable)');
    }
    saveState();
    await new Promise((res) => setTimeout(res, CFG.sampleMs));
  }
}


/* --------------------------------------------------------------- self-test */
/* Runs the §5 protocol from INSIDE the container, i.e. against the very egress
 * path your traffic will use. This is the part nobody else can fake: it proves
 * the exit IP, that censored sites are reachable from it, and how fast it is.  */

async function fetchCode(url, timeout) {
  try {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(timeout || 20000),
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' },
    });
    return r.status;
  } catch (e) { return 'ERR:' + (e.name === 'TimeoutError' ? 'timeout' : e.message).slice(0, 24); }
}

async function measureSpeed(url, maxMs) {
  const t0 = Date.now();
  let bytes = 0;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(maxMs || 45000) });
    const rd = r.body.getReader();
    for (;;) {
      const { done, value } = await rd.read();
      if (done) break;
      bytes += value.length;
      if (Date.now() - t0 > (maxMs || 45000)) { try { rd.cancel(); } catch (e) {} break; }
    }
  } catch (e) { return { bytes, error: e.message.slice(0, 60) }; }
  const sec = (Date.now() - t0) / 1000 || 0.001;
  return { bytes, seconds: +sec.toFixed(2), mbps: +((bytes * 8) / sec / 1e6).toFixed(2) };
}

let verifyBusy = false;

async function runSelfTest(rounds) {
  if (verifyBusy) return { busy: true, note: 'a self-test is already running' };
  verifyBusy = true;
  const t0 = Date.now();
  const R = Math.max(1, Math.min(20, rounds || 5));
  const out = { startedAt: new Date().toISOString(), rounds: R };
  try {
    // 1) connectivity
    const conn = [];
    for (let i = 0; i < R; i++) {
      conn.push(await fetchCode('https://www.google.com/generate_204', 15000));
    }
    out.connectivity = { codes: conn, ok: conn.filter((c) => c === 204).length, total: R };

    // 2) egress IP, sampled
    const ips = [];
    for (let i = 0; i < R; i++) {
      const r = await sampleIP();
      ips.push(r ? r.ip : 'ERR');
    }
    const uniq = [...new Set(ips.filter((x) => x !== 'ERR'))];
    out.egressIP = { samples: ips, distinct: uniq, isStaticNow: uniq.length === 1 };
    out.egressIP.current = uniq.length === 1 ? uniq[0] : state.current;

    // 3) censored / blocked sites
    out.sites = {};
    for (const s of CFG.sites) out.sites[s] = await fetchCode('https://' + s + '/', 25000);
    out.sitesDead = Object.entries(out.sites).filter(([, v]) => String(v).startsWith('ERR')).map(([k]) => k);

    // 4) throughput
    out.throughput = await measureSpeed(CFG.speedURL, 45000);

    // 5) identity of the exit
    const ip = out.egressIP.current;
    if (ip) {
      try {
        const g = await fetch('https://ipinfo.io/' + ip + '/json', { signal: AbortSignal.timeout(12000) });
        const j = await g.json();
        out.exit = { ip, org: j.org, city: j.city, region: j.region, country: j.country };
      } catch (e) { out.exit = { ip, org: 'lookup failed' }; }
    }

    out.seconds = +((Date.now() - t0) / 1000).toFixed(1);
    out.finishedAt = new Date().toISOString();
    out.verdict = {
      connectivity: out.connectivity.ok === R,
      ipStaticNow: out.egressIP.isStaticNow,
      ipStaticOverTime: state.changes.length === 0 && state.samples.length > 1,
      allSitesReachable: out.sitesDead.length === 0,
      fastEnough: (out.throughput.mbps || 0) > 1,
    };
    out.verdict.PASS = Object.values(out.verdict).every(Boolean);
    state.verify = out;
    saveState();
    log('self-test done in ' + out.seconds + 's  PASS=' + out.verdict.PASS +
        '  ip=' + out.egressIP.current + '  mbps=' + out.throughput.mbps);
    return out;
  } finally { verifyBusy = false; }
}

async function verifyLoop() {
  await new Promise((r) => setTimeout(r, 25000)); // let xray settle first
  for (;;) {
    try { await runSelfTest(5); } catch (e) { log('self-test crashed:', e.message); }
    await new Promise((r) => setTimeout(r, CFG.verifyEveryMs));
  }
}

/* ------------------------------------------------------------------ links */

function cleanHost(reqHost) {
  const h = String(reqHost || env.PUBLIC_HOST || '').split(',')[0].trim();
  return h.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
}

function vlessLink(addr, host, remark) {
  const q = new URLSearchParams({
    encryption: 'none',
    security: 'tls',
    sni: host,
    alpn: CFG.alpn,
    fp: CFG.fp,
    type: 'ws',
    host: host,
    path: CFG.wsPath,
  });
  // URLSearchParams encodes '/' as %2F already, which is what v2rayNG/Hiddify expect.
  return `vless://${CFG.uuid}@${addr}:${CFG.publicPort}?${q.toString()}#${encodeURIComponent(remark)}`;
}

function allLinks(host) {
  const out = [];
  out.push({ kind: 'direct', remark: `${CFG.remark}-direct`, url: vlessLink(host, host, `${CFG.remark}-direct`) });
  CFG.cleanIPs.forEach((ip, i) => {
    out.push({ kind: 'cleanip', ip, remark: `${CFG.remark}-cf${i + 1}`, url: vlessLink(ip, host, `${CFG.remark}-cf${i + 1}`) });
  });
  return out;
}

function subBase64(host) {
  return Buffer.from(allLinks(host).map((l) => l.url).join('\n'), 'utf8').toString('base64');
}

/* ------------------------------------------------------------- http layer */

function httpRes(sock, code, body, type, extra) {
  const b = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
  // NOTE: end() first and write() after loses the body (write-after-end). One
  // single end() with headers+body concatenated is the only correct way.
  const head = Buffer.from([
    `HTTP/1.1 ${code}`,
    `content-type: ${type || 'text/plain; charset=utf-8'}`,
    `content-length: ${b.length}`,
    'connection: close',
    'cache-control: no-store',
    ...(extra || []),
  ].join('\r\n') + '\r\n\r\n', 'latin1');
  try { sock.end(Buffer.concat([head, b])); } catch (e) { /* client already gone */ }
}

function ok(sock, q, hostHeader) {
  const body = subBase64(cleanHost(hostHeader));
  httpRes(sock, '200 OK', body, 'text/plain; charset=utf-8', ['content-disposition: inline']);
}

function handleMagic(sock, pathname, q, hostHeader) {
  const host = cleanHost(hostHeader);
  const authed = (q.t || q.token || '') === CFG.token;

  if (pathname === '/__health') {
    return httpRes(sock, '200 OK', JSON.stringify({
      ok: true, egressIP: state.current, changes: state.changes.length,
      uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    }), 'application/json');
  }
  if (!authed) return httpRes(sock, '404 Not Found', '404 Not Found');

  if (pathname === '/__ip') {
    return httpRes(sock, '200 OK', JSON.stringify({
      egressIP: state.current,
      isStaticSoFar: state.changes.length === 0 && state.samples.length > 0,
      firstSeen: state.firstSeen,
      samplesCollected: state.samples.length,
      windowHours: state.samples.length
        ? +((Date.now() - new Date(state.samples[0].ts).getTime()) / 3600000).toFixed(2) : 0,
      changes: state.changes,
      containerRestarts: state.restarts,
      processUptimeSec: Math.round((Date.now() - startedAt) / 1000),
      lastSamples: state.samples.slice(-20),
    }, null, 2), 'application/json');
  }

  if (pathname === '/__sub') return ok(sock, q, hostHeader);

  if (pathname === '/__verify') {
    if (!q.fresh && state.verify) return httpRes(sock, '200 OK', JSON.stringify(state.verify, null, 2), 'application/json');
    sock.setTimeout(0);
    return runSelfTest(parseInt(q.rounds || '5', 10)).then(
      (r) => httpRes(sock, '200 OK', JSON.stringify(r, null, 2), 'application/json'),
      (e) => httpRes(sock, '500 Internal Server Error', String(e && e.message || e)));
  }

  if (pathname === '/__links') {
    const rows = allLinks(host).map((l) => l.url).join('\n');
    return httpRes(sock, '200 OK', rows, 'text/plain; charset=utf-8');
  }

  if (pathname === '/__panel') {
    const links = allLinks(host);
    const sub = subBase64(host);
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const html = `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(CFG.remark)}</title>
<style>
body{font:14px/1.7 system-ui,Segoe UI,Tahoma;background:#0b1020;color:#e6e9f2;margin:0;padding:18px}
h1{font-size:18px}code,pre{direction:ltr;text-align:left;font-family:ui-monospace,Menlo,Consolas,monospace}
pre{background:#141b33;padding:10px;border-radius:8px;overflow:auto;white-space:pre-wrap;word-break:break-all}
.card{background:#111832;border:1px solid #23305c;border-radius:12px;padding:14px;margin:12px 0}
button{background:#2f6df6;color:#fff;border:0;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:13px}
b.ok{color:#4ade80}b.bad{color:#f87171}.muted{color:#93a0c4}
</style>
<h1>🛰 ${esc(CFG.remark)} — VLESS + WS + TLS</h1>
<div class="card">
  <div>hostname: <code dir="ltr">${esc(host)}</code></div>
  <div>egress IP: <code dir="ltr">${esc(state.current || '…')}</code>
    &nbsp;|&nbsp; ${state.changes.length === 0
      ? '<b class="ok">ثابت تا الان ✓</b>'
      : '<b class="bad">' + state.changes.length + ' بار عوض شده ✗</b>'}</div>
  <div class="muted">نمونه‌ها: ${state.samples.length} | ریبوت کانتینر: ${state.restarts} | آپتایم پروسه: ${Math.round((Date.now() - startedAt) / 1000)}s</div>
</div>
<div class="card">
  <b>لینک سابسکریپشن (همه کانفیگ‌ها یکجا)</b>
  <pre dir="ltr">https://${esc(host)}/__sub?t=${esc(CFG.token)}</pre>
  <button onclick="c(this.nextElementSibling.textContent)">کپی base64</button>
  <pre dir="ltr">${esc(sub)}</pre>
  <div class="muted">این رو مستقیم بده به Hiddify / v2rayNG به عنوان Subscription URL.</div>
</div>
${links.map((l) => `<div class="card"><b>${esc(l.remark)}</b> <span class="muted">(${esc(l.kind)}${l.ip ? ' · ' + esc(l.ip) : ''})</span>
<button onclick="c(this.nextElementSibling.textContent)">کپی</button><pre dir="ltr">${esc(l.url)}</pre></div>`).join('\n')}
${state.verify ? `<div class="card"><b>آخرین خود-آزمایی (§5)</b>
<div class="muted">${esc(state.verify.finishedAt || '')} · ${esc(state.verify.seconds || '?')}s</div>
<pre dir="ltr">${esc(JSON.stringify(state.verify.verdict, null, 2))}</pre>
<pre dir="ltr">ip      : ${esc(JSON.stringify(state.verify.egressIP && state.verify.egressIP.distinct))}
exit    : ${esc(JSON.stringify(state.verify.exit || {}))}
speed   : ${esc(state.verify.throughput && state.verify.throughput.mbps)} Mbit/s
connect : ${esc(state.verify.connectivity && state.verify.connectivity.ok)}/${esc(state.verify.connectivity && state.verify.connectivity.total)} x 204
sites   : ${esc(JSON.stringify(state.verify.sites, null, 0))}</pre>
<button onclick="location.href='/__verify?t=${esc(CFG.token)}&fresh=1'">اجرای دوباره</button></div>` : ''}
<div class="card muted">
  <div>UUID <code dir="ltr">${esc(CFG.uuid)}</code></div>
  <div>WS path <code dir="ltr">${esc(CFG.wsPath)}</code></div>
  <div>port <code dir="ltr">${CFG.publicPort}</code> · security <code dir="ltr">tls</code> · fp <code dir="ltr">${esc(CFG.fp)}</code> · alpn <code dir="ltr">${esc(CFG.alpn)}</code></div>
  <div>JSON وضعیت: <code dir="ltr">/__ip?t=…</code></div>
</div>
<script>function c(t){navigator.clipboard.writeText(t.trim());}</script>
</html>`;
    return httpRes(sock, '200 OK', html, 'text/html; charset=utf-8');
  }

  return httpRes(sock, '404 Not Found', '404 Not Found');
}

/* ----------------------------------------------------------- tcp routing */

function forward(sock, buf) {
  sock.pause();
  const up = net.connect(CFG.xrayPort, CFG.xrayHost);
  up.on('connect', () => {
    up.write(buf);
    sock.setTimeout(0);
    sock.pipe(up);
    up.pipe(sock);
  });
  const kill = () => { try { sock.destroy(); } catch (e) {} try { up.destroy(); } catch (e) {} };
  up.on('error', (e) => {
    log('upstream (xray) error:', e.message);
    if (!up.writable) httpRes(sock, '503 Service Unavailable', 'xray upstream not ready');
    kill();
  });
  sock.on('error', kill);
  sock.on('close', kill);
  up.on('close', kill);
}

function route(sock, buf, hdrEnd) {
  const head = buf.slice(0, hdrEnd).toString('latin1');
  const lines = head.split('\r\n');
  const parts = lines[0].split(' ');
  const method = (parts[0] || '').toUpperCase();
  const target = parts[1] || '/';
  const headers = {};
  for (const l of lines.slice(1)) {
    const i = l.indexOf(':');
    if (i > 0) headers[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim();
  }
  const qi = target.indexOf('?');
  const pathname = qi === -1 ? target : target.slice(0, qi);
  const q = qi === -1 ? {} : Object.fromEntries(new URLSearchParams(target.slice(qi + 1)));
  const hostHeader = headers.host || '';

  const upgrade = (headers.upgrade || '').toLowerCase() === 'websocket';
  const connUp = /\bupgrade\b/i.test(headers.connection || '');
  const hasKey = !!headers['sec-websocket-key'];

  if (pathname === CFG.wsPath) {
    // A correct WebSocket handshake goes to Xray untouched. Anything else on the
    // secret path is a probe or a broken client => 400, exactly like Cloudflare.
    if (method === 'GET' && upgrade && connUp && hasKey) return forward(sock, buf);
    return httpRes(sock, '400 Bad Request', '400 Bad Request');
  }

  if (pathname.startsWith('/__')) {
    sock.pause();
    sock.setTimeout(0);
    return handleMagic(sock, pathname, q, hostHeader);
  }

  // Everything else looks dead on purpose.
  return httpRes(sock, '404 Not Found', '404 Not Found');
}

function handleConn(sock) {
  sock.on('error', () => {});
  let buf = Buffer.alloc(0);
  let routed = false;
  sock.setTimeout(20000, () => { if (!routed) { try { sock.destroy(); } catch (e) {} } });
  const onData = (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    const idx = buf.indexOf('\r\n\r\n');
    if (idx === -1) {
      if (buf.length > 16384) { routed = true; httpRes(sock, '400 Bad Request', '400 Bad Request'); }
      return;
    }
    routed = true;
    sock.removeListener('data', onData);
    sock.pause();
    try { route(sock, buf, idx); } catch (e) { log('route error:', e.message); try { sock.destroy(); } catch (_) {} }
  };
  sock.on('data', onData);
}

/* ------------------------------------------------------------------ boot */

loadState();

const server = net.createServer(handleConn);
server.listen(CFG.port, '0.0.0.0', () => log('plain  listening on 0.0.0.0:' + CFG.port,
  '-> ws path', CFG.wsPath, '-> xray', CFG.xrayHost + ':' + CFG.xrayPort));

if (CFG.tlsPort > 0 && CFG.tlsCert && CFG.tlsKey) {
  try {
    const opts = { cert: fs.readFileSync(CFG.tlsCert), key: fs.readFileSync(CFG.tlsKey) };
    tls.createServer(opts, handleConn).listen(CFG.tlsPort, '0.0.0.0',
      () => log('tls    listening on 0.0.0.0:' + CFG.tlsPort));
  } catch (e) { log('TLS mode disabled:', e.message); }
}

log('panel  /__panel?t=<token>  /__ip  /__sub  /__links  /__verify  /__health   token=' + CFG.token);
watchLoop();
verifyLoop();

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => { saveState(); process.exit(0); });
}
process.on('uncaughtException', (e) => log('uncaught:', e.message));
