# Branch Rules — LLMeter

## GitFlow (simplificado)

- `main` = producción (Vercel deploy)
- `develop` = integración
- `feature/*`, `fix/*` = trabajo en progreso

## Reglas

1. **NUNCA** hacer commits directos a `main`
2. Todo trabajo va a `develop` o a un branch `feature/` / `fix/`
3. `main` solo recibe merges desde `develop`
4. Antes de mergear, verificar: `git log develop..main` debe estar vacío
5. Sub-agentes (Otto, Codex, Claude Code) trabajan en `develop` únicamente

## Merge a main (release)

```bash
git checkout main
git merge develop --no-ff
git push origin main
```
