#!/bin/sh
# Put kodranni on PATH. Does not enable systemd — game night is kodranni start / stop.
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
bin_dir="${XDG_BIN_HOME:-$HOME/.local/bin}"
unit_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
cfg_dir="${XDG_CONFIG_HOME:-$HOME/.config}/kodranni"

mkdir -p "$bin_dir" "$unit_dir" "$cfg_dir"

if [ -x "$root/bin/kodranni" ]; then
  ln -sfn "$root/bin/kodranni" "$bin_dir/kodranni"
elif [ -x "$root/apps/cli/bin/kodranni.mjs" ]; then
  ln -sfn "$root/apps/cli/bin/kodranni.mjs" "$bin_dir/kodranni"
  printf 'KODRANNI_REPO=%s\n' "$root" > "$cfg_dir/service.env"
  chmod 600 "$cfg_dir/service.env"
else
  echo "no kodranni launcher under $root" >&2
  exit 1
fi

if [ -f "$root/packaging/linux/kodranni-table.service" ]; then
  cp "$root/packaging/linux/kodranni-table.service" "$unit_dir/kodranni-table.service"
fi
if command -v systemctl >/dev/null 2>&1; then
  systemctl --user daemon-reload >/dev/null 2>&1 || true
fi

echo "Installed kodranni → $bin_dir/kodranni"
echo "  Found:  kodranni --name \"Your campaign\""
echo "  Night:  kodranni start"
echo "  Stop:   kodranni stop"
echo "Optional always-live: systemctl --user enable --now kodranni-table.service"
