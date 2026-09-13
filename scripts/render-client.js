#!/usr/bin/env node
/*
 * Renders an Xray CLIENT config from environment variables and writes it to argv[2].
 * Used by CI and by scripts/verify-remote.sh so the exact same client that
 * v2rayNG/Hiddify would build is the one we test with.
 *
 *   ADDR   address the client dials (clean Cloudflare IP, or the real hostname)
 *   PORT   443
 *   SNI    tls serverName  (real hostname)
 *   HOST   ws Host header  (real hostname, defaults to SNI)
 *   WS_PATH   ws path
 *   UUID   vless id
 *   SECURITY tls | none
 *   INSECURE 1 => allowInsecure (self-signed tests only)
 *   FP / ALPN / SOCKS_PORT
 */
'use strict';
const fs = require('fs');
const e = process.env;
const out = process.argv[2] || '/tmp/client.json';

const alpn = (e.ALPN || 'http/1.1').split(',').map((s) => s.trim()).filter(Boolean);
const security = e.SECURITY || 'tls';
const sni = e.SNI || e.HOST || e.ADDR;

const cfg = {
  log: { loglevel: e.LOGLEVEL || 'warning', access: '/dev/null', error: '/dev/stderr' },
  dns: {
    servers: ['https://1.1.1.1/dns-query', 'localhost'],
    queryStrategy: 'UseIPv4',
  },
  inbounds: [
    {
      tag: 'socks-in',
      listen: e.SOCKS_LISTEN || '127.0.0.1',
      port: parseInt(e.SOCKS_PORT || '10808', 10),
      protocol: 'socks',
      settings: { auth: 'noauth', udp: true, userLevel: 0 },
      sniffing: { enabled: true, destOverride: ['http', 'tls', 'quic'] },
    },
  ],
  outbounds: [
    {
      tag: 'proxy',
      protocol: 'vless',
      settings: {
        vnext: [
          {
            address: e.ADDR,
            port: parseInt(e.PORT || '443', 10),
            users: [{ id: e.UUID, encryption: 'none', level: 0 }],
          },
        ],
      },
      streamSettings: {
        network: 'ws',
        security: security,
        ...(security === 'tls'
          ? {
              tlsSettings: {
                serverName: sni,
                allowInsecure: e.INSECURE === '1',
                alpn: alpn,
                fingerprint: e.FP || 'chrome',
                rejectUnknownSni: false,
              },
            }
          : {}),
        wsSettings: {
          path: e.WS_PATH || '/cf5d72f32b82',
          headers: { Host: e.HOST || sni },
          maxEarlyData: 0,
        },
        sockopt: { tcpFastOpen: true, tcpKeepAliveIdle: 30, tcpKeepAliveInterval: 10 },
      },
    },
  ],
  routing: {
    domainStrategy: 'AsIs',
    rules: [
      { type: 'field', outboundTag: 'proxy', network: 'tcp,udp' },
    ],
  },
};

fs.writeFileSync(out, JSON.stringify(cfg, null, 2));
console.log(`[render-client] ${out}  ->  ${cfg.outbounds[0].settings.vnext[0].address}:${cfg.outbounds[0].settings.vnext[0].port}  sni=${sni}  host=${cfg.outbounds[0].streamSettings.wsSettings.headers.Host}  path=${cfg.outbounds[0].streamSettings.wsSettings.path}  sec=${security}  fp=${cfg.outbounds[0].streamSettings.tlsSettings ? cfg.outbounds[0].streamSettings.tlsSettings.fingerprint : '-'}`);
