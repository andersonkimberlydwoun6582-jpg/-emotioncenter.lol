import type { Metadata } from 'next';
import { AffirmationTool } from '@/components/affirmation-tool';
import { CommunityFeed, Composer, EmotionLinks } from '@/components/community';
import { ChannelHero, EditorialSection, SafetyNote } from '@/components/page-sections';

const title = 'Daily Affirmations Generator — Free Positive Self-Talk';
const description = 'Generate a gentle affirmation for confidence, calm, healing, courage, self-love, or gratitude. Free and instant.';
const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Daily Affirmations Generator',
  description,
  url: 'https://emotioncenter.lol/gratitude/affirmations',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/gratitude/affirmations' },
  openGraph: {
    title,
    description,
    url: 'https://emotioncenter.lol/gratitude/affirmations',
    type: 'website',
    images: [{ url: '/og.png', width: 1733, height: 907, alt: 'Emotion Center — A place for every feeling.' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
};

export default function AffirmationsPage() {
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />
    <ChannelHero tone="gratitude" eyebrow="A few words for today" title="Start with one kinder sentence." description="Pick what you need right now. We will give you something small and steady to carry with you." />
    <div className="site-container content-main">
      <AffirmationTool />
      <Composer category="small-things" channel="gratitude" prompt="What felt worth noticing today?" />
      <CommunityFeed channel="gratitude" title="Small good things held here" />
      <EditorialSection eyebrow="Not magic—practice" title="The words you repeat become familiar paths.">
        <p>“I am not enough.” “I always ruin things.” Those sentences are repetitions too, practiced until they sound like facts. An affirmation does not erase reality. It offers your mind another sentence to rehearse.</p>
        <p>Choose one that feels believable enough to hold today. Tomorrow, you can choose again.</p>
      </EditorialSection>
      <EmotionLinks current="gratitude" />
      <SafetyNote />
    </div>
  </main>;
}
