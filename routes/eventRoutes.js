const express = require('express');
const router = express.Router();
const taskEvents = require('../events');

// POST /events/register — Register new event entry (Non-blocking async dispatch)
router.post('/register', (req, res) => {
  const { name, email, event, seats, rollNo } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const entry = taskEvents.addPipelineEntry({
    name,
    email,
    event: event || 'Workshop',
    seats: parseInt(seats, 10) || 1,
    rollNo: rollNo || 'D25IT118',
  });

  // Practical 10 Core Concept: Respond immediately to client BEFORE background worker finishes
  console.log(`[API Response] 201 Created sent immediately for "${entry.name}" at ${entry.receivedAt}`);
  res.status(201).json({
    success: true,
    message: 'Entry received',
    entry,
  });

  // Emit event asynchronously
  taskEvents.emit('event-desk-entry', entry);
});

// GET /events/pipeline — Fetch current live pipeline state
router.get('/pipeline', (req, res) => {
  res.status(200).json(taskEvents.getPipeline());
});

// POST /events/reset — Reset pipeline to empty state
router.post('/reset', (req, res) => {
  taskEvents.resetPipeline();
  res.status(200).json({ success: true, message: 'Pipeline reset successfully' });
});

// GET /events/log — View in-memory audit log
router.get('/log', (req, res) => {
  res.status(200).json({ logs: taskEvents.getEventLogs(), count: taskEvents.getEventLogs().length });
});

// POST /events/clear — Clear event logs
router.post('/clear', (req, res) => {
  taskEvents.clearEventLogs();
  res.status(200).json({ success: true, message: 'Event logs cleared', logs: [] });
});

module.exports = router;
