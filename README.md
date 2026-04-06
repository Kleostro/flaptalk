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

В проекте настроена более долгосрочная production-схема:
- CI проверяет код в GitHub Actions
- отдельный workflow собирает API image и публикует его в GHCR
- production deploy выполняется из GitHub Actions по SSH на VPS
- сервер не делает `git pull` и не собирает образ из исходников
- runtime-секреты живут только на сервере в `/etc/flaptalk/api.env`

#### Что уже настроено в репозитории

Основные файлы:
- CI: [.github/workflows/ci.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/ci.yml)
- публикация API image: [.github/workflows/publish-api-image.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/publish-api-image.yml)
- production deploy: [.github/workflows/deploy-api-production.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/deploy-api-production.yml)
- Docker image: [Dockerfile](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/Dockerfile)
- production compose: [deploy/docker-compose.api.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/deploy/docker-compose.api.yml)
- remote deploy script: [scripts/deploy-api-docker.sh](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/scripts/deploy-api-docker.sh)

#### Как теперь устроен production deploy

Поток такой:
1. вы пушите код в GitHub
2. workflow `CI` прогоняет проверки
3. workflow `Publish API Image` собирает immutable image и публикует его в `ghcr.io`
4. workflow `Deploy API Production` подключается к VPS по SSH
5. на сервер копируются свежие deploy-файлы
6. сервер делает `docker pull` готового image
7. сервер запускает `prisma migrate deploy`
8. сервер поднимает контейнер API
9. workflow проверяет health endpoint

Это заметно безопаснее и стабильнее, чем:
- хранить production checkout на сервере
- делать `git pull` руками
- пересобирать образ прямо на VPS

#### Что нужно подготовить один раз

Нужно:
- VPS в Timeweb Cloud с Ubuntu 24.04
- база данных Neon
- GitHub repository
- production branch `main`
- GitHub Environment `production`
- GitHub secrets для SSH-деплоя

#### Шаг 1. Подготовить VPS

Подключитесь к серверу:

```bash
ssh root@YOUR_SERVER_IP
```

Установите Docker и базовые утилиты:

```bash
apt update
apt upgrade -y
apt install -y curl git docker.io docker-compose-v2 postgresql-client
systemctl enable docker
systemctl start docker
```

Если пакет `docker-compose-v2` недоступен, проверьте:

```bash
docker compose version
```

Создайте каталог под deploy-артефакты и runtime env:

```bash
mkdir -p /opt/flaptalk/deploy /etc/flaptalk
```

Если хотите управлять сервером не из-под `root`, создайте пользователя:

```bash
useradd -m -s /bin/bash flaptalk
usermod -aG sudo flaptalk
usermod -aG docker flaptalk
chown -R flaptalk:flaptalk /opt/flaptalk
```

#### Шаг 2. Создать runtime env на сервере

Создайте файл:

```bash
nano /etc/flaptalk/api.env
```

Пример:

```env
NODE_ENV="production"
PORT="3000"
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require&channel_binding=require"
WEB_ORIGIN="https://your-frontend-domain.com"
```

Если домена и фронтенда пока нет:

```env
WEB_ORIGIN=""
```

Важно:
- значения лучше оборачивать в кавычки
- для `DATABASE_URL` это обязательно из-за `&` и других спецсимволов
- production secrets не нужно хранить в git и GitHub repository secrets, если они нужны только runtime-контейнеру

Проверка:

```bash
set -a
source /etc/flaptalk/api.env
set +a
echo "$DATABASE_URL"
```

#### Шаг 3. Настроить GitHub Environment и secrets

В GitHub откройте:
- `Settings` -> `Environments` -> `New environment`
- создайте environment `production`

Добавьте туда secrets:
- `SSH_HOST`
- `SSH_PORT`
- `SSH_USER`
- `SSH_PRIVATE_KEY`

Рекомендуется:
- включить required reviewers для environment `production`
- деплоить production из `main`

Что означают secrets:
- `SSH_HOST`: IP или hostname VPS
- `SSH_PORT`: обычно `22`
- `SSH_USER`: пользователь для деплоя, например `flaptalk`
- `SSH_PRIVATE_KEY`: приватный SSH-ключ, которым GitHub Actions подключается к серверу

#### Шаг 4. Подготовить SSH-доступ для GitHub Actions

