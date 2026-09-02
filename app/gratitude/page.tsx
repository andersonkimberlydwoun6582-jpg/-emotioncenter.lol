import { permanentRedirect } from 'next/navigation';

export default function GratitudePage() {
  permanentRedirect('/gratitude/affirmations');
}
