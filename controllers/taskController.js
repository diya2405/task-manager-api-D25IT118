const taskStore = require('../data/taskStore');

function getAllTasks(req, res) {
  res.status(200).json(taskStore.getAll());
}

function getTaskById(req, res) {
  const task = taskStore.getById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }
  res.status(200).json(task);
}

function createTask(req, res, next) {
  try {
    const { title, completed } = req.body;
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: "Task 'title' is required and must be a string" });
    }
    const newTask = taskStore.create(title, completed);
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
}




function updateTask(req, res, next) {
  try {
    const existing = taskStore.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }
    const updated = taskStore.update(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

function deleteTask(req, res) {
  const existing = taskStore.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Task not found" });
  }
  const deleted = taskStore.remove(req.params.id);
  res.status(200).json({ message: "Task deleted", task: deleted });
}

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };