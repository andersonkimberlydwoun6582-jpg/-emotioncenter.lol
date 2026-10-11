# Emotion Center — Launch Audit

Audit date: 2026-10-11
Auditor: DSH agent, using the `shangzhan-liucheng` (上站流程) skill

This is a follow-up audit of the 2026-09-01 launch documented in `LAUNCH_REPORT.md`.
The original report stands; this file records the current verified production state,
the one remaining launch-policy gap, and the exact blocker preventing its repair.

## Production identity

| Item | Value |
|---|---|
| Canonical domain | `https://emotioncenter.lol` |
| Alternate hostname | `https://www.emotioncenter.lol` |
| GitHub repository | `https://github.com/andersonkimberlydwoun6582-jpg/-emotioncenter.lol` (public, default branch `main`) |
| Hosting | OpenAI Sites (not Vercel) |
| Sites project | `appgprj_6a962172e52c8191a17c15846fc7ab96` |
| Sites production URL | `https://emotioncenter-lol.andersonkimberlydwou.chatgpt.site` |
| Local source | `…\emotioncenter-src\-emotioncenter.lol-main` |
| Local git remote | `sites-origin` → `https://git.chatgpt-team.site/…/appgprj_6a962172e52c8191a17c15846fc7ab96.git` |

Hosting channel was chosen by project shape, per the launch policy: the project carries a
valid `.openai/hosting.json` with a D1 binding and builds through `vinext`, so the Sites
runtime applies. No channel switch occurred in this audit.

## DNS and Cloudflare

Cloudflare zone `1ac7737c89bad715d14e4e0cf51b33ec`, status `active`, not paused.
Authoritative nameservers: `jillian.ns.cloudflare.com`, `tate.ns.cloudflare.com`.

| Type | Name | Proxied |
|---|---|---|
| A | `emotioncenter.lol` (×2) | **false (DNS-only)** |
| CNAME | `www.emotioncenter.lol` → `custom-domains.chatgpt.site` | **false (DNS-only)** |
| TXT | `_cf-custom-hostname.emotioncenter.lol` | false |
| TXT | `_cf-custom-hostname.www.emotioncenter.lol` | false |
| TXT | `_openai-site-verification.emotioncenter.lol` | false |
| TXT | `_openai-site-verification.www.emotioncenter.lol` | false |

All records are DNS-only, which is the required posture. Both hostnames carry active
provider SSL.

Important consequence: because the records are DNS-only, **Cloudflare edge rules
(Page Rules, Redirect Rules, Bulk Redirects) do not apply to this zone's traffic**.
The zone currently has zero Page Rules. Any edge-level redirect would require turning
the orange-cloud proxy on, which the launch policy explicitly warns against.

## Search and metadata (verified in a real browser)

Verified from an isolated browser context, i.e. the anonymous-visitor view:

| Check | Result |
|---|---|
| `rel=canonical` on apex | `https://emotioncenter.lol` ✅ |
| `rel=canonical` on `www` | `https://emotioncenter.lol` ✅ |
| `og:url` on both hosts | apex ✅ |
| `meta robots` | absent → indexable by default ✅ |
| `robots.txt` | `User-Agent: * / Allow: /` + `Sitemap: https://emotioncenter.lol/sitemap.xml` ✅ |
| `sitemap.xml` | 200, 28 URLs, all apex host ✅ |
| JSON-LD | one `WebSite` schema, apex URL ✅ |
| hreflang | none emitted (single-language site) — not a defect |
| RSS | `/editorial/feed.xml` 200, 9,910 bytes ✅ |
| Google Analytics | **installed** — GA4 `G-JP4PKJ7SQX` rendered from `app/layout.tsx` as a committed constant |
| Advertising / AdSense | **absent** — correct, ads are disabled by policy |
| Search Console verification | **configured** — domain property `sc-domain:emotioncenter.lol`; sitemap submitted 2026-10-11 |

### Page availability

All 28 sitemap URLs return `200`:

| Prefix | URLs |
|---|---|
| `/` | 1 |
| `/grief` | 9 |
| `/vent` | 8 |
| `/gratitude` | 5 |
| `/fun` | 5 |

## Repository state

