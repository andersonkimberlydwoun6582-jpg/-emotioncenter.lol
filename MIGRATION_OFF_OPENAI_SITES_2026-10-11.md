# Migration off OpenAI Sites to the owner's Cloudflare account

Date: 2026-10-11
Reason: the ChatGPT account that hosted this site on OpenAI Sites was suspended, so the
Sites git remote (`git.chatgpt-team.site`) could no longer authenticate and the site could
not be updated or redeployed.

## Outcome

The site now runs entirely on the owner's own Cloudflare account. No OpenAI infrastructure
is involved in serving it.

| Item | Before | After |
|---|---|---|
| Runtime | OpenAI Sites, project `appgprj_6a962172e52c8191a17c15846fc7ab96` | Cloudflare Worker `emotion-center` |
| DNS apex | `A` → `162.159.143.30`, `172.66.3.26` | `AAAA` → `100::` (Workers Custom Domain) |
| DNS www | `CNAME` → `custom-domains.chatgpt.site` | `AAAA` → Workers Custom Domain |
| Deploy channel | `git push sites-origin main` (credentials lost) | `wrangler deploy` with `wrangler.deploy.json` |
| Database | OpenAI-managed D1 (binding `DB`) | `emotion-center-db`, id `1275e09c-2157-4bd0-9598-f3fdd48a9f64` |
| Secret | injected by Sites | `AUTH_PEPPER_V1` set on the Worker (reused the existing value) |

## Why the custom hostname had to be released first

`emotioncenter.lol` was registered as a Cloudflare for SaaS custom hostname belonging to
OpenAI's zone. That association outranks a Worker Route in the owner's own zone, so:

- adding Worker routes returned success but the apex kept serving OpenAI's copy;
- adding a Workers Custom Domain returned `409 Conflict`;
- after deleting the two OpenAI-pointed apex `A` records, the Custom Domain API accepted
  the hostname and Cloudflare created the `100::` record itself.

The equivalent `CNAME` on `www` was deleted for the same reason and replaced with a second
Custom Domain. Worker routes were then removed; both hostnames are Custom Domains.

## Verification (2026-10-11)

| Check | Result |
|---|---|
| `https://emotioncenter.lol/` | `200`, served by the Worker |
| GA4 tag `G-JP4PKJ7SQX` in the apex HTML | present — this is the new build's fingerprint |
| `www` → apex | `301`, `Location` preserves path and query string |
| `/`, `/robots.txt`, `/sitemap.xml`, `/vent`, `/grief`, `/fun`, `/my-notes`, `/recover` | all `200` |

Command-line probes are subject to Cloudflare Bot Management on this zone: `curl` may be
answered with a `403` carrying a `__cf_bm` cookie. That is a client-authentication challenge,
not a site failure — verify with a real browser.

## Deploying future changes

```powershell
npm run build
wrangler deploy --config wrangler.deploy.json
```

`wrangler.deploy.json` at the repository root holds the Worker name, the `nodejs_compat`
flag, `no_bundle`, the asset directory, and the D1 binding. Secrets are not in the file;
`AUTH_PEPPER_V1` lives on the Worker.

## Rollback

The pre-migration DNS records are recoverable from the audit trail: the replaced records
were `A emotioncenter.lol → 162.159.143.30`, `A emotioncenter.lol → 172.66.3.26`, and
`CNAME www.emotioncenter.lol → custom-domains.chatgpt.site`. Restoring them would only make
sense if OpenAI Sites became usable again, which the suspension prevents.

## Note for the rest of the portfolio

The same suspended account created Sites projects for other domains in this account. Any
site whose `www` still resolves to `custom-domains.chatgpt.site`, or whose apex resolves to
`162.159.143.30` / `172.66.3.26`, is on the same infrastructure and carries the same risk.
