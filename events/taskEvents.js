// Forwarding wrapper to ensure compatibility with root events.js
const taskEvents = require('../events');

module.exports = {
  taskEvents,
  logEvent: taskEvents.logEvent,
  getEventLogs: taskEvents.getEventLogs,
  clearEventLogs: taskEvents.clearEventLogs,
};
