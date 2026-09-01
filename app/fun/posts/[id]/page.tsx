import type { Metadata } from 'next';
import { PostDetail } from '@/components/community';

export const metadata: Metadata = { title: 'A lighthearted example', description: 'Read an editorial example about a small moment of humor on Emotion Center.' };

export default async function FunPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetail expectedChannel="fun" id={id} />;
}
