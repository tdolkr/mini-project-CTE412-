# Tasks API Platform

Opinionated REST API for managing personal tasks with JWT-based authentication, automated CI/CD, and Dockerized deployments.

## Stack
- Node.js 20 + TypeScript + Express
- PostgreSQL 15
- JWT (HS256) + bcrypt password hashing
- Jest + Supertest integration tests (backed by `pg-mem`)
- Docker/Docker Compose
- GitHub Actions CI/CD

## Domain Model
| Table | Fields |
| --- | --- |
| `users` | `id` (uuid, PK), `email` (unique), `password_hash`, `name`, `created_at` |
| `tasks` | `id` (uuid, PK), `user_id` (FK → users.id, cascade delete), `title`, `description`, `due_date`, `status` (`pending`/`in_progress`/`done`), `created_at`, `updated_at` |

Relationships:
- Each task belongs to one user.
- Deleting a user cascades to their tasks.

Schema is defined in `db/migrations/001_init.sql` and auto-applied by Postgres on container start.

## API Surface

### Authentication
All protected endpoints expect `Authorization: Bearer <JWT>` with 1-hour expiry tokens issued on login/registration.

| Method | Path | Description | Request | Responses |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | Create account & issue access token | JSON: `{ email, password, name }` | `201 Created` `{ token, user }`; `409` email exists; `400` validation error |
| `POST` | `/auth/login` | Exchange credentials for access token | JSON: `{ email, password }` | `200 OK` `{ token, user }`; `401` invalid creds |

### Tasks (authenticated)

| Method | Path | Description | Request | Responses |
| --- | --- | --- | --- | --- |
| `GET` | `/tasks` | List current user's tasks (newest first) | – | `200 OK` `{ tasks: Task[] }` |
| `POST` | `/tasks` | Create task | JSON: `{ title, description?, dueDate? }` | `201 Created` `{ task }`; `400` validation |
| `GET` | `/tasks/:id` | Fetch single task | – | `200 OK` `{ task }`; `404` not found |
| `PUT` | `/tasks/:id` | Update task attributes/status | JSON: `{ title?, description?, dueDate?, status? }` | `200 OK` `{ task }`; `404` not found; `400` validation |
| `DELETE` | `/tasks/:id` | Remove task | – | `204 No Content`; `404` not found |

`dueDate` accepts ISO8601 strings (or `null`). `status` must be one of `pending`, `in_progress`, `done`.

## Local Development

1. Copy environment template: `cp .env.example .env` and adjust values.
2. Install dependencies: `npm install`
3. Useful scripts:
   - `npm run dev` – hot-reload server
   - `npm run lint` – ESLint checks
   - `npm test` – Jest + Supertest suite (uses in-memory Postgres via `pg-mem`)
   - `npm run build` / `npm start`
4. Dockerized stack: `docker compose up --build`
   - Exposes API on `http://localhost:3000`
   - PostgreSQL available on `localhost:5432` with credentials from `docker-compose.yml`
   - Mounts SQL migrations into the database container for automatic bootstrapping

## CI/CD Pipeline
Defined in `.github/workflows/ci-cd.yml`.

### Pull Requests
1. Checkout
2. `npm install`
3. `npm run lint`
4. `npm test`
5. `npm run build`
6. Uploads built `dist/` as artifact for quick inspection

### Main Branch
In addition to the steps above:
1. Build & push Docker image with tags:
   - `${REGISTRY}/${IMAGE_NAME}:${GITHUB_SHA}`
   - `${REGISTRY}/${IMAGE_NAME}:latest`
2. SSH into the deployment host and run:
   - `docker login`
   - `docker pull` newest tag
   - `docker compose` (in `$DEPLOY_PATH`) with `IMAGE_REF` set to the freshly pushed tag to recreate the stack

#### Required GitHub Secrets
| Secret | Purpose |
| --- | --- |
| `REGISTRY` | Registry host (e.g. `ghcr.io/owner` or `docker.io/username`) |
| `REGISTRY_USERNAME` / `REGISTRY_PASSWORD` | Credentials for Docker registry |
| `IMAGE_NAME` | Repository/image name (e.g. `tasks-api`) |
| `SSH_HOST`, `SSH_USER`, `SSH_KEY` | Deployment target info |
| `DEPLOY_PATH` | Path on the server containing `docker-compose.yml` |

Remote host prerequisites:
- Docker Engine + Compose plugin
- `.env` containing runtime secrets (`JWT_SECRET`, database URL, etc.)
- Repo (or deployment bundle) placed at `$DEPLOY_PATH`

## Docker & Compose

### Building standalone image
```bash
docker build -t tasks-api:dev .
docker run --rm -p 3000:3000 --env-file .env tasks-api:dev
```

### Compose variables
- `IMAGE_REF` controls which image tag `api` service uses (defaults to local build).
- `JWT_SECRET`, `LOG_LEVEL`, `PORT` can be overridden through environment/export or `.env`.

For production deployment, export `IMAGE_REF` to the registry tag pushed by CI, e.g.:
```bash
export IMAGE_REF=ghcr.io/your-org/tasks-api:latest
docker compose pull api
docker compose up -d --remove-orphans
```

## Testing Strategy
- Authentication & CRUD flows covered via API-level integration tests (`tests/*.test.ts`).
- Tests run against an in-memory Postgres clone, applying real SQL migrations for parity.
- Extend with new suites by adding TypeScript test files under `tests/`.

## Project Structure
```
src/
  app.ts             Express app wiring & middleware
  index.ts           HTTP entrypoint
  controllers/       HTTP controllers (auth, tasks)
  services/          Domain logic
  db/                PG pool + repositories
  middleware/        Auth + error handling
  utils/             Env, logging, crypto helpers
tests/               Jest + Supertest suites
db/migrations/       SQL schema definition
```

## Next Steps
- Add refresh tokens / logout endpoints if longer sessions are needed.
- Integrate migration tool (e.g. `node-pg-migrate`) for versioned rollouts.
- Expand domain (labels, reminders, task activity feed) as requirements evolve.
