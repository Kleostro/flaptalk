# flaptalk

## Deployment env

API:
- `DATABASE_URL` - PostgreSQL connection string
- `WEB_ORIGIN` - comma-separated list of allowed frontend origins for CORS, for example `https://flaptalk.pages.dev`
- `PORT` - provided automatically by most hosting platforms

Web:
- configure the frontend to call your deployed API URL, for example the Render service URL

## Deploy plan

### Render API

This repo includes [render.yaml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/render.yaml) for the API service.

Recommended steps:
- create a Neon PostgreSQL database and copy its connection string into `DATABASE_URL`
- create a new Blueprint on Render from this repository
- set `WEB_ORIGIN` to your Cloudflare Pages domain, for example `https://flaptalk.pages.dev`
- deploy the `flaptalk-api` service

Notes:
- the Blueprint uses the free plan
- Bun is pinned via [.bun-version](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.bun-version)
- Prisma migrations run through `preDeployCommand`

### Cloudflare Pages web

Recommended settings:
- Framework preset: `None`
- Root directory: `/`
- Build command: `npm install -g bun && bun install --frozen-lockfile && bun run build:web`
- Build output directory: `apps/web/dist/flaptalk-web/browser`

For Angular client-side routing on Pages, the project includes [apps/web/public/_redirects](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/apps/web/public/_redirects).
