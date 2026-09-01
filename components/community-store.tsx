'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type Channel, type CommunityPost, seedPosts } from '@/lib/community-data';
import { deleteLocalPost, getSetting, loadLocalPosts, migrateLegacyLocalStorage, saveLocalPost, setSetting, type LocalCommunitySettings } from '@/lib/indexed-community';

type Store = {
  posts: CommunityPost[];
  hydrated: boolean;
  hiddenPostIds: string[];
  addPost: (input: Pick<CommunityPost, 'channel' | 'category' | 'title' | 'content'>) => Promise<CommunityPost>;
  updatePost: (id: string, input: Pick<CommunityPost, 'title' | 'content'>) => Promise<CommunityPost>;
  hidePost: (id: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
};

const CommunityContext = createContext<Store | null>(null);

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 55) || 'anonymous-note';
}

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<CommunityPost[]>(seedPosts);
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
    hiddenPostIds,
    addPost: async (input) => {
      const post: CommunityPost = {
        ...input,
        id: `${slugify(input.title)}-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        isMine: true,
      };
      await saveLocalPost(post);
      setPosts((current) => [post, ...current]);
      return post;
    },
    updatePost: async (id, input) => {
      const existing = posts.find((post) => post.id === id && post.isMine);
      if (!existing) throw new Error('Only private entries can be edited.');
      const updated = { ...existing, ...input };
      await saveLocalPost(updated);
      setPosts((current) => current.map((post) => post.id === id ? updated : post));
      return updated;
    },
    hidePost: async (id) => {
      const nextHidden = hiddenPostIds.includes(id) ? hiddenPostIds : [...hiddenPostIds, id];
      setHiddenPostIds(nextHidden);
      await setSetting<LocalCommunitySettings>('community-settings', { hiddenPostIds: nextHidden });
    },
    deletePost: async (id) => {
      await deleteLocalPost(id);
      setPosts((current) => current.filter((post) => post.id !== id));
    },
  }), [posts, ready, hiddenPostIds]);

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
