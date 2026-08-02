# Task Manager API — D25IT118

A RESTful backend for a Task Management system, built with Node.js and Express.
Uses an in-memory array as storage (no database).

## Setup

\`\`\`bash
npm install
npm start
\`\`\`
Server runs on `http://localhost:5000`.

## Endpoints

| Method | Route      | Description        | Success Status | Error Status |
|--------|------------|---------------------|-----------------|--------------|
| GET    | /tasks     | List all tasks       | 200             | —            |
| GET    | /tasks/:id | Get a single task     | 200             | 404          |
| POST   | /tasks     | Create a task         | 201             | 400          |
| PUT    | /tasks/:id | Update a task         | 200             | 404          |
| DELETE | /tasks/:id | Delete a task         | 200             | 404          |

All POST/PUT requests must include `Content-Type: application/json`,
otherwise the API responds `400 Bad Request`.

## Middleware pipeline

1. `express.json()` — parses JSON request bodies
2. `requestLogger` — logs method, URL, and timestamp for every incoming request
3. `requireJson` — rejects POST/PUT requests missing `application/json` Content-Type
4. Task routes (`/tasks`) — each `:id` route runs `validateTaskId` first
5. `notFound` — 404 handler for any undefined route
6. `errorHandler` — global error handler, registered last in the pipeline

## Project structure

\`\`\`
task-manager-api-D25IT118/
├── server.js
├── package.json
├── data/
│   └── taskStore.js
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
\`\`\`

## Key Questions (Analysis)

- **Why must the error handling middleware be last?** Express walks the
  middleware stack top to bottom. An error handler only catches errors
  passed via `next(err)` from code that ran *before* it in the stack —
  so if it's registered before the routes, it never sees their errors.
- **`app.use()` vs. route-specific middleware?** `app.use()` runs for
  every request that matches its path prefix, regardless of method.
  Route-specific middleware (e.g. `router.get('/:id', validateTaskId, handler)`)
  only runs for that exact method + path combination.
- **Why not send raw stack traces to the client?** Stack traces reveal
  internal file paths, library versions, and logic — useful
  reconnaissance for an attacker, and meaningless to a legitimate API
  consumer. The stack is logged server-side; the client gets a generic
  message instead.

## Example requests (curl)

\`\`\`bash
# Create a task
curl.exe -X POST http://localhost:5000/tasks -H "Content-Type: application/json" -d '{"title": "Write MATURITY.md"}'

# Get all tasks
curl.exe http://localhost:5000/tasks

# Update a task
curl.exe -X PUT http://localhost:5000/tasks/<id> -H "Content-Type: application/json" -d '{"completed": true}'

# Delete a task
curl.exe -X DELETE http://localhost:5000/tasks/<id>
\`\`\`

The Richardson Maturity Model evaluation for this API lives in the
separate `assignment-w4-D25IT118` repository (see `MATURITY.md` there).