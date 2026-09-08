import type { Metadata } from 'next';
import { EditorialBrowse } from '@/components/editorial';
import { editorialChannels } from '@/lib/editorial';

const config = editorialChannels.grief;
const title = 'Editorial Stories — Grief';

export const metadata: Metadata = {
  title,
  description: config.description,
  alternates: { canonical: config.browsePath, types: { 'application/rss+xml': `${config.browsePath}/feed.xml` } },
  openGraph: { title, description: config.description, url: `https://emotioncenter.lol${config.browsePath}`, type: 'website', images: [{ url: '/og.png', width: 1733, height: 907, alt: 'Emotion Center — A place for every feeling.' }] },
  twitter: { card: 'summary_large_image', title, description: config.description, images: ['/og.png'] },
};

export default async function GriefBrowsePage({ searchParams }: { searchParams: Promise<{ emotion?: string | string[] }> }) {
  const { emotion } = await searchParams;
  return <EditorialBrowse channel="grief" selectedEmotion={typeof emotion === 'string' ? emotion : undefined} />;
}
