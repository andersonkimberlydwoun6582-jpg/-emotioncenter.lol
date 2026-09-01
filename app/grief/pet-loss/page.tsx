import type { Metadata } from 'next';
import { ChannelHero, EditorialSection, SafetyNote } from '@/components/page-sections';
import { CommunityFeed, Composer, EmotionLinks } from '@/components/community';

export const metadata: Metadata = { title: "How to Cope With Losing a Pet — You're Not Alone", description: "Lost your dog, cat, or best friend? Share your grief and read comforting words from others who've been there.", alternates: { canonical: '/grief/pet-loss' } };

export default function PetLossPage() {
  return <main>
    <ChannelHero tone="grief" eyebrow="Pet loss" title="You did not lose “just a pet.”" description="You lost the one who waited at the door, knew when you were sad, and made ordinary days feel like home. Your grief is real here." href="#write" action="Write to your pet" />
    <div className="site-container content-main">
      <EditorialSection eyebrow="Your love does not need defending" title="They were part of the shape of every day.">
        <p>Other people may not understand how a small, furry life became your alarm clock, your shadow, and the one presence you never wanted to push away. They may tell you to get another pet. They may expect you to be fine at work the next morning.</p>
        <p>You do not have to shrink this loss for them. The quiet in the house is real. The habits your hands still remember are real. So is the love beneath all of it.</p>
      </EditorialSection>

      <div id="write"><Composer category="pet-loss" channel="grief" prompt="What would you say to them today?" /></div>
      <CommunityFeed category="pet-loss" channel="grief" limit={6} title="Letters to deeply loved companions" />

      <EditorialSection eyebrow="A gentler way forward" title="You do not have to replace them.">
        <p>You gave them a whole life in which they were known, protected, and loved. They occupied one chapter of your life; you were their entire world. The pain you feel is not a mistake. It is evidence that they were here and mattered.</p>
      </EditorialSection>
      <EmotionLinks current="grief" />
      <SafetyNote />
    </div>
  </main>;
}
