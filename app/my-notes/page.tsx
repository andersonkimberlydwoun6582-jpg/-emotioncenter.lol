import type { Metadata } from 'next';
import { MyNotes } from '@/components/my-notes';

export const metadata: Metadata = {
  title: 'My private notes',
  description: 'Open private Emotion Center entries saved in this browser.',
  robots: { index: false, follow: false },
};

export default function MyNotesPage() {
  return <MyNotes />;
}
