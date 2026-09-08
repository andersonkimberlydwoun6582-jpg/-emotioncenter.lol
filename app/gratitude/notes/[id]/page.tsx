import type { Metadata } from 'next';
import { PostDetail } from '@/components/community';
import { EditorialDetail } from '@/components/editorial';
import { editorialMetadata, getEditorialPost, getEditorialPosts, privateEntryMetadata } from '@/lib/editorial';

export function generateStaticParams() {
  return getEditorialPosts('gratitude').map((post) => ({ id: post.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = getEditorialPost('gratitude', id);
  return post ? editorialMetadata(post) : privateEntryMetadata('gratitude');
}

export default async function GratitudeNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = getEditorialPost('gratitude', id);
  if (post) return <EditorialDetail post={post} />;
  return <PostDetail expectedChannel="gratitude" id={id} />;
}
