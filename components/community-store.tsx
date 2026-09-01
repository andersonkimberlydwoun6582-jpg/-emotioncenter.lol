'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type Channel, type CommunityPost, type ReactionKey, seedPosts } from '@/lib/community-data';

type Store = {
  posts: CommunityPost[];
  hydrated: boolean;
  myReactions: Record<string, ReactionKey[]>;
  hiddenPostIds: string[];
  addPost: (input: Pick<CommunityPost, 'channel' | 'category' | 'title' | 'content'>) => CommunityPost;
  toggleReaction: (id: string, reaction: ReactionKey) => void;
  addResponse: (id: string, content: string) => void;
  hidePost: (id: string) => void;
};

const CommunityContext = createContext<Store | null>(null);
const storageKey = 'emotion-center-posts-v2';
const legacyStorageKey = 'emotion-center-posts-v1';
const reactionsKey = 'emotion-center-reactions-v1';
const hiddenKey = 'emotion-center-hidden-v1';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 55) || 'anonymous-note';
}

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<CommunityPost[]>(seedPosts);
  const [myReactions, setMyReactions] = useState<Record<string, ReactionKey[]>>({});
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Array<CommunityPost & { likes?: number }>;
        const normalized = parsed.map((post) => ({
          ...post,
          reactions: post.reactions ?? { relate: post.likes ?? 0, support: 0, understand: 0 },
        }));
        const existingIds = new Set(normalized.map((post) => post.id));
        setPosts([...normalized, ...seedPosts.filter((post) => !existingIds.has(post.id))]);
      } catch { setPosts(seedPosts); }
    }
    try { setMyReactions(JSON.parse(window.localStorage.getItem(reactionsKey) ?? '{}')); } catch { setMyReactions({}); }
    try { setHiddenPostIds(JSON.parse(window.localStorage.getItem(hiddenKey) ?? '[]')); } catch { setHiddenPostIds([]); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKey, JSON.stringify(posts));
  }, [posts, ready]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(reactionsKey, JSON.stringify(myReactions));
  }, [myReactions, ready]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(hiddenKey, JSON.stringify(hiddenPostIds));
  }, [hiddenPostIds, ready]);

  const value = useMemo<Store>(() => ({
    posts,
    hydrated: ready,
    myReactions,
    hiddenPostIds,
    addPost: (input) => {
      const post: CommunityPost = { ...input, id: `${slugify(input.title)}-${Date.now().toString(36)}`, createdAt: new Date().toISOString(), reactions: { relate: 0, support: 0, understand: 0 }, responses: [] };
      setPosts((current) => [post, ...current]);
      return post;
    },
    toggleReaction: (id, reaction) => {
      const selected = myReactions[id] ?? [];
      const isActive = selected.includes(reaction);
      setMyReactions((current) => ({ ...current, [id]: isActive ? selected.filter((item) => item !== reaction) : [...selected, reaction] }));
      setPosts((current) => current.map((post) => post.id === id ? { ...post, reactions: { ...post.reactions, [reaction]: Math.max(0, post.reactions[reaction] + (isActive ? -1 : 1)) } } : post));
    },
    addResponse: (id, content) => setPosts((current) => current.map((post) => post.id === id ? { ...post, responses: [...post.responses, { id: crypto.randomUUID(), content, createdAt: new Date().toISOString() }] } : post)),
    hidePost: (id) => setHiddenPostIds((current) => current.includes(id) ? current : [...current, id]),
  }), [posts, ready, myReactions, hiddenPostIds]);

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const value = useContext(CommunityContext);
  if (!value) throw new Error('useCommunity must be used within CommunityProvider');
  return value;
}

export function routeFor(channel: Channel, id: string) {
  if (channel === 'grief') return `/grief/letters/${id}`;
  if (channel === 'vent') return `/vent/rants/${id}`;
  if (channel === 'gratitude') return `/gratitude/notes/${id}`;
  return `/fun/posts/${id}`;
}
