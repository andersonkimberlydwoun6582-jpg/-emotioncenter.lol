import type { Metadata } from 'next';
import { EditorialBrowse } from '@/components/editorial';
import { editorialChannels } from '@/lib/editorial';

const config = editorialChannels.vent;
const title = 'Editorial Stories — Vent';

export const metadata: Metadata = {
  title,
  description: config.description,
  alternates: { canonical: config.browsePath },
  openGraph: { title, description: config.description, url: `https://emotioncenter.lol${config.browsePath}`, type: 'website', images: [{ url: '/og.png', width: 1733, height: 907, alt: 'Emotion Center — A place for every feeling.' }] },
  twitter: { card: 'summary_large_image', title, description: config.description, images: ['/og.png'] },
};

export default async function VentBrowsePage({ searchParams }: { searchParams: Promise<{ emotion?: string | string[] }> }) {
  const { emotion } = await searchParams;
  return <EditorialBrowse channel="vent" selectedEmotion={typeof emotion === 'string' ? emotion : undefined} />;
}
