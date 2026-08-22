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

1. `cors()` — allows the React dev server (`localhost:5173`) to call this API
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
│   └── Task.js
├── controllers/
│   └── taskController.js
├── routes/
│   └── taskRoutes.js
└── middleware/
    ├── logger.js
    ├── requireJson.js
    ├── validateTaskId.js
    ├── notFound.js
    └── errorHandler.js
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
- No other backend changes needed — Practical 5's CRUD logic is reused as-is
- Verified end-to-end: create/update/delete requests from the React UI persist correctly in MongoDB, confirmed by refreshing the browser

## GitHub Deliverables

- Working MongoDB-backed CRUD API with Mongoose schema and validation
- `.env` excluded via `.gitignore`; `.env.example` provided instead
- CORS enabled for local frontend-backend integration (Practical 6)

## Author

**Diya Shah** — B.Tech IT, CSPIT, CHARUSAT University
[GitHub](https://github.com/diya2405)
