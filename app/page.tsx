import type { Metadata } from 'next';
import { ArrowRight, Feather, Flame, Heart, Sparkles } from 'lucide-react';

export const metadata: Metadata = { alternates: { canonical: '/' } };

const doors = [
  { href: '/vent', eyebrow: 'Anger', title: "I'm angry", copy: 'Say the thing you cannot say anywhere else.', action: 'Let it out', icon: Flame, tone: 'door-coral' },
  { href: '/grief', eyebrow: 'Grief', title: "I'm grieving", copy: 'Write to someone you miss. Read words from people who understand.', action: 'Be heard', icon: Heart, tone: 'door-blue' },
  { href: '/gratitude/affirmations', eyebrow: 'Gratitude', title: 'I need a kind word', copy: 'Find a small, steady sentence to carry through today.', action: 'Find my words', icon: Feather, tone: 'door-sage' },
  { href: '/fun', eyebrow: 'Lightness', title: 'Make me smile', copy: 'Take one uncomplicated minute away from the heavy stuff.', action: 'Take a breather', icon: Sparkles, tone: 'door-gold' },
];

export default function Home() {
  return (
    <main>
      <section className="hero-shell home-collage">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div aria-hidden="true" className="paper-scrap paper-scrap-one">HANDLE WITH CARE</div>
        <div aria-hidden="true" className="paper-scrap paper-scrap-two">OPEN WHEN YOU NEED IT</div>
        <div aria-hidden="true" className="doodle-loop" />
        <div className="site-container relative z-10 pt-10 sm:pt-16">
          <p className="eyebrow postal-eyebrow mb-5">A quiet corner of the internet · special delivery</p>
          <h1 className="display-title max-w-4xl">Every emotion deserves a place to land.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft sm:text-xl">
            Angry? Grieving? Looking for one kind thought—or one small laugh? Pick a door. No account, no names, no judgment.
          </p>
          <div className="mt-12 flex items-center gap-4 text-sm text-ink-soft"><span className="h-px w-10 bg-current opacity-40" />How are you feeling right now?</div>
        </div>
      </section>

      <section className="site-container relative z-20 -mt-8 pb-24">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {doors.map((door) => {
            const Icon = door.icon;
            return (
              <a className={`emotion-door ${door.tone}`} data-cursor-theme={door.href.split('/')[1] || 'home'} href={door.href} key={door.href}>
                <div className="door-icon"><Icon aria-hidden="true" /></div>
                <span aria-hidden="true" className="card-tape" />
                <p className="eyebrow">{door.eyebrow}</p>
                <h2>{door.title}</h2>
                <p className="door-copy">{door.copy}</p>
                <span className="door-action">{door.action} <ArrowRight aria-hidden="true" /></span>
              </a>
            );
          })}
        </div>

        <div className="journey-grid mt-24">
          <div><p className="eyebrow mb-4">Why four doors?</p><h2 className="section-title">Feelings rarely arrive alone.</h2></div>
          <div className="space-y-5 text-base leading-7 text-ink-soft sm:text-lg sm:leading-8">
            <p>Grief can carry anger. After anger comes the hurt underneath. A memory can hold sorrow and gratitude in the same breath—and sometimes a laugh returns before the pain leaves.</p>
            <p className="font-medium text-ink">Start wherever you are. The other doors will still be here.</p>
          </div>
        </div>

        <div className="privacy-note mt-20">
          <div className="privacy-dot" />
          <div><p className="font-semibold text-ink">Your words, at your pace.</p><p className="mt-1 text-sm leading-6 text-ink-soft">What you write is stored only in this browser. No name or email is requested.</p></div>
        </div>
      </section>
    </main>
  );
}
