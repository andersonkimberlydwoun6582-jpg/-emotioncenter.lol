import type { Metadata } from 'next';
import { EMOTIONS } from '@/config/emotions';
import { seedPosts, type Channel, type CommunityPost } from '@/lib/community-data';

export const siteUrl = 'https://emotioncenter.lol';

export const editorialChannels: Record<Channel, { label: string; browsePath: string; channelPath: string; description: string }> = {
  grief: { label: 'Grief', browsePath: '/grief/browse', channelPath: '/grief', description: 'Editorial letters about loss, remembrance, and the people or animals we still miss.' },
  vent: { label: 'Vent', browsePath: '/vent/browse', channelPath: '/vent', description: 'Editorial stories about anger, frustration, work, relationships, money, and daily pressure.' },
  gratitude: { label: 'Gratitude', browsePath: '/gratitude/browse', channelPath: '/gratitude/affirmations', description: 'Editorial notes about small kindnesses, everyday gratitude, and personal growth.' },
  fun: { label: 'Smile', browsePath: '/fun/browse', channelPath: '/fun', description: 'Editorial stories about small, funny moments that make an ordinary day lighter.' },
};

export function editorialPath(channel: Channel, id: string) {
  if (channel === 'grief') return `/grief/letters/${id}`;
  if (channel === 'vent') return `/vent/rants/${id}`;
  if (channel === 'gratitude') return `/gratitude/notes/${id}`;
  return `/fun/posts/${id}`;
}

export function getEditorialPosts(channel?: Channel) {
  return channel ? seedPosts.filter((post) => post.channel === channel) : seedPosts;
}

export function getEditorialPost(channel: Channel, id: string) {
  return seedPosts.find((post) => post.channel === channel && post.id === id);
}

export function getRelatedEditorialPosts(post: CommunityPost, limit = 3) {
  return seedPosts.filter((item) => item.channel === post.channel && item.id !== post.id).slice(0, limit);
}

export function excerpt(content: string, limit = 120) {
  if (content.length <= limit) return content;
  const shortened = content.slice(0, limit + 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > limit * 0.65 ? lastSpace : limit).trimEnd()}…`;
}

export function emotionDetails(post: CommunityPost) {
  const selected = new Set(post.emotions ?? []);
  return EMOTIONS.filter((emotion) => selected.has(emotion.id));
}

export function editorialMetadata(post: CommunityPost): Metadata {
  const description = excerpt(post.content, 155);
  const path = editorialPath(post.channel, post.id);
  return {
    title: post.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: post.title,
      description,
      url: `${siteUrl}${path}`,
      type: 'article',
      images: [{ url: '/og.png', width: 1733, height: 907, alt: 'Emotion Center — A place for every feeling.' }],
    },
    twitter: { card: 'summary_large_image', title: post.title, description, images: ['/og.png'] },
  };
}

export function privateEntryMetadata(channel: Channel): Metadata {
  return {
    title: `Private ${editorialChannels[channel].label.toLowerCase()} entry`,
    description: 'A private entry stored in this browser.',
    robots: { index: false, follow: false },
  };
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
