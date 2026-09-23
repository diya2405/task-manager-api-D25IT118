# Task Manager API — D25IT118

A RESTful backend for a Task Management system, built with **Node.js, Express, and MongoDB (Mongoose)**, created as part of the Advanced Web Development Frameworks (ITUE301) coursework at CHARUSAT University. Now serving a live React frontend end-to-end (Practical 6).

🔗 **Live Repo:** [github.com/diya2405/task-manager-api-D25IT118](https://github.com/diya2405/task-manager-api-D25IT118)  
🔗 **Frontend Repo:** [github.com/diya2405/Portfolio-D25IT118](https://github.com/diya2405/Portfolio-D25IT118)

## Tech Stack

- Node.js (v18+)
- Express.js
- MongoDB + Mongoose
- CORS (for frontend integration)
- dotenv
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- node-cache (in-memory caching & telemetry)

## Setup

```bash
git clone https://github.com/diya2405/task-manager-api-D25IT118.git
cd task-manager-api-D25IT118
npm install
```

Create a `.env` file in the project root:
```
MONGO_URI=mongodb://127.0.0.1:27017/taskmanager
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=1h
```
(Swap `MONGO_URI` for an Atlas connection string if you prefer cloud MongoDB instead of a local Compass connection — no other code changes needed.)

```bash
npm start
```
Server runs on `http://localhost:5000`

## Endpoints

| Method | Route      | Description       | Success Status | Error Status |
| ------ | ---------- | ----------------- | --------------- | ------------ |
| GET    | /tasks     | List all tasks    | 200             | —            |
| GET    | /tasks/:id | Get a single task | 200             | 404          |
| POST   | /tasks     | Create a task      | 201             | 400          |
| PUT    | /tasks/:id | Update a task      | 200             | 400 / 404    |
| DELETE | /tasks/:id | Delete a task      | 200             | 404          |

All POST/PUT requests must include `Content-Type: application/json`, otherwise the API responds `400 Bad Request`.

## Task Schema

```js
{
  title: { type: String, required: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}
```

## Middleware Pipeline

1. `cors()` — allows the React dev server (`localhost:5173`) to call this API with explicit origin restriction
2. `express.json()` — parses JSON request bodies
3. `requestLogger` — logs method, URL, and timestamp for every incoming request
4. `requireJson` — rejects POST/PUT requests missing `application/json` Content-Type
5. Task routes (`/tasks`) — each `:id` route runs `validateTaskId` first (checks for a valid Mongo ObjectId)
6. `notFound` — 404 handler for any undefined route
7. `errorHandler` — global error handler, registered last; converts Mongoose `ValidationError` into structured `{ error, details }` JSON instead of leaking raw error objects

## Project Structure

```
task-manager-api-D25IT118/
├── server.js
├── package.json
├── .env.example
├── models/
│   ├── Task.js
│   └── User.js
├── controllers/
│   ├── taskController.js
│   └── authController.js
├── routes/
│   ├── taskRoutes.js
│   └── authRoutes.js
├── middleware/
│   ├── auth.js
│   ├── logger.js
│   ├── requireJson.js
│   ├── validateTaskId.js
│   ├── validateTaskInput.js
│   ├── notFound.js
│   └── errorHandler.js
└── utils/
    └── cache.js
```

## Key Questions (Analysis)

- **Why a schema if MongoDB is schema-less?** MongoDB itself will store any shape of document. Mongoose adds an application-level contract — every document is checked against defined types, required fields, and constraints before it's written, giving predictability without giving up MongoDB's storage-layer flexibility.
- **Why validate at the schema level, not just the frontend?** Frontend validation is a UX convenience, easily bypassed with Postman/curl. Schema-level validation is the real guarantee that no invalid document reaches the database.
- **Why must error handling middleware be last?** Express walks the middleware stack top to bottom. An error handler only catches errors passed via `next(err)` from code that ran *before* it — registering it early means it never sees route errors.
- **Why enable CORS?** Browsers block cross-origin requests by default (same-origin policy). The React dev server (port 5173) and this API (port 5000) are different origins, so without `cors()` the browser refuses to let frontend JS read the API's responses.

## Example Requests (curl)

```bash
# Create a task
curl -X POST http://localhost:5000/tasks -H "Content-Type: application/json" -d '{"title": "Write notes"}'

# Get all tasks
curl http://localhost:5000/tasks

# Update a task
curl -X PUT http://localhost:5000/tasks/<id> -H "Content-Type: application/json" -d '{"completed": true}'

# Delete a task
curl -X DELETE http://localhost:5000/tasks/<id>
```

## Practicals Covered

### Practical 4 — RESTful API with Node.js and Express
- Built REST endpoints for creating, reading, updating, and deleting tasks using an in-memory array
- Request logging middleware (method, URL, timestamp) applied to every request
- Global error handling middleware as the last step in the pipeline
- Correct HTTP status codes used throughout (200, 201, 404, 500)

### Practical 5 — MongoDB Integration and Schema Design with Mongoose
- Connected the API to MongoDB using Mongoose, replacing the in-memory array with real model operations
- Defined the `Task` schema with 4 required fields (title, description, completed, createdAt)
- All CRUD operations tested against a live database using Postman
- Validation errors returned as structured JSON (`{ error, details }`), never raw Mongoose error objects

### Practical 6 — Full Stack Integration (React + Node + MongoDB)
- Added `cors()` middleware to allow the React frontend (port 5173) to call this API (port 5000)
- CORS origin restricted to `CLIENT_ORIGIN` environment variable — not a wildcard (`*`)
- No other backend changes needed — Practical 5's CRUD logic is reused as-is
- `.env` excluded via `.gitignore`; `.env.example` provided with placeholder values
- Verified end-to-end: create/update/delete requests from the React UI persist correctly in MongoDB, confirmed by refreshing the browser

### Practical 7 — Authentication and Middleware Pipeline
- Added user registration and login with bcrypt-hashed passwords and JWT-based authentication
- New `User` model (`email`, hashed `password`, timestamps) with unique email constraint
- Three auth endpoints: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- JWT auth middleware protects **all** `/tasks*` routes — requests without a valid token are rejected `401`
- Server-side `validateTaskInput` middleware rejects missing/empty task titles on `POST`/`PUT` before Mongoose is touched
- Security: same generic "Invalid credentials" for wrong email or wrong password (prevents user enumeration), password hash never in any response, `JWT_SECRET` only in `.env`
- Token stored in `localStorage` on the frontend (acceptable for coursework scope; httpOnly cookie would be the production-grade approach)

## Auth Endpoints

| Method | Route           | Auth Required | Description                    | Success | Error       |
|--------|-----------------|---------------|--------------------------------|---------|-------------|
| POST   | /auth/register  | No            | Create a new user account      | 201     | 400         |
| POST   | /auth/login     | No            | Log in, receive a JWT          | 200     | 400 / 401   |
| GET    | /auth/me        | Yes (Bearer)  | Get current user info          | 200     | 401 / 404   |

> **Note:** All `/tasks*` endpoints now require `Authorization: Bearer <token>` in the request header. Without it, the API responds `401`.

## Auth Example Requests (curl)

```bash
# Register a new user
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "diya@example.com", "password": "test123"}'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "diya@example.com", "password": "test123"}'

# Get current user (replace <token> with the JWT from login)
curl http://localhost:5000/auth/me \
  -H "Authorization: Bearer <token>"

# Get all tasks (now requires auth)
curl http://localhost:5000/tasks \
  -H "Authorization: Bearer <token>"

# Create a task (now requires auth)
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title": "Write notes"}'
```


### Practical 9 — In-Memory Caching and Query Optimization
- Implemented in-memory server-side caching using `node-cache` with a 60-second TTL
- **User-Scoped Caching Strategy**: Cache keys are segmented per authenticated user (`tasks_${req.user.id}` and `task_${req.user.id}_${taskId}`) to maintain strict multi-tenant data privacy
- **Cache Invalidation on Writes**: Every write operation (`POST /tasks`, `PUT /tasks/:id`, `DELETE /tasks/:id`) immediately purges the corresponding cache keys, ensuring stale task data is never served
- **Cache Telemetry**: `X-Cache: HIT` and `X-Cache: MISS` headers returned on read operations, with hit/miss counter stats exposed at `GET /tasks/cache/stats`
- **Benchmarking & Testing**: Includes helper endpoints for manual cache flush (`POST /tasks/cache/flush`) and batch dummy task generation (`POST /tasks/seed-dummy`)

#### Empirical Performance Comparison (Cached vs. Uncached)

| Metric / Reading | Uncached (MongoDB Atlas Query) | Cached (node-cache In-Memory) | Latency Reduction |
|---|---|---|---|
| **Sample 1** | `42.43 ms` | `3.89 ms` | **90.8% faster** |
| **Sample 2** | `35.17 ms` | `3.90 ms` | **88.9% faster** |
| **Sample 3** | `29.20 ms` | `4.79 ms` | **83.6% faster** |
| **Average Response Time** | **`35.60 ms`** | **`4.19 ms`** | **88.2% FASTER** |

#### Key Analysis & Viva Questions

1. **Why must the cache be invalidated on every write operation, and what would happen to data correctness if it were not?**
   - If the cache is not invalidated on write (`POST`, `PUT`, `DELETE`), subsequent `GET` requests within the TTL window will return stale, outdated snapshots from memory rather than the updated database state, causing data inconsistency and phantom records.
2. **What is a reasonable TTL (time-to-live) for cached data in a task management context, and what trade-off does TTL length represent?**
   - A TTL of 30–60 seconds is typical for interactive task applications. A longer TTL reduces database read load but increases the risk of serving stale data if an external service writes to the database directly without invalidating the cache. A shorter TTL guarantees fresher data but causes more frequent database queries.
3. **Why is in-memory caching (node-cache) not suitable for a multi-server/multi-instance deployment?**
   - `node-cache` stores items in the RAM of a single Node.js process. In a clustered or multi-instance load-balanced deployment, writes handled by Server A will not invalidate the cache on Server B, causing users routed to different instances to see conflicting data. Distributed caching (e.g., Redis or Memcached) is required for multi-server setups.

## Cache & Analytics Endpoints

| Method | Route                | Auth Required | Description                                    |
|--------|----------------------|---------------|------------------------------------------------|
| GET    | /tasks/cache/stats   | Yes (Bearer)  | View cache hits, misses, hit rate, active keys |
| POST   | /tasks/cache/flush   | Yes (Bearer)  | Manually invalidate all cached entries         |
| POST   | /tasks/seed-dummy    | Yes (Bearer)  | Seed sample realistic tasks for testing        |

## GitHub Deliverables

- Working MongoDB-backed CRUD API with Mongoose schema and validation
- `.env` excluded via `.gitignore`; `.env.example` provided instead
- CORS enabled for local frontend-backend integration (Practical 6)
- JWT Authentication & Middleware pipeline (Practical 7)
- In-memory caching with `node-cache` and empirical latency benchmarking (Practical 9)

## Author

**Diya Shah** — B.Tech IT, CSPIT, CHARUSAT University  
[GitHub](https://github.com/diya2405)
