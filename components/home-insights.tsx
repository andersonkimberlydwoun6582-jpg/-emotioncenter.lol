'use client';

import { CalendarDays, Shuffle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useCommunity } from '@/components/community-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EMOTIONS } from '@/config/emotions';
import type { CommunityPost } from '@/lib/community-data';
import { getCalendarDays, getStreak, streakMessage, type CalendarDay } from '@/lib/note-insights';

const weekdayLabels = [
  ['Monday', 'M'],
  ['Tuesday', 'T'],
  ['Wednesday', 'W'],
  ['Thursday', 'T'],
  ['Friday', 'F'],
  ['Saturday', 'S'],
  ['Sunday', 'S'],
] as const;

const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' });
const rangeDateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
const emotionById = new Map<string, (typeof EMOTIONS)[number]>(EMOTIONS.map((emotion) => [emotion.id, emotion]));

function summaryForDay(day: CalendarDay) {
  const titles = day.notes.map((note) => note.title).join(' · ');
  const labels = day.emotions.map((id) => emotionById.get(id)?.label).filter(Boolean).join(', ');
  return labels ? titles + ' — ' + labels : titles + ' — No emotion selected';
}

function emotionLabels(note: CommunityPost) {
  return (note.emotions ?? []).map((id) => emotionById.get(id)).filter((emotion) => Boolean(emotion));
}

export function HomeInsights() {
  const { posts, hydrated } = useCommunity();
  const [recalled, setRecalled] = useState<CommunityPost | null>(null);
  const notes = useMemo(() => posts.filter((post) => post.isMine), [posts]);
  const calendarDays = useMemo(() => getCalendarDays(notes), [notes]);
  const weeks = useMemo(() => Array.from({ length: 12 }, (_, index) => calendarDays.slice(index * 7, index * 7 + 7)), [calendarDays]);
  const streak = useMemo(() => getStreak(notes), [notes]);

  function recallMoment() {
    if (!notes.length) return;
    setRecalled(notes[Math.floor(Math.random() * notes.length)]);
  }

  if (!hydrated) {
    return (
      <section aria-busy="true" className="home-insights home-insights-loading">
        <p className="eyebrow">Your private space</p>
        <h2>Your words, at your pace.</h2>
        <p>Opening your private notes…</p>
      </section>
    );
  }

  const recalledEmotions = recalled ? emotionLabels(recalled) : [];
  const rangeStart = calendarDays[0]?.date;
  const rangeEnd = calendarDays[calendarDays.length - 1]?.date;

  return (
    <section className="home-insights">
      <div className="home-insights-heading">
        <div>
          <p className="eyebrow mb-3">Your private space</p>
          <h2>Your words, at your pace.</h2>
          <p>Only entries saved in this browser appear here.</p>
        </div>
        <div className="streak-note">
          <strong>{streak}</strong>
          <span>{streakMessage(streak)}</span>
        </div>
      </div>

      <div className="insights-layout">
        <div className="mood-calendar-card">
          <div className="mood-calendar-heading">
            <div><CalendarDays aria-hidden="true" /><div><h3>Your last 12 weeks</h3><p>{rangeStart && rangeEnd ? rangeDateFormat.format(new Date(rangeStart + 'T12:00:00')) + ' – ' + rangeDateFormat.format(new Date(rangeEnd + 'T12:00:00')) : ''}</p></div></div>
            <Link href="/my-notes">View all notes</Link>
          </div>
          <div className="mood-calendar-scroll">
            <table className="mood-calendar">
              <caption className="sr-only">Private writing days and selected emotions from the last twelve weeks</caption>
              <thead><tr>{weekdayLabels.map(([full, short]) => <th key={full} scope="col"><abbr title={full}>{short}</abbr></th>)}</tr></thead>
              <tbody>
                {weeks.map((week) => (
                  <tr key={week[0]?.date}>
                    {week.map((day) => (
                      <td key={day.date}>
                        {day.notes.length ? (
                          <Link aria-label={day.date + ': ' + summaryForDay(day)} className={'mood-day mood-day-' + day.tone} href={'/my-notes?date=' + day.date} title={summaryForDay(day)}><span>{day.dayNumber}</span></Link>
                        ) : (
                          <span aria-label={day.date + ': no entry'} className={'mood-day mood-day-empty' + (day.future ? ' is-future' : '')}><span>{day.dayNumber}</span></span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div aria-label="Calendar color key" className="mood-legend">
            <span><i className="legend-gold" />Gentle</span>
            <span><i className="legend-green" />Amused</span>
            <span><i className="legend-blue" />Heavy</span>
            <span><i className="legend-red" />Intense</span>
            <span><i className="legend-mixed" />Mixed</span>
          </div>
        </div>

        <aside className="recall-card">
          <p className="eyebrow">A note from before</p>
          <h3>Meet a past moment gently.</h3>
          <p>Bring back one private entry at random. Nothing opens until you choose.</p>
          <Button className="rounded-full" disabled={!notes.length} onClick={recallMoment} type="button"><Shuffle aria-hidden="true" /> Recall a moment</Button>
          {!notes.length && <small>Save a private entry first, then it can return here.</small>}
        </aside>
      </div>

      <Dialog open={Boolean(recalled)} onOpenChange={(open) => { if (!open) setRecalled(null); }}>
        <DialogContent className="recall-dialog sm:max-w-lg" overlayClassName="bg-[#17211e]/55">
          {recalled && (
            <>
              <DialogHeader>
                <p className="eyebrow">Private entry · {recalled.createdAt ? dateFormat.format(new Date(recalled.createdAt)) : 'Saved earlier'}</p>
                <DialogTitle>{recalled.title}</DialogTitle>
                <DialogDescription className="sr-only">A randomly selected private entry saved in this browser.</DialogDescription>
              </DialogHeader>
              <p className="recall-body">{recalled.content}</p>
              {recalledEmotions.length ? <div className="recall-emotions">{recalledEmotions.map((emotion) => emotion && <span key={emotion.id}>{emotion.emoji} {emotion.label}</span>)}</div> : null}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
