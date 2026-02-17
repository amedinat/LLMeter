# LLMeter — Development Commands
# Usage: just <command>

# Default: show available commands
default:
    @just --list

# ─── Development ───────────────────────────────────

# Start dev server
dev:
    npx next dev

# Start dev server on custom port
dev-port port="3001":
    npx next dev --port {{port}}

# ─── Build & Lint ──────────────────────────────────

# Production build
build:
    npx next build

# Run ESLint
lint:
    npx eslint .

# TypeScript type check (no emit)
typecheck:
    npx tsc --noEmit

# Run all checks (lint + typecheck + build)
check: lint typecheck build

# ─── Database ──────────────────────────────────────

# Generate a new Supabase migration
db-migration name:
    npx supabase migration new {{name}}

# Apply pending migrations (local)
db-push:
    npx supabase db push

# Reset local database
db-reset:
    npx supabase db reset

# Start local Supabase
db-start:
    npx supabase start

# Stop local Supabase
db-stop:
    npx supabase stop

# Generate TypeScript types from Supabase schema
db-types:
    npx supabase gen types typescript --local > src/types/database.ts

# ─── Dependencies ─────────────────────────────────

# Install dependencies
install:
    npm install

# Add a new dependency
add package:
    npm install {{package}}

# Add a new dev dependency
add-dev package:
    npm install -D {{package}}

# Add a shadcn/ui component
ui component:
    npx shadcn@latest add {{component}}

# ─── Inngest ───────────────────────────────────────

# Start Inngest dev server (for local function testing)
inngest-dev:
    npx inngest-cli dev

# ─── Utilities ─────────────────────────────────────

# Clean build artifacts
clean:
    rm -rf .next node_modules/.cache

# Full clean (including node_modules)
clean-all:
    rm -rf .next node_modules

# Show project stats
stats:
    @echo "TypeScript files:" && find src -name '*.ts' -o -name '*.tsx' | wc -l
    @echo "Lines of code:" && find src -name '*.ts' -o -name '*.tsx' | xargs wc -l | tail -1
