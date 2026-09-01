import type { Metadata } from 'next';
import { ChannelHero, EditorialSection, SafetyNote } from '@/components/page-sections';
import { CommunityFeed, Composer, EmotionLinks } from '@/components/community';

export const metadata: Metadata = { title: "Anonymous Vent — Say What You Can't Say Out Loud", description: 'Vent anonymously about work, relationships, or life. Free, stored only in your browser, and no account needed.', alternates: { canonical: '/vent/anonymous' } };

export default function AnonymousVentPage() {
  return <main>
    <ChannelHero tone="vent" eyebrow="No name attached" title="Say what you can't say out loud." description="Saying it to your boss could get you fired. Saying it to your partner could start a fight. Saying it here can simply let the pressure move." href="#write" action="Vent now" />
    <div className="site-container content-main">
      <EditorialSection eyebrow="Some words need a neutral place" title="The real world has consequences.">
        <p>You may have a good reason for keeping the sentence behind your teeth. Speaking can change a relationship before you are ready. Silence, however, gets heavy.</p>
        <p>Loosen it here. In this local version, your post stays in this browser. You are a few paragraphs, not a profile. Please leave out names, workplaces, addresses, and other details that could identify someone.</p>
      </EditorialSection>

      <div id="write"><Composer channel="vent" prompt="Start typing. No name needed." /></div>
      <CommunityFeed channel="vent" limit={6} title="Other things held in this space" />

      <EditorialSection eyebrow="No apology required" title="Anger can be a boundary speaking loudly.">
        <p>It is not always beautiful or reasonable, but it is information. Let it tell you what was crossed, what hurt, or what needs to change—after you have had room to breathe.</p>
      </EditorialSection>
      <EmotionLinks current="vent" />
      <SafetyNote />
    </div>
  </main>;
}
