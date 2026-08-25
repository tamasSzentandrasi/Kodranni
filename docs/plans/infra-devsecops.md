# Infrastructure / DevSecOps lock

**Date:** 2026-08-25  
**Status:** Locked  
**Supersedes:** campaign-as-GitHub-repo as a required object (architecture L2, L6, O12); hashed-only live URL (L5); custom domain as “ST’s problem” (D3/D4); U6 hostname park as the archive (`live-tunnel.md` same-hostname section, `automation-status.md` U6 “Pages push later”); `packages/publish` HTML as the public face.

**Does not supersede:** local SQLite as sole mechanical authority (L3); session-scoped automation (L4); privacy split (L7); hexagonal ports (L9); live + archive as the same campaign-ui components (L18, O6); tests first-class (L20).

Readiness CLI/HTTP remains **emissary** (not “doctor”).

---

## 1. Locked outcomes (read this first)

| ID | Decision |
|----|----------|
| **I1** | One public hostname per campaign. Live and archive are that name in different states, not two URLs. |
| **I2** | No campaign git repository in the default product. Full table features work without GitHub on the Storyteller side. |
| **I3** | Archive payload is redacted `public.json` (plus optional small media). Archive *application* (HTML/JS/CSS) is shipped with the product to Cloudflare Pages, once per release. |
| **I4** | Public origin is Cloudflare Pages + a Pages Function on a zone we operate. Between sessions the Function serves the archive app + snapshot. During a session it reverse-proxies to a Cloudflare Tunnel whose origin is `127.0.0.1` on the host. |
| **I5** | Presence is a KV record `{ origin: string \| null }`. Written on session start, session end, and proxy failure. No heartbeat writes. |
| **I6** | Host runtime is one production process (not `astro dev`, not PID-file supervision of `npm -w` children). `cloudflared` is the only extra child, and only while the session is live. Linux: `systemd --user`, XDG, libsecret. |
| **I7** | Storyteller never holds a Cloudflare API token, Discord bot token (default path), or GitHub token. The host authenticates to **our** Worker with a campaign device key. |
| **I8** | Discord: one official application; HTTP interactions to the same Function; 3s ACK in the Function; autocomplete proxied only when live with a short circuit-breaker. |
| **I9** | Absolute $0: GitHub (product only) + Cloudflare free (Pages, Functions/Workers 100k req/day, KV, Tunnels) + Discord. No R2 (card-gated), no Workers Paid, no Durable Objects as the ingress, no VPS, no Load Balancing. |
| **I10** | Park-process archive is not a product path. Local static export is an **offline adapter** only. |

---

## 2. Do we need a campaign git repo?

### 2.1 What a repo was for

The original plan used `kodranni-<slug>` under the ST’s GitHub account as:

1. Public hosting (GitHub Pages)
2. A durable object independent of this monorepo
3. History of the public snapshot
4. A Pages rebuild path without the ST machine

(1) is replaced by **I1/I4**. (2)–(4) are evaluated below against a complete feature list **with the repo omitted**.

### 2.2 Full feature list without a campaign repo

| Feature | Needs ST git? | How it works without a repo |
|---------|---------------|-----------------------------|
| Create / found a campaign | No | Local sqlite + XDG; register `campaign_id` + device key with the Worker |
| Discord play (roll, intent, create, harm, approve) | No | Official app → Function → host while live |
| Live hall + sheets | No | Host SSR + tunnel; Function proxies |
| Same URL when session ended | No | Function + KV snapshot + archive app |
| Same URL when laptop off / asleep | No | Same; origin is null; no process on the host |
| Crash mid-session | No | Proxy timeout clears `origin`; last snapshot remains |
| Offline / LAN table | No | Bind localhost; no Function calls; optional local snapshot dir |
| Sheet HMAC + ST `kod_setup` | No | Local secret-service |
| Redacted public snapshot | No | `toPublicSnapshot()` allowlist; tests |
| Player bookmark / Discord links | No | Single hostname |
| Software update of hall/archive chrome | No | **Better without frozen HTML in a repo:** one archive app deploy updates every campaign’s between-session UI |
| Backup / restore | No | Copy XDG data dir; operator UI can download `public.json` + sqlite |
| Emissary | No | Local HTTP + CLI |
| Multiple campaigns on one host | No | One systemd service; `campaign_id` in KV |
| Avatars on **live** | No | Local media dir |
| Avatars on **archive** | No | v1: monogram / existing generated mark only (no blob store). Snapshot stays JSON. |
| Data not stored in `Kodranni.git` | No | sqlite is on the host; snapshot is in **our** KV, not the product repo |
| Custom hostname on **our** zone | No | Pages custom domain / route we attach |
| Public snapshot history (git log) | **Yes** | Without repo: last snapshot only, plus whatever CF Pages/KV overwrite semantics give us. Not required for play. |
| `git clone` the campaign face | **Yes** | Without repo: download snapshot from operator UI. |
| ST keeps the **public URL** if we vanish | **Yes** | Without repo: they keep sqlite (the real data) and a downloaded snapshot. The hostname on our zone dies. |
| Rebuild archive HTML with no ST online | No | Archive app is ours; snapshots are JSON. Updating the app is our release, not their CI. |
| Co-ST / second writer | Neither | Still a single local store. Git does not help. |

