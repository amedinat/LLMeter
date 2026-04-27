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
    slug: 'reduce-llm-api-costs',
    title: '5 Proven Ways to Reduce LLM API Costs Without Sacrificing Quality',
    description:
      'LLM API bills grow faster than usage because of hidden multipliers: output token pricing, prompt bloat, over-engineered models, and agentic loops. Here are five strategies that cut spend 40–80% without touching quality.',
    publishedAt: '2026-04-27',
    author: 'LLMeter Team',
    keyword: 'reduce llm api costs',
    readingMinutes: 9,
  },
  {
    slug: 'track-openai-api-costs',
    title: 'How to Track OpenAI API Costs Per Model, Project, and Customer in 2026',
    description:
      'OpenAI\'s dashboard shows total spend but not which model, project, or customer drove it. Here\'s how to get per-model and per-customer cost breakdowns — with and without a proxy.',
    publishedAt: '2026-04-27',
    author: 'LLMeter Team',
    keyword: 'track openai api costs',
    readingMinutes: 8,
  },
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
