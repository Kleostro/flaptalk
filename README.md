# FlapTalk

FlapTalk is a monorepo with:

- `apps/api` — Bun + Elysia API with Prisma and PostgreSQL
- `apps/web` — Angular web client

The repository is set up for local development, split CI for API and web, containerized API delivery, and server-side deployment through GitHub Actions.

## 📌 Status

- **Monorepo**: active
- **API runtime**: Bun + Elysia
- **Web runtime**: Angular
- **Database**: PostgreSQL via Prisma
- **Production API delivery**: Docker + GHCR + GitHub Actions + VPS
- **Production frontend delivery**: Cloudflare Pages
- **Backend tests**: not yet implemented as a dedicated API suite

## ✨ Overview

### What is in the project

- **API**: Elysia application with Prisma, Swagger, CORS configuration, and modular routes
- **Web**: Angular application built with Bun-based workspace tooling
- **Database**: PostgreSQL, with Prisma migrations and Neon as the current production target
- **Deployment**: Docker image published to GHCR and deployed to a VPS over SSH
- **Observability**: structured JSON logs, health/readiness endpoints, uptime workflow

### Current production model

- API image is built in GitHub Actions
- image is published to `ghcr.io`
- deployment runs remotely on the VPS
- runtime secrets stay on the server
- the server does **not** build from source during deploy

### Architecture

```text
Developer
   |
   v
GitHub repository
   |
   +--> CI API / CI Web
   |
   +--> Publish API Image -> GHCR
                              |
                              v
                    Deploy API via GitHub Actions
                              |
                              v
                         Timeweb VPS
                              |
                              v
                        Dockerized API
                              |
                              v
                         Neon PostgreSQL

Cloudflare Pages
   |
   v
Angular Web
   |
   v
HTTP requests to API
```

## 🧭 Repository Map

```text
apps/
  api/   Bun + Elysia + Prisma backend
  web/   Angular frontend

.github/workflows/
  ci-api.yml
  ci-web.yml
  publish-api-image.yml
  deploy-api-production.yml
  semgrep.yml

husky_scripts/
  validate-branch-create.sh
  validate-commit.sh
  validate-push.sh
  validate-staged.sh

deploy/
  docker-compose.api.yml

scripts/
  deploy-api-docker.sh
  validate-branch-scope.cjs
```

### Key files

- API entrypoint: [apps/api/src/index.ts](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/apps/api/src/index.ts)
- API app setup: [apps/api/src/app.ts](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/apps/api/src/app.ts)
- Prisma root schema: [apps/api/prisma/schema.prisma](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/apps/api/prisma/schema.prisma)
- User model schema: [apps/api/prisma/users.prisma](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/apps/api/prisma/users.prisma)
- Web package: [apps/web/package.json](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/apps/web/package.json)
- Root workspace scripts: [package.json](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/package.json)
- Docker runtime for API: [Dockerfile](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/Dockerfile)
- VPS compose file: [deploy/docker-compose.api.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/deploy/docker-compose.api.yml)
- Remote deploy runner: [scripts/deploy-api-docker.sh](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/scripts/deploy-api-docker.sh)
- Branch scope validator: [validate-branch-scope.cjs](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/scripts/validate-branch-scope.cjs)

## 🚀 Quick Start

### Requirements

- Bun `1.3.10+`
- Node.js `22+`
- Docker, if you want local PostgreSQL or container workflows
- PostgreSQL connection string for API work

### Install dependencies

```bash
bun install --frozen-lockfile
```

### Start local development

API:

```bash
bun run dev:api
```

Web:

```bash
bun run dev:web
```

### Useful root commands

```bash
bun run build
bun run build:api
bun run build:web

bun run typecheck
bun run typecheck:api
bun run typecheck:web

bun run lint
bun run lint:api
bun run lint:web
bun run stylelint:web

bun run test
bun run test:web
```

## 🧱 API

The backend is built with:

- **Bun**
- **Elysia**
- **Prisma**
- **PostgreSQL**

