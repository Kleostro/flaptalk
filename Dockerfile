FROM oven/bun:1.3.10 AS deps

WORKDIR /app

ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/flaptalk?schema=public"
ENV DATABASE_URL="${DATABASE_URL}"

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN bun install --frozen-lockfile

FROM deps AS build

WORKDIR /app

COPY . .

RUN bun run --cwd apps/api prisma:generate

FROM oven/bun:1.3.10 AS runtime

WORKDIR /app

COPY --from=build --chown=bun:bun /app/node_modules ./node_modules
COPY --from=build --chown=bun:bun /app/apps/api ./apps/api
COPY --from=build --chown=bun:bun /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000

USER bun

EXPOSE 3000

CMD ["bun", "run", "--cwd", "apps/api", "start"]
