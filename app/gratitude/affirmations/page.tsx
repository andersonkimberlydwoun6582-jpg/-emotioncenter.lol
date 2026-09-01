import type { Metadata } from 'next';
import { AffirmationTool } from '@/components/affirmation-tool';
import { CommunityFeed, Composer, EmotionLinks } from '@/components/community';
import { ChannelHero, EditorialSection, SafetyNote } from '@/components/page-sections';

export const metadata: Metadata = { title: 'Daily Affirmations Generator — Free Positive Self-Talk', description: 'Generate a gentle affirmation for confidence, calm, healing, courage, self-love, or gratitude. Free and instant.', alternates: { canonical: '/gratitude/affirmations' } };

export default function AffirmationsPage() {
  return <main>
    <ChannelHero tone="gratitude" eyebrow="A few words for today" title="Start with one kinder sentence." description="Pick what you need right now. We will give you something small and steady to carry with you." />
    <div className="site-container content-main">
      <AffirmationTool />
      <Composer buttonLabel="Save this good thing" category="small-things" channel="gratitude" prompt="What felt worth noticing today?" />
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
