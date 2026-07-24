# Task Management API

A REST API for managing projects and their tasks, built with Node.js, Express, and PostgreSQL (via Prisma ORM).

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL
- **ORM:** Prisma 7 (with `@prisma/adapter-pg` driver adapter)
- **Testing:** Jest + Supertest

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- Docker (recommended, for running PostgreSQL) — or a local PostgreSQL installation

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd task-management-api
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```
DATABASE_URL="postgresql://postgres:mysecret@localhost:5432/taskdb?schema=public"
JWT_SECRET="dev-jwt-secret-change-me"
```

### 3. Start with Docker Compose (recommended)

Runs PostgreSQL + the API (migrations apply automatically):

```bash
docker compose up --build
```

The API will be available at `http://localhost:3000`.

### Or: local PostgreSQL + Node

Start Postgres (example with Docker):

```bash
docker run --name task-db -e POSTGRES_PASSWORD=mysecret -e POSTGRES_DB=taskdb -p 5432:5432 -d postgres
```

Then generate the Prisma client, migrate, and start:

```bash
npx prisma generate
npx prisma migrate deploy
npm start
```

Optional: `npm run seed` loads sample users/projects/tasks  
(`alice@example.com` / `bob@example.com`, password `password123`).

Useful scripts: `npm test`, `npm run dev`, `npm run migrate`, `npm run seed`.

## Authentication

All `/api/projects` and `/api/tasks` routes require a JWT. Register or log in first, then send:

```
Authorization: Bearer <token>
```

Users only see and manage **their own** projects and tasks. Cross-user access returns `404`.

### Register

```
POST /api/auth/register
Content-Type: application/json

{ "email": "alice@example.com", "password": "password123", "name": "Alice" }
```

Response `201`:
```json
{
  "user": { "id": 1, "email": "alice@example.com", "name": "Alice", "createdAt": "..." },
  "token": "<jwt>"
}
```

### Login

```
POST /api/auth/login
Content-Type: application/json

{ "email": "alice@example.com", "password": "password123" }
```

Response `200` with the same `{ user, token }` shape.

## Running Tests

```bash
npm test
```

This runs both unit tests (business logic validation) and integration tests (full API flows), executed sequentially (`--runInBand`) since they share a single database.

**Note:** Integration tests clean the database before each test run. Avoid running tests against a database with data you want to keep.

- **Unit tests** (`tests/unit/`): validation logic (due date rules, status transitions) in isolation.
- **Integration tests** (`tests/integration/`): full HTTP request/response flows covering:
  1. Auth register/login and ownership isolation
  2. Create project → add task → mark done → delete project (cascade verification)
  3. Filter tasks by status and priority
  4. Search and pagination

## Database Schema

### User

| Field | Type | Notes |
|---|---|---|
| id | Int | Primary key, auto-increment |
| email | String | Required, unique |
| passwordHash | String | bcrypt hash |
| name | String | Optional |
| createdAt | DateTime | Auto-set on creation |
| updatedAt | DateTime | Auto-updated on change |

### Project

| Field | Type | Notes |
|---|---|---|
| id | Int | Primary key, auto-increment |
| name | String | Required, unique per owner |
| description | String | Optional |
| ownerId | Int | Foreign key to User |
| createdAt | DateTime | Auto-set on creation |
| updatedAt | DateTime | Auto-updated on change |
| deletedAt | DateTime | Soft delete timestamp |

A project has many tasks. **Deleting a project soft-deletes its tasks**. Hard deletes cascade at the DB level when a user is removed.

### Task

| Field | Type | Notes |
|---|---|---|
| id | Int | Primary key, auto-increment |
| projectId | Int | Foreign key to Project |
| title | String | Required |
| description | String | Optional |
| status | Enum | `todo` \| `in_progress` \| `done`, default `todo` |
| priority | Enum | `low` \| `medium` \| `high`, default `medium` |
| dueDate | DateTime | Optional; cannot be in the past |
| createdAt | DateTime | Auto-set on creation |
| updatedAt | DateTime | Auto-updated on change |
| deletedAt | DateTime | Soft delete timestamp |

Indexes are set on `projectId`, `status`, `priority`, and `dueDate` to keep filtering and sorting efficient.

## API Endpoints

Protected project/task endpoints below all require `Authorization: Bearer <token>`.

