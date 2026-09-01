import type { Metadata } from 'next';
import { ChannelHero, EditorialSection, SafetyNote } from '@/components/page-sections';
import { CommunityFeed, Composer, EmotionLinks } from '@/components/community';

export const metadata: Metadata = { title: 'I Miss My Mom Who Passed Away — Write Her a Letter', description: 'Missing your mom hurts. Write her a letter here, or read letters from people who feel the same. You are not alone.', alternates: { canonical: '/grief/missing-mom' } };

export default function MissingMomPage() {
  return <main>
    <ChannelHero tone="grief" eyebrow="For the words still waiting" title="I miss my mom who passed away." description="Some days it feels like yesterday. Some days it feels like a lifetime ago. Either way, you are here—and that means there may be something you still need to say." href="#write" action="Write her a letter" />
    <div className="site-container content-main">
      <EditorialSection eyebrow="You came here for a reason" title="You are not looking for a lesson on grief.">
        <p>You may have typed those words late at night, when there was nobody you wanted to call. You do not need another person to explain stages or tell you she is in a better place. You may simply need somewhere to put the words: “I miss you.”</p>
        <p>There are people here who understand that sentence without asking you to make it smaller.</p>
      </EditorialSection>

      <div id="write"><Composer category="missing-parent" channel="grief" prompt="What would you say to her today?" /></div>

      <EditorialSection eyebrow="There is no correct timeline" title="Missing her can become part of how you live.">
        <p>It can be light as a sigh, then suddenly heavy in the grocery aisle because you see the brand she always bought. That is not proof that you failed to move on. It is one of the ways a person remains woven into your life.</p>
        <p>If today is hard, let it be hard. If today holds a warm memory, let that be true too. Grief does not ask you to choose one feeling.</p>
      </EditorialSection>

      <CommunityFeed category="missing-parent" channel="grief" limit={6} title="Letters to moms who are still missed" />

      <section className="content-section content-narrow"><p className="eyebrow mb-3">A letter left here</p><blockquote className="quote-card">Mom, I still open your contact and stare at it. I know no one will pick up, but seeing your name makes the world feel normal for two seconds. I got the job. I wish I could call and hear you say you knew I would. I miss you. That is really all this is.</blockquote></section>
      <EmotionLinks current="grief" />
      <SafetyNote />
    </div>
  </main>;
}
