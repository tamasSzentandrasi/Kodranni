# Mid-session live tunnel (Cloudflare)

Players open the **live** campaign-ui while the Storyteller’s session process is running. Between sessions they use the **archive** (GitHub Pages) — not the tunnel.

## Modes

| Mode | Hostname | Setup | Use when |
|------|----------|--------|----------|
| **quick** (default) | Random `*.trycloudflare.com` (Cloudflare word names) | `cloudflared` on PATH only | Zero config, one-off sessions |
| **named** | **Your** domain or subdomain | Cloudflare account + domain on CF DNS + tunnel | Serious / stable mid-session URL |

Quick tunnels are free and need no account. They are **not** hex hashes — that is Cloudflare’s free product. Named tunnels are free on Cloudflare **if you bring a domain**.

## Quick tunnel (default)

```bash
npm run kodranni -- live --slug <slug> --tunnel
# or
npm run kodranni -- session start --slug <slug> --tunnel --detach
```

Share the printed `public:` URL only while the process runs. Do **not** commit it to a public repo.

## Named tunnel (Storyteller domain)

### 1. Once in Cloudflare

1. Add your domain to Cloudflare (DNS).
2. Zero Trust → **Networks → Tunnels** → Create a tunnel (Cloudflared).
3. Install connector: copy the **token** (or install and use a named tunnel after `cloudflared tunnel login`).
4. **Public hostname** tab: e.g. `live.yourdomain.com` → service `http://127.0.0.1:8742`  
   (or `http://localhost:8742`).

Optional CLI-only path (same account):

```bash
cloudflared tunnel login
cloudflared tunnel create kodranni-vardmark
cloudflared tunnel route dns kodranni-vardmark live.yourdomain.com
# config.yml ingress → http://127.0.0.1:8742
```

### 2. Campaign config (`~/.kodranni/campaigns/<slug>/campaign.toml`)

```toml
live_bind = "127.0.0.1:8742"
# URL players open when the named tunnel is up:
live_base_url = "https://live.yourdomain.com"
tunnel_mode = "named"
tunnel_hostname = "https://live.yourdomain.com"

# Prefer token from the dashboard (or env — see below):
cloudflare_tunnel_token = "eyJ..."

# Or, instead of token:
# cloudflare_tunnel_name = "kodranni-vardmark"
# cloudflare_tunnel_config = "/home/you/.cloudflared/config.yml"
```

Environment / secrets (preferred — survive `campaign destroy` / `seed-demo --force`):

| File under `~/.kodranni/secrets/` | Env |
|-----------------------------------|-----|
| `cf-tunnel-token` | `KODRANNI_CF_TUNNEL_TOKEN` |
| `cf-tunnel-hostname` | `KODRANNI_TUNNEL_HOSTNAME` (e.g. `live.yourdomain.com`) |

`campaign seed-demo` / `campaign sync-defaults` auto-set `tunnel_mode = "named"` and `tunnel_hostname` when those exist. **Do not** put the run token in `campaign.toml` — keep it in the secret file.

```bash
export KODRANNI_CF_TUNNEL_TOKEN="eyJ..."
export KODRANNI_TUNNEL_HOSTNAME="live.yourdomain.com"
export KODRANNI_TUNNEL_MODE=named   # optional force
```

### 3. Run

```bash
npm run kodranni -- live --slug <slug> --tunnel
npm run kodranni -- emissary --slug <slug>
```

Emissary should report **public tunnel** OK against your hostname while the session is live.

### 4. DNS tip

For a “serious” ephemeral label on *your* domain you can use any host you route:

- `live.yourdomain.com` (stable name)
- `s-a7f3c91e.yourdomain.com` (you invent a hash-looking label)

Cloudflare still serves it; the name is yours.

## Security

- Tunnel URL (quick or named) is a **capability**: anyone with the link can **read** the live UI while the ST process is up.
- **Writes** (creation spends, Confirm, Wanting) require a **bot-signed edit token** (`?edit=` → cookie). Issued by `/create`, `/claim`, and ST `/review` links. Secret: `KODRANNI_SHEET_TOKEN_SECRET` or `~/.kodranni/secrets/sheet-token-secret` (mode `600`).
- Named hostnames are guessable if short; prefer long labels. Sheet tokens gate mutations without Cloudflare Access.
- Do not put tunnel or sheet secrets in a public git repo; `~/.kodranni` is private on the ST machine.

## Archive vs live

| | Live (tunnel) | Archive (Pages) |
|--|---------------|-----------------|
| When | Session running | Always (after publish) |
| Writes | No (read-only UI) | No |
| Hostname | trycloudflare **or** your domain | Pages URL |

## Same hostname: live ↔ archive (U6)

Public host (e.g. `https://kodranni.cosimomedia.com`) should keep answering when the table is dark.

| Mode | What serves the hostname |
|------|---------------------------|
| **Session up** | Named tunnel → live Astro on `live_bind` |
| **Session end** (default for named) | Publish `archive/`, serve it on the same `live_bind`, **keep or restart** the named tunnel → same URL shows the snapshot |

```bash
npm run kodranni -- session end --slug vardmark          # park hostname (named default)
npm run kodranni -- session end --slug vardmark --no-park  # tear down tunnel too
npm run kodranni -- campaign publish --slug vardmark       # archive only
npm run kodranni -- session start --slug vardmark --tunnel --bot --force
```

Cloudflare DNS for that hostname should stay pointed at the **tunnel**. Do not also attach Pages to the same hostname while the tunnel owns it — Pages push is optional later as a cold standby.

Session end should publish the archive; named setups park the hostname on that archive until the next `session start --force`.