### API behavior

- listens on `PORT` or defaults to `3000`
- connects to the database on startup
- emits structured JSON logs for request lifecycle and application events
- exposes `/` as a basic info route
- exposes `/health` as a liveness endpoint
- exposes `/ready` as a readiness endpoint with a database check
- exposes `/users`
- enables Swagger docs through Elysia Swagger

### API environment variables

- `DATABASE_URL` — PostgreSQL connection string
- `DIRECT_DATABASE_URL` — direct PostgreSQL connection string for Prisma migrations and administrative operations
- `WEB_ORIGIN` — comma-separated allowed CORS origins
- `PORT` — API port
- `NODE_ENV` — runtime mode

Example:

```env
NODE_ENV="production"
PORT="3000"
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require&channel_binding=require"
DIRECT_DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require&channel_binding=require"
WEB_ORIGIN="https://your-frontend-domain.com"
```

### Observability

- logs are emitted as structured JSON from [logger.ts](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/apps/api/src/observability/logger.ts)
- request start, completion, failure, and readiness failures are logged with context such as `requestId`, `path`, `method`, and duration
- `/health` is the liveness endpoint used by deploy verification
- `/ready` is the readiness endpoint used for database-aware checks

## 🖥️ Web

The frontend lives in `apps/web` and uses Angular.

### Main web commands

```bash
bun run --cwd apps/web dev
bun run --cwd apps/web build
bun run --cwd apps/web lint
bun run --cwd apps/web stylelint
bun run --cwd apps/web typecheck
bun run --cwd apps/web test
```

### Build output

The production browser build ends up in:

[apps/web/dist/flaptalk-web/browser](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/apps/web/dist/flaptalk-web/browser)

## 🗄️ Database and Prisma

The project uses Prisma migrations for schema evolution.

### Common Prisma commands

```bash
bun run prisma:generate
bun run prisma:migrate
bun run prisma:push
bun run prisma:seed
```

### Production migration flow

Production does **not** use `prisma migrate dev`.

Instead:

- image is deployed to the server
- the server-side deploy script runs:

```bash
cd apps/api && bunx prisma migrate deploy
```

### Production troubleshooting

If you see:

```text
The table `public.users` does not exist in the current database
```

check:

1. `DATABASE_URL` points to the expected production database
2. `DIRECT_DATABASE_URL` points to a reachable direct database endpoint if you use Neon or another pooler-based provider
3. Prisma migrations were applied
4. `_prisma_migrations` exists
5. `users` exists in the `public` schema

Quick SQL check:

