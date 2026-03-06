# Contributing to LLMeter

Thank you for your interest in contributing to LLMeter! This guide will help you get started.

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great together.

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account (for database and auth)
- A [Stripe](https://stripe.com) account (optional, for billing features)

### Local Setup

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/LLMeter.git
   cd LLMeter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in the required values — see `.env.local.example` for documentation on each variable.

4. **Start the dev server:**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- **`main`** — stable, production-ready code.
- **`develop`** — active development branch. All PRs target `develop`.
- Feature branches should be named `feat/<short-description>`.
- Bug fix branches should be named `fix/<short-description>`.

### Making Changes

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/my-feature
   ```

2. Make your changes and write tests where applicable.

3. Run the linter and tests:
   ```bash
   npm run lint
   npm run test
   ```

4. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add Google AI provider support
   fix: correct cost calculation for cached tokens
   docs: update API key setup instructions
   ```

5. Push and open a PR against `develop`.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── api/              # Backend API routes
│   ├── (auth)/           # Auth pages (login, signup)
│   └── (dashboard)/      # Dashboard pages
├── components/           # Shared React components
│   ├── ui/               # Shadcn UI primitives
│   └── dashboard/        # Dashboard-specific components
├── features/             # Feature-based modules
├── lib/                  # Shared utilities and services
│   ├── providers/        # LLM provider adapters
│   ├── supabase/         # Supabase client helpers
│   ├── stripe/           # Stripe helpers
│   ├── inngest/          # Background job definitions
│   ├── email/            # Email templates and sending
│   └── validators/       # Zod schemas
├── config/               # App configuration (plans, pricing)
├── data/                 # Static data (model pricing)
└── types/                # Shared TypeScript types
```

## Adding a New LLM Provider

1. Create an adapter in `src/lib/providers/` implementing the `ProviderAdapter` interface.
2. Register it in `src/lib/providers/registry.ts`.
3. Add model pricing data to `src/data/model-pricing.ts`.
4. Add tests in `src/lib/providers/adapters.test.ts`.

## Guidelines

- **Keep PRs focused.** One feature or fix per PR.
- **Write tests** for new logic, especially provider adapters and API routes.
- **Don't leak secrets.** Never commit API keys or credentials. Use environment variables.
- **Sanitize errors.** Use `sanitizeErrorForClient()` from `@/lib/error-sanitizer` in API catch blocks.
- **No unnecessary `console.log`.** Use `console.warn` or `console.error` for operational logging only.

## Reporting Issues

Open an issue on GitHub with:
- A clear title describing the problem
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (OS, Node version, browser)

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0 License](LICENSE).
