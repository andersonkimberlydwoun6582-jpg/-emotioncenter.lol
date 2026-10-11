/**
 * Canonical-host redirect: www.emotioncenter.lol -> emotioncenter.lol
 *
 * The apex is the canonical domain: app/layout.tsx sets metadataBase and
 * app/sitemap.ts emits only apex URLs. Before this file, www served a full
 * duplicate 200 response whose rel=canonical pointed at the apex, which splits
 * crawl budget and external link equity across two hostnames.
 *
 * A permanent redirect consolidates both. This is the canonical-host rule the
 * launch policy requires for every site in this portfolio.
 *
 * Uses the `proxy` convention rather than the deprecated `middleware`
 * convention. Returns a plain Response instead of NextResponse because vinext
 * supplies its own runtime shims and this project does not depend on the `next`
 * package, so `next/server` must not be imported here. The runtime wraps any
 * returned Response, so a native Response is the portable form.
 */

const CANONICAL_HOST = 'emotioncenter.lol';

const REDIRECT_HOSTS = new Set(['www.emotioncenter.lol']);

export function proxy(request: Request): Response | undefined {
  const url = new URL(request.url);

  if (!REDIRECT_HOSTS.has(url.hostname.toLowerCase())) {
    return undefined;
  }

  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.port = '';

  return new Response(null, {
    status: 301,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
