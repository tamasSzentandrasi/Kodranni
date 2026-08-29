#!/bin/sh
# Install the systemd --user unit and a kodranni wrapper on PATH.
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
bin_dir="${XDG_BIN_HOME:-$HOME/.local/bin}"
unit_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
cfg_dir="${XDG_CONFIG_HOME:-$HOME/.config}/kodranni"
slug=${1:-vardmark}

mkdir -p "$bin_dir" "$unit_dir" "$cfg_dir"
ln -sfn "$root/apps/cli/bin/kodranni.mjs" "$bin_dir/kodranni"
cp "$root/packaging/linux/kodranni@.service" "$unit_dir/kodranni@.service"
printf 'KODRANNI_REPO=%s\n' "$root" > "$cfg_dir/service.env"
chmod 600 "$cfg_dir/service.env"

systemctl --user daemon-reload
echo "Installed user unit. Start with:"
echo "  systemctl --user enable --now kodranni@${slug}"
echo "PATH needs $bin_dir (kodranni → $root/apps/cli/bin/kodranni.mjs)"
