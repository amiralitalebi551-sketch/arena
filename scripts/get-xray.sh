#!/usr/bin/env bash
# Downloads xray-core into .bin/xray (linux amd64/arm64, macos, or whatever uname says).
# Used by the CI workflows and by anyone who wants to test locally.
set -eu
DIR="${1:-$PWD/.bin}"
mkdir -p "$DIR"
X="$DIR/xray"
VER="${XRAY_VERSION:-latest}"

OS="$(uname -s | tr 'A-Z' 'a-z')"; M="$(uname -m)"
case "$OS" in linux) P=linux;; darwin) P=macos;; *) echo "unsupported os $OS" >&2; exit 1;; esac
case "$M" in x86_64|amd64) A=64;; aarch64|arm64) A=arm64-v8a;; *) A=64;; esac

if [ "$VER" = latest ]; then
  VER="$(curl -fsSL https://api.github.com/repos/XTLS/Xray-core/releases/latest | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
fi
[ -n "$VER" ] || { echo "could not resolve version" >&2; exit 1; }

for n in "Xray-${P}-${A}.zip" "Xray-${P}-64.zip"; do
  if curl -fsSL --retry 3 -o "$DIR/x.zip" "https://github.com/XTLS/Xray-core/releases/download/${VER}/${n}"; then break; fi
done
[ -s "$DIR/x.zip" ] || { echo "download failed for $VER" >&2; exit 1; }
unzip -oq "$DIR/x.zip" -d "$DIR"
install -m0755 "$DIR/xray" "$X"
rm -f "$DIR/x.zip"
export XRAY_LOCATION_ASSET="$DIR"
echo "$X"
"$X" version | head -2
