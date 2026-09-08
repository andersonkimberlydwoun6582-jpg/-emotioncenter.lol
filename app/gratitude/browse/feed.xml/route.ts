import { editorialRssResponse } from '@/lib/rss';

export function GET() {
  return editorialRssResponse('gratitude');
}
