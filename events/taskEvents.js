const EventEmitter = require('events');

class TaskEventEmitter extends EventEmitter {}

const taskEvents = new TaskEventEmitter();

// Buffer the last 50 async event logs for UI / API inspection
const eventLogs = [];

function logEvent(entry) {
  eventLogs.unshift({
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (eventLogs.length > 50) eventLogs.pop();
}

function getEventLogs() {
  return eventLogs;
}

function clearEventLogs() {
  eventLogs.length = 0;
}

module.exports = {
  taskEvents,
  logEvent,
  getEventLogs,
  clearEventLogs,
};
