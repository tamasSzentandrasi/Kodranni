# Hosting lock

**Date:** 2026-09-29  
**Amends:** the 2026-08-25 infrastructure lock, for subdomains and the Storyteller Desk.  
**Surfaces:** [overview.md](./overview.md) · [decisions.md](./decisions.md)

Local SQLite is the mechanical authority. Automation is session-scoped. The public snapshot is a redaction. Live and archive render with the same campaign-ui components. Tests stay first-class. Readiness on the CLI remains `emissary`. Its human face becomes the desk status strip ([decisions.md](./decisions.md)).

---

## Locked outcomes

| ID | Decision |
|----|----------|
| **I1** | One public hostname per campaign: `https://<slug>.kodranni.com/`. Live and archive are that name in two states. Paths: `/`, `/hierarchy/`, `/character-map/`, `/characters/`, `/characters/<slug>/`. The Guidebook and landing stay on `kodranni.com`. Reserved: `www`, `demo`, `play`. `demo.kodranni.com` redirects to the showcase. Localhost is `http://127.0.0.1:8742/` with the same paths and no slug. `/map/` is reserved for a later geography. |
| **I2** | No campaign git repository. Full table features work without GitHub on the Storyteller side. |
| **I3** | Archive payload is redacted `public.json` (optional small media later). The archive application ships with the product to Cloudflare Pages, once per release. |
| **I4** | Public origin is Cloudflare Pages plus a Function on a zone we operate. Between sessions the Function serves the archive app and the snapshot. During a session it reverse-proxies to a Cloudflare Tunnel whose origin is `127.0.0.1` on the host. |
| **I5** | Presence is a KV record `{ origin: string \| null }`. Written on session start, session end, and proxy failure. No heartbeat writes. |
| **I6** | One production process (not `astro dev`, not PID-file supervision of `npm -w` children). `cloudflared` is the only extra child, and only while the session is live. Linux: `systemd --user`, XDG, libsecret. |
| **I7** | The Storyteller never holds a Cloudflare API token, the Discord bot token (default path), or a GitHub token. The host authenticates to our Worker with a campaign device key. |
| **I8** | Discord: one official application. HTTP interactions hit the same Function. The Function ACKs within 3 seconds. Autocomplete is proxied only while live, with a short circuit-breaker. |
| **I9** | Absolute $0: GitHub (product only) plus Cloudflare free (Pages, Functions/Workers 100k req/day, KV, Tunnels) plus Discord. No R2, no Workers Paid, no Durable Objects as the ingress, no VPS, no Load Balancing. |
| **I10** | A parked local process is not the archive. A local static export is an offline adapter only. |

The internal tunnel hostname (`origin-<slug>.kodranni.com`) is an implementation detail. Players never bookmark it.

---

## No campaign repository

A per-campaign git repo was going to host the public face, survive as an object outside this monorepo, and keep a history of the snapshot. I1 and I4 take the public face. The authority is SQLite on the host. The snapshot in KV is the between-session copy. Backup is a copy of the XDG data directory, plus download and restore of `public.json` on the desk.

What a repo would still uniquely give — a Storyteller-owned git chronicle, cloneable HTML history, a public URL that survives if this project’s zone dies — is an optional later export. It does not gate founding, session start, or the public name.

---

## Shape

```text
Discord HTTP interactions
        │
        ▼
https://<slug>.kodranni.com
        │
        ▼
Cloudflare Pages + one Function
  1. Verify Discord Ed25519 on /interactions
  2. Read KV
  3. If origin is set, proxy to the tunnel (short fail).
     On failure: origin=null, fall through.
  4. Else: archive app + snapshot from KV
        │
        ├── Tunnel (live only) → 127.0.0.1:8742
        │     one process: store, campaign-ui, interaction handler, publish client
        │     child: cloudflared, session only, token minted by the Function
        │
        └── KV
              campaign:{id}.origin
              campaign:{id}.snapshot    (public.json)
              campaign:{id}.meta
```

