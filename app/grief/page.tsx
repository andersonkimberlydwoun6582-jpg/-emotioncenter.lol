import type { Metadata } from 'next';
import { ChannelHero, EditorialSection, SafetyNote, TopicLinks } from '@/components/page-sections';
import { CommunityFeed, Composer, EmotionLinks } from '@/components/community';

export const metadata: Metadata = { title: 'Grief Support Online — Share Your Loss, Anonymously', description: "Grieving someone you lost? Write them a letter, read others' stories, and feel less alone. Free, anonymous, no account needed.", alternates: { canonical: '/grief' } };

export default function GriefPage() {
  return <main>
    <ChannelHero tone="grief" eyebrow="Grief & remembrance" title="You're grieving. You're not alone." description="Whether it was yesterday or ten years ago, grief does not follow a calendar. Write a letter to the one you lost, or read words from people who understand." href="#write" action="Write a letter" />
    <div className="site-container content-main">
      <EditorialSection eyebrow="A place that does not rush you" title="No one teaches us how to grieve.">
        <p>People say “be strong” and “it will get better,” but they do not tell you what to do when a familiar smell stops you in the kitchen or a song changes the whole shape of the day.</p>
        <p>Grief is not a problem to solve. It is something to move through—and the loneliest part is believing nobody else understands. Here, you can write without an appointment, a name, or a polished explanation.</p>
      </EditorialSection>

      <section className="content-section content-narrow"><p className="eyebrow mb-3">Who are you missing?</p><h2 className="font-heading text-3xl font-normal tracking-tight sm:text-5xl">There is room for every kind of loss.</h2><TopicLinks links={[{ label: 'My mom', href: '/grief/missing-mom' }, { label: 'My dad or parent', href: '#write' }, { label: 'My pet', href: '/grief/pet-loss' }, { label: 'My partner', href: '#write' }, { label: 'My friend', href: '#write' }, { label: 'My grandparent', href: '#write' }]} /></section>

      <CommunityFeed channel="grief" title="Letters held here with care" />
      <div id="write"><Composer channel="grief" prompt="What would you say to them today?" /></div>
      <EmotionLinks current="grief" />
      <SafetyNote />
    </div>
  </main>;
}
