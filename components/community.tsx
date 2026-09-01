'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, EyeOff, LockKeyhole, Pencil, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type Channel } from '@/lib/community-data';
import { routeFor, useCommunity } from '@/components/community-store';
import { CloudBackupPanel } from '@/components/cloud-backup-panel';
import { deleteDraftEverywhere } from '@/lib/cloud-backup';
import { CHANNEL_PROMPTS } from '@/config/prompts';
import { EMOTIONS, type EmotionId } from '@/config/emotions';
import { VoiceInputButton } from '@/components/voice-input-button';

const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const channelCopy: Record<Channel, { titlePlaceholder: string; bodyPlaceholder: string; backHref: string; backLabel: string }> = {
  vent: { titlePlaceholder: 'What finally pushed you over the edge?', bodyPlaceholder: 'I am so tired of…', backHref: '/vent', backLabel: 'vents' },
  grief: { titlePlaceholder: 'Something you still want to tell them…', bodyPlaceholder: 'I want you to know that…', backHref: '/grief', backLabel: 'letters' },
  gratitude: { titlePlaceholder: 'What felt worth noticing today?', bodyPlaceholder: 'Today I am grateful for…', backHref: '/gratitude/affirmations', backLabel: 'gratitude notes' },
  fun: { titlePlaceholder: 'What made you smile?', bodyPlaceholder: 'The funny thing was…', backHref: '/fun', backLabel: 'smiles' },
};

function savedDate(createdAt?: string) {
  return createdAt ? dateFormat.format(new Date(createdAt)) : '';
}

export function Composer({ channel, category = 'general', prompt }: { channel: Channel; category?: string; prompt: string }) {
  const { addPost } = useCommunity();
  const copy = channelCopy[channel];
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [emotions, setEmotions] = useState<EmotionId[]>([]);

  function toggleEmotion(emotion: EmotionId) {
    setEmotions((current) => current.includes(emotion) ? current.filter((item) => item !== emotion) : [...current, emotion]);
  }

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!title.trim()) {
      setError('Add a title before saving.');
      return;
    }
    if (!content.trim()) {
      setError('Add a few words before saving.');
      return;
    }
    setSaving(true);
    try {
      const post = await addPost({ channel, category, title: title.trim(), content: content.trim(), emotions });
      window.location.assign(routeFor(channel, post.id));
    } catch {
      setError('This browser could not save the entry. Check private-browsing storage settings and try again.');
      setSaving(false);
    }
  }

  return (
    <form className={`composer composer-${channel}`} onSubmit={submit}>
      <div><p className="eyebrow mb-3">Write without a profile</p><h2 className="font-heading text-3xl font-normal tracking-tight sm:text-4xl">{prompt}</h2></div>
      <div className="prompt-group"><p className="field-label">Need a place to start?</p><div className="prompt-pills">{CHANNEL_PROMPTS[channel].map((item) => <button className="prompt-pill" key={item} onClick={() => { setTitle(item); setError(''); }} type="button">{item}</button>)}</div></div>
      <label className="field-label" htmlFor={`${channel}-post-title`}>Give your words a title</label>
      <Input className="h-11 bg-white/50 px-4" id={`${channel}-post-title`} maxLength={100} onChange={(event) => { setTitle(event.target.value); setError(''); }} placeholder={copy.titlePlaceholder} value={title} />
      <div className="private-writing-notice"><LockKeyhole /><div><strong>Saved only on this device.</strong><p>Choose an encrypted backup after saving if you want to access this entry elsewhere.</p></div></div>
      <label className="field-label" htmlFor={`${channel}-post-content`}>Your words</label>
      <div className="voice-textarea-wrap"><Textarea className="min-h-40 resize-y bg-white/50 p-4 pb-14 leading-7" id={`${channel}-post-content`} maxLength={3000} onChange={(event) => { setContent(event.target.value); setError(''); }} placeholder={copy.bodyPlaceholder} value={content} /><VoiceInputButton onChange={(value) => { setContent(value.slice(0, 3000)); setError(''); }} textareaId={`${channel}-post-content`} value={content} /></div>
      <fieldset className="emotion-picker"><legend className="field-label">How does this feel? <span>Optional · choose more than one</span></legend><div>{EMOTIONS.map((emotion) => { const selected = emotions.includes(emotion.id); return <button aria-pressed={selected} className="emotion-choice" data-selected={selected} key={emotion.id} onClick={() => toggleEmotion(emotion.id)} type="button"><span aria-hidden="true">{emotion.emoji}</span>{emotion.label}</button>; })}</div></fieldset>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-ink-soft">Avoid names, addresses, workplaces, or other identifying details.</p>
        <Button className="h-11 rounded-full px-5" disabled={saving} type="submit"><Save /> {saving ? 'Saving…' : 'Save privately'}</Button>
      </div>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </form>
  );
}

