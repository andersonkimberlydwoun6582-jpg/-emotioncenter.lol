'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, EyeOff, Heart, MessageCircle, Send, Share2, Shuffle, Sparkles, Trash2, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type Channel, type CommunityPost, type ReactionKey } from '@/lib/community-data';
import { routeFor, useCommunity } from '@/components/community-store';
import { CloudBackupPanel } from '@/components/cloud-backup-panel';
import { deleteDraftEverywhere } from '@/lib/cloud-backup';

const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const channelCopy: Record<Channel, { titlePlaceholder: string; bodyPlaceholder: string; backHref: string; backLabel: string; responseTitle: string }> = {
  vent: { titlePlaceholder: 'What finally pushed you over the edge?', bodyPlaceholder: 'I am so tired of…', backHref: '/vent', backLabel: 'rants', responseTitle: 'Leave a supportive note.' },
  grief: { titlePlaceholder: 'Something you still want to tell them…', bodyPlaceholder: 'I want you to know that…', backHref: '/grief', backLabel: 'letters', responseTitle: 'Leave a little kindness here.' },
  gratitude: { titlePlaceholder: 'What felt worth noticing today?', bodyPlaceholder: 'Today I am grateful for…', backHref: '/gratitude/affirmations', backLabel: 'gratitude notes', responseTitle: 'Add a warm note.' },
  fun: { titlePlaceholder: 'What made you smile?', bodyPlaceholder: 'The funny thing was…', backHref: '/fun', backLabel: 'smiles', responseTitle: 'Join the laugh.' },
};

const reactionCopy: Record<Channel, Record<ReactionKey, string>> = {
  vent: { relate: 'Same here', support: 'Hang in there', understand: 'I get this' },
  grief: { relate: 'I feel this', support: 'Sending love', understand: 'I remember too' },
  gratitude: { relate: 'Me too', support: 'Sending warmth', understand: 'This helped' },
  fun: { relate: 'Same energy', support: 'Good one', understand: 'Made me smile' },
};

const reactionIcons = { relate: Users, support: Heart, understand: Sparkles };

function totalReactions(post: CommunityPost) {
  return Object.values(post.reactions).reduce((sum, value) => sum + value, 0);
}

function stableRandom(id: string, seed: number) {
  let value = seed;
  for (let index = 0; index < id.length; index += 1) value = (value * 31 + id.charCodeAt(index)) | 0;
  return value;
}

function ReactionBar({ post, compact = false }: { post: CommunityPost; compact?: boolean }) {
  const { myReactions, toggleReaction } = useCommunity();
  const selected = myReactions[post.id] ?? [];

  return (
    <div className={`reaction-bar ${compact ? 'reaction-bar-compact' : ''}`} aria-label="Quick reactions">
      {(Object.keys(reactionCopy[post.channel]) as ReactionKey[]).map((key) => {
        const Icon = reactionIcons[key];
        const active = selected.includes(key);
        return <button aria-pressed={active} className="reaction-button" data-active={active} key={key} onClick={() => toggleReaction(post.id, key)} type="button"><Icon /><span>{reactionCopy[post.channel][key]}</span><b>{post.reactions[key] || ''}</b></button>;
      })}
    </div>
  );
}

export function Composer({ channel, category = 'general', prompt, buttonLabel }: { channel: Channel; category?: string; prompt: string; buttonLabel: string }) {
  const { addPost } = useCommunity();
  const copy = channelCopy[channel];
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Add a title before saving.');
      return;
    }
    if (!content.trim()) {
      setError('Add a few words before saving.');
      return;
    }
    try {
      const post = await addPost({ channel, category, title: title.trim(), content: content.trim() });
      window.location.assign(routeFor(channel, post.id));
    } catch {
      setError('This browser could not save the note. Check private-browsing storage settings and try again.');
    }
  }

  return (
    <form className={`composer composer-${channel}`} onSubmit={submit}>
      <div><p className="eyebrow mb-3">Write without a profile</p><h2 className="font-heading text-3xl font-normal tracking-tight sm:text-4xl">{prompt}</h2></div>
      <label className="field-label" htmlFor={`${channel}-post-title`}>Give your words a title</label>
      <Input className="h-11 bg-white/50 px-4" id={`${channel}-post-title`} maxLength={100} onChange={(event) => { setTitle(event.target.value); setError(''); }} placeholder={copy.titlePlaceholder} value={title} />
      <label className="field-label" htmlFor={`${channel}-post-content`}>Your words</label>
      <Textarea className="min-h-40 resize-y bg-white/50 p-4 leading-7" id={`${channel}-post-content`} maxLength={3000} onChange={(event) => { setContent(event.target.value); setError(''); }} placeholder={copy.bodyPlaceholder} value={content} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-ink-soft">Private to this browser unless you choose an encrypted backup. Avoid names, addresses, workplaces, or identifying details.</p>
        <Button className="h-11 rounded-full px-5" type="submit"><Send /> {buttonLabel}</Button>
      </div>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </form>
  );
}

