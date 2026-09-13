/*
 * bootstrap.mjs — the ZERO-CI, ZERO-Command deploy path.
 *
 * Fetched and imported by a tiny inline loader passed through NODE_OPTIONS, so
 * the container needs NOTHING from the platform UI except two env vars:
 *
 *     NODE_OPTIONS = --import=data:text/javascript,<loader>
 *     BOOT_URL     = https://raw.githubusercontent.com/<owner>/<repo>/<ref>/scripts/bootstrap.mjs
 *
 * and the image's own default CMD (`node` on node:22-alpine).
 *
 * Why node does the downloading instead of curl/wget: the official node build
 * ships its OWN bundled CA root store, so HTTPS works even when the image has no
 * `ca-certificates` package and no curl. Fewer moving parts = fewer ways to fail.
 *
 * Everything is cached under $STATE_DIR (/data if you mounted a volume), so a
 * restart boots in ~2s and survives a GitHub outage.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, chmodSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { arch, platform } from 'node:os';

const REPO = process.env.BOOT_REPO || 'amiralitalebi551-sketch/arena';
const REF = process.env.BOOT_REF || 'main';
const BASE = process.env.BOOT_BASE || `https://raw.githubusercontent.com/${REPO}/${REF}`;
const APP = process.env.APP_DIR || '/app';
let DATA = process.env.STATE_DIR || '/data';

const log = (...a) => console.log(new Date().toISOString(), '[boot]', ...a);

function writable(dir) {
  try { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, '.w'), 'x'); rmSync(join(dir, '.w')); return true; }
  catch { return false; }
}
if (!writable(DATA)) { DATA = '/tmp/clawdata'; mkdirSync(DATA, { recursive: true }); log('/data not writable, using ' + DATA); }
mkdirSync(APP, { recursive: true });
const CACHE = join(DATA, 'boot-cache');
mkdirSync(CACHE, { recursive: true });

/* ------------------------------------------------------------------ fetch */

async function getText(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const t = await r.text();
      if (!t.trim()) throw new Error('empty body');
      return t;
    } catch (e) { last = e; log(`  retry ${i + 1}/${tries} ${url} -> ${e.message}`); await new Promise((r) => setTimeout(r, 1500 * (i + 1))); }
  }
  throw last;
}
async function getBuf(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(300000), redirect: 'follow' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const b = Buffer.from(await r.arrayBuffer());
      if (b.length < 1024) throw new Error('suspiciously small: ' + b.length);
      return b;
    } catch (e) { last = e; log(`  retry ${i + 1}/${tries} ${url} -> ${e.message}`); await new Promise((r) => setTimeout(r, 2000 * (i + 1))); }
  }
  throw last;
}
/** cached fetch: prefer the volume copy, re-fetch only when asked or missing */
async function cached(name, url) {
  const p = join(CACHE, name);
  if (process.env.BOOT_FORCE !== '1' && existsSync(p) && statSync(p).size > 0) {
    log(`  cache hit  ${name}`);
    return readFileSync(p);
  }
  const body = await getText(url);
  writeFileSync(p, body);
  log(`  fetched    ${name} (${body.length} bytes)`);
  return Buffer.from(body);
}

/* NODE_OPTIONS is inherited by every child process. The `node -e` config
 * renderer inside entrypoint.sh — and any node-based helper — would otherwise
 * re-import the boot loader and bootstrap again: an infinite fork bomb. So every
 * spawn below uses this env with NODE_OPTIONS wiped. */
const CLEAN_ENV = { ...process.env, NODE_OPTIONS: '' };

function sh(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const c = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], env: CLEAN_ENV, ...opts });
    let out = '', err = '';
    c.stdout.on('data', (d) => { out += d; });
    c.stderr.on('data', (d) => { err += d; });
    c.on('error', reject);
    c.on('close', (code) => code === 0 ? resolve(out) : reject(new Error(`${cmd} ${args.join(' ')} -> exit ${code}\n${out}${err}`)));
  });
}

/* ------------------------------------------------------ 1) server files */

log(`base=${BASE}`);
log(`app=${APP} data=${DATA}`);
for (const f of ['front.js', 'config.json', 'entrypoint.sh']) {
  const body = await cached(f, `${BASE}/server/${f}`);
  writeFileSync(join(APP, f), body);
}
chmodSync(join(APP, 'entrypoint.sh'), 0o755);
log('server files ready');