```bash
psql "$DATABASE_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

## 🔐 Secrets and Runtime Configuration

### What goes into git

- source code
- workflow files
- Docker and deploy definitions
- Prisma migrations

### What must not go into git

- production `DATABASE_URL`
- SSH private keys
- any server-only runtime secrets

### Where secrets live

- **GitHub Environments** store deployment SSH secrets
- **VPS** stores runtime app secrets in `/etc/flaptalk/api.env`

## ⚙️ CI/CD

The repository uses split pipelines to avoid rebuilding everything on every change.

### Workflows

- API CI: [ci-api.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/ci-api.yml)
- Web CI: [ci-web.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/ci-web.yml)
- API image publish: [publish-api-image.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/publish-api-image.yml)
- API deploy: [deploy-api-production.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/deploy-api-production.yml)
- Security scan: [semgrep.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/semgrep.yml)
- Dependency review: [dependency-review.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/dependency-review.yml)
- API uptime monitor: [api-uptime.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/api-uptime.yml)

### What triggers what

#### API changes trigger

- API CI
- API image publish
- API deploy chain

Examples:

- `apps/api/**`
- `Dockerfile`
- `deploy/**`
- `scripts/deploy-api-docker.sh`
- shared root files like `package.json`, `bun.lock`, `tsconfig.base.json`

#### Web changes trigger

- Web CI

Examples:

- `apps/web/**`
- shared root files like `package.json`, `bun.lock`, `tsconfig.base.json`

### Delivery model

1. code is pushed to `develop` or `main`
2. relevant CI workflow runs
3. API image is built only when backend-related files changed
4. image is published to GHCR
5. deploy workflow connects to the VPS
6. server pulls the immutable image
7. server runs Prisma migrations
8. server restarts the API container

### Rollback model

The deploy workflow supports manual rollback through `workflow_dispatch`.

Use `Run workflow` in GitHub Actions and pass a previous image tag, usually a commit SHA, in the `image_tag` input.

That redeploys an earlier immutable image from GHCR without rebuilding the application on the VPS.

## 🐳 API Deployment

The API is delivered as a Docker container.

### Docker files

- image: [Dockerfile](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/Dockerfile)
- compose: [deploy/docker-compose.api.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/deploy/docker-compose.api.yml)
- deploy runner: [scripts/deploy-api-docker.sh](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/scripts/deploy-api-docker.sh)

### What `deploy-api-docker.sh` does

It is the server-side deploy runner used by GitHub Actions.

It:

- receives `API_IMAGE`
- loads `/etc/flaptalk/api.env`
- optionally logs in to GHCR
- pulls the target image
- runs Prisma migrations
- restarts the API container
- prunes unused Docker images

This script is intentionally about **runtime deployment**, not about building from source on the VPS.

### VPS runtime layout

- deploy assets: `/opt/flaptalk`
- runtime env: `/etc/flaptalk/api.env`

### Current port exposure

The API container is published through Docker on port `3000`.

If deployment succeeds and the server/firewall allows traffic, the API should be reachable at:

```text
http://YOUR_SERVER_IP:3000
```

### Health verification

- local on server: `http://127.0.0.1:3000/health`
- external: `http://YOUR_SERVER_IP:3000/health`

## ☁️ Server Setup

### One-time VPS bootstrap

```bash
ssh root@YOUR_SERVER_IP
apt update
apt upgrade -y
apt install -y curl git docker.io docker-compose-v2 postgresql-client
systemctl enable docker
systemctl start docker
mkdir -p /opt/flaptalk/deploy /etc/flaptalk
```

If you deploy as a non-root user:

```bash
useradd -m -s /bin/bash flaptalk
usermod -aG sudo flaptalk
usermod -aG docker flaptalk
chown -R flaptalk:flaptalk /opt/flaptalk
```

### GitHub deploy secrets

Add these secrets to GitHub environments:

- `SSH_HOST`
- `SSH_PORT`
- `SSH_USER`
- `SSH_PRIVATE_KEY`

Recommended environments:

- `develop`
- `production`

### SSH deploy key

Generate on your machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/flaptalk_deploy
```

Use:

- `~/.ssh/flaptalk_deploy` -> GitHub secret `SSH_PRIVATE_KEY`
- `~/.ssh/flaptalk_deploy.pub` -> server `~/.ssh/authorized_keys`

## 🧪 Working as a Developer

### Local Git guardrails

The repository uses **Husky** to enforce local git checks before code leaves your machine.

Configured hooks:

- `pre-commit` -> runs `lint-staged`
- `commit-msg` -> runs `commitlint`
- `post-checkout` -> validates a newly created branch name against the detected change scope
- `pre-push` -> validates branch scope before push

Related files:

- Husky hooks: [.husky/pre-commit](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.husky/pre-commit), [.husky/commit-msg](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.husky/commit-msg), [.husky/post-checkout](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.husky/post-checkout), [.husky/pre-push](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.husky/pre-push)
- Hook scripts: [validate-staged.sh](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/husky_scripts/validate-staged.sh), [validate-commit.sh](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/husky_scripts/validate-commit.sh), [validate-branch-create.sh](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/husky_scripts/validate-branch-create.sh), [validate-push.sh](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/husky_scripts/validate-push.sh)

### Branch naming and scope validation

Branch names are not just cosmetic here. The repository validates that the branch prefix matches the detected scope of changed files.

Supported prefixes:

- `FTB` -> backend-only changes
- `FTW` -> frontend-only changes
- `FT` -> project-wide or mixed changes

Allowed branch shape:

```text
<type>/<prefix>-<sprint>-<task>/<description>
```

Example branch names:

```text
feat/FTB-01-03/add_users_endpoint
fix/FTW-02-04/fix_login_layout
chore/FT-03-01/update_workspace_config
```

Allowed exceptions:

- `main`
- `develop`
- branches starting with `sprint-`

How scope is detected:

- changes only in `apps/api/**` -> `FTB`
- changes only in `apps/web/**` -> `FTW`
- mixed or root-level changes -> `FT`

If the branch name does not match the detected scope:

- new branch creation can be reverted automatically
- push can be rejected until the branch is renamed

Rename example:

```bash
git branch -m "fix/FTB-01-01/rename_me"
```

### Typical flow

1. create a branch
2. make changes
3. run relevant local checks
4. push the branch
5. open a PR
6. wait for CI
7. merge

### Example

```bash
git checkout -b feature/something
bun run typecheck
bun run lint
git add -A
git commit -m "Implement something"
git push origin feature/something
```

### If you only changed frontend

You usually care about:

```bash
bun run lint:web
bun run stylelint:web
bun run typecheck:web
bun run test:web
bun run build:web
```

### If you changed backend

You usually care about:

```bash
bun run lint:api
bun run typecheck:api
bun run build:api
```

## 🔍 Operational Checks

### Check API on the server

```bash
docker compose -f /opt/flaptalk/deploy/docker-compose.api.yml ps
docker compose -f /opt/flaptalk/deploy/docker-compose.api.yml logs --tail=100 api
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/ready
curl http://127.0.0.1:3000/users
```

### Check API externally

```bash
curl http://YOUR_SERVER_IP:3000/health
curl http://YOUR_SERVER_IP:3000/ready
curl http://YOUR_SERVER_IP:3000/users
```

### Monitoring and alerts

- scheduled uptime checks run through [api-uptime.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/api-uptime.yml)
- configure the repository variable `API_HEALTHCHECK_URL` to point to the production `/health` endpoint
- on failure the workflow opens or updates a GitHub issue
- on recovery the workflow comments on the alert issue and closes it

### Check whether port `3000` is already occupied

```bash
lsof -i :3000
sudo ss -ltnp | grep 3000
```

## 🛟 Troubleshooting

### `public.users` does not exist

- verify `DATABASE_URL`
- verify migrations ran
- verify `_prisma_migrations` exists
- verify `users` exists

### `address already in use`

Port `3000` is already occupied by another process or old service.

Check:

```bash
lsof -i :3000
sudo ss -ltnp | grep 3000
```

### Deploy cannot write to `/opt/flaptalk`

Fix permissions on the server:

```bash
mkdir -p /opt/flaptalk/deploy
chown -R flaptalk:flaptalk /opt/flaptalk
```

### Deploy cannot find GHCR image

Usually means the image was not published with the expected tag, or publish failed earlier in the pipeline.

## 📚 Notes

- API tests are not yet implemented as a separate backend test suite
- API CI currently runs formatting, lint, typecheck, and build
- web CI is stricter and already includes lint, stylelint, typecheck, tests, and build

## 🌐 Web Deployment

The frontend is deployed to Cloudflare Pages.

### Production URL

- Live site: https://flaptalk.pages.dev/

### Cloudflare Pages settings

Use the following configuration for the web app:

- Framework preset: `None`
- Root directory: `/`
- Build command: `npm install -g bun && bun install --frozen-lockfile && bun run build:web`
- Build output directory: `apps/web/dist/flaptalk-web/browser`

### Routing

For Angular client-side routing on Pages, the project includes [apps/web/public/\_redirects](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/apps/web/public/_redirects).

### Notes

- the frontend is deployed independently from the API
- web-only changes should go through the web CI workflow and do not need to trigger API image delivery
- when production API origin changes, make sure the frontend points to the correct backend URL
