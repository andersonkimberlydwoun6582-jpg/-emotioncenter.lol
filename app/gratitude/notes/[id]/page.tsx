import type { Metadata } from 'next';
import { PostDetail } from '@/components/community';

export const metadata: Metadata = { title: 'A gratitude example', description: 'Read an editorial example about noticing a small good thing on Emotion Center.' };

export default async function GratitudeNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetail expectedChannel="gratitude" id={id} />;
}
