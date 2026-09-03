'use client';

import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { BackupManager } from '@/components/backup-manager';
import { routeFor, useCommunity } from '@/components/community-store';
import { localDateKey } from '@/lib/note-insights';

/* Native navigation stays reliable when browser translation rewrites page text. */
/* oxlint-disable next/no-html-link-for-pages */

const channelName = {
  vent: 'Vent',
  grief: 'Grief',
  gratitude: 'Gratitude',
  fun: 'Smile',
};

const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' });

export function MyNotes({ selectedDate }: { selectedDate?: string }) {
  const { posts, hydrated } = useCommunity();
  const notes = useMemo(() => posts
    .filter((post) => post.isMine)
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()), [posts]);
  const groups = useMemo(() => {
    const grouped = new Map<string, typeof notes>();
    for (const note of notes) {
      const date = note.createdAt ? localDateKey(note.createdAt) : '';
      if (!date) continue;
      const entries = grouped.get(date) ?? [];
      entries.push(note);
      grouped.set(date, entries);
    }
    return [...grouped.entries()].map(([date, entries]) => ({ date, entries }));
  }, [notes]);
  const hasSelectedDate = Boolean(selectedDate && groups.some((group) => group.date === selectedDate));

  useEffect(() => {
    if (!hydrated || !selectedDate || !hasSelectedDate) return;
    const frame = requestAnimationFrame(() => document.getElementById('notes-' + selectedDate)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [hasSelectedDate, hydrated, selectedDate]);

  return (
    <main className="my-notes-page">
      <div className="site-container">
        <div className="my-notes-heading">
          <p className="eyebrow mb-3">Saved in this browser</p>
          <h1 className="section-title">My notes</h1>
          <p><LockKeyhole /> Everything you saved privately is collected here.</p>
        </div>

        {hydrated ? <BackupManager firstNoteHref={notes[0] ? routeFor(notes[0].channel, notes[0].id) : undefined} /> : null}

        {!hydrated ? <p className="my-notes-loading">Opening your notes…</p> : notes.length ? (
          <>
            {selectedDate && !hasSelectedDate ? <p className="my-notes-date-empty">No entries for this date. <a href="/my-notes">Show all notes</a></p> : null}
            <div className="my-notes-groups">
              {groups.map((group) => (
                <section className={'my-notes-date-group' + (group.date === selectedDate ? ' is-selected' : '')} id={'notes-' + group.date} key={group.date}>
                  <h2>{dateFormat.format(new Date(group.date + 'T12:00:00'))}</h2>
                  <div className="my-notes-grid">
                    {group.entries.map((note) => (
                      <a className="my-note-card" href={routeFor(note.channel, note.id)} key={note.id}>
                        <span className="eyebrow">{channelName[note.channel]}</span>
                        <h3>{note.title}</h3>
                        <p>{note.content}</p>
                        <strong>Open or edit <ArrowRight /></strong>
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <div className="my-notes-empty">
            <h2>You have not saved a private note yet.</h2>
            <p>Choose a space and write whenever you are ready.</p>
            <div><a href="/vent">Vent</a><a href="/grief">Grief</a><a href="/gratitude/affirmations">Gratitude</a><a href="/fun">Smile</a></div>
          </div>
        )}
      </div>
    </main>
  );
}
