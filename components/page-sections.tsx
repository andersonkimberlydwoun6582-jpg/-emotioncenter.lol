import Link from 'next/link';
import { ArrowRight, Droplets, Flame, Heart, Leaf, Mail, MessageCircle, PartyPopper, Smile, Sparkles, Star, Sun, Zap } from 'lucide-react';

const effectCopy = {
  grief: { stamp: 'WORDS CAN BE HELD', icons: [Heart, Droplets, Mail] },
  vent: { stamp: 'PRESSURE RELEASE', icons: [Flame, Zap, MessageCircle] },
  gratitude: { stamp: 'ONE KIND THOUGHT', icons: [Leaf, Sun, Sparkles] },
  fun: { stamp: 'A TINY GOOD TIME', icons: [Smile, Star, PartyPopper] },
};

function EmotionBackdrop({ tone }: { tone: 'grief' | 'vent' | 'gratitude' | 'fun' }) {
  const effect = effectCopy[tone];
  return (
    <div aria-hidden="true" className={`emotion-fx fx-${tone}`}>
      <span className="fx-stamp">{effect.stamp}</span>
      {effect.icons.map((Icon, index) => <span className={`fx-piece fx-piece-${index + 1}`} key={index}><Icon /></span>)}
      <span className="fx-doodle fx-doodle-one" /><span className="fx-doodle fx-doodle-two" />
    </div>
  );
}

export function ChannelHero({ tone, eyebrow, title, description, href, action }: { tone: 'grief' | 'vent' | 'gratitude' | 'fun'; eyebrow: string; title: string; description: string; href?: string; action?: string }) {
  return (
    <section className={`channel-hero channel-${tone}`} data-cursor-theme={tone}>
      <EmotionBackdrop tone={tone} />
      <div className="site-container relative z-10 py-20">
        <p className="eyebrow mb-5">{eyebrow}</p>
        <h1 className="channel-title">{title}</h1>
        <p className="channel-lede">{description}</p>
        {href && action && <Link className="primary-link" href={href}>{action}<ArrowRight className="w-4" /></Link>}
      </div>
    </section>
  );
}

export function EditorialSection({ eyebrow, title, children }: { eyebrow?: string; title: string; children: React.ReactNode }) {
  return (
    <section className="content-section content-narrow">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="font-heading text-3xl font-normal tracking-tight sm:text-5xl">{title}</h2>
      <div className="prose-copy mt-6">{children}</div>
    </section>
  );
}

export function TopicLinks({ links }: { links: { label: string; href: string }[] }) {
  return <div className="topic-links">{links.map((link) => <Link className="topic-link" href={link.href} key={link.label}>{link.label}<ArrowRight /></Link>)}</div>;
}

export function SafetyNote() {
  return (
    <aside className="mt-16 rounded-xl border border-line bg-white/45 p-5 text-sm leading-6 text-ink-soft">
      <strong className="text-ink">A gentle note:</strong> Emotion Center is a peer expression space, not a crisis or medical service. If you may hurt yourself or someone else, contact local emergency services or a crisis service where you live now.
    </aside>
  );
}
