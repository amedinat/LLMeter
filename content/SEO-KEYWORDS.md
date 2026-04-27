# LLMeter — SEO Keyword Research & Content Plan

> Created 2026-04-26. Target: +20% GSC impressions in 30 days.

## Strategy

LLMeter sits in a young, fast-moving category ("LLM cost monitoring / AI cost tracking"). Generic high-volume terms like "API monitoring" are dominated by Datadog/New Relic. Our wedge is the **specific intent**: developers Googling for *help with their bill* on a specific provider, or evaluating Helicone/Portkey alternatives. The plan focuses on long-tail, high-intent queries we can realistically rank for in 30–60 days.

## Target keywords (Tier 1 — fastest to rank)

These are buyer-intent queries with low/medium difficulty where LLMeter has a structurally strong angle.

| Keyword | Intent | Difficulty | Target page |
|---|---|---|---|
| openai cost tracking | Commercial | Medium | `/` (homepage) — already H1-aligned |
| anthropic api cost tracking | Commercial | Low | NEW `/blog/anthropic-cost-tracking` |
| llm cost monitoring without proxy | Commercial | Low | NEW `/blog/llm-cost-monitoring-without-proxy` |
| openai billing dashboard | Commercial | Medium | `/` |
| helicone alternative | Commercial | Medium | `/migrate/helicone` (already exists) |
| helicone vs llmeter | Commercial | Low | `/migrate/helicone` |
| llm api cost calculator | Informational → Commercial | Medium | `/models` |
| openai pricing calculator | Informational → Commercial | High | `/models` (long-tail variants) |
| portkey alternative | Commercial | Low | NEW `/migrate/portkey` (future) |
| openai usage api | Informational → Commercial | Low | NEW `/blog/openai-usage-api-guide` |
| track openai spending | Commercial | Low | `/` |
| ai api budget alerts | Commercial | Low | `/` (alerts feature) |

## Target keywords (Tier 2 — medium-term, build authority)

| Keyword | Intent | Difficulty | Target page |
|---|---|---|---|
| llm observability | Informational | High | NEW `/blog/llm-observability-guide` (pillar) |
| openai vs anthropic pricing | Informational | Medium | `/models` + NEW `/blog/openai-vs-anthropic-pricing` |
| how to reduce ai api costs | Informational | Medium | NEW `/blog/reduce-ai-api-costs` (listicle) |
| ai cost per customer | Informational | Low | NEW `/blog/per-customer-cost-attribution` |
| llm cost optimization | Informational | High | NEW `/blog/llm-cost-optimization` (pillar) |
| claude cost tracking | Commercial | Low | NEW `/blog/claude-cost-tracking` |
| deepseek pricing | Informational | Medium | `/models` (anchor link) |

## Content calendar (4 weeks → 4 posts)

Goal: 1 SEO-optimized post/week. All posts target a specific Tier 1 query, link to `/`, `/pricing`, `/models`, and at least one peer post for internal-link equity.

| Week | Slug | Primary keyword | Word target | Status |
|---|---|---|---|---|
| 1 (this week) | `llm-cost-monitoring-without-proxy` | llm cost monitoring without proxy | 1500–2000 | DRAFTED |
| 2 | `anthropic-cost-tracking` | anthropic api cost tracking | 1500 | TODO |
| 3 | `openai-usage-api-guide` | openai usage api | 2000 | TODO |
| 4 | `openai-vs-anthropic-pricing` | openai vs anthropic pricing | 1800 | TODO |

## Technical SEO checklist (this sprint)

- [x] Canonicals consistent on `https://www.llmeter.org` (apex 307s to www on Vercel)
- [x] `robots.txt` Sitemap directive matches canonical host
- [x] OpenGraph URLs match canonicals (avoid social-share dedupe issues)
- [x] JSON-LD URLs match canonicals
- [x] `metadataBase` set on every page that uses relative OG image paths
- [ ] `/blog` index in sitemap (added in this sprint)
- [ ] Per-post `Article` JSON-LD with `datePublished`, `author`, `mainEntityOfPage`
- [ ] BreadcrumbList JSON-LD on blog posts (next sprint)
- [ ] Image sizing audit (`<Image>` only, no raw `<img>`) — clean per code review

## Measurement

- **Baseline (today, 2026-04-26):** capture GSC 28-day impressions/clicks/avg-position before deploy.
- **Target (2026-05-26):** +20% impressions, +1 ranking position avg on Tier 1 keywords.
- **Tracking:** Plausible (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` already configured) for click-through; GSC for impressions.
- **Decision gate:** if Tier 1 posts haven't entered the GSC index in 14 days, revisit indexing (manual submit + internal-link audit).

## Out of scope (deferred — needs John or Simon)

- Backlinks: outreach to LLM dev newsletters (delegate to Simon).
- Domain authority: HN/Reddit drops are tracked elsewhere in the LBG/LLMeter visibility plan.
- Programmatic SEO for `/models/[slug]` per-model pages (50+ pages) — large scope, separate sprint.
