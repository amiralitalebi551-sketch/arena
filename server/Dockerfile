# syntax=docker/dockerfile:1
# VLESS + WebSocket server image for $0 PaaS platforms (ClawCloud Run and friends).
# TLS is terminated by the platform ingress, so Xray runs WS-only behind front.js.
# Build:  docker build -f server/Dockerfile -t xray-vless .
FROM node:22-alpine

ARG XRAY_VERSION=latest
ARG TARGETARCH=amd64
ARG OCI_SOURCE=""

ENV XRAY_LOCATION_ASSET=/usr/local/share/xray \
    PORT=80 \
    XRAY_PORT=2087 \
    WS_PATH=/cf5d72f32b82 \
    UUID=bac2db35-df5b-47e1-a8e1-19ecd81c1ed5 \
    PANEL_TOKEN=cf5d72f32b82 \
    IP_SAMPLE_SECONDS=900 \
    TZ=UTC

RUN apk add --no-cache curl ca-certificates unzip tzdata

# Resolve + fetch xray-core. Tries several asset names because XTLS renames them
# between releases. Pin XRAY_VERSION (e.g. v25.9.30) for reproducible builds.
RUN set -eux; \
    VER="${XRAY_VERSION}"; \
    if [ "$VER" = "latest" ]; then \
      VER="$(curl -fsSL https://api.github.com/repos/XTLS/Xray-core/releases/latest \
             | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"; \
    fi; \
    test -n "$VER"; \
    case "${TARGETARCH}" in \
      amd64) NAMES="Xray-linux-64.zip Xray-linux-amd64.zip" ;; \
      arm64) NAMES="Xray-linux-arm64-v8a.zip Xray-linux-arm64.zip" ;; \
      *) echo "unsupported TARGETARCH=${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    mkdir -p /usr/local/share/xray /tmp/x; ok=""; \
    for n in $NAMES; do \
      if curl -fsSL --retry 3 -o /tmp/x.zip "https://github.com/XTLS/Xray-core/releases/download/${VER}/${n}"; then ok="$n"; break; fi; \
    done; \
    test -n "$ok"; \
    unzip -oq /tmp/x.zip -d /tmp/x; \
    install -m 0755 /tmp/x/xray /usr/local/bin/xray; \
    for g in geoip.dat geosite.dat; do \
      [ -f "/tmp/x/$g" ] && cp "/tmp/x/$g" /usr/local/share/xray/ || true; \
    done; \
    printf '%s\n' "$VER" > /usr/local/share/xray/VERSION; \
    rm -rf /tmp/x /tmp/x.zip; \
    xray version | head -2

COPY server/config.json  /app/config.json
COPY server/front.js     /app/front.js
COPY server/entrypoint.sh /app/entrypoint.sh
RUN chmod 0755 /app/entrypoint.sh && mkdir -p /data

LABEL org.opencontainers.image.source="${OCI_SOURCE}" \
      org.opencontainers.image.title="vless-ws-xray" \
      org.opencontainers.image.description="VLESS+WS behind Cloudflare/ingress, with egress-IP watchdog"

EXPOSE 80
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||80)+'/__health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/entrypoint.sh"]
