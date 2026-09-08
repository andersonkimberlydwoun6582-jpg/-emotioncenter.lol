import { type Channel } from '@/lib/community-data';
import { editorialChannels, editorialPath, getEditorialPosts, siteUrl } from '@/lib/editorial';

const rssChannelCopy: Record<Channel, { label: string; description: string }> = {
  grief: { label: 'Grief', description: 'Editorial stories about grief and loss. Written by our editors.' },
  vent: { label: 'Vent', description: 'Editorial stories about anger and frustration. Written by our editors.' },
  gratitude: { label: 'Gratitude', description: 'Editorial stories about gratitude and small good things. Written by our editors.' },
  fun: { label: 'Fun', description: 'Editorial stories about light and funny moments. Written by our editors.' },
};

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function plainText(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function summary(value: string) {
  const text = plainText(value);
  return text.length > 200 ? `${text.slice(0, 199).trimEnd()}…` : text;
}

export function rssPath(channel?: Channel) {
  return channel ? `${editorialChannels[channel].browsePath}/feed.xml` : '/editorial/feed.xml';
}

export function buildEditorialRss(channel?: Channel) {
  const posts = [...getEditorialPosts(channel)]
    .filter((post) => post.publishedAt)
    .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
    .slice(0, 50);
  const selfPath = rssPath(channel);
  const browseUrl = channel ? `${siteUrl}${editorialChannels[channel].browsePath}` : siteUrl;
  const title = channel ? `Emotion Center — Editorial Stories: ${rssChannelCopy[channel].label}` : 'Emotion Center — Editorial Stories';
  const description = channel ? rssChannelCopy[channel].description : 'Editorial stories for grief, frustration, gratitude, and lightness. Written by our editors.';
  const latestDate = posts[0]?.publishedAt;
  const items = posts.map((post) => {
    const url = `${siteUrl}${editorialPath(post.channel, post.id)}`;
    const categories = (post.emotions ?? []).map((emotion) => `      <category>${escapeXml(emotion)}</category>`).join('\n');
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(summary(post.content))}</description>
${categories}
      <pubDate>${new Date(post.publishedAt!).toUTCString()}</pubDate>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(browseUrl)}</link>
    <description>${escapeXml(description)}</description>
    <atom:link href="${escapeXml(`${siteUrl}${selfPath}`)}" rel="self" type="application/rss+xml"/>
    <language>en</language>
${latestDate ? `    <lastBuildDate>${new Date(latestDate).toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>`;
}

export function editorialRssResponse(channel?: Channel) {
  return new Response(buildEditorialRss(channel), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