На своей машине создайте отдельный deploy key:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/flaptalk_deploy
```

Потом:
- содержимое `~/.ssh/flaptalk_deploy` положите в secret `SSH_PRIVATE_KEY`
- содержимое `~/.ssh/flaptalk_deploy.pub` добавьте на сервер в `~/.ssh/authorized_keys` пользователя деплоя

Пример на сервере:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### Шаг 5. Как работает publish image

Workflow [publish-api-image.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/publish-api-image.yml):
- логинится в GHCR через short-lived GitHub token
- собирает Docker image
- публикует его с immutable tag по SHA коммита

Итоговый image имеет вид:

```text
ghcr.io/OWNER/REPOSITORY/api:<commit-sha>
```

Например:

```text
ghcr.io/kleostro/flaptalk/api:e30e4ac038b95fa267a524e576a2a877d75e3c2c
```

#### Шаг 6. Как работает production deploy

Workflow [deploy-api-production.yml](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/.github/workflows/deploy-api-production.yml):
- запускается автоматически на push в `main`
- или вручную через `workflow_dispatch`
- копирует на сервер только deploy-файлы
- передаёт в deploy-скрипт `API_IMAGE`
- логинится в GHCR через временный GitHub token
- делает `docker pull`
- применяет Prisma migrations
- поднимает контейнер
- проверяет `http://127.0.0.1:3000/`

#### Ежедневная работа

##### Обычная разработка

В VS Code:

```bash
git status
git add -A
git commit -m "Your change"
git push origin your-branch
```

Откройте Pull Request в `main`.

Что произойдёт:
- `CI` проверит код
- security workflows продолжат работать отдельно

##### Production deploy

После merge в `main`:
- image соберётся автоматически
- production deploy выполнится автоматически через GitHub Actions

То есть на сервер больше не нужно заходить для обычного деплоя.

##### Ручной redeploy

Если нужно повторно выкатить уже собранный image:
- откройте `Actions` -> `Deploy API Production`
- нажмите `Run workflow`
- при необходимости укажите `image_tag`

Это полезно для:
- повторного деплоя того же commit
- отката на предыдущий SHA image

#### Что делает deploy-api-docker.sh

[scripts/deploy-api-docker.sh](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/scripts/deploy-api-docker.sh) теперь используется как server-side deploy runner.

Он:
- принимает `API_IMAGE`
- загружает runtime env из `/etc/flaptalk/api.env`
- при необходимости логинится в GHCR
- делает `docker compose pull`
- запускает `prisma migrate deploy`
- поднимает контейнер
- чистит неиспользуемые image

То есть этот скрипт больше не про `git pull`, а про безопасный запуск уже собранного production-артефакта.

#### Как проверить production вручную

На сервере:

```bash
docker compose -f /opt/flaptalk/deploy/docker-compose.api.yml ps
docker compose -f /opt/flaptalk/deploy/docker-compose.api.yml logs --tail=100 api
curl http://127.0.0.1:3000/
curl http://127.0.0.1:3000/users
```

Проверка таблиц в Neon:

```bash
set -a
source /etc/flaptalk/api.env
set +a
psql "$DATABASE_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

#### Что делать при ошибке `public.users does not exist`

Проверьте по порядку:
1. корректен ли `/etc/flaptalk/api.env`
2. смотрит ли `DATABASE_URL` в нужную production-базу Neon
3. прошёл ли job `Deploy API Production`
4. успешно ли отработал шаг `prisma migrate deploy`
5. есть ли в БД `_prisma_migrations` и `users`

#### Почему эта схема лучше

По сравнению с ручным деплоем на сервере она даёт:
- immutable artifacts вместо сборки на VPS
- меньше production secrets в CI
- минимум секретов в git
- audited deploy history в GitHub Actions
- короткоживущий registry token вместо постоянной ручной авторизации
- предсказуемый rollback по image tag
- меньший риск “у меня на сервере была не та версия кода”

### Cloudflare Pages web

Recommended settings:
- Framework preset: `None`
- Root directory: `/`
- Build command: `npm install -g bun && bun install --frozen-lockfile && bun run build:web`
- Build output directory: `apps/web/dist/flaptalk-web/browser`

For Angular client-side routing on Pages, the project includes [apps/web/public/_redirects](/Users/maxzabaluev/Desktop/flaptalk/flaptalk/apps/web/public/_redirects).
