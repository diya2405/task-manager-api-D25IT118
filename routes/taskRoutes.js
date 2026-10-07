const express = require('express');
const router = express.Router();

const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getCacheStatsEndpoint,
  flushCacheEndpoint,
  seedDummyTasks,
  getEventLogsEndpoint,
  clearEventLogsEndpoint,
} = require('../controllers/taskController');

const auth = require('../middleware/auth');
const validateTaskId = require('../middleware/validateTaskId');
const validateTaskInput = require('../middleware/validateTaskInput');

// Practical 9: Cache Debug & Analytics Endpoints
router.get('/cache/stats', auth, getCacheStatsEndpoint);
router.post('/cache/flush', auth, flushCacheEndpoint);
router.post('/seed-dummy', auth, seedDummyTasks);

// Practical 10: Event Telemetry & Audit Log Endpoints
router.get('/events/log', auth, getEventLogsEndpoint);
router.post('/events/clear', auth, clearEventLogsEndpoint);

// Task CRUD Endpoints
router.get('/', auth, getAllTasks);
router.get('/:id', auth, validateTaskId, getTaskById);
router.post('/', auth, validateTaskInput, createTask);
router.put('/:id', auth, validateTaskId, validateTaskInput, updateTask);
router.delete('/:id', auth, validateTaskId, deleteTask);

module.exports = router;