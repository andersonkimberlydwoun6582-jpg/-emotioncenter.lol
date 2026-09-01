import type { MetadataRoute } from 'next';
import { seedPosts } from '@/lib/community-data';

function postPath(channel: string, id: string) {
  if (channel === 'grief') return `/grief/letters/${id}`;
  if (channel === 'vent') return `/vent/rants/${id}`;
  if (channel === 'gratitude') return `/gratitude/notes/${id}`;
  return `/fun/posts/${id}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/grief', '/grief/missing-mom', '/grief/pet-loss', '/vent', '/vent/anonymous', '/gratitude/affirmations', '/fun', ...seedPosts.map((post) => postPath(post.channel, post.id))];
  return routes.map((route) => ({ url: `https://emotioncenter.lol${route}`, lastModified: new Date('2026-09-01'), changeFrequency: route === '' ? 'weekly' : 'monthly', priority: route === '' ? 1 : 0.8 }));
}
