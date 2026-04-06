FROM oven/bun:1.3.10 AS base

WORKDIR /app

ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/flaptalk?schema=public"
ENV DATABASE_URL="${DATABASE_URL}"

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN bun install --frozen-lockfile

COPY . .

RUN bun run --cwd apps/api prisma:generate

ENV NODE_ENV=production
ENV PORT=3000

RUN chown -R bun:bun /app

USER bun

EXPOSE 3000

CMD ["bun", "run", "start:api"]
