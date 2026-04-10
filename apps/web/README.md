# Corux Web

This frontend is built with `Angular 21.2.x`, `standalone` components, `Angular Router`, `SCSS`, `zoneless` mode, and `Vitest`.

## Run

From the monorepo root:

```bash
bun run dev:web
bun run build:web
```

## Current direction

- `apps/web` is the future CRM client
- `apps/api` remains the source of truth for typed HTTP contracts
- the next integration step is `Eden Treaty` between Angular and Elysia

## Notes

- In this local environment Angular tooling is running against `node@20.20.x`
- The initial route is a CRM dashboard shell in `src/app/pages/dashboard`