export function CommunityFeed({ channel, category, limit = 8, title = 'Words in this space' }: { channel: Channel; category?: string; limit?: number; title?: string }) {
  const { posts, hiddenPostIds } = useCommunity();
  const [sort, setSort] = useState<'recent' | 'top' | 'random'>('recent');
  const [randomSeed, setRandomSeed] = useState(1);
  const filtered = useMemo(() => {
    const result = posts.filter((post) => post.channel === channel && !hiddenPostIds.includes(post.id) && (!category || post.category === category));
    if (sort === 'top') result.sort((a, b) => totalReactions(b) - totalReactions(a));
    else if (sort === 'random') result.sort((a, b) => stableRandom(a.id, randomSeed) - stableRandom(b.id, randomSeed));
    else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result.slice(0, limit);
  }, [posts, hiddenPostIds, channel, category, limit, sort, randomSeed]);

  function chooseSort(next: 'recent' | 'top' | 'random') {
    setSort(next);
    if (next === 'random') setRandomSeed((value) => value + 1);
  }

  return (
    <section className="content-section community-feed">
      <div className="feed-heading">
        <div><p className="eyebrow mb-3">Examples and your private notes</p><h2 className="font-heading text-3xl font-normal tracking-tight sm:text-4xl">{title}</h2></div>
        <div className="feed-filters" aria-label="Sort posts">
          <button aria-pressed={sort === 'recent'} onClick={() => chooseSort('recent')} type="button"><CalendarDays /> Recent</button>
          <button aria-pressed={sort === 'top'} onClick={() => chooseSort('top')} type="button"><TrendingUp /> Top</button>
          <button aria-pressed={sort === 'random'} onClick={() => chooseSort('random')} type="button"><Shuffle /> Random</button>
        </div>
      </div>
      <div className="post-grid">
        {filtered.map((post) => (
          <article className="post-card" key={post.id}>
            <p className="eyebrow">{post.category.replace('-', ' ')}</p>
            <Link className="post-card-link" href={routeFor(post.channel, post.id)}><h3>{post.title}</h3><p className="post-excerpt">{post.content}</p></Link>
            <div className="post-meta"><span>{dateFormat.format(new Date(post.createdAt))}</span><span>{totalReactions(post)} felt this</span><span><MessageCircle /> {post.responses.length}</span></div>
            <ReactionBar compact post={post} />
            <Link className="leave-note-link" href={`${routeFor(post.channel, post.id)}#responses`}><MessageCircle /> Leave a note</Link>
          </article>
        ))}
        {!filtered.length && <div className="feed-empty"><p className="font-heading text-2xl">Nothing here yet.</p><p className="mt-2 text-sm text-ink-soft">You can be the first person to leave something in this space.</p></div>}
      </div>
    </section>
  );
}

export function EmotionLinks({ current }: { current: Channel }) {
  const links = [
    { key: 'vent', href: '/vent/anonymous', label: 'I need to let something out', note: 'A private-feeling place to write without using your name.' },
    { key: 'grief', href: '/grief', label: 'There is grief underneath this', note: 'Write to someone you miss or read letters from others.' },
    { key: 'gratitude', href: '/gratitude/affirmations', label: 'I need one kind thought', note: 'Generate a gentle affirmation and share what helped.' },
    { key: 'fun', href: '/fun', label: 'I need a small break', note: 'Share a laugh or find a little lightness.' },
  ].filter((link) => link.key !== current).slice(0, 3);

  return <section className="content-section"><p className="eyebrow mb-3">Another door may fit</p><h2 className="font-heading text-3xl font-normal tracking-tight sm:text-4xl">What do you need next?</h2><div className="mt-8 grid gap-3 md:grid-cols-3">{links.map((link) => <Link className="journey-card" href={link.href} key={link.key}><span>{link.label}</span><p>{link.note}</p><ArrowRight /></Link>)}</div></section>;
}

