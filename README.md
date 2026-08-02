# Task Manager API — D25IT118

A RESTful backend built with Node.js and Express for managing tasks (in-memory storage).

## Run locally
\`\`\`bash
npm install
npm start
\`\`\`

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
