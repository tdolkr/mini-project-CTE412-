# Habit Tracker Platform

REST API + React front-end for tracking daily habits and lightweight todos with JWT-based authentication, automated CI, and Dockerized deployment.

## Stack
- Node.js 20 + TypeScript + Express
- PostgreSQL 15
- JWT (HS256) + bcrypt password hashing
- Jest + Supertest integration tests (backed by `pg-mem`)
- React + TailwindCSS web client (Vite)
- Docker/Docker Compose
- GitHub Actions CI

## Domain Model
| Table | Fields |
| --- | --- |
| `users` | `id` (uuid, PK), `email` (unique), `password_hash`, `name`, `created_at` |
| `habits` | `id` (uuid, PK), `user_id` (FK → users.id), `name`, `description`, `created_at` |
| `habit_entries` | `id` (uuid, PK), `habit_id` (FK → habits.id), `entry_date`, `completed`, `created_at`, UNIQUE(habit_id, entry_date) |
| `todos` | `id` (uuid, PK), `user_id` (FK → users.id), `title`, `created_at` |

Relationships:
- Each habit and todo belongs to one user.
- Habit entries cascade when a habit is removed.

Schema is defined in `db/migrations/001_init.sql` and auto-applied by Postgres on container start.

## API Surface

### Authentication
All protected endpoints expect `Authorization: Bearer <JWT>` with 1-hour expiry tokens issued on login/registration.

| Method | Path | Description | Request | Responses |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | Create account & issue access token | JSON: `{ email, password, name }` | `201 Created` `{ token, user }`; `409` email exists; `400` validation error |
| `POST` | `/auth/login` | Exchange credentials for access token | JSON: `{ email, password }` | `200 OK` `{ token, user }`; `401` invalid creds |

### Habits (authenticated)

| Method | Path | Description | Request | Responses |
| --- | --- | --- | --- | --- |
| `GET` | `/habits` | List user habits with recent check-ins | – | `200 OK` `{ habits: HabitWithEntries[] }` |
| `POST` | `/habits` | Create a habit | JSON: `{ name, description? }` | `201 Created` `{ habit }`; `400` validation |
| `DELETE` | `/habits/:id` | Remove a habit | – | `204 No Content`; `404` not found |
| `POST` | `/habits/:id/checkins` | Mark habit completion (defaults to today) | JSON: `{ date?, completed? }` | `204 No Content`; `404` not found |
| `DELETE` | `/habits/:id/checkins/:date` | Clear completion for a given day (ISO date) | – | `204 No Content`; `404` not found |

### Todos (authenticated)

| Method | Path | Description | Request | Responses |
| --- | --- | --- | --- | --- |
| `GET` | `/todos` | List todo items | – | `200 OK` `{ todos: Todo[] }` |
| `POST` | `/todos` | Create todo | JSON: `{ title }` | `201 Created` `{ todo }`; `400` validation |
| `DELETE` | `/todos/:id` | Remove todo | – | `204 No Content`; `404` not found |

## Local Development

1. Copy environment template: `cp .env.example .env` and adjust values.
2. Install backend deps: `npm install`
3. Install frontend deps: `npm install` inside `frontend/`
4. Useful scripts:
   - API dev server: `npm run dev`
   - Web dev server (Vite): `npm run web:dev`
   - Tests: `npm test`
   - Lint: `npm run lint`
   - Builds: `npm run build` (API) and `npm run web:build` (client)
5. Dockerized stack: `docker compose up --build`
   - Exposes API & web client on `http://localhost:3000`
   - PostgreSQL available on `localhost:5432` with credentials from `docker-compose.yml`
   - Mounts SQL migrations into the database container for automatic bootstrapping
6. Frontend entry points (served by Express SPA fallback):
   - `http://localhost:3000/` → Landing page
   - `http://localhost:3000/auth` → Register / login portal
   - `http://localhost:3000/dashboard` → Authenticated workspace (JWT required)

## Web Client
The `frontend/` directory contains a Vite-powered React app styled with TailwindCSS:
- `src/screens/LandingPage.tsx` – Aurora-inspired overview with CTAs into auth & dashboard flows.
- `src/screens/AuthPage.tsx` – Handles registration/login, persists JWTs in local storage, and redirects on success.
- `src/screens/DashboardPage.tsx` – Presents metrics, timeline radar, daily habit toggles, and todo management with JWT guard.
- `src/lib/*` & `src/components/*` – Shared API client, storage helpers, toast notifications, and router setup.
- `src/index.css` + `tailwind.config.ts` – Custom gradients, glassmorphism, and animation accents layered atop Tailwind utilities.
- `npm run web:dev` launches the React dev server, while `npm run web:build` creates the production bundle consumed by Express.

## CI Pipeline
Defined in `.github/workflows/ci-cd.yml`.

### Pull Requests
1. Checkout
2. `npm install`
3. `npm run lint`
4. `npm test`
5. `npm run build`
6. `npm run web:build`
7. Uploads built `dist/` as artifact for quick inspection

### Main Branch
- Mirrors the pull-request workflow steps above.
- Builds and pushes a production Docker image to GitHub Container Registry (`ghcr.io/<owner>/<repo>`) tagged with the branch and commit SHA.
- Actions cache accelerates subsequent builds through `docker/build-push-action`.

## Docker & Compose

### Building standalone image
```bash
docker build -t tasks-api:dev .
docker run --rm -p 3000:3000 --env-file .env tasks-api:dev
```

### Compose variables
- `IMAGE_REF` controls which image tag the `api` service uses (defaults to the locally built image).
- `JWT_SECRET`, `PORT`, and `LOG_LEVEL` can be overridden at runtime (helpful for prod vs. dev).
- Postgres credentials default to `habit_user` / `habit_pass` with database `habit_db`; change via environment overrides.

For production deployment, point `IMAGE_REF` at the pushed registry tag and restart:
```bash
export IMAGE_REF=ghcr.io/your-org/tasks-api:main
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
  controllers/       HTTP controllers (auth, habits, todos)
  services/          Domain logic
  db/                PG pool + repositories
  middleware/        Auth + error handling
  utils/             Env, logging, crypto helpers
tests/               Jest + Supertest suites
db/migrations/       SQL schema definition
frontend/
  src/              React pages, components, hooks, and API helpers
  public/           Static assets (e.g., favicon)
  index.html        Vite entry point
```

## Next Steps
- Add refresh tokens / logout endpoints if longer sessions are needed.
- Integrate migration tool (e.g. `node-pg-migrate`) for versioned rollouts.
- Expand domain (habit streak analytics, reminders, social accountability) as requirements evolve.
