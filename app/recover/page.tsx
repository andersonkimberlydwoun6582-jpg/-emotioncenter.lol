import type { Metadata } from 'next';
import { RecoveryForm } from '@/components/recovery-form';

export const metadata: Metadata = {
  title: 'Restore Your Private Notes',
  description: 'Restore end-to-end encrypted Emotion Center notes with your recovery code.',
  robots: { index: false, follow: false },
};

export default function RecoverPage() {
  return <main className="site-container recovery-page"><RecoveryForm /></main>;
}
