import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/mobile-nav';
import { getAllPosts } from '@/lib/blog/posts';

export const metadata: Metadata = {
  title: 'LLMeter Blog — LLM Cost Monitoring & Optimization',
  description:
    'Practical guides on tracking, budgeting, and optimizing LLM API spend across OpenAI, Anthropic, and other providers — without proxies or SDK lock-in.',
  metadataBase: new URL('https://www.llmeter.org'),
  alternates: { canonical: 'https://www.llmeter.org/blog' },
  openGraph: {
    title: 'LLMeter Blog — LLM Cost Monitoring & Optimization',
    description:
      'Practical guides on tracking, budgeting, and optimizing LLM API spend across OpenAI, Anthropic, and other providers.',
    url: 'https://www.llmeter.org/blog',
    siteName: 'LLMeter',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLMeter Blog',
    description: 'Practical guides on tracking and optimizing LLM API spend.',
    images: ['/og-image.png'],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.llmeter.org' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.llmeter.org/blog' },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'LLMeter Blog',
    url: 'https://www.llmeter.org/blog',
    description:
      'Practical guides on tracking, budgeting, and optimizing LLM API spend.',
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `https://www.llmeter.org/blog/${p.slug}`,
      datePublished: p.publishedAt,
      dateModified: p.updatedAt ?? p.publishedAt,
      author: { '@type': 'Organization', name: p.author },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <MobileNav />
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold text-cyan-400 sm:inline-block">
                LLMeter
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link href="/#how-it-works" className="text-foreground/60 hover:text-foreground/80">
                How It Works
              </Link>
              <Link href="/#features" className="text-foreground/60 hover:text-foreground/80">
                Features
              </Link>
              <Link href="/models" className="text-foreground/60 hover:text-foreground/80">
                Model Pricing
              </Link>
              <Link href="/pricing" className="text-foreground/60 hover:text-foreground/80">
                Pricing
              </Link>
              <Link href="/blog" className="text-foreground hover:text-foreground/80">
                Blog
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white" asChild>
              <Link href="/login">Start Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container max-w-3xl py-12 md:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to LLMeter
          </Link>
          <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight md:text-5xl">
            LLMeter Blog
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Practical guides on tracking, budgeting, and optimizing LLM API
            spend across OpenAI, Anthropic, Google AI, DeepSeek, and OpenRouter.
          </p>

          <ul className="mt-12 space-y-6">
            {posts.map((post) => (
              <li
                key={post.slug}
                className="rounded-xl border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                    <span>·</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    {post.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Read article
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
