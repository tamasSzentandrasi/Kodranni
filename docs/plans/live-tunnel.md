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

Environment overrides (good for secrets):

```bash
export KODRANNI_CF_TUNNEL_TOKEN="eyJ..."
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
- Named hostnames are guessable if short; use long random labels or Cloudflare Access if you need a gate.
- Do not put tunnel tokens in a public git repo; `~/.kodranni` is private on the ST machine.

## Archive vs live

| | Live (tunnel) | Archive (Pages) |
|--|---------------|-----------------|
| When | Session running | Always (after publish) |
| Writes | No (read-only UI) | No |
| Hostname | trycloudflare **or** your domain | Pages URL |

Session end should stop the tunnel and (when implemented) force-publish the archive.