export function PostDetail({ id, expectedChannel }: { id: string; expectedChannel: Channel }) {
  const { posts, hydrated, hiddenPostIds, addResponse, hidePost, deletePost } = useCommunity();
  const copy = channelCopy[expectedChannel];
  const post = posts.find((item) => item.id === id && item.channel === expectedChannel && !hiddenPostIds.includes(item.id));
  const [response, setResponse] = useState('');
  const [shared, setShared] = useState(false);
  const [responseError, setResponseError] = useState('');

  useEffect(() => { if (post) document.title = `${post.title} — Emotion Center`; }, [post]);

  if (!post && !hydrated) return <main className="site-container min-h-[60vh] py-24"><p className="text-ink-soft">Opening this note…</p></main>;
  if (!post) return <main className="site-container min-h-[60vh] py-24"><p className="eyebrow mb-4">Not found</p><h1 className="section-title">This note is no longer here.</h1><Link className="mt-8 inline-flex items-center gap-2 font-semibold" href={copy.backHref}><ArrowLeft /> Back to this channel</Link></main>;

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: post!.title, text: post!.content, url: window.location.href });
      else await navigator.clipboard.writeText(window.location.href);
      setShared(true);
    } catch { setShared(false); }
  }

  function respond(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (response.trim().length < 2) { setResponseError('Write at least a couple of words.'); return; }
    addResponse(post!.id, response.trim());
    setResponse('');
    setResponseError('');
  }

  async function hide() {
    try {
      await hidePost(post!.id);
      window.location.assign(copy.backHref);
    } catch {
      setResponseError('This browser could not update the hidden-notes list.');
    }
  }

  async function remove() {
    if (!window.confirm('Permanently delete this note from this browser and its encrypted cloud copy, if one exists?')) return;
    try {
      await deleteDraftEverywhere(post!.id);
      await deletePost(post!.id);
      window.location.assign(copy.backHref);
    } catch (caught) {
      setResponseError(caught instanceof Error ? caught.message : 'This note could not be deleted.');
    }
  }

  return (
    <main className={`detail-page detail-${post.channel}`}>
      <article className="article-shell">
        <Link className="back-link" href={copy.backHref}><ArrowLeft /> Back to all {copy.backLabel}</Link>
        <p className="eyebrow mt-12">Anonymous · {dateFormat.format(new Date(post.createdAt))}</p>
        <h1 className="article-title">{post.title}</h1>
        <div className="article-body"><p>{post.content}</p></div>
        <ReactionBar post={post} />
        <div className="article-actions">
          <Button className="rounded-full" onClick={share} variant="outline"><Share2 /> {shared ? 'Link copied' : 'Share'}</Button>
          <Button className="rounded-full" onClick={hide} variant="ghost"><EyeOff /> Hide this note</Button>
          {post.isMine && <Button className="rounded-full" onClick={remove} variant="ghost"><Trash2 /> Delete everywhere</Button>}
        </div>
        {post.isMine && <CloudBackupPanel post={post} />}

        <section className="responses" id="responses">
          <p className="eyebrow mb-3">Notes · {post.responses.length}</p>
          <h2 className="font-heading text-3xl font-normal">{copy.responseTitle}</h2>
          <div className="mt-7 space-y-3">
            {post.responses.map((item) => <div className="response" key={item.id}><p>{item.content}</p><span>Anonymous · {dateFormat.format(new Date(item.createdAt))}</span></div>)}
            {!post.responses.length && <p className="rounded-xl border border-dashed p-5 text-sm text-ink-soft">No notes yet. You can be the first person to let them know they were heard.</p>}
          </div>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={respond}>
            <div className="flex-1"><Input aria-label="Supportive note" className="h-11 bg-white/55 px-4" onChange={(event) => setResponse(event.target.value)} placeholder="Write something kind…" value={response} />{responseError && <p className="mt-2 text-sm text-red-700" role="alert">{responseError}</p>}</div>
            <Button className="h-11 rounded-full px-5" type="submit">Send note</Button>
          </form>
        </section>
      </article>
      <div className="site-container pb-20"><EmotionLinks current={post.channel} /></div>
    </main>
  );
}
