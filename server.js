const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

// ---------- Global Middleware ----------
app.use(express.json());

// Reject POST/PUT without Content-Type: application/json
app.use((req, res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    if (!req.is('application/json')) {
      return res.status(400).json({ error: "Content-Type must be application/json" });
    }
  }
  next();
});

// Request logging middleware — logs method, URL, timestamp
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});
// ---------- In-memory data store ----------
let tasks = [
  { id: uuidv4(), title: "Prepare ITUE302 exam notes", completed: false },
  { id: uuidv4(), title: "Push SentinelAI repo update", completed: true },
];

// ---------- Helper: validate task ID exists ----------
function findTaskIndex(id) {
  return tasks.findIndex((t) => t.id === id);
}

// Route-specific middleware: validate ID format before controller runs
function validateIdParam(req, res, next) {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return res.status(400).json({ error: "Invalid task ID format" });
  }
  next();
}

// ---------- Routes ----------

// GET /tasks — get all tasks
app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

// GET /tasks/:id — get single task
app.get('/tasks/:id', validateIdParam, (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.status(200).json(task);
});

// POST /tasks — create a task
app.post('/tasks', (req, res, next) => {
  try {
    const { title, completed } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: "Task 'title' is required and must be a string" });
    }

    const newTask = {
      id: uuidv4(),
      title,
      completed: Boolean(completed) || false,
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
  } catch (err) {
    next(err); // pass to global error handler
  }
});

// PUT /tasks/:id — update a task
app.put('/tasks/:id', validateIdParam, (req, res, next) => {
  try {
    const index = findTaskIndex(req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { title, completed } = req.body;
    if (title !== undefined) tasks[index].title = title;
    if (completed !== undefined) tasks[index].completed = Boolean(completed);

    res.status(200).json(tasks[index]);
  } catch (err) {
    next(err);
  }
});
// DELETE /tasks/:id — delete a task
app.delete('/tasks/:id', validateIdParam, (req, res) => {
  const index = findTaskIndex(req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }
  const deleted = tasks.splice(index, 1);
  res.status(200).json({ message: "Task deleted", task: deleted[0] });
});

// ---------- 404 handler for undefined routes ----------
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});
// ---------- Global error handling middleware (MUST be last) ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));