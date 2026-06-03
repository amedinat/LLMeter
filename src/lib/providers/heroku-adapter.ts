import type { ProviderAdapter, NormalizedUsageRecord } from './types';

/**
 * Heroku Managed Inference adapter — first PaaS pioneer to offer native LLM inference on LLMeter.
 * Heroku (heroku.com) — San Francisco, CA. Founded 2007.
 *
 * **Origins — inventing the PaaS category (2007–2010):**
 * Founded by Adam Wiggins, James Lindenbaum, and Orion Henry. Heroku introduced the concept
 * of Platform as a Service: `git push heroku main` deployed an app live with zero server
 * management. Before Heroku, deploying a web app required provisioning servers, configuring
 * web servers (Apache, Nginx), managing SSH keys, and maintaining uptime yourself. Heroku
 * abstracted all of this behind a simple CLI command.
 *
 * Heroku's technical inventions that became industry standards:
 * - **Heroku Buildpacks** (2011): language-specific build systems (Ruby, Python, Node, Go, PHP,
 *   Java). The buildpack standard is now used by Cloud Foundry, Dokku, Render, Railway,
 *   Fly.io, and every major PaaS — making it the most widely cloned PaaS architecture.
 * - **Heroku Dynos** (2011): auto-scaling ephemeral compute units. The original "serverless"
 *   compute concept — before AWS Lambda, before Kubernetes, before Fargate.
 * - **Heroku Add-ons** (2010): marketplace of cloud services (databases, monitoring, caching)
 *   connected to apps via environment variables. The model every modern add-on ecosystem copies.
 * - **Slug compilation**: reproducible build artifacts that run anywhere — the conceptual
 *   ancestor of OCI container images.
 *
 * **Salesforce acquisition ($212M, December 2010):**
 * Salesforce acquired Heroku for $212M in December 2010 — one of the largest dev tools
 * acquisitions at that time. Marc Benioff's thesis: developers, not IT departments, would
 * drive the next wave of enterprise software adoption. Heroku would be Salesforce's
 * developer cloud: build apps on Heroku, sell to enterprises via Salesforce CRM.
 * Heroku became the foundation of the Salesforce Platform (Force.com ecosystem).
 *
 * **Scale and ecosystem:**
 * 7M+ registered developers. 600,000+ deployed apps. Supports 20+ programming languages.
 * Major customers built on Heroku: Toyota, Macy's, Citrix, Unsplash, Product Hunt,
 * and tens of thousands of startups that used Heroku to get from idea to production
 * without a DevOps team.
 *
 * **Heroku Managed Inference (2024) — AI comes to PaaS:**
 * Heroku launched Managed Inference as an add-on: `heroku addons:create heroku-inference`.
 * OpenAI-compatible API at us.inference.heroku.com/v1. Developers can add LLM capabilities
 * to any Heroku app with one command — same zero-ops philosophy, now with AI.
 * Supports Anthropic Claude (enterprise), Meta Llama (open source), Cohere (multilingual).
 * Available in US (us.inference.heroku.com) and EU (eu.inference.heroku.com) regions.
 *
 * **First PaaS pioneer to offer native LLM inference on LLMeter.**
 * Every other provider on LLMeter started as an AI company, cloud provider, or GPU startup.
 * Heroku uniquely bridges the 2007 developer cloud era with the 2024 AI era — the platform
 * that taught a generation of developers to `git push` now teaches them to `curl infer`.
 *
 * OpenAI-compatible API at us.inference.heroku.com/v1.
 * Auth: Bearer token (Heroku API key from dashboard.heroku.com or `heroku authorizations:create`).
 * Validates key via GET /v1/models with Bearer auth.
 * Billing API: none public — fetchUsage returns [].
 * Use wrapHeroku() SDK wrapper for per-call cost tracking.
 *
 * 8 models (enterprise pricing includes Heroku platform layer):
 * claude-3-5-sonnet-20241022 ($3.00/$15.00 — Anthropic flagship via Heroku enterprise tier),
 * claude-3-haiku-20240307 ($0.25/$1.25 — Anthropic budget, 90% cheaper GPT-4o input),
 * claude-3-opus-20240229 ($15.00/$75.00 — Anthropic premium, maximum intelligence),
 * meta-llama/Llama-3.3-70B-Instruct ($0.75/$0.90 — Meta flagship, 70% cheaper GPT-4o),
 * meta-llama/Llama-3.1-70B-Instruct ($0.70/$0.85 — Meta 70B standard),
 * meta-llama/Llama-3.1-8B-Instruct ($0.18/$0.18 sym — Meta budget, 93% cheaper GPT-4o),
 * cohere/command-r-plus ($3.00/$15.00 — Cohere enterprise multilingual),
 * cohere/command-r ($0.50/$1.50 — Cohere standard multilingual).
 * 1/8 symmetric (Llama 3.1 8B).
 *
 * API docs: https://devcenter.heroku.com/articles/heroku-inference
 * Add-on: heroku addons:create heroku-inference
 */
export const herokuAdapter: ProviderAdapter = {
  type: 'heroku',

  async validateKey(apiKey: string): Promise<boolean> {
    const trimmed = apiKey?.trim();
    if (!trimmed)
      throw new Error(
        'Heroku API key is missing. Get your key at dashboard.heroku.com or run: heroku authorizations:create'
      );

    const res = await fetch('https://us.inference.heroku.com/v1/models', {
      headers: { Authorization: `Bearer ${trimmed}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Invalid Heroku API key. Get your key at dashboard.heroku.com or run: heroku authorizations:create'
        );
      }
      throw new Error(
        body?.error?.message ?? body?.message ?? `Heroku Managed Inference returned ${res.status}`
      );
    }

    return true;
  },

  async fetchUsage(
    _apiKey: string,
    _startDate: Date,
    _endDate: Date
  ): Promise<NormalizedUsageRecord[]> {
    // Heroku Managed Inference does not provide a public usage/billing API.
    // Use wrapHeroku() SDK wrapper for per-call cost tracking.
    return [];
  },
};
