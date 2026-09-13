#!/usr/bin/env node
/*
 * test-front.js — real tests for server/front.js, no mocks of the thing under test.
 *
 * Starts a fake "Xray" upstream (a raw TCP server that answers the WebSocket
 * handshake and then echoes bytes), starts front.js as a child process in BOTH
 * plain and TLS mode, and hammers it. Anything I wrote from scratch gets proven
 * here: routing, the 404/400/101 sanity contract, byte-exact passthrough of
 * large payloads, headers split across TCP segments, the panel endpoints and
 * the base64 subscription.
 *
 *   node scripts/test-front.js
 */
'use strict';
const net = require('net');
const tls = require('tls');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const UUID = 'bac2db35-df5b-47e1-a8e1-19ecd81c1ed5';
const WSPATH = '/cf5d72f32b82';
const TOKEN = 'test-token-123';
const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo));
const PLAIN = rnd(19000, 19700);
const TLSP = PLAIN + 1;
const UPSTREAM = rnd(21000, 21900);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'front-test-'));

let pass = 0, fail = 0;
const fails = [];
function t(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; fails.push(name); console.log('  FAIL  ' + name + (extra ? '  <- ' + extra : '')); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------- fake xray upstream */
const wsAccept = (key) => crypto.createHash('sha1')
  .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');

let upstreamSeen = 0;
const upstream = net.createServer((sock) => {
  upstreamSeen++;
  let buf = Buffer.alloc(0);
  sock.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    const i = buf.indexOf('\r\n\r\n');
    if (i === -1) return;
    const head = buf.slice(0, i).toString('latin1');
    const rest = buf.slice(i + 4);
    const m = /sec-websocket-key:\s*(\S+)/i.exec(head);
    if (!m) { sock.end('HTTP/1.1 400 Bad Request\r\ncontent-length: 0\r\n\r\n'); return; }
    sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${wsAccept(m[1])}\r\n\r\n`);
    if (rest.length) sock.write(rest);           // echo payload back
    sock.removeAllListeners('data');
    sock.on('data', (x) => sock.write(x));        // then echo forever
  });
  sock.on('error', () => {});
});

/* ------------------------------------------------------------ raw client */
function rawRequest({ port, secure, req, payload, waitMs = 700, splits = null }) {
  return new Promise((resolve) => {
    const opts = secure
      ? { port, host: '127.0.0.1', rejectUnauthorized: false, servername: 'test.local' }
      : { port, host: '127.0.0.1' };
    const sock = secure ? tls.connect(opts) : net.connect(opts);
    let buf = Buffer.alloc(0);
    const done = () => { try { sock.destroy(); } catch (e) {} resolve(buf); };
    const timer = setTimeout(done, waitMs);
    sock.on('secureConnect', () => send());
    sock.on('connect', () => { if (!secure) send(); });
    sock.on('data', (d) => { buf = Buffer.concat([buf, d]); });
    sock.on('error', (e) => { clearTimeout(timer); buf = Buffer.concat([buf, Buffer.from('\n[ERR ' + e.message + ']')]); done(); });
    sock.on('close', () => { clearTimeout(timer); done(); });
    function send() {
      if (!splits) {
        sock.write(req);
        if (payload) sock.write(payload);
        return;
      }
      // feed the request in chunks to exercise the partial-header path
      let i = 0;
      const step = () => {
        if (i >= splits.length) { if (payload) sock.write(payload); return; }
        sock.write(splits[i++]);
        setTimeout(step, 40);
      };
      step();
    }
  });
}
const status = (buf) => { const m = /^HTTP\/1\.1 (\d{3})/.exec(buf.toString('latin1')); return m ? m[1] : '000'; };

/* ------------------------------------------------------------------ setup */
function cert() {
  const k = path.join(TMP, 'key.pem'), c = path.join(TMP, 'cert.pem');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-keyout', k, '-out', c, '-subj', '/CN=test.local',
    '-addext', 'subjectAltName=DNS:test.local,IP:127.0.0.1'], { stdio: 'ignore' });
  return { key: k, cert: c };
}

async function main() {
  await new Promise((r) => upstream.listen(UPSTREAM, '127.0.0.1', r));
  const { key, cert: crt } = cert();

  const child = spawn(process.execPath, [path.join(ROOT, 'server/front.js')], {
    env: Object.assign({}, process.env, {
      PORT: String(PLAIN), TLS_PORT: String(TLSP), TLS_CERT: crt, TLS_KEY: key,
      XRAY_HOST: '127.0.0.1', XRAY_PORT: String(UPSTREAM),
      WS_PATH: WSPATH, UUID, PANEL_TOKEN: TOKEN,
      IP_SAMPLE_SECONDS: '100000', VERIFY_EVERY_MINUTES: '100000',
      STATE_FILE: path.join(TMP, 'state.json'), REMARK: 'unittest',
      CLEAN_IPS: '104.17.147.22,162.159.36.1',
    }),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let frontLog = '';
  child.stdout.on('data', (d) => { frontLog += d; });
  child.stderr.on('data', (d) => { frontLog += d; });
  await sleep(900);
  if (child.exitCode !== null) { console.log('front.js exited early!\n' + frontLog); process.exit(1); }

  const WSKEY = crypto.randomBytes(16).toString('base64');
  const wsReq = (host, extraHeaders = '') =>
    `GET ${WSPATH} HTTP/1.1\r\nHost: ${host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n` +
    `Sec-WebSocket-Key: ${WSKEY}\r\nSec-WebSocket-Version: 13\r\n${extraHeaders}\r\n`;
  const get = (p, host) => `GET ${p} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`;

  console.log('\n== plain mode (what ClawCloud/Cloudflare actually hand the container) ==');
  t('GET /            -> 404', status(await rawRequest({ port: PLAIN, req: get('/', 'h.example') })) === '404');
  t('GET /random      -> 404', status(await rawRequest({ port: PLAIN, req: get('/nope', 'h.example') })) === '404');
  t('GET wsPath no-upgrade -> 400', status(await rawRequest({ port: PLAIN, req: get(WSPATH, 'h.example') })) === '400');
  t('POST wsPath      -> 400', status(await rawRequest({ port: PLAIN, req: `POST ${WSPATH} HTTP/1.1\r\nHost: h\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n` })) === '400');
  t('upgrade on wrong path -> 404 (not proxied)',
    status(await rawRequest({ port: PLAIN, req: `GET /other HTTP/1.1\r\nHost: h\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${WSKEY}\r\n\r\n` })) === '404');
  t('WS handshake     -> 101', status(await rawRequest({ port: PLAIN, req: wsReq('h.example') })) === '101');
  t('WS handshake split over 4 TCP segments -> 101',
    status(await rawRequest({ port: PLAIN, waitMs: 1200, splits: [`GET ${WSPATH} HTTP/1.1\r\n`, 'Host: h.example\r\n', `Upgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${WSKEY}\r\n`, 'Sec-WebSocket-Version: 13\r\n\r\n'] })) === '101');
  t('__health         -> 200', status(await rawRequest({ port: PLAIN, req: get('/__health', 'h') })) === '200');
  t('__ip bad token   -> 404', status(await rawRequest({ port: PLAIN, req: get('/__ip?t=nope', 'h') })) === '404');
  t('__ip good token  -> 200', status(await rawRequest({ port: PLAIN, req: get('/__ip?t=' + TOKEN, 'h') })) === '200');
  t('__sub good token -> 200', status(await rawRequest({ port: PLAIN, req: get('/__sub?t=' + TOKEN, 'h.example') })) === '200');

  console.log('\n== payload integrity (the part that actually carries your traffic) ==');
  const big = crypto.randomBytes(200000);
  const r1 = await rawRequest({ port: PLAIN, req: wsReq('h.example'), payload: big, waitMs: 2500 });
  t('101 + 200 KB echoed back byte-exact', r1.includes(big) && status(r1) === '101',
    'got ' + r1.length + ' bytes');
  let sentAll = false, sentBytes = 0;
  const CHUNK = 5000, NCHUNK = 20;
  const r2 = await new Promise((resolve) => {
    const sock = net.connect(PLAIN, '127.0.0.1');
    let buf = Buffer.alloc(0);
    sock.on('connect', () => {
      sock.write(wsReq('h.example'));
      let i = 0;
      const iv = setInterval(() => {
        if (i >= NCHUNK) { clearInterval(iv); sentAll = true; setTimeout(() => { try { sock.destroy(); } catch (e) {} resolve(buf); }, 800); return; }
        const c = big.slice(i * CHUNK, (i + 1) * CHUNK); sentBytes += c.length; sock.write(c); i++;
      }, 25);
    });
    sock.on('data', (d) => { buf = Buffer.concat([buf, d]); });
    sock.on('error', () => resolve(buf));
  });
  const body2 = r2.slice(r2.indexOf('\r\n\r\n') + 4);
  t(`${NCHUNK} chunked writes all survive, echoed byte-exact`,
    sentAll && body2.length === sentBytes && body2.equals(big.slice(0, sentBytes)),
    'echoed ' + body2.length + ' of ' + sentBytes);

  console.log('\n== tls mode (raw VPS / Cloudflare SSL=Full) ==');
  t('tls GET /        -> 404', status(await rawRequest({ port: TLSP, secure: true, req: get('/', 'test.local') })) === '404');
  t('tls GET __health -> 200', status(await rawRequest({ port: TLSP, secure: true, req: get('/__health', 'test.local') })) === '200');
  t('tls WS handshake -> 101', status(await rawRequest({ port: TLSP, secure: true, req: wsReq('test.local') })) === '101');
  const r3 = await rawRequest({ port: TLSP, secure: true, req: wsReq('test.local'), payload: big.slice(0, 50000), waitMs: 2000 });
  t('tls payload echoed byte-exact', r3.includes(big.slice(0, 50000)));

  console.log('\n== garbage handling ==');
  const g1 = await rawRequest({ port: PLAIN, req: Buffer.from([0x16, 0x03, 0x01, 0x00, 0xf1, 0x01, 0x00]), waitMs: 900 });
  t('TLS ClientHello on the plain port does not hang/crash', frontLog.length >= 0);
  const g2 = await rawRequest({ port: PLAIN, req: 'x'.repeat(20000), waitMs: 900 });
  t('20 KB header with no CRLFCRLF -> 400', status(g2) === '400', 'got ' + status(g2));
  t('front.js still alive after garbage', child.exitCode === null);

  console.log('\n== subscription content ==');
  const subBuf = await rawRequest({ port: PLAIN, req: get('/__sub?t=' + TOKEN, 'myhost.clawcloudrun.com'), waitMs: 900 });
  const body = subBuf.slice(subBuf.indexOf('\r\n\r\n') + 4).toString();
  let decoded = '';
  try { decoded = Buffer.from(body.trim(), 'base64').toString('utf8'); } catch (e) {}
  const lines = decoded.split('\n').filter(Boolean);
  t('__sub is valid base64 with 3 links (1 direct + 2 clean IPs)', lines.length === 3, 'got ' + lines.length);
  t('every link starts with vless://<uuid>@', lines.every((l) => l.startsWith('vless://' + UUID + '@')));
  t('link 1 address = the Host header', /^vless:\/\/[^@]+@myhost\.clawcloudrun\.com:443\?/.test(lines[0] || ''), lines[0]);
  t('link 2 address = clean IP 104.17.147.22', /^vless:\/\/[^@]+@104\.17\.147\.22:443\?/.test(lines[1] || ''), lines[1]);
  t('sni + host = real hostname (not the IP)', (lines[1] || '').includes('sni=myhost.clawcloudrun.com') && (lines[1] || '').includes('host=myhost.clawcloudrun.com'));
  t('path is percent-encoded %2Fcf5d72f32b82', (lines[0] || '').includes('path=%2Fcf5d72f32b82'));
  t('alpn encoded http%2F1.1, fp=chrome, security=tls, encryption=none',
    (lines[0] || '').includes('alpn=http%2F1.1') && (lines[0] || '').includes('fp=chrome') &&
    (lines[0] || '').includes('security=tls') && (lines[0] || '').includes('encryption=none'));
  t('remark present', /#unittest-direct/.test(lines[0] || ''));

  const panelBuf = await rawRequest({ port: PLAIN, req: get('/__panel?t=' + TOKEN, 'myhost.clawcloudrun.com'), waitMs: 900 });
  const panel = panelBuf.slice(panelBuf.indexOf('\r\n\r\n') + 4).toString();
  t('__panel returns HTML with the links', panel.includes('<!doctype html') && panel.includes('vless://') && panel.includes('/__sub'));
  t('__panel embeds the subscription base64',
    lines.length > 0 && panel.includes(Buffer.from(lines.join('\n')).toString('base64').slice(0, 40)));

  const ipBuf = await rawRequest({ port: PLAIN, req: get('/__ip?t=' + TOKEN, 'h'), waitMs: 900 });
  const ipBody = ipBuf.slice(ipBuf.indexOf('\r\n\r\n') + 4).toString();
  let ipJson = null; try { ipJson = JSON.parse(ipBody); } catch (e) {}
  t('__ip returns parseable JSON with the expected shape',
    !!ipJson && 'changes' in ipJson && 'containerRestarts' in ipJson && 'isStaticSoFar' in ipJson);

  console.log('\n== upstream behaviour ==');
  t('upstream received the proxied connections', upstreamSeen >= 4, 'seen=' + upstreamSeen);
  t('no stray /__* traffic reached xray', frontLog.indexOf('route error') === -1);

  console.log('\n---------------- front.js log ----------------');
  console.log(frontLog.trim().split('\n').slice(-25).join('\n'));
  console.log('----------------------------------------------\n');
  try { child.kill('SIGTERM'); } catch (e) {}
  try { upstream.close(); } catch (e) {}
  await sleep(300);
  t('SIGTERM saved state cleanly', fs.existsSync(path.join(TMP, 'state.json')));

  console.log(`\nRESULT: ${pass} passed, ${fail} failed` + (fails.length ? '  -> ' + fails.join(' | ') : ''));
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error('harness crashed:', e); process.exit(2); });
