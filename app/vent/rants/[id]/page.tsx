import type { Metadata } from 'next';
import { PostDetail } from '@/components/community';

export const metadata: Metadata = { title: 'An anonymous vent', description: 'Read an anonymous rant and supportive responses on Emotion Center.' };

export default async function RantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetail expectedChannel="vent" id={id} />;
}
