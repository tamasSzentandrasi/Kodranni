# Storyteller host

**Status:** Verify-ready (infra step 6 + I6 kernel + desk picker)  
**Does not reopen:** I2–I10. Own domain is own hosting, not a name on kodranni.com.

## Lock line

Install, `kodranni`, Found, invite, pick guild/channel/role, `start` / `stop`.  
Players: `kodranni.com/?campaign=<id>` and Discord.  
Own domain: own hosting.  
Nothing running when you are not playing.  
No npm at the table.

The thing they name at Found is the **campaign**. “Community” stays the in-world hall.

A campaign can be created empty or **repopulated from a public snapshot**.

## Product verbs

| Command | Meaning |
|---------|---------|
| `kodranni [--name …] [--from snapshot.json]` | Desk (no tunnel). Found / restore if needed. |
| `kodranni start` | Open the table. |
| `kodranni stop` | Publish archive, tear tunnel, exit. |
| `kodranni status` | `down` / `desk` / `live <url>` |

## Discord bind

Official app. Token stays on the Worker. Desk: invite, then pick **guild**, **play channel**, **Storyteller role**. Saved in `campaign.toml` (not secret files). Snowflake files remain a hatch.

## Hard limits (product edge)

3 campaigns per device key · 5 registers/IP/day · 1 live session/campaign · 1 MB snapshot · 90-day inactive GC.

## Own hosting

Deploy `apps/edge` on *their* Cloudflare, point `edge_control_url` at it, their domain. Same `kodranni` binary. Their Interactions URL.

## Verify

Walkthrough: [`manual-test-plan.md`](./manual-test-plan.md). DevSecOps is **verify-ready**, not ship, until that pass is `ship`.
