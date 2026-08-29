#!/bin/sh
# Host tarball: production campaign-ui + CLI + packages. Requires Node 22 on the target.
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
version=$(node -p "require('$root/package.json').version")
out_dir="${1:-$root/dist-linux}"
name="kodranni-host-${version}-linux"
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT

mkdir -p "$stage/$name" "$out_dir"
cd "$root"
npm ci
NODE_OPTIONS='--experimental-sqlite' npm run build:campaign-ui

tar -C "$root" -cf - \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='apps/campaign-ui/node_modules' \
  --exclude='apps/edge/node_modules' \
  --exclude='dist' \
  --exclude='apps/edge/public' \
  package.json package-lock.json \
  apps packages adapters packaging scripts \
  | tar -C "$stage/$name" -xf -

cp -a "$root/apps/campaign-ui/dist" "$stage/$name/apps/campaign-ui/dist"
printf 'KODRANNI_REPO=.\n' > "$stage/$name/packaging/linux/service.env.example"
printf '%s\n' "$version" > "$stage/$name/VERSION"

tar -C "$stage" -czf "$out_dir/$name.tar.gz" "$name"
echo "Wrote $out_dir/$name.tar.gz"
echo "On the host: tar xf $name.tar.gz && cd $name && npm ci --omit=dev && packaging/linux/install-user.sh"
