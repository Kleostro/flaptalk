# flaptalk

## Deployment env

API:
- `DATABASE_URL` - PostgreSQL connection string
- `WEB_ORIGIN` - comma-separated list of allowed frontend origins for CORS, for example `https://flaptalk.pages.dev`
- `PORT` - provided automatically by most hosting platforms

Web:
- configure the frontend to call your deployed API URL

## Deploy plan

### API на VPS Timeweb Cloud через Docker

В проекте поддерживается один production-вариант для API: Docker на VPS Timeweb Cloud с внешней базой данных в Neon.

Это означает:
- API собирается из [Dockerfile](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/Dockerfile)
- контейнер запускается через [deploy/docker-compose.api.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/deploy/docker-compose.api.yml)
- production env хранится вне репозитория, например в `/etc/flaptalk/api.env`
- обновление выполняется через [scripts/deploy-api-docker.sh](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/scripts/deploy-api-docker.sh)

#### Что подготовить

Перед началом у вас должны быть:
- VPS в Timeweb Cloud с Ubuntu 24.04
- SSH-доступ к серверу
- репозиторий проекта на GitHub
- база данных Neon
- при желании домен для API, но для первого запуска он не обязателен

Рекомендуемая конфигурация сервера на старте:
- 1 vCPU
- 2 GB RAM
- 20+ GB SSD

#### Шаг 1. Подготовить сервер

Подключитесь к серверу:

```bash
ssh root@YOUR_SERVER_IP
```

Обновите систему и установите Docker:

```bash
apt update
apt upgrade -y
apt install -y git curl docker.io docker-compose-v2 postgresql-client
systemctl enable docker
systemctl start docker
```

Если пакет `docker-compose-v2` недоступен, проверьте:

```bash
docker compose version
```

#### Шаг 2. Создать пользователя и каталоги

```bash
useradd -m -s /bin/bash flaptalk
mkdir -p /var/www/flaptalk /etc/flaptalk
chown -R flaptalk:flaptalk /var/www/flaptalk
```

Если хотите пользоваться `sudo` из-под `flaptalk`:

```bash
usermod -aG sudo flaptalk
usermod -aG docker flaptalk
```

После добавления в группу `docker` лучше перелогиниться.

#### Шаг 3. Клонировать репозиторий

Под пользователем `flaptalk`:

```bash
su - flaptalk
cd /var/www/flaptalk
git clone https://github.com/YOUR_GITHUB_USERNAME/flaptalk.git .
```

Проверьте, что Docker-файлы на месте:

```bash
find deploy -maxdepth 2 -type f | sort
```

#### Шаг 4. Создать production env

Создайте файл:

```bash
sudo nano /etc/flaptalk/api.env
```

Пример:

```env
NODE_ENV="production"
PORT="3000"
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require&channel_binding=require"
WEB_ORIGIN="https://your-frontend-domain.com"
```

Важно:
- оборачивайте значения в кавычки
- это особенно важно для `DATABASE_URL`, потому что в строке могут быть `&` и другие спецсимволы shell
- для Prisma миграций лучше использовать direct URL Neon, если Neon показывает и pooled, и direct варианты

Если домена и фронтенда пока нет, `WEB_ORIGIN` можно временно оставить пустым:

```env
WEB_ORIGIN=""
```

Проверьте, что env читается:

```bash
set -a
source /etc/flaptalk/api.env
set +a
echo "$DATABASE_URL"
```

#### Шаг 5. Собрать образ

В корне проекта:

```bash
cd /var/www/flaptalk
docker compose -f deploy/docker-compose.api.yml build api
```

#### Шаг 6. Применить Prisma migrations

Запустите миграции в одноразовом контейнере:

```bash
cd /var/www/flaptalk
set -a
source /etc/flaptalk/api.env
set +a
docker compose -f deploy/docker-compose.api.yml run --rm api bunx prisma migrate deploy
```

Что должно появиться в Neon:
- `_prisma_migrations`
- `users`

Проверка SQL-запросом:

```bash
psql "$DATABASE_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

#### Шаг 7. Запустить API

```bash
cd /var/www/flaptalk
set -a
source /etc/flaptalk/api.env
set +a
docker compose -f deploy/docker-compose.api.yml up -d api
```

Проверка контейнера:

```bash
docker compose -f deploy/docker-compose.api.yml ps
docker compose -f deploy/docker-compose.api.yml logs -f api
```

Проверка API на сервере:

```bash
curl http://127.0.0.1:3000/
curl http://127.0.0.1:3000/users
```

#### Как работает сеть

По умолчанию compose-файл публикует контейнер так:

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

Это значит:
- API доступен на самом сервере по `127.0.0.1:3000`
- извне порт `3000` не открыт
- это безопаснее для production

Если вы хотите временно тестировать API напрямую по внешнему IP без Nginx, поменяйте mapping на:

```yaml
ports:
  - "3000:3000"
```

После этого пересоберите и перезапустите контейнер:

```bash
docker compose -f deploy/docker-compose.api.yml up -d --build api
```

Тогда проверить с вашего компьютера можно будет так:

```bash
curl http://YOUR_SERVER_IP:3000/
curl http://YOUR_SERVER_IP:3000/users
```

#### Как обновлять приложение

Для обычного обновления:

```bash
cd /var/www/flaptalk
chmod +x scripts/deploy-api-docker.sh
./scripts/deploy-api-docker.sh
```

Скрипт делает:
- `git pull`
- пересборку образа
- запуск `prisma migrate deploy`
- перезапуск контейнера API

#### Что делать при ошибке `public.users does not exist`

Проверьте по порядку:
1. загружен ли `/etc/flaptalk/api.env`
2. ведёт ли `DATABASE_URL` в нужную production-базу Neon
3. выполнена ли команда `docker compose -f deploy/docker-compose.api.yml run --rm api bunx prisma migrate deploy`
4. есть ли в базе `_prisma_migrations` и `users`

#### Какие файлы использовать

Для Docker-деплоя API используйте:
- [Dockerfile](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/Dockerfile)
- [.dockerignore](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.dockerignore)
- [deploy/api.env.example](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/deploy/api.env.example)
- [deploy/docker-compose.api.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/deploy/docker-compose.api.yml)
- [scripts/deploy-api-docker.sh](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/scripts/deploy-api-docker.sh)

### Cloudflare Pages web

Recommended settings:
- Framework preset: `None`
- Root directory: `/`
- Build command: `npm install -g bun && bun install --frozen-lockfile && bun run build:web`
- Build output directory: `apps/web/dist/flaptalk-web/browser`

For Angular client-side routing on Pages, the project includes [apps/web/public/_redirects](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/apps/web/public/_redirects).
