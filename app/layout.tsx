import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { CommunityProvider } from '@/components/community-store';
import { CartoonCursor } from '@/components/cartoon-cursor';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

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
      <body className={`${geist.variable} antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Emotion Center', url: 'https://emotioncenter.lol', description: 'A safe, anonymous space for every emotion.' }) }} />
        <CommunityProvider>
        <CartoonCursor />
        <header className="site-header">
          <div className="site-container flex h-20 items-center justify-between gap-6">
            <Link className="brand" href="/" aria-label="Emotion Center home">
              <span className="brand-mark"><HeartHandshake aria-hidden="true" /></span><span>Emotion Center</span>
            </Link>
            <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft sm:flex" aria-label="Main navigation">
              <Link href="/vent">Vent</Link><Link href="/grief">Grief</Link><Link href="/gratitude/affirmations">Affirmations</Link><Link href="/fun">Smile</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-line bg-paper-deep">
          <div className="site-container flex flex-col gap-5 py-10 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Emotion Center. A place for what you feel.</p>
            <div className="flex gap-5"><Link href="/">Home</Link><Link href="/grief">Grief</Link><Link href="/vent">Vent</Link></div>
          </div>
        </footer>
        </CommunityProvider>
      </body>
    </html>
  );
}