| Artifact | Where | When it changes |
|----------|--------|-----------------|
| Archive app | Pages, on our release | When we cut a release |
| Snapshot | Workers KV | Session end; optional crash-floor write at session start |
| Live HTML | The host | Rendered from SQLite |

The Function does not SSR the hall. Archive mode reads the snapshot and renders the same components with writes disabled. A portrait published with the snapshot is stored in KV and served at `/api/avatar/<slug>` while the hall is dark. Other uploaded files stay on the host.

### Presence

```text
session start
  PUT snapshot (crash floor)
  start local HTTP
  POST /control/session/start → Function mints a tunnel token
  start cloudflared
  Function sets origin

browser GET
  origin set → proxy; timeout or 5xx → origin=null, serve archive
  origin null → archive app + snapshot

session end
  origin=null
  stop cloudflared
  PUT snapshot (retry in the background; stop does not wait on it)
```

KV writes: start, end, fail-closed. No periodic heartbeat. Start while already live is a no-op. End while dark publishes a dirty snapshot, otherwise no-op.

### Who calls Cloudflare

The host never calls the Cloudflare API. It calls our Function: register (device key), session start, session end, PUT snapshot. The Function holds the tunnel token API and checks the snapshot schema. Discord arrives at the Function and is forwarded to the host only while origin is set.

Worker secrets, never on the host and never in campaign SQLite: Cloudflare API token; Discord application public key; Discord bot token for command registration and the REST the Function performs after defer. The bot token does not ship in the tarball.

The Worker script stays on the Workers runtime. Hall render reads the Tide dyes from `@kodranni/store/table`. The store barrel pulls SQLite and `node:fs` into that script, and Cloudflare rejects the upload. `nodejs_compat` stays off.

### Discord

One application. The Storyteller opens an invite, then picks guild, play channel, and Storyteller role on the desk. The interaction endpoint is the Function. Autocomplete proxies to the host only while origin is set, and aborts at about a second with empty choices. Commands return a deferred response immediately. If origin is null, the player gets an ephemeral “table is not live” and the archive URL.

A Storyteller-owned bot token plus a local gateway remains a later hatch (`KODRANNI_DISCORD_GATEWAY=1`), same port, not the default.

### Desk on the public path

Desk tools render for `isLocalDeskRequest` (loopback, and not tunnelled). A tunnel or archive stays the live hall. Desk POSTs are rejected otherwise. The Function does not forward desk routes. Player routes that already exist (hall, hierarchy, character map, sheets, Session, the player’s own edit token) are what the proxy allowlist carries. Session is `GET /session/` and `GET /api/session`. Desk routes stay off the tunnel. `kod_edit` stays the player’s draft token. There is no `kod_setup`. CSRF Origin checks on local mutating routes stay.

### Linux host

| Item | Lock |
|------|------|
| Process | One production Node (or bundled) process |
| Live server | Production adapter. `astro dev` is not the table |
| Tunnel | Vendored `cloudflared`, child, session-scoped |
| Supervisor | `systemd --user`, `Type=notify` |
| Paths | XDG data / config / state; `KODRANNI_HOME` override |
| Secrets | libsecret; `0600` file fallback under config |
| Bind | `127.0.0.1` only. No `0.0.0.0` |
| Dist | GitHub Release tarball with vendored Node, plus an OCI image. Quadlet is that image, not a second product |
| CLI | `kodranni`, `kodranni start`, `kodranni stop`, `kodranni status`, `kodranni emissary` |

Windows is out of scope. systemd is the Linux adapter, not the kernel.

A campaign is founded with a name, or restored from a public snapshot. The command and the handoff to the desk are below. “Community” remains the in-world hall. Nothing is running when the table is dark. No npm at the table: install the Linux tarball.

### Hard limits

3 campaigns per device key. 5 registers per IP per day. 1 live session per campaign. 1 MB snapshot. Inactive campaigns collected after 90 days.

Own domain, for someone who will not use `<slug>.kodranni.com`, means they deploy `apps/edge` on their Cloudflare and point the host at that Function. Same binary. Their Interactions URL. A name on our zone is the default product, not that path.

---

