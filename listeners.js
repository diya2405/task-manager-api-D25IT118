const taskEvents = require('./events');

// Step 2 & 5: Listener for 'task-created' with artificial 2-second delay (Supplementary 3)
taskEvents.on('task-created', (task) => {
  const receivedAt = new Date().toISOString();
  console.log(`[Notification] Task "${task.title}" created at ${receivedAt}`);
  console.log(`[Notification] Processing background notification for assigned user: ${task.user || 'N/A'}...`);

  // Artificial delay (2 seconds) to make the asynchronous non-blocking behavior visible in console
  setTimeout(() => {
    const completedAt = new Date().toISOString();
    console.log(
      `[Notification Worker] Background job finished for Task "${task.title}" (Assigned User: ${task.user}) at ${completedAt}`
    );

    taskEvents.logEvent({
      event: 'task-created',
      type: 'task-created',
      taskTitle: task.title,
      taskId: task._id,
      userId: task.user,
      receivedAt,
      completedAt,
      durationMs: 2000,
      delayMs: 2000,
      status: 'COMPLETED',
      details: `Notification successfully sent to user ${task.user}`,
    });
  }, 2000);
});

// Supplementary Problem 1: Second event 'task-deleted' with its own listener
taskEvents.on('task-deleted', (task) => {
  const receivedAt = new Date().toISOString();
  console.log(`[Audit] Task "${task.title || task._id}" deleted at ${receivedAt}`);

  setTimeout(() => {
    const completedAt = new Date().toISOString();
    console.log(
      `[Audit Worker] Background audit record archived for deleted Task "${task.title || task._id}" at ${completedAt}`
    );

    taskEvents.logEvent({
      event: 'task-deleted',
      type: 'task-deleted',
      taskTitle: task.title,
      taskId: task._id,
      userId: task.user,
      receivedAt,
      completedAt,
      durationMs: 1000,
      delayMs: 1000,
      status: 'COMPLETED',
      details: `Permanent audit log archived for deleted task ${task._id}`,
    });
  }, 1000);
});

// Supplementary Problem 2: Error event listener catching unhandled EventEmitter errors
taskEvents.on('error', (err) => {
  console.error(`[Event Error] Unhandled EventEmitter error captured: ${err.message}`);
  taskEvents.logEvent({
    event: 'error',
    type: 'error',
    status: 'FAILED',
    details: err.message,
  });
});

console.log('✅ Task EventEmitter listeners registered successfully.');

module.exports = taskEvents;