/* --------------------------------------------------------- 2) xray-core */

const XRAY = join(DATA, 'xray');
async function xrayWorks() {
  try { await sh(XRAY, ['version']); return true; } catch { return false; }
}

if (existsSync(XRAY) && await xrayWorks()) {
  log('xray cached: ' + (await sh(XRAY, ['version'])).split('\n')[0]);
} else {
  let ver = process.env.XRAY_VERSION || 'latest';
  if (ver === 'latest') {
    const j = JSON.parse(await getText('https://api.github.com/repos/XTLS/Xray-core/releases/latest'));
    ver = j.tag_name;
  }
  const a = arch();
  const names = (a === 'arm64')
    ? ['Xray-linux-arm64-v8a.zip', 'Xray-linux-arm64.zip']
    : ['Xray-linux-64.zip', 'Xray-linux-amd64.zip'];
  if (platform() !== 'linux') names.unshift(`Xray-${platform() === 'darwin' ? 'macos' : platform()}-${a === 'arm64' ? 'arm64-v8a' : '64'}.zip`);

  const zipBase = process.env.XRAY_URL_BASE || `https://github.com/XTLS/Xray-core/releases/download/${ver}`;
  let zip = null, used = null;
  const zipPath = join(CACHE, 'xray.zip');
  if (process.env.BOOT_FORCE !== '1' && existsSync(zipPath) && statSync(zipPath).size > 1000000) {
    zip = readFileSync(zipPath); used = 'cache';
  } else {
    for (const n of names) {
      const url = `${zipBase}/${n}`;
      try { zip = await getBuf(url); used = n; writeFileSync(zipPath, zip); break; } catch (e) { log(`  ${n}: ${e.message}`); }
    }
  }
  if (!zip) throw new Error('could not download xray-core ' + ver);
  log(`xray ${ver} from ${used} (${(zip.length / 1048576).toFixed(1)} MB) base=${zipBase}`);

  const ex = join(DATA, 'xbin');
  rmSync(ex, { recursive: true, force: true });
  mkdirSync(ex, { recursive: true });
  writeFileSync(join(ex, 'x.zip'), zip);
  // busybox unzip is present on alpine; fall back to installing it
  try {
    await sh('unzip', ['-oq', join(ex, 'x.zip'), '-d', ex]);
  } catch (e) {
    log('unzip missing/failed, trying apk: ' + e.message.split('\n')[0]);
    await sh('sh', ['-c', 'apk add --no-cache unzip ca-certificates >/dev/null 2>&1 || true']);
    await sh('unzip', ['-oq', join(ex, 'x.zip'), '-d', ex]);
  }
  const found = [join(ex, 'xray'), join(ex, 'xray.exe')].find((p) => existsSync(p));
  if (!found) throw new Error('xray binary not in the zip: ' + (await sh('sh', ['-c', `ls -la ${ex}`]).catch(() => '?')));
  writeFileSync(XRAY, readFileSync(found));
  chmodSync(XRAY, 0o755);
  for (const g of ['geoip.dat', 'geosite.dat']) {
    const src = join(ex, g);
    if (existsSync(src)) writeFileSync(join(DATA, g), readFileSync(src));
  }
  rmSync(join(ex, 'x.zip'), { force: true });
  log('xray installed: ' + (await sh(XRAY, ['version'])).split('\n')[0]);
}

/* ------------------------------------------------------------- 3) run it */

const child = spawn('sh', [join(APP, 'entrypoint.sh')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    APP_DIR: APP,
    STATE_DIR: DATA,
    XRAY_BIN: XRAY,
    XRAY_LOCATIONS_ASSET: DATA,
    NODE_OPTIONS: '',
  },
});
log('supervisor started (pid ' + child.pid + ')');

let stopping = false;
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    if (stopping) return;
    stopping = true;
    log(sig + ' -> forwarding to the server');
    try { child.kill('SIGTERM'); } catch {}
    setTimeout(() => process.exit(0), 4000).unref();
  });
}
child.on('exit', (code, sig) => {
  log(`server process exited (code=${code} sig=${sig}) — exiting so the platform restarts us`);
  process.exit(code || 1);
});
