const EventEmitter = require('events');

class TaskEvents extends EventEmitter {}

const taskEvents = new TaskEvents();

// In-memory buffer of recent events for UI inspection
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

module.exports = taskEvents;
