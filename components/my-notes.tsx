'use client';

import { ArrowRight, LockKeyhole } from 'lucide-react';
import { routeFor, useCommunity } from '@/components/community-store';

/* Native navigation stays reliable when browser translation rewrites page text. */
/* oxlint-disable next/no-html-link-for-pages */

const channelName = {
  vent: 'Vent',
  grief: 'Grief',
  gratitude: 'Gratitude',
  fun: 'Smile',
};

const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function MyNotes() {
  const { posts, hydrated } = useCommunity();
  const notes = posts
    .filter((post) => post.isMine)
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  return (
    <main className="my-notes-page">
      <div className="site-container">
        <div className="my-notes-heading">
          <p className="eyebrow mb-3">Saved in this browser</p>
          <h1 className="section-title">My notes</h1>
          <p><LockKeyhole /> Everything you saved privately is collected here.</p>
        </div>

        {!hydrated ? <p className="my-notes-loading">Opening your notes…</p> : notes.length ? (
          <div className="my-notes-grid">
            {notes.map((note) => (
              <a className="my-note-card" href={routeFor(note.channel, note.id)} key={note.id}>
                <span className="eyebrow">{channelName[note.channel]}{note.createdAt ? ` · ${dateFormat.format(new Date(note.createdAt))}` : ''}</span>
                <h2>{note.title}</h2>
                <p>{note.content}</p>
                <strong>Open or edit <ArrowRight /></strong>
              </a>
            ))}
          </div>
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
