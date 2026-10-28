const EventEmitter = require('events');

class TaskEvents extends EventEmitter {}

const taskEvents = new TaskEvents();

// In-memory buffer of recent events for telemetry & audit log inspection
const eventLogs = [];

taskEvents.logEvent = function (entry) {
  eventLogs.unshift({
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (eventLogs.length > 50) eventLogs.pop();
};

taskEvents.getEventLogs = function () {
  return eventLogs;
};

taskEvents.clearEventLogs = function () {
  eventLogs.length = 0;
};

// Practical 10: Event Desk Live Pipeline Storage
const pipeline = [];

taskEvents.addPipelineEntry = function (data) {
  const entry = {
    id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: (data.name && data.name.trim()) || 'Diya Shah',
    email: (data.email && data.email.trim()) || 'diya@example.com',
    event: data.event || 'Workshop',
    seats: parseInt(data.seats, 10) || 1,
    rollNo: (data.rollNo && data.rollNo.trim()) || 'D25IT118',
    status: 'processing', // 'waiting' | 'processing' | 'confirmed'
    ticketCode: null,
    receivedAt: new Date().toISOString(),
    confirmedAt: null,
  };
  pipeline.unshift(entry);
  if (pipeline.length > 30) pipeline.pop();
  return entry;
};

taskEvents.getPipeline = function () {
  const waiting = pipeline.filter((item) => item.status === 'waiting');
  const processing = pipeline.filter((item) => item.status === 'processing');
  const confirmed = pipeline.filter((item) => item.status === 'confirmed');
  return {
    waiting,
    processing,
    confirmed,
    total: pipeline.length,
    all: pipeline,
  };
};

taskEvents.resetPipeline = function () {
  pipeline.length = 0;
};

module.exports = taskEvents;