## Cost

| Service | Free cap | Use | Risk |
|---------|----------|-----|------|
| Cloudflare Pages | Unmetered static, 500 builds/month | Archive app on our release | We do not build per session |
| Pages Functions / Workers | 100k req/day | Discord, live proxy, archive API | A private table fits. Dark-path CSS and images go through Pages assets, not the Function |
| Workers KV | 100k reads/day, 1000 writes/day, 1 GB, 25 MB/value | origin, snapshot, meta | Writes are sessions, not heartbeats |
| Cloudflare Tunnel | Free | Live only | None |
| Discord | Free | One app | None |
| GitHub | Free | Product repo, Actions, Releases | The Storyteller needs no account |
| R2, Workers Paid, Durable Objects as ingress, Load Balancing, VPS | Paid | Unused | — |

---

## Threats and secrets

| Threat | Mitigation |
|--------|------------|
| Public snapshot leaks Discord snowflakes, tokens, or the member map | `toPublicSnapshot()` allowlist. Worker rejects payloads that fail the schema or look like snowflakes. Tests. |
| The live machine is a capability URL | Tunnel URL is unguessable. Writes still need `kod_edit` or the desk gate. Bind loopback. |
| A stolen tarball talks to the Function as another campaign | Device-key HMAC. `campaign_id` bound. Register is rate-limited. |
| Official Discord token on every laptop | Token never shipped to the host. |
| Cloudflare API token on every laptop | Token only in Worker secrets. |
| Desk tools exposed on the tunnel | Desk routes are localhost-only. The Function does not forward them. A `kod_desk` cookie on the public name is ignored. |
| CSRF on local writes | Origin checks. |
| Supply chain | `npm ci` in Actions, lockfile, release artifacts from CI, Actions pinned to SHAs. |
| Logs | Emissary and logs print names of secrets, never values. |
| Snapshot overwrite | HMAC on PUT snapshot. |

| Secret | Where |
|--------|--------|
| Discord bot token, app public key, app id | Worker / Actions |
| Cloudflare API token (tunnels) | Worker |
| Sheet HMAC (`KODRANNI_SHEET_TOKEN_SECRET`) | Host libsecret |
| Campaign device key | Host libsecret |
| Storyteller role, guild, play channel | Host `campaign.toml`. Not in the public snapshot. |
| Fluxer token and ids | Host or Worker secrets, when that adapter exists. Unused while it throws. |

Snowflake files under the secrets directory remain a hatch (env over file over toml). The desk picker writes guild, channel, and role into `campaign.toml`. The hatch is not the happy path.

