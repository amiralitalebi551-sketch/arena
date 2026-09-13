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
  stateFile: env.STATE_FILE || '/data/ip-state.json',
  echo: (env.IP_ECHO_URLS ||
    'https://api.ipify.org,https://ifconfig.me/ip,https://api-ipv4.ip.sb/ip,https://ipv4.icanhazip.com,https://checkip.amazonaws.com')
    .split(',').map((s) => s.trim()).filter(Boolean),
  remark: env.REMARK || 'claw-vless',
};

const startedAt = Date.now();
const log = (...a) => console.log(new Date().toISOString(), '[front]', ...a);

/* ------------------------------------------------------------------ state */

let state = {
  createdAt: new Date().toISOString(),
  bootId: Math.random().toString(36).slice(2, 10),
  current: null,
  firstSeen: null,
  restarts: 0,
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
  } catch (e) { log('state save failed (no writable volume?):', e.message); }
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
  const head = [
    `HTTP/1.1 ${code}`,
    `content-type: ${type || 'text/plain; charset=utf-8'}`,
    `content-length: ${b.length}`,
    'connection: close',
    'cache-control: no-store',
    ...(extra || []),
  ].join('\r\n');
  try { sock.end(head + '\r\n\r\n'); } catch (e) { /* gone */ }
  try { sock.write(b); } catch (e) { /* gone */ }
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

log('panel  /__panel?t=<token>  /__ip  /__sub  /__links  /__health   token=' + CFG.token);
watchLoop();

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => { saveState(); process.exit(0); });
}
process.on('uncaughtException', (e) => log('uncaught:', e.message));
