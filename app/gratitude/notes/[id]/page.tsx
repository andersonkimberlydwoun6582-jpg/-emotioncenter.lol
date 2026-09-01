import type { Metadata } from 'next';
import { PostDetail } from '@/components/community';

export const metadata: Metadata = { title: 'An anonymous gratitude note', description: 'Read a small good thing and leave a warm response on Emotion Center.' };

export default async function GratitudeNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetail expectedChannel="gratitude" id={id} />;
}
