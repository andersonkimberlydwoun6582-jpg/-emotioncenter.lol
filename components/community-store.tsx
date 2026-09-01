'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type Channel, type CommunityPost, type ReactionKey, seedPosts } from '@/lib/community-data';
import { deleteLocalPost, getSetting, loadLocalPosts, migrateLegacyLocalStorage, saveLocalPost, setSetting, type LocalCommunitySettings } from '@/lib/indexed-community';

type Store = {
  posts: CommunityPost[];
  hydrated: boolean;
  myReactions: Record<string, ReactionKey[]>;
  hiddenPostIds: string[];
  addPost: (input: Pick<CommunityPost, 'channel' | 'category' | 'title' | 'content'>) => Promise<CommunityPost>;
  toggleReaction: (id: string, reaction: ReactionKey) => void;
  addResponse: (id: string, content: string) => void;
  hidePost: (id: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
};

const CommunityContext = createContext<Store | null>(null);

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 55) || 'anonymous-note';
}

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<CommunityPost[]>(seedPosts);
  const [myReactions, setMyReactions] = useState<Record<string, ReactionKey[]>>({});
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      await migrateLegacyLocalStorage();
      const [storedPosts, settings] = await Promise.all([
        loadLocalPosts(),
        getSetting<LocalCommunitySettings>('community-settings'),
      ]);
      if (!active) return;
      const storedById = new Set(storedPosts.map((post) => post.id));
      setPosts([...storedPosts, ...seedPosts.filter((post) => !storedById.has(post.id))]);
      setMyReactions(settings?.myReactions ?? {});
      setHiddenPostIds(settings?.hiddenPostIds ?? []);
      setReady(true);
    })().catch(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, []);

  const value = useMemo<Store>(() => ({
    posts,
    hydrated: ready,
    myReactions,
    hiddenPostIds,
    addPost: async (input) => {
      const post: CommunityPost = {
        ...input,
        id: `${slugify(input.title)}-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        reactions: { relate: 0, support: 0, understand: 0 },
        responses: [],
        isMine: true,
      };
      await saveLocalPost(post);
      setPosts((current) => [post, ...current]);
      return post;
    },
    toggleReaction: (id, reaction) => {
      const selected = myReactions[id] ?? [];
      const isActive = selected.includes(reaction);
      const nextReactions = { ...myReactions, [id]: isActive ? selected.filter((item) => item !== reaction) : [...selected, reaction] };
      setMyReactions(nextReactions);
      void setSetting<LocalCommunitySettings>('community-settings', { myReactions: nextReactions, hiddenPostIds });
      setPosts((current) => current.map((post) => {
        if (post.id !== id) return post;
        const updated = { ...post, reactions: { ...post.reactions, [reaction]: Math.max(0, post.reactions[reaction] + (isActive ? -1 : 1)) } };
        void saveLocalPost(updated);
        return updated;
      }));
    },
    addResponse: (id, content) => setPosts((current) => current.map((post) => {
      if (post.id !== id) return post;
      const updated = { ...post, responses: [...post.responses, { id: crypto.randomUUID(), content, createdAt: new Date().toISOString() }] };
      void saveLocalPost(updated);
      return updated;
    })),
    hidePost: async (id) => {
      const nextHidden = hiddenPostIds.includes(id) ? hiddenPostIds : [...hiddenPostIds, id];
      setHiddenPostIds(nextHidden);
      await setSetting<LocalCommunitySettings>('community-settings', { myReactions, hiddenPostIds: nextHidden });
    },
    deletePost: async (id) => {
      await deleteLocalPost(id);
      setPosts((current) => current.filter((post) => post.id !== id));
    },
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
