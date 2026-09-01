'use client';

import { useEffect, useRef, useState } from 'react';
import { Flame, Heart, Leaf, MousePointer2, Smile, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

type CursorTone = 'home' | 'vent' | 'grief' | 'gratitude' | 'fun';

function toneFromPath(pathname: string): CursorTone {
  if (pathname.startsWith('/vent')) return 'vent';
  if (pathname.startsWith('/grief')) return 'grief';
  if (pathname.startsWith('/gratitude')) return 'gratitude';
  if (pathname.startsWith('/fun')) return 'fun';
  return 'home';
}

const icons = { home: MousePointer2, vent: Flame, grief: Heart, gratitude: Leaf, fun: Smile };
const burstGlyphs = { home: '✦', vent: '!', grief: '♥', gratitude: '✿', fun: '★' };

export function CartoonCursor() {
  const pathname = usePathname();
  const routeTone = toneFromPath(pathname);
  const [tone, setTone] = useState<CursorTone>(routeTone);
  const cursorRef = useRef<HTMLDivElement>(null);
  const toneRef = useRef<CursorTone>(routeTone);

  useEffect(() => {
    setTone(routeTone);
    toneRef.current = routeTone;
    document.documentElement.dataset.emotion = routeTone;
  }, [routeTone]);

  useEffect(() => {
    let frame = 0;
    const move = (event: PointerEvent) => {
      cursorRef.current?.classList.remove('is-hidden');
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (cursorRef.current) cursorRef.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      });
      const hovered = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-cursor-theme]');
      const nextTone = (hovered?.dataset.cursorTheme as CursorTone | undefined) ?? routeTone;
      toneRef.current = nextTone;
      setTone(nextTone);
    };
    const leave = () => cursorRef.current?.classList.add('is-hidden');
    const enter = () => cursorRef.current?.classList.remove('is-hidden');
    const click = (event: PointerEvent) => {
      const particle = document.createElement('span');
      particle.className = `cursor-burst cursor-burst-${toneRef.current}`;
      particle.textContent = burstGlyphs[toneRef.current];
      particle.style.left = `${event.clientX}px`;
      particle.style.top = `${event.clientY}px`;
      document.body.appendChild(particle);
      window.setTimeout(() => particle.remove(), 650);
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    document.documentElement.addEventListener('mouseenter', enter);
    window.addEventListener('pointerdown', click, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('mouseleave', leave);
      document.documentElement.removeEventListener('mouseenter', enter);
      window.removeEventListener('pointerdown', click);
    };
  }, [routeTone]);

  const Icon = icons[tone];
  return (
    <div aria-hidden="true" className={`cartoon-cursor cursor-${tone} is-hidden`} ref={cursorRef}>
      <span className="cursor-face"><Icon /></span>
      <Sparkles className="cursor-spark" />
    </div>
  );
}
