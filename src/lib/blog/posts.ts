export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  keyword: string;
  readingMinutes: number;
};

export const POSTS: BlogPost[] = [
  {
    slug: 'llm-cost-monitoring-without-proxy',
    title: 'LLM Cost Monitoring Without a Proxy: Why It Matters in 2026',
    description:
      'Proxy-based LLM cost trackers add latency, see your prompts, and break when providers change SDKs. Here is how usage-API monitoring works and when to choose it.',
    publishedAt: '2026-04-26',
    author: 'LLMeter Team',
    keyword: 'llm cost monitoring without proxy',
    readingMinutes: 8,
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
