import type { Metadata } from 'next';
import { PostDetail } from '@/components/community';

export const metadata: Metadata = { title: 'A shared smile', description: 'Read something that made someone smile and join the conversation on Emotion Center.' };

export default async function FunPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetail expectedChannel="fun" id={id} />;
}