Play, live tracking, one bookmark, laptop-off archive, Discord, founding, redaction, backup of authority (sqlite), and UI upgrades **do not need a campaign git repo**.

The repo only uniquely provides: **a ST-owned git chronicle**, **cloneable HTML/JSON history**, and **URL survival if the author account dies**. Those are sovereignty/export features, not table features.

### 2.3 Why a repo is the worse default

- Forces a GitHub account and (if we are kind) a GitHub App install before the first session.
- Frozen generated HTML in `gh-pages` **fights** L18/O6: the archive UI should track the product, not the last ST machine that ran an export.
- GitHub Pages as CDN conflicts with one hostname (cannot share DNS with a tunnel). We already chose a Cloudflare origin, so Pages-on-git is a second CDN or a Worker fetch hop we do not need.
- Per-session `git push` + Actions rebuild reintroduces the latency and failure mode the original architecture correctly rejected for the live path, and is wasted if the Function already has `public.json`.

### 2.4 Decision

**Do not require, create, or document a campaign git repo for v1.**

Optional later adapter (not a second architecture): export `public.json` (and a static tree) to a repo the ST connects. That is a chronicle/backup feature. It must not gate session start, publish, or the public URL.

Scale note: KV 1 GB + 1000 writes/day is enough for an indie number of tables (snapshot write ≈ 1–2 per session). If we ever outgrow KV, the next store is R2 or ST-owned git — a scale adapter, not v1.

---

## 3. Target architecture

```text
                    Discord HTTP interactions
                              │
                              ▼
Public hostname ──► Cloudflare Pages
                      │
                      │  Pages Function (one Worker script)
                      │    1. Verify Discord Ed25519 if /interactions
                      │    2. Read KV campaign record
                      │    3. If origin set: proxy to tunnel (short fail)
                      │       on fail: origin=null, fall through
                      │    4. Else: archive app + snapshot from KV
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
   Tunnel (live only)        KV
   → 127.0.0.1:8742            campaign:{id}.origin
   host: campaign-ui SSR       campaign:{id}.snapshot   (public.json)
   sqlite, Discord handler     campaign:{id}.meta       (name, discord guild, …)

Host (Linux)
  systemd --user kodranni.service
    one Node process: store + campaign-ui (production adapter) + interaction handler + publish client
    child: cloudflared  (session only; token from Function, not a ST-created tunnel)
```

### 3.1 Snapshot vs app (split that makes $0 work)

| Artifact | Where | When updated |
|----------|--------|----------------|
| Archive **app** (routes, CSS, JS) | Cloudflare Pages project, product release | When we cut a desk/runtime release |
| **Snapshot** (`public.json`) | Workers KV | Session end; optional session start (crash floor) |
| **Live HTML** | Not on the edge | Rendered on the host from sqlite |

This avoids per-session Pages **builds** (500/month account cap) and avoids stuffing a site tree into git. Function CPU stays small: JSON get + proxy or static asset serve. Do not SSR the whole hall on the Worker (10ms CPU class on free).

Archive campaign-ui reads `/api/snapshot` (Function → KV) and renders the **same components** as live with writes disabled. Live keeps SSR + sqlite. Shared components, two data adapters — that is O6.

Media: live avatars stay on the host. Archive v1 does not host player-uploaded blobs (no R2). Monogram / generated identity is enough for the public face.

### 3.2 Presence protocol

```text
session start
  PUT snapshot (crash floor, optional but recommended)
  start local HTTP
  POST /control/session/start  → Function mints tunnel token, returns it
  start cloudflared child
  Function sets KV origin = tunnel URL

GET (browser)
  origin set → proxy; timeout/5xx → origin=null, serve archive
  origin null → archive app + snapshot

session end
  Function sets origin=null
  stop cloudflared
  PUT snapshot
  stop is not required to wait on snapshot success; retry in background
```

KV writes: start, end, fail-closed. Within the 1000 writes/day free cap. **No periodic heartbeat writes.**

Session start while already live: no-op. Session end while dark: publish snapshot if dirty, otherwise no-op.

