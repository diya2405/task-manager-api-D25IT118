# Task Manager API — D25IT118

A RESTful backend built with Node.js and mongoDB for data storage
Update for Practical- 5
## Run locally

npm install

npm start


Server runs on `http://localhost:5000`

## Endpoints
| Method | Route         | Description         |
|--------|---------------|----------------------|
| GET    | /tasks        | Get all tasks        |
| GET    | /tasks/:id    | Get a single task    |
| POST   | /tasks        | Create a new task    |
| PUT    | /tasks/:id    | Update a task        |
| DELETE | /tasks/:id    | Delete a task        |

## Middleware pipeline
1. `express.json()` — parses JSON body
2. Content-Type check — rejects POST/PUT without `application/json`
3. Request logger — logs method, URL, timestamp
4. Route-specific `validateIdParam` — checks `:id` format before hitting controller
5. 404 handler — for undefined routes
6. Global error handler — last middleware, catches thrown/passed errors     

### Practical 6 — Full Stack Integration (React + Node + MongoDB)
- Added `cors()` middleware to allow the React frontend (port 5173) to call this API (port 5000)
- CORS origin restricted to `CLIENT_ORIGIN` environment variable — not a wildcard (`*`)
- No other backend changes needed — Practical 5's CRUD logic is reused as-is
- `.env` excluded via `.gitignore`; `.env.example` provided with placeholder values
- Verified end-to-end: create/update/delete requests from the React UI persist correctly in MongoDB, confirmed by refreshing the browser

