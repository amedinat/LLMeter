# Branch Rules — LLMeter

## GitFlow (simplified)

- `main` — production (deployed to Vercel)
- `develop` — integration branch
- `feature/*`, `fix/*`, `chore/*` — work in progress

## Rules

1. **Never** commit directly to `main`
2. All work lands on `develop` or a `feature/` / `fix/` / `chore/` branch
3. `main` only receives merges from `develop`
4. Before opening a release merge, verify `git log develop..main` is empty

## Releasing to main

```bash
git checkout main
git merge develop --no-ff
git push origin main
```
