import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { HeartHandshake, NotebookPen } from 'lucide-react';
import { CommunityProvider } from '@/components/community-store';
import { CartoonCursor } from '@/components/cartoon-cursor';
import './globals.css';

/* Native navigation is intentional because browser translation can rewrite the client router DOM. */
/* oxlint-disable next/no-html-link-for-pages */

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

/*
 * Google Analytics 4 measurement ID for this site's property.
 *
 * Hardcoded rather than read from the environment on purpose. Runtime
 * configuration in this project comes from Cloudflare Workers bindings through
 * getBindings() (see lib/server/db.ts), not from process.env, and the generated
 * dist/server/wrangler.json carries `"vars": {}`. Reading process.env here would
 * add a runtime dependency that never resolves to a value.
 *
 * The ID is not a secret — it is served in every page's HTML. The tag renders
 * only while this constant is non-empty, which keeps the launch policy's rule
 * that analytics ships only once a real Measurement ID exists. Set it to an
 * empty string to suppress analytics entirely.
 */
const GA_MEASUREMENT_ID = 'G-JP4PKJ7SQX';

export const metadata: Metadata = {
  metadataBase: new URL('https://emotioncenter.lol'),
  title: { default: 'Emotion Center — A Safe Space for Every Emotion', template: '%s — Emotion Center' },
  description: 'Vent your anger, share your grief, find a kind word, or take a moment to smile. Free, anonymous, no sign-up.',
  openGraph: { title: 'Emotion Center', description: 'A place for every feeling.', images: [{ url: '/og.png', width: 1733, height: 907, alt: 'Emotion Center — A place for every feeling.' }] },
  twitter: { card: 'summary_large_image', title: 'Emotion Center', description: 'A place for every feeling.', images: ['/og.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {GA_MEASUREMENT_ID ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html:
                  'window.dataLayer = window.dataLayer || [];' +
                  'function gtag(){dataLayer.push(arguments);}' +
                  "gtag('js', new Date());" +
                  `gtag('config', '${GA_MEASUREMENT_ID}');`,
              }}
            />
          </>
        ) : null}
      </head>
      <body className={`${geist.variable} antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Emotion Center', url: 'https://emotioncenter.lol', description: 'A safe, anonymous space for every emotion.' }) }} />
        <CommunityProvider>
        <CartoonCursor />
        <header className="site-header">
          <div className="site-container flex h-20 items-center justify-between gap-6">
            <a className="brand" href="/" aria-label="Emotion Center home">
              <span className="brand-mark"><HeartHandshake aria-hidden="true" /></span><span>Emotion Center</span>
            </a>
            <a className="my-notes-nav" href="/my-notes"><NotebookPen aria-hidden="true" /> My notes</a>
            <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft sm:flex" aria-label="Main navigation">
              <a href="/">Home</a><a href="/vent">Vent</a><a href="/grief">Grief</a><a href="/gratitude/affirmations">Affirmations</a><a href="/fun">Smile</a><a href="/recover">Restore</a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-line bg-paper-deep">
          <div className="site-container flex flex-col gap-5 py-10 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Emotion Center. A place for what you feel.</p>
            <div className="flex flex-wrap gap-5"><a href="/">Home</a><a href="/my-notes">My notes</a><a href="/grief">Grief</a><a href="/vent">Vent</a><a href="/gratitude/affirmations">Affirmations</a><a href="/fun">Smile</a><a href="/recover">Restore</a></div>
          </div>
        </footer>
        </CommunityProvider>
      </body>
    </html>
  );
}
