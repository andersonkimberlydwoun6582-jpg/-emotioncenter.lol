import type { Metadata } from 'next';
import { MyNotes } from '@/components/my-notes';

export const metadata: Metadata = {
  title: 'My private notes',
  description: 'Open private Emotion Center entries saved in this browser.',
  robots: { index: false, follow: false },
};

export default async function MyNotesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const selectedDate = date && /^\d{4}-\d{2}-\d{2}$/u.test(date) ? date : undefined;
  return <MyNotes selectedDate={selectedDate} />;
}
