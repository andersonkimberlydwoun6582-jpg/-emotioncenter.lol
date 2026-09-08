import type { Metadata } from 'next';
import { PostDetail } from '@/components/community';
import { EditorialDetail } from '@/components/editorial';
import { editorialMetadata, getEditorialPost, getEditorialPosts, privateEntryMetadata } from '@/lib/editorial';

export function generateStaticParams() {
  return getEditorialPosts('grief').map((post) => ({ id: post.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = getEditorialPost('grief', id);
  return post ? editorialMetadata(post) : privateEntryMetadata('grief');
}

export default async function LetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = getEditorialPost('grief', id);
  if (post) return <EditorialDetail post={post} />;
  return <PostDetail expectedChannel="grief" id={id} />;
}
