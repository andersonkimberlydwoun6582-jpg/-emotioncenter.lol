import type { Metadata } from 'next';
import { PostDetail } from '@/components/community';

export const metadata: Metadata = { title: 'A grief-writing example', description: 'Read an editorial letter about loss and remembrance on Emotion Center.' };

export default async function LetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetail expectedChannel="grief" id={id} />;
}