### 3.3 Control plane (author) vs data plane (host)

The host never talks to the Cloudflare API. It talks to our Function:

| Host → Function | Function does |
|-----------------|---------------|
| Register campaign (device public identity) | Allocate id, KV meta |
| Session start | Cloudflare Tunnel API (secret on the Worker), KV origin |
| Session end | KV origin=null |
| PUT snapshot | KV snapshot; redaction asserted client-side **and** schema-checked on the Worker |
| Discord is inbound Function → host while origin is set | |

Worker secrets (never on the host, never in the campaign sqlite): Cloudflare API token with tunnel + (if needed) account scope; Discord application public key. Discord **bot token** stays in GitHub Actions / Worker secrets for command registration and any REST the Function must do after defer. It does not ship in the AppImage.

### 3.4 Discord

- One application. ST: invite URL, then pick guild/channel/role in the local UI (bot lists after join).
- Interaction endpoint = the Pages Function.
- Autocomplete: only if `origin` set; proxy to host; **≤1s** abort → empty choices. Cannot defer.
- Commands / components: Function returns type 5 (deferred) immediately; host (or Function after host reply) `PATCH` webhook. If origin is null: ephemeral “table is not live” + archive URL, no host call.
- Do not put the official bot token on the host. Do not use per-ST Discord apps as the default. Escape hatch later: ST-owned token + local gateway, same ChatPort.

### 3.5 Linux host

| Item | Lock |
|------|------|
| Process | One production Node (or bundled) process |
| Live server | `@astrojs/node` standalone (or equivalent). **Forbidden:** `astro dev` as the table |
| Tunnel | Vendored `cloudflared`, child, session-scoped |
| Supervisor | `systemd --user` unit, `Type=notify` |
| Paths | XDG: data / config / state; `KODRANNI_HOME` override |
| Secrets | libsecret; 0600 file fallback under config |
| Bind | `127.0.0.1` only |
| Operator UI | Same campaign-ui, localhost + `kod_setup` (or loopback-only routes). Session start/end, invite, emissary, snapshot download |
| Dist | GitHub Releases: AppImage (or single tarball) + OCI image. Quadlet is the same image, not a second product |
| CLI | `kodranni` starts the service/UI; `kodranni session start\|end\|status`; `kodranni emissary` |

Windows is out of scope. The kernel is not systemd-specific (systemd is the Linux adapter).

---

## 4. Cost (absolute $0)

| Service | Free cap | Use | Cap risk |
|---------|----------|-----|----------|
| Cloudflare Pages | Unmetered static, 500 builds/month | Archive **app** deploys on **our** release | Fine (we do not build per session) |
| Pages Functions / Workers | 100k req/day | Discord + live proxy + archive API | Private table: fine. Do not send large static assets through the Function on the dark path — `ASSETS.fetch` / Pages static |
| Workers KV | 100k reads/day, 1000 writes/day, 1 GB, 25 MB/value | origin + snapshot + meta | Writes: sessions, not heartbeats. Snapshot size: TTRPG JSON ≪ 25 MB |
| Cloudflare Tunnel | Free | Live only | None |
| Discord | Free | One app | None |
| GitHub | Free | Product repo, Actions, Releases | ST does not need an account |
| R2 | Free allowance, often card | **Not used** | — |
| Workers Paid / DO ingress / Load Balancing / VPS | Paid | **Not used** | — |

Dark-path traffic must not count every CSS/image as a Function invocation if we can serve via Pages assets. Live-path proxy counts; a session of a handful of players is well under 100k/day.

---

## 5. DevSecOps

### 5.1 Threat model (short)

| Threat | Mitigation |
|--------|------------|
| Public snapshot leaks Discord snowflakes / tokens / member map | Allowlist `toPublicSnapshot()`; Worker rejects payloads that fail schema / look like snowflakes; tests |
| ST machine is a capability URL while live | Tunnel URL is unguessable; writes still need `kod_edit` / `kod_setup`; bind loopback |
| Stolen AppImage talking to our Function as another campaign | Device key HMAC; campaign_id bound; rate-limit register |
| Official Discord token on every laptop | Token never shipped to host |
| Cloudflare API token on every laptop | Token only in Worker secrets |
| Operator UI exposed on the tunnel | Operator/setup routes **localhost only**; never proxied (Function does not forward `/setup`, `/operator`, `/api` mutating admin). Live proxy allowlist: hall, sheets, player APIs already designed |
| CSRF on local mutating routes | Existing Origin checks; keep them |
| Supply chain | `npm ci` in Actions; lockfile; release artifacts from CI only; pin Actions SHAs when we touch workflows |
| Journal / logs | Emissary and logs print names of secrets, never values |
| Snapshot overwrite by attacker | HMAC on PUT snapshot; origin/session still required or device key |