export function CommunityFeed({ channel, category, limit = 8, title = 'Examples for this space' }: { channel: Channel; category?: string; limit?: number; title?: string }) {
  const { posts, hiddenPostIds } = useCommunity();
  const examples = useMemo(() => posts
    .filter((post) => !post.isMine && post.channel === channel && !hiddenPostIds.includes(post.id) && (!category || post.category === category))
    .slice(0, limit), [posts, hiddenPostIds, channel, category, limit]);
  const privateNotes = useMemo(() => posts
    .filter((post) => post.isMine && post.channel === channel && (!category || post.category === category))
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, limit), [posts, channel, category, limit]);

  return (
    <section className="content-section community-feed">
      <div className="feed-group examples-group">
        <div className="feed-heading"><div><p className="eyebrow mb-3">Editorial examples</p><h2 className="font-heading text-3xl font-normal tracking-tight sm:text-4xl">{title}</h2><p className="feed-section-note">Written examples to help you begin. They are not community posts.</p></div></div>
        <div className="post-grid">
          {examples.map((post) => (
            <article className="post-card post-card-example" key={post.id}>
              <p className="eyebrow">Editorial example · {post.category.replace(/-/g, ' ')}</p>
              <a className="post-card-link" href={routeFor(post.channel, post.id)}><h3>{post.title}</h3><p className="post-excerpt">{post.content}</p><span className="entry-link">Read example <ArrowRight /></span></a>
            </article>
          ))}
          {!examples.length && <div className="feed-empty"><p className="font-heading text-2xl">No examples are shown here.</p></div>}
        </div>
      </div>

      <div className="feed-group private-notes-group">
        <div className="feed-heading"><div><p className="eyebrow mb-3">Your notes</p><h2 className="font-heading text-3xl font-normal tracking-tight sm:text-4xl">Private entries on this device</h2><p className="feed-section-note">Only you can see these entries in this browser. Open one to edit, delete, or back it up with encryption.</p></div></div>
        <div className="post-grid">
          {privateNotes.map((post) => (
            <article className="post-card post-card-private" key={post.id}>
              <p className="eyebrow">Private entry{savedDate(post.createdAt) ? ` · ${savedDate(post.createdAt)}` : ''}</p>
              <a className="post-card-link" href={routeFor(post.channel, post.id)}><h3>{post.title}</h3><p className="post-excerpt">{post.content}</p><span className="entry-link">Open or edit <Pencil /></span></a>
            </article>
          ))}
          {!privateNotes.length && <div className="feed-empty"><p className="font-heading text-2xl">No private entries yet.</p><p className="mt-2 text-sm text-ink-soft">Use the writing space above to save your first entry on this device.</p></div>}
        </div>
      </div>
    </section>
  );
}

export function EmotionLinks({ current }: { current: Channel }) {
  const links = [
    { key: 'vent', href: '/vent/anonymous', label: 'I need to let something out', note: 'A private space to write without using your name.' },
    { key: 'grief', href: '/grief', label: 'There is grief underneath this', note: 'Write to someone you miss or read an editorial example.' },
    { key: 'gratitude', href: '/gratitude/affirmations', label: 'I need one kind thought', note: 'Find a gentle affirmation and save what helped privately.' },
    { key: 'fun', href: '/fun', label: 'I need a small break', note: 'Find a laugh and keep a smile for yourself.' },
  ].filter((link) => link.key !== current).slice(0, 3);

  return <section className="content-section"><p className="eyebrow mb-3">Another door may fit</p><h2 className="font-heading text-3xl font-normal tracking-tight sm:text-4xl">What do you need next?</h2><div className="mt-8 grid gap-3 md:grid-cols-3">{links.map((link) => <a className="journey-card" href={link.href} key={link.key}><span>{link.label}</span><p>{link.note}</p><ArrowRight /></a>)}</div></section>;
}

