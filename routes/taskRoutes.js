const express = require('express');
const router = express.Router();

const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const auth = require('../middleware/auth');
const validateTaskId = require('../middleware/validateTaskId');
const validateTaskInput = require('../middleware/validateTaskInput');

router.get('/', auth, getAllTasks);
router.get('/:id', auth, validateTaskId, getTaskById);
router.post('/', auth, validateTaskInput, createTask);
router.put('/:id', auth, validateTaskId, validateTaskInput, updateTask);
router.delete('/:id', auth, validateTaskId, deleteTask);

module.exports = router;