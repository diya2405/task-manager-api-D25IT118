const taskEvents = require('./events');

// Step 2 & 5: Listener for 'task-created' event with 2-second delay
taskEvents.on('task-created', (task) => {
  const receivedAt = new Date().toISOString();
  console.log(`[Notification] Task "${task.title}" created at ${receivedAt}`);

  setTimeout(() => {
    const completedAt = new Date().toISOString();
    console.log(
      `[Notification Worker] Background notification sent for Task "${task.title}" (User: ${task.user}) completed at ${completedAt}`
    );

    taskEvents.logEvent({
      event: 'task-created',
      taskTitle: task.title,
      taskId: task._id,
      userId: task.user,
      receivedAt,
      completedAt,
      delayMs: 2000,
      status: 'COMPLETED',
    });
  }, 2000);
});

// Supplementary Problem 1: Second event 'task-deleted' with its own listener
taskEvents.on('task-deleted', (task) => {
  const receivedAt = new Date().toISOString();
  console.log(`[Notification] Task "${task.title || task._id}" deleted at ${receivedAt}`);

  setTimeout(() => {
    const completedAt = new Date().toISOString();
    console.log(
      `[Audit Worker] Background audit completed for deleted Task "${task.title || task._id}" at ${completedAt}`
    );

    taskEvents.logEvent({
      event: 'task-deleted',
      taskTitle: task.title,
      taskId: task._id,
      userId: task.user,
      receivedAt,
      completedAt,
      delayMs: 1000,
      status: 'COMPLETED',
    });
  }, 1000);
});

// Supplementary Problem 2: Error event listener catching unhandled errors
taskEvents.on('error', (err) => {
  console.error(`[Event Error] Unhandled EventEmitter error captured: ${err.message}`);
  taskEvents.logEvent({
    event: 'error',
    status: 'FAILED',
    details: err.message,
  });
});

console.log('✅ Task EventEmitter listeners registered successfully.');

module.exports = taskEvents;
