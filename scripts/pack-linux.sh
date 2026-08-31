#!/bin/sh
# Host tarball: vendored Node + production campaign-ui + CLI. No npm on the target.
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
version=$(node -p "require('$root/package.json').version")
out_dir="${1:-$root/dist-linux}"
name="kodranni-host-${version}-linux"
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT

mkdir -p "$stage/$name/lib" "$stage/$name/bin" "$out_dir"
cd "$root"
npm ci
NODE_OPTIONS='--experimental-sqlite' npm run build:campaign-ui

tar -C "$root" -cf - \
  --exclude='.git' \
  --exclude='apps/edge/public' \
  --exclude='docs' \
  --exclude='Guidebook' \
  --exclude='src' \
  package.json package-lock.json \
  node_modules \
  apps packages adapters packaging \
  | tar -C "$stage/$name" -xf -

cp -a "$root/apps/campaign-ui/dist" "$stage/$name/apps/campaign-ui/dist"

node_bin=$(command -v node)
cp "$node_bin" "$stage/$name/lib/node"
chmod +x "$stage/$name/lib/node"

if command -v cloudflared >/dev/null 2>&1; then
  cp "$(command -v cloudflared)" "$stage/$name/lib/cloudflared"
  chmod +x "$stage/$name/lib/cloudflared"
fi

cat > "$stage/$name/bin/kodranni" <<'WRAP'
#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
export KODRANNI_REPO="$root"
export PATH="$root/lib:$PATH"
exec "$root/lib/node" --experimental-sqlite --import tsx \
  "$root/apps/cli/src/main.ts" "$@"
WRAP
chmod +x "$stage/$name/bin/kodranni"

printf '%s\n' "$version" > "$stage/$name/VERSION"

tar -C "$stage" -czf "$out_dir/$name.tar.gz" "$name"
echo "Wrote $out_dir/$name.tar.gz"
echo "On the host: tar xf $name.tar.gz && cd $name && packaging/linux/install-user.sh"
echo "Then: kodranni --name \"Your campaign\""