### 5.2 Secrets inventory

| Secret | Location |
|--------|----------|
| Discord bot token, app public key | Worker / Actions |
| Cloudflare API token (tunnels) | Worker |
| Sheet HMAC (`KODRANNI_SHEET_TOKEN_SECRET`) | Host libsecret |
| Campaign device key | Host libsecret |
| ST Discord role/channel ids | Host config (not third-party secret, but not in the public snapshot) |

### 5.3 Network

- Host: `127.0.0.1:8742` (or XDG-configured port).
- Function proxy Host header as required by the local app (`localhost`).
- No `0.0.0.0` in production.
- Tunnel child env only the minted token; discarded on session end.

### 5.4 Product CI (this repo)

| Workflow | Job |
|----------|-----|
| Existing Pages | Guidebook + landing (unchanged product site) |
| Test | workspaces + snapshot redaction + Function contract tests with fakes |
| Release | AppImage/tarball + OCI to `ghcr.io`; provenance if free |
| Deploy edge | Wrangler: Pages archive-app + Function + KV bindings (OIDC to Cloudflare if available; else a single Actions secret) |

Campaigns are **not** built by this workflow. Snapshots do not live in this git tree.

### 5.5 Emissary

Single readiness document (CLI and `GET /emissary` on localhost):

- kernel process / sqlite open
- device key present
- Function reachable
- KV origin vs local session state
- Discord: guild bound or not
- tunnel child alive iff session live
- last snapshot timestamp

Fix actions in the local UI, not a 12-row lecture. No `doctor` command.

---

## 6. What is deleted or demoted

| Current | Fate |
|---------|------|
| `session end` park: keep tunnel + static Node server | Removed as default. Offline local export may remain as a flag for LAN-only |
| `packages/publish` as a second HTML site | Redaction + `public.json` writer only. Face = campaign-ui archive mode |
| `astro dev` as live | Production adapter |
| `npm run -w` children + PID `session.json` as supervisor | Internal state machine + systemd |
| `~/.kodranni` as the documented root | XDG; override env |
| ST-created named tunnel / `printf` secret files as the happy path | Device key + Function |
| Campaign `public_repo` / `gh repo create` | Not v1 |
| Debounced git push on mutation | Not applicable |
| Two Discord links (live + archive) | One URL |

---

## 7. Implementation order

Each step is independently shippable and testable. Do not start distribution before (1).

1. **Kernel** — production campaign-ui server in-process with the CLI; session state machine; kill `astro dev` as the table path.
2. **Archive mode** — same components, `public.json` adapter, no writes; snapshot schema tests (O23).
3. **Edge** — Pages project + Function: KV snapshot serve + origin proxy + fail-closed. Contract tests with a fake origin.
4. **Tunnel mint** — Function + vendored cloudflared; session start/end as in §3.2.
5. **Discord HTTP** — official app to Function; defer; autocomplete breaker; dark replies.
6. **Linux dist** — systemd user unit, XDG, libsecret, AppImage on Releases. Operator UI + **emissary**.
7. **Optional later** — GitHub snapshot export; ST-owned Discord gateway; Quadlet; ST-owned Cloudflare running the same Function; avatar blobs if we accept a store.

---

## 8. Open only if the lock is reopened

These are **not** v1 work. Revisit only with a concrete cap or product failure:

- KV 25 MB / 1 GB / 1000 writes/day actually hit
- Function 100k/day actually hit (then: two-URL fallback, or unmetered-only dark path — never paid Workers as the first move)
- Author zone as SPOF becomes unacceptable (then: ST-owned CF or git export)
- Need archive photo media (then: R2 if we accept a card, or ST git LFS — both explicit)

---

## 9. Mapping to the old decision log

| Old | New |
|-----|-----|
| L2 Campaign = public git repo + local SoT | Local SoT + KV snapshot + our Pages app |
| L5 Live = hashed tunnel, no custom domain | Live = tunnel behind **one** hostname on our zone |
| L6 Archive = campaign GitHub Pages | Archive = KV snapshot + product archive app |
| O4 Quick tunnel default / named optional | Quick/named are implementation details; ST does not choose |
| O12 `kodranni-<slug>` repo naming | Dropped |
| D1 Packaged binary deferred | Now in scope (step 6) |
| D3/D4 Named host / custom domain deferred | One hostname is v1; ST-owned domain still later |
| U6 park hostname | Replaced by I5 |

L1, L3, L4, L7–L20, O5, O6, O23 remain in force.
