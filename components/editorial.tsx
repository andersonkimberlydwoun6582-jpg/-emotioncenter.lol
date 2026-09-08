import { ArrowLeft, ArrowRight } from 'lucide-react';
import { EMOTIONS } from '@/config/emotions';
import { type Channel, type CommunityPost } from '@/lib/community-data';
import {
  editorialChannels,
  editorialPath,
  emotionDetails,
  excerpt,
  getEditorialPosts,
  getRelatedEditorialPosts,
  jsonLd,
  siteUrl,
} from '@/lib/editorial';

/* Native navigation matches the rest of the site and remains stable under browser translation. */
/* oxlint-disable next/no-html-link-for-pages */

const privateWritingLabels: Record<Channel, string> = {
  grief: 'Write about grief',
  vent: 'Write what is on your mind',
  gratitude: 'Write a gratitude note',
  fun: 'Write down a smile',
};

function EmotionTags({ post }: { post: CommunityPost }) {
  const emotions = emotionDetails(post);
  if (!emotions.length) return null;
  return <div className="editorial-emotions" aria-label="Emotions">{emotions.map((emotion) => <span key={emotion.id}><span aria-hidden="true">{emotion.emoji}</span>{emotion.label}</span>)}</div>;
}

function EditorialCard({ post }: { post: CommunityPost }) {
  return (
    <article className="editorial-card">
      <p className="eyebrow">{post.category.replace(/-/g, ' ')}</p>
      <h2><a href={editorialPath(post.channel, post.id)}>{post.title}</a></h2>
      <EmotionTags post={post} />
      <p>{excerpt(post.content)}</p>
      <a className="entry-link" href={editorialPath(post.channel, post.id)}>Read story <ArrowRight aria-hidden="true" /></a>
    </article>
  );
}

export function EditorialDetail({ post }: { post: CommunityPost }) {
  const channel = editorialChannels[post.channel];
  const path = editorialPath(post.channel, post.id);
  const description = excerpt(post.content, 155);
  const related = getRelatedEditorialPosts(post);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description,
    url: `${siteUrl}${path}`,
    mainEntityOfPage: `${siteUrl}${path}`,
    isAccessibleForFree: true,
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: 'Emotion Center', url: siteUrl },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Emotion Center', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: channel.label, item: `${siteUrl}${channel.channelPath}` },
      { '@type': 'ListItem', position: 3, name: 'Editorial Stories', item: `${siteUrl}${channel.browsePath}` },
      { '@type': 'ListItem', position: 4, name: post.title, item: `${siteUrl}${path}` },
    ],
  };

  return (
    <main className={`detail-page detail-${post.channel}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <article className="article-shell">
        <nav aria-label="Breadcrumb" className="editorial-breadcrumb">
          <ol>
            <li><a href="/">Emotion Center</a></li>
            <li><a href={channel.channelPath}>{channel.label}</a></li>
            <li><a href={channel.browsePath}>Editorial Stories</a></li>
            <li aria-current="page">{post.title}</li>
          </ol>
        </nav>
        <a className="back-link" href={channel.browsePath}><ArrowLeft aria-hidden="true" /> Back to {channel.label.toLowerCase()} stories</a>
        <p className="eyebrow mt-12">Editorial example</p>
        <h1 className="article-title">{post.title}</h1>
        <EmotionTags post={post} />
        <div className="article-body"><p>{post.content}</p></div>
        <p className="example-disclaimer">Written by our editors to help you begin. This is not a real user submission or a record of public interaction.</p>
      </article>

      <section className="site-container editorial-related" aria-labelledby="related-stories">
        <p className="eyebrow">More from this space</p>
        <h2 id="related-stories">Related editorial stories</h2>
        <div className="editorial-related-grid">{related.map((item) => <EditorialCard key={item.id} post={item} />)}</div>
        <div className="editorial-write-cta">
          <div><p className="eyebrow">Something on your mind?</p><h2>Write your own — private to this browser.</h2><p>No name, no account.</p></div>
          <a href={channel.channelPath}>{privateWritingLabels[post.channel]} <ArrowRight aria-hidden="true" /></a>
        </div>
      </section>
    </main>
  );
}

export function EditorialBrowse({ channel, selectedEmotion }: { channel: Channel; selectedEmotion?: string }) {
  const config = editorialChannels[channel];
  const posts = getEditorialPosts(channel);
  const availableEmotions = EMOTIONS.filter((emotion) => posts.some((post) => post.emotions?.includes(emotion.id)));
  const validEmotion = EMOTIONS.some((emotion) => emotion.id === selectedEmotion) ? selectedEmotion : undefined;
  const filteredPosts = validEmotion ? posts.filter((post) => post.emotions?.includes(validEmotion)) : posts;
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Editorial Stories — ${config.label}`,
    description: config.description,
    url: `${siteUrl}${config.browsePath}`,
    isPartOf: { '@type': 'WebSite', name: 'Emotion Center', url: siteUrl },
  };

  return (
    <main className={`editorial-browse-page detail-${channel}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(pageSchema) }} />
      <section className="site-container editorial-browse-hero">
        <a className="back-link" href={config.channelPath}><ArrowLeft aria-hidden="true" /> Back to {config.label.toLowerCase()}</a>
        <p className="eyebrow">{config.label} · public reading</p>
        <h1>Editorial Stories — {config.label}</h1>
        <p className="editorial-browse-lede">{config.description}</p>
        <p className="editorial-library-note"><strong>Written by our editors.</strong> Not real user submissions.</p>
      </section>

      <section className="site-container editorial-browse-content" aria-labelledby="story-list">
        <div className="editorial-filter-row" aria-label="Filter stories by emotion">
          <a aria-current={!validEmotion ? 'page' : undefined} href={config.browsePath}>All</a>
          {availableEmotions.map((emotion) => <a aria-current={validEmotion === emotion.id ? 'page' : undefined} href={`${config.browsePath}?emotion=${emotion.id}`} key={emotion.id}><span aria-hidden="true">{emotion.emoji}</span>{emotion.label}</a>)}
        </div>
        <h2 className="sr-only" id="story-list">{validEmotion ? `${config.label} stories tagged ${validEmotion}` : `All ${config.label} editorial stories`}</h2>
        {filteredPosts.length ? <div className="editorial-browse-grid">{filteredPosts.map((post) => <EditorialCard key={post.id} post={post} />)}</div> : <div className="editorial-empty"><h2>No stories match this feeling yet.</h2><p>Try another emotion or return to all editorial stories.</p><a href={config.browsePath}>View all stories</a></div>}
      </section>
    </main>
  );
}

export function HomeEditorialStories() {
  const channels = (Object.keys(editorialChannels) as Channel[]);
  return (
    <section className="home-editorial-library" aria-labelledby="home-editorial-title">
      <div className="home-editorial-heading">
        <div><p className="eyebrow">Public reading</p><h2 id="home-editorial-title">Editorial stories</h2></div>
        <p>Written by our editors. Not real user submissions.</p>
      </div>
      <div className="home-editorial-grid">
        {channels.map((channel) => {
          const config = editorialChannels[channel];
          return <article className={`home-editorial-channel home-editorial-${channel}`} key={channel}>
            <p className="eyebrow">{config.label}</p>
            <ul>{getEditorialPosts(channel).slice(0, 3).map((post) => <li key={post.id}><a href={editorialPath(channel, post.id)}>{post.title}</a></li>)}</ul>
            <a className="entry-link" href={config.browsePath}>Browse {config.label.toLowerCase()} stories <ArrowRight aria-hidden="true" /></a>
          </article>;
        })}
      </div>
    </section>
  );
}
