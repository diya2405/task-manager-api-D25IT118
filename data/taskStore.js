const { v4: uuidv4 } = require('uuid');

let tasks = [
  { id: uuidv4(), title: "Prepare ITUE302 exam notes", completed: false },
  { id: uuidv4(), title: "Push SentinelAI repo update", completed: true },
];

function getAll() {
  return tasks;
}

function getById(id) {
  return tasks.find((t) => t.id === id);
}
function findIndexById(id) {
  return tasks.findIndex((t) => t.id === id);
}
function create(title, completed) {
  const newTask = { id: uuidv4(), title, completed: Boolean(completed) || false };
  tasks.push(newTask);
  return newTask;
}
function update(id, updates) {
  const index = findIndexById(id);
  if (index === -1) return null;
  if (updates.title !== undefined) tasks[index].title = updates.title;
  if (updates.completed !== undefined) tasks[index].completed = Boolean(updates.completed);
  return tasks[index];
}

function remove(id) {
  const index = findIndexById(id);
  if (index === -1) return null;
  const deleted = tasks.splice(index, 1);
  return deleted[0];
}

module.exports = { getAll, getById, findIndexById, create, update, remove };