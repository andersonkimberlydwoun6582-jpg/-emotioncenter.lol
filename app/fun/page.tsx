import type { Metadata } from 'next';
import { Smile } from 'lucide-react';
import { CommunityFeed, Composer, EmotionLinks } from '@/components/community';
import { ChannelHero, SafetyNote } from '@/components/page-sections';

export const metadata: Metadata = { title: 'A Little Something to Make You Smile', description: 'Light, clean jokes for when you need a break. No deep thoughts required.', alternates: { canonical: '/fun' } };

const jokes = [
  ['Why do skeletons avoid arguments?', "They don't have the guts."],
  ['What do you call a fake noodle?', 'An impasta.'],
  ['Why did the bicycle lie down?', 'It was two-tired.'],
  ['What did one wall say to the other?', "I'll meet you at the corner."],
  ['Why was the math book so stressed?', 'It had too many problems.'],
  ['What kind of tree fits in your hand?', 'A palm tree.'],
];

export default function FunPage() {
  return <main>
    <ChannelHero tone="fun" eyebrow="One uncomplicated minute" title="Take a breath. Smile if you want to." description="No deep thoughts required. Just a few gentle jokes and a quiet corner away from the heavier stuff." />
    <div className="site-container content-main">
      <section>
        <div className="mb-8 flex items-center gap-3"><span className="brand-mark bg-[var(--gold)]"><Smile /></span><div><p className="eyebrow mb-2">Small, clean, harmless</p><h2 className="font-heading text-3xl font-normal sm:text-5xl">A few jokes for the road.</h2></div></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{jokes.map(([setup, punchline]) => <article className="joke-card" key={setup}><p>{setup}</p><p>{punchline}</p></article>)}</div>
      </section>
      <Composer buttonLabel="Save this smile" category="shared-smile" channel="fun" prompt="What made you smile today?" />
      <CommunityFeed channel="fun" title="Little things worth smiling about" />
      <EmotionLinks current="fun" />
      <SafetyNote />
    </div>
  </main>;
}
