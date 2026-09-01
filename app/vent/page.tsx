import type { Metadata } from 'next';
import { ChannelHero, EditorialSection, SafetyNote } from '@/components/page-sections';
import { CommunityFeed, Composer, EmotionLinks } from '@/components/community';

export const metadata: Metadata = { title: 'Vent to Strangers Online — Get It Off Your Chest', description: 'Angry, frustrated, done? Let it out anonymously and read rants from others who feel the same. No sign-up, no judgment.', alternates: { canonical: '/vent' } };

export default function VentPage() {
  return <main>
    <ChannelHero tone="vent" eyebrow="Anonymous venting" title="Get it off your chest." description="You have been holding it in all day. Maybe all year. Put it here instead—without using your name or making the situation messier." href="#write" action="Start venting" />
    <div className="site-container content-main">
      <EditorialSection eyebrow="You have held it long enough" title="Say what you actually think.">
        <p>You smiled at your boss. You typed three messages and deleted them. You told everyone you were fine because explaining the truth would take more energy than you had.</p>
        <p>Here, you can stop performing. Write the unreasonable part, the petty part, the part that sounds too angry out loud. Avoid names and identifying details—but the feeling itself does not need to be polite.</p>
      </EditorialSection>

      <CommunityFeed channel="vent" title="Rants and notes in this space" />
      <div id="write"><Composer buttonLabel="Save this vent" channel="vent" prompt="What is really getting to you?" /></div>

      <EditorialSection eyebrow="After the pressure drops" title="Anger often protects something softer.">
        <p>Sometimes the fire burns down and reveals disappointment, exhaustion, loneliness, or grief. You do not have to force that discovery. But if another feeling appears, there is a door for that too.</p>
      </EditorialSection>
      <EmotionLinks current="vent" />
      <SafetyNote />
    </div>
  </main>;
}
