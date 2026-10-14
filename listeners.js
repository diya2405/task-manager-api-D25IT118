const taskEvents = require('./events');

// Step 2 & 5: Listener for 'task-created' event with artificial delay (Supplementary 3)
taskEvents.on('task-created', (task) => {
  console.log(`[Notification] Task "${task.title}" created at ${new Date().toISOString()}`);

  // Artificial delay (2 seconds) to demonstrate asynchronous non-blocking behavior
  setTimeout(() => {
    console.log(
      `[Notification Worker] Background notification sent for Task "${task.title}" (User: ${task.user}) completed at ${new Date().toISOString()}`
    );
  }, 2000);
});

// Supplementary Problem 1: Second event 'task-deleted' with its own listener
taskEvents.on('task-deleted', (task) => {
  console.log(`[Notification] Task "${task.title || task._id}" deleted at ${new Date().toISOString()}`);

  setTimeout(() => {
    console.log(
      `[Audit Worker] Background audit completed for deleted Task "${task.title || task._id}" at ${new Date().toISOString()}`
    );
  }, 1000);
});

// Supplementary Problem 2: Error event listener catching unhandled errors
taskEvents.on('error', (err) => {
  console.error(`[Event Error] Unhandled EventEmitter error captured: ${err.message}`);
});

module.exports = taskEvents;
