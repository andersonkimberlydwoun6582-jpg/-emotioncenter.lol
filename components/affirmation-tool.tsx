'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const affirmations: Record<string, string[]> = {
  Confidence: ['You have handled hard things before. You can meet this moment too.', 'You do not need to be fearless to take the next step.', 'Your voice deserves room in the conversation.'],
  Calm: ['Nothing asks you to solve the whole day at once.', 'Let your shoulders drop. This breath is enough for now.', 'You are allowed to move slowly through a loud world.'],
  Healing: ['Healing does not need to be linear to be real.', 'You can miss what was and still make room for what comes next.', 'Tenderness toward yourself is part of the work.'],
  'Self-love': ['You are not a problem to be fixed.', 'You deserve the patience you give so freely to other people.', 'Your worth is not waiting at the end of a productive day.'],
  Courage: ['Courage can look like one honest sentence.', 'You may be scared and still choose what matters.', 'The next small step counts.'],
  Gratitude: ['There is something gentle here, even if it is only this breath.', 'You can hold gratitude without pretending everything is fine.', 'Notice one good thing. Let it be enough for a moment.'],
};

export function AffirmationTool() {
  const moods = Object.keys(affirmations);
  const [mood, setMood] = useState('Calm');
  const [index, setIndex] = useState(0);
  const result = useMemo(() => affirmations[mood][index % affirmations[mood].length], [mood, index]);

  function choose(nextMood: string) { setMood(nextMood); setIndex(0); window.localStorage.setItem('emotion-center-last-mood', nextMood); }

  return (
    <section className="affirmation-panel">
      <p className="eyebrow mb-4">What do you need right now?</p>
      <div className="flex flex-wrap gap-2">{moods.map((item) => <button className="mood-choice" data-active={item === mood} key={item} onClick={() => choose(item)} type="button">{item}</button>)}</div>
      <div className="affirmation-result"><div><Sparkles className="mx-auto mb-5 text-[var(--sage)]" /><p>{result}</p></div></div>
      <div className="mt-4 flex justify-center"><Button className="h-11 rounded-full px-5" onClick={() => setIndex((value) => value + 1)} variant="outline"><RefreshCw /> Another one</Button></div>
    </section>
  );
}