export function PostDetail({ id, expectedChannel }: { id: string; expectedChannel: Channel }) {
  const { posts, hydrated, hiddenPostIds, updatePost, hidePost, deletePost } = useCommunity();
  const copy = channelCopy[expectedChannel];
  const post = posts.find((item) => item.id === id && item.channel === expectedChannel && !hiddenPostIds.includes(item.id));
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [entryError, setEntryError] = useState('');
  const postTitle = post?.title;

  useEffect(() => {
    if (!postTitle) return;
    document.title = `${postTitle} — Emotion Center`;
  }, [postTitle]);

  if (!post && !hydrated) return <main className="site-container min-h-[60vh] py-24"><p className="text-ink-soft">Opening this entry…</p></main>;
  if (!post) return <main className="site-container min-h-[60vh] py-24"><p className="eyebrow mb-4">Not found</p><h1 className="section-title">This entry is no longer here.</h1><a className="mt-8 inline-flex items-center gap-2 font-semibold" href={copy.backHref}><ArrowLeft /> Back to this channel</a></main>;

  async function hide() {
    try {
      await hidePost(post!.id);
      window.location.assign(copy.backHref);
    } catch {
      setEntryError('This browser could not update the hidden-examples list.');
    }
  }

  async function remove() {
    if (!window.confirm('Permanently delete this entry from this browser and its encrypted cloud copy, if one exists?')) return;
    try {
      await deleteDraftEverywhere(post!.id);
      await deletePost(post!.id);
      window.location.assign(copy.backHref);
    } catch (caught) {
      setEntryError(caught instanceof Error ? caught.message : 'This entry could not be deleted.');
    }
  }

  async function saveChanges(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTitle.trim()) {
      setEntryError('Add a title before saving.');
      return;
    }
    if (!editContent.trim()) {
      setEntryError('Add a few words before saving.');
      return;
    }
    try {
      await updatePost(post!.id, { title: editTitle.trim(), content: editContent.trim() });
      setEditing(false);
      setEntryError('');
    } catch (caught) {
      setEntryError(caught instanceof Error ? caught.message : 'This entry could not be updated.');
    }
  }

  function cancelEditing() {
    setEditTitle(post!.title);
    setEditContent(post!.content);
    setEntryError('');
    setEditing(false);
  }

  function beginEditing() {
    setEditTitle(post!.title);
    setEditContent(post!.content);
    setEntryError('');
    setEditing(true);
  }

  return (
    <main className={`detail-page detail-${post.channel}`}>
      <article className="article-shell">
        <a className="back-link" href={copy.backHref}><ArrowLeft /> Back to all {copy.backLabel}</a>
        <p className="eyebrow mt-12">{post.isMine ? `Private entry${savedDate(post.createdAt) ? ` · ${savedDate(post.createdAt)}` : ''}` : 'Editorial example'}</p>
        {editing && post.isMine ? (
          <form className="entry-edit-form" onSubmit={saveChanges}>
            <label className="field-label" htmlFor="entry-title">Title</label>
            <Input className="h-12 bg-white/65 px-4" id="entry-title" maxLength={100} onChange={(event) => { setEditTitle(event.target.value); setEntryError(''); }} value={editTitle} />
            <label className="field-label" htmlFor="entry-content">Your words</label>
            <Textarea className="min-h-64 resize-y bg-white/65 p-4 leading-7" id="entry-content" maxLength={3000} onChange={(event) => { setEditContent(event.target.value); setEntryError(''); }} value={editContent} />
            <div className="article-actions"><Button className="rounded-full" type="submit"><Save /> Save changes</Button><Button className="rounded-full" onClick={cancelEditing} type="button" variant="ghost"><X /> Cancel</Button></div>
          </form>
        ) : (
          <><h1 className="article-title">{post.title}</h1><div className="article-body"><p>{post.content}</p></div></>
        )}
        {!editing && <div className="article-actions">
          {post.isMine ? <><Button className="rounded-full" onClick={beginEditing} variant="outline"><Pencil /> Edit entry</Button><Button className="rounded-full" onClick={remove} variant="ghost"><Trash2 /> Delete everywhere</Button></> : <Button className="rounded-full" onClick={hide} variant="ghost"><EyeOff /> Hide this example</Button>}
        </div>}
        {entryError && <p className="mt-4 text-sm text-red-700" role="alert">{entryError}</p>}
        {post.isMine ? <><p className="entry-privacy-note"><LockKeyhole /> This entry is private to this browser. If you edit it, update its encrypted copy below when you are ready.</p><CloudBackupPanel post={post} /></> : <p className="example-disclaimer">This is an editorial example written to help you begin. It is not a community post or a record of public interaction.</p>}
      </article>
      <div className="site-container pb-20"><EmotionLinks current={post.channel} /></div>
    </main>
  );
}