GitHub Actions secrets for the product: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DISCORD_BOT_TOKEN`, `DISCORD_APP_ID`.

### Network

Host: `127.0.0.1:8742`, or an XDG-configured port. The Function sets the Host header the local app expects. The tunnel child receives only the minted token, discarded on session end.

### CI

| Workflow | Job |
|----------|-----|
| Pages | Guidebook and landing |
| Test | Workspaces, snapshot redaction, Function contract tests with fakes |
| Release | Tarball and OCI |
| Deploy edge | Wrangler: archive app, Function, KV bindings |

Campaigns are not built by this workflow. Snapshots do not live in this git tree.

---

## Interim named tunnel

The locked product mints the tunnel on the Worker for the session. The Storyteller does not create a named tunnel and does not hold a Cloudflare API token.

The CLI still understands `tunnel_mode=named` (token, tunnel name, or config path, plus a public URL). That is the interim path. When those credentials are missing, `kodranni emissary` says so and points at this file. Do not add features on it.

Keeping `cloudflared` up after stop to serve a local static `archive/` is the old park-process. It is not the archive. The archive is the Function serving the last snapshot when origin is null.

---

## Emissary

The desk strip on the loopback hall is the readiness face. `kodranni emissary` prints the CLI list. `GET /emissary` is gone.

The strip shows session phase (down, desk, or live), the public table URL this binary serves, Discord and Fluxer bound or not, tunnel up or down, the archive snapshot time and schema when `snapshot.json` exists, Tide closed, scene faces 7 and 13, and how many submissions are waiting. Tide and extra scene lines are closed because nothing stores them yet.

`kodranni emissary` still checks the kernel, the store, the device key, Discord, Fluxer credentials, and the tunnel token. An unbound Discord line points at the hall.

---

## Reopen only if a cap breaks

These are not current work:

- KV 25 MB, 1 GB, or 1000 writes/day actually hit
- The Function’s 100k requests/day actually hit
- The author zone as a single point of failure becomes unacceptable (then: Storyteller-owned Cloudflare, or a git export)
- Archive photographs become necessary (then: R2, if a card is acceptable, or the Storyteller’s own storage — both explicit)

---

## Founding a campaign

One install of the program. After that, a campaign is a name.

The worked seed in the Guidebook is Aspalath, after the night the knife missed.

```bash
kodranni --name "Aspalath"
```

A snapshot restores the same way:

```bash
kodranni --name "Aspalath" --from ./snapshot.json
```

That command is the setup. It turns the name into a slug and, before it writes anything, refuses `www`, `demo`, `play`, and a name that starts with `origin-`. The first time, it writes the empty community on this machine, registers the slug with the device key, and publishes an empty snapshot. The line it prints is `https://aspalath.kodranni.com/community/`. The desk opens at `http://127.0.0.1:8742/`. Opening the same name again leaves the campaign and publishes nothing. `--from` restores the snapshot, then registers and publishes. If the edge cannot attach the name, that is logged and the desk still opens. `demo.kodranni.com` stays the showcase for that same campaign.

The empty record is Steady (2) on all five Fortunes, unfounded until the five buttons are pressed. The axes are Arms, Faith, Coin, and Blood, with empty rungs and no ruler. Faction and tag categories exist and have no labels. There are no myths, no people, and no canvas.

The Worker attaches `<slug>.kodranni.com` when the campaign registers. The Storyteller does not edit DNS. A catch-all name would also catch `origin-<slug>.kodranni.com`, which is the tunnel, so each public name is attached on its own and the tunnel host is left alone. `demo.kodranni.com` stays the showcase. Players never use the tunnel host.

One machine may register three campaigns. One address may register five times a day.

From then on the Storyteller Desk does the work. Customisation and management stay there: fortunes, ladders, factions and tags, people and sheets, the notebook, the character-map upload, and the Session night. Go Live opens the public night on that name. End Session publishes the hall, including uploaded pictures, and returns the name to the archive. Discord and Fluxer are configured on the desk: invite the one shared bot, then pick the server, the play channel, and the Storyteller role. A campaign does not get its own application.

The Storyteller does not hold a Cloudflare token, does not edit DNS, and does not come back to the console to change the campaign.

### What this binary does today

`kodranni --name` refuses `www`, `demo`, `play`, and a name that starts with `origin-` before it writes a directory. The first time, it writes the empty community, registers the slug, and publishes that hall. The line it prints is `https://<slug>.kodranni.com/community/`. A campaign already on this machine is left as it is, and nothing is published. `--from` restores the snapshot, then registers and publishes. If the edge refuses the name, that line is logged and the desk still opens. Register on publish and on `kodranni start` asks the Worker to attach the name. Go Live and End Session are still `kodranni start` and `kodranni stop`. The Session tab saves Discord’s guild, channel, and role. Fluxer does not send cards yet. Portraits publish with the snapshot. Other uploaded pictures stay on the machine.

---

## Product verbs (current binary)

| Command | Meaning |
|---------|---------|
| `kodranni [--name …] [--from snapshot.json]` | Open the local UI. Found or restore if needed. |
| `kodranni start` | Open the table. |
| `kodranni stop` | Publish the snapshot, tear the tunnel, exit. |
| `kodranni status` | `down`, `desk`, or `live` plus the URL. |
| `kodranni emissary` | The readiness list above. |

The README runbook describes this binary: the hall desk on loopback, and the printed player address `https://<slug>.kodranni.com/community/`. The setup command registers that name and publishes the empty hall. See [status.md](./status.md).
