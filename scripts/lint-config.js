#!/usr/bin/env node
/*
 * lint-config.js — static checks on server/config.json against the brief.
 * Catches the exact traps listed in §6 without needing an xray binary.
 *
 *   node scripts/lint-config.js [path/to/config.json]
 */
'use strict';
const fs = require('fs');
const file = process.argv[2] || require('path').join(__dirname, '..', 'server', 'config.json');

const EXPECT_UUID = 'bac2db35-df5b-47e1-a8e1-19ecd81c1ed5';
const EXPECT_PATH = '/cf5d72f32b82';
const PRIVATE_V4 = ['0.0.0.0/8', '10.0.0.0/8', '100.64.0.0/10', '127.0.0.0/8', '169.254.0.0/16',
  '172.16.0.0/12', '192.168.0.0/16', '224.0.0.0/4', '240.0.0.0/4'];
const PRIVATE_V6 = ['::1/128', 'fc00::/7', 'fe80::/10'];

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  PASS  ' + n); } else { fail++; console.log('  FAIL  ' + n + (x ? '  <- ' + x : '')); } };

console.log('lint ' + file);
let raw, c;
try { raw = fs.readFileSync(file, 'utf8'); c = JSON.parse(raw); } catch (e) {
  console.log('  FAIL  not parseable JSON: ' + e.message); process.exit(1);
}
ok('valid JSON', true);
ok('no JSON comments (xray accepts them, but strict parsers do not)', !/^\s*\/\//m.test(raw));

const inb = (c.inbounds || []).find((i) => i.protocol === 'vless');
ok('has a VLESS inbound', !!inb);
if (!inb) process.exit(1);

ok('protocol is vless (not vmess)', inb.protocol === 'vless');
ok('decryption = none', inb.settings.decryption === 'none');
ok('client id = the brief UUID', inb.settings.clients[0].id === EXPECT_UUID, inb.settings.clients[0].id);
ok('network = ws', inb.streamSettings.network === 'ws');
ok('ws path = the brief path', inb.streamSettings.wsSettings.path === EXPECT_PATH, inb.streamSettings.wsSettings.path);
ok('ws path starts with /', inb.streamSettings.wsSettings.path.startsWith('/'));
ok('server-side security = none (platform/Cloudflare terminates TLS)', inb.streamSettings.security === 'none',
  String(inb.streamSettings.security));
ok('xray listens on loopback only (front.js is the only door)', inb.listen === '127.0.0.1', inb.listen);
ok('xray port is not the public port (80/443)', inb.port !== 80 && inb.port !== 443, String(inb.port));
ok('no acceptProxyProtocol on ws', inb.streamSettings.wsSettings.acceptProxyProtocol !== true);

const outs = (c.outbounds || []).map((o) => o.protocol);
ok('has a freedom outbound', outs.includes('freedom'));
ok('has a blackhole outbound', outs.includes('blackhole'));
ok('freedom is the FIRST outbound (default route)', c.outbounds[0].protocol === 'freedom');
ok('outbounds are tagged', c.outbounds.every((o) => !!o.tag));

ok('§6 gotcha: no "geoip:" rules (geoip.dat would be required)', !raw.includes('geoip:'), 'found geoip:');
ok('§6 gotcha: no "geosite:" rules (geosite.dat would be required)', !raw.includes('geosite:'), 'found geosite:');

const rules = (c.routing && c.routing.rules) || [];
const blocked = rules.filter((r) => r.outboundTag === 'blocked');
ok('has a routing rule sending traffic to blackhole', blocked.length > 0);
const ips = [].concat(...blocked.map((r) => r.ip || []));
const missing = [...PRIVATE_V4, ...PRIVATE_V6].filter((cidr) => !ips.includes(cidr));
ok('blocks every private/link-local CIDR literally (no SSRF into the k8s cluster)',
  missing.length === 0, 'missing: ' + missing.join(' '));
ok('blocks the cloud metadata range 169.254.0.0/16 (169.254.169.254)', ips.includes('169.254.0.0/16'));
ok('every blocked rule has type=field', blocked.every((r) => r.type === 'field'));

ok('dns present', !!c.dns);
if (c.dns) {
  ok('dns uses IPv4 (k8s clusters here are usually v4-only)', c.dns.queryStrategy === 'UseIPv4', String(c.dns.queryStrategy));
}
ok('log level is not debug (disk/CPU)', !['debug'].includes((c.log || {}).loglevel));

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