- GitHub `main` tracks 143 files; local `HEAD` tracks 143 files.
- `package.json`, `app/sitemap.ts`, `app/robots.ts`, and `LAUNCH_REPORT.md` are
  byte-identical between local and GitHub.
- The two histories use different commit SHAs for the same commit messages, i.e. the
  GitHub copy was populated independently rather than pushed from this working copy.
  **Content is in sync; only git object identity differs.** This is cosmetic and does
  not affect the deployment, which runs from `sites-origin`.
- Working tree was clean before this audit.

## Remaining launch-policy gap

**`www.emotioncenter.lol` does not redirect to the apex.**

Measured with a same-origin `fetch(..., { redirect: 'manual' })`, which reports the true
response rather than a followed redirect:

```json
{ "type": "basic", "status": 200, "redirected": false, "location": null }
```

The launch policy requires `www` to redirect to the apex with `301` or `308`. Today it
serves a full duplicate `200` whose canonical points at the apex. The canonical tag
prevents a duplicate-content penalty, so this is a best-practice gap rather than a
breakage — but it splits crawl budget and external link equity between two hostnames.

### Prepared repair

`proxy.ts` was added at the repository root. It returns a native `Response` with
`status: 301` and an apex `Location` for any request whose host is `www.emotioncenter.lol`.

Two implementation decisions:

- The `proxy` convention is used rather than the deprecated `middleware` convention. The
  configured `middleware` file convention produced a deprecation warning at build time
  directing authors to `proxy`, and the vinext request runtime supports both.
- A native `Response` is returned rather than `NextResponse`. This project does not depend
  on the `next` package, so `next/server` must not be imported; the request runtime wraps
  any returned `Response`, so the native form is the portable one.

`npm run build` completes with exit code `0` and no deprecation warning after the change.

### Blocker

The repair cannot be deployed from this host.

- `git ls-remote sites-origin` fails with `Authentication required`.
- Windows Credential Manager holds only GitHub entries; there is **no
  `git.chatgpt-team.site` credential**.
- No `SITE*`, `CHATGPT*`, or `OPENAI*` variable exists in the environment, and no
  `openai` / `sites` CLI is installed.

**Exact missing item:** a credential for `https://git.chatgpt-team.site` so the prepared
commit can be pushed to the Sites remote.

Additionally, the Cloudflare API token in the company env file can read zones, DNS
records, and Page Rules, but is rejected with `403 Authentication error` on
`/zones/{id}/rulesets` and `/rulesets/phases/http_request_dynamic_redirect/entrypoint`.
An edge-level redirect is therefore unavailable even if proxying were acceptable.

## Audit-method warning for future launches

`curl.exe -I https://emotioncenter.lol/` returns **403** for every path, including
`robots.txt` and `sitemap.xml`. This is the hosting provider's Cloudflare bot protection
rejecting a command-line client, not a site failure. The 2026-09-01 report already noted
this. Command-line HTTP probes are unreliable for this site; verification must use a real
browser, and same-origin `fetch` from within a page is the reliable way to read
`robots.txt` and `sitemap.xml`.

## Unresolved risks

1. `www` duplicate serving — repair prepared, deployment blocked on the Sites credential.
2. Search Console indexing. The domain property is configured and the sitemap was
   accepted on 2026-10-11. A live URL test of the homepage that day returned
   "已抓取 - 尚未编入索引" (crawled, not yet indexed): Googlebot smartphone fetched
   `https://emotioncenter.lol/` successfully at 17:45:30, so crawling is permitted and
   the fetch succeeded — the earlier `curl` 403 responses were bot protection rejecting
   non-browser clients and do **not** indicate that Googlebot is blocked. The sitemap row
   initially reported "无法抓取" with 0 discovered pages; every report in the property
   also read "正在处理数据，请过 1 天左右再来查看", so that status is expected to settle
   within about a day. Re-check the sitemap row and the Pages report after that. If the
   homepage stays uncrawled by choice rather than by fetch failure, the cause is content
   quality and inbound links, not the deployment.
3. Community content is stored in the visitor's browser only; it is not a shared,
   cross-device database. A backend, moderation queue, abuse controls, and durable
   storage are still required before treating UGC as a multi-user community. This
   limitation is unchanged from the 2026-09-01 report.
4. The Cloudflare API token should be scoped to include Rulesets if edge-level redirects
   are ever intended for these zones.