### Projects

#### Create a project

```
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Website Redesign", "description": "Optional description" }
```

Response `201`:
```json
{
  "id": 1,
  "name": "Website Redesign",
  "description": null,
  "ownerId": 1,
  "createdAt": "2026-07-21T12:28:43.333Z",
  "updatedAt": "2026-07-21T12:28:43.333Z"
}
```

Errors: `400` if `name` is missing or empty; `400` if `name` already exists for this user; `401` if unauthenticated.

#### List projects

```
GET /api/projects?page=1&limit=10
Authorization: Bearer <token>
```

Response `200`:
```json
{
  "data": [ { "id": 1, "name": "Website Redesign", "...": "..." } ],
  "pagination": { "page": 1, "limit": 10, "total": 1 }
}
```

#### Get a project by ID

```
GET /api/projects/:id
Authorization: Bearer <token>
```
Returns `200` with the project, or `404` if not found / not owned by you.

#### Update a project

```
PUT /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{ "description": "Updated description" }
```
Returns `200` with the updated project, `404` if not found / not owned, `400` on duplicate name.

#### Delete a project

```
DELETE /api/projects/:id
Authorization: Bearer <token>
```
Returns `204` on success (soft-deletes the project and its tasks), `404` if not found / not owned.

### Tasks

#### Create a task under a project

```
POST /api/projects/:projectId/tasks
Authorization: Bearer <token>
Content-Type: application/json

{ "title": "Design login screen", "priority": "high", "dueDate": "2026-08-01" }
```

Response `201`:
```json
{
  "id": 1,
  "projectId": 3,
  "title": "Design login screen",
  "description": null,
  "status": "todo",
  "priority": "high",
  "dueDate": "2026-08-01T00:00:00.000Z",
  "createdAt": "...",
  "updatedAt": "..."
}
```

Errors: `404` if the project doesn't exist or isn't yours; `400` if `title` is missing or `dueDate` is in the past.

#### List tasks under a project

```
GET /api/projects/:projectId/tasks?status=todo&priority=high&sort_by=priority&sort_order=desc&page=1&limit=10
Authorization: Bearer <token>
```
Supports the same filtering, sorting, and pagination as the global tasks endpoint below, scoped to one owned project.

#### List all tasks (across your projects)

```
GET /api/tasks?status=todo&priority=high&due_date_from=2026-08-01&due_date_to=2026-08-31&sort_by=due_date&sort_order=asc&q=login&page=1&limit=10
Authorization: Bearer <token>
```

Query parameters (all optional):
- `status`: `todo` | `in_progress` | `done`
- `priority`: `low` | `medium` | `high`
- `due_date_from`, `due_date_to`: ISO date strings
- `sort_by`: `due_date` | `priority` | `created_at` (default `created_at`)
- `sort_order`: `asc` | `desc` (default `desc`)
- `q`: search string, matched against title and description (case-insensitive)
- `page`, `limit`: pagination (defaults `1` and `10`)

Response `200`:
```json
{
  "data": [
    {
      "id": 1,
      "projectId": 3,
      "title": "Design login screen",
      "status": "todo",
      "priority": "high",
      "project": { "id": 3, "name": "Mobile App" },
      "...": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1 }
}
```
Each task includes its parent project's `id` and `name` via a single join query (no N+1 queries). Only tasks from your projects are returned.

#### Get a task by ID

```
GET /api/tasks/:id
Authorization: Bearer <token>
```
Returns `200` with the task (including its project), or `404` if not found / not owned.

#### Update a task

```
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{ "status": "done" }
```
Returns `200` with the updated task. Status can move in any direction, including `done → todo` (reopening), which is logged server-side. `404` if not found / not owned; `400` if title is empty or due date is in the past.

#### Delete a task

```
DELETE /api/tasks/:id
Authorization: Bearer <token>
```
Returns `204` on success, `404` if not found / not owned.

## Business Rules

- A task always belongs to exactly one project.
- Projects and tasks are scoped to the authenticated owner.
- Deleting a project soft-deletes all its tasks.
- Due dates cannot be set in the past (on create or update).
- Status can change in any direction; `done → todo` is allowed but logged.
- Duplicate project names are rejected per user.
- Invalid or missing foreign keys return `404`/`400`, never `500`.
