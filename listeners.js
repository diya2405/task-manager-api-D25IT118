const taskEvents = require('./events');

// ==========================================
// Practical 10: Event Desk Registration Listener
// ==========================================
taskEvents.on('event-desk-entry', (entry) => {
  const receivedAt = new Date().toISOString();
  console.log(`[Event Desk] Entry received for "${entry.name}" (${entry.event}, ${entry.seats} seat(s)) at ${receivedAt}`);
  console.log(`[Event Desk Worker] Background processing seat confirmation for ${entry.email}...`);

  // Asynchronous background worker (2.0s delay simulating background booking & notification)
  setTimeout(() => {
    const confirmedAt = new Date().toISOString();
    const ticketCode = 'EVT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    entry.status = 'confirmed';
    entry.ticketCode = ticketCode;
    entry.confirmedAt = confirmedAt;

    console.log(
      `[Event Desk Worker] Background confirmation complete: "${entry.name}" -> ${ticketCode} at ${confirmedAt}`
    );

    taskEvents.logEvent({
      event: 'event-desk-confirmed',
      taskTitle: `${entry.name} - ${entry.event} (${ticketCode})`,
      taskId: entry.id,
      receivedAt,
      completedAt: confirmedAt,
      delayMs: 2000,
      status: 'COMPLETED',
      details: `Confirmed ticket ${ticketCode} for ${entry.name}`,
    });
  }, 2000);
});

// ==========================================
// Step 2 & 5: Listener for 'task-created' event
// ==========================================
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

// ==========================================
// Supplementary Problem 1: Second event 'task-deleted'
// ==========================================
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

// ==========================================
// Supplementary Problem 2: Error event listener
// ==========================================
taskEvents.on('error', (err) => {
  console.error(`[Event Error] Unhandled EventEmitter error captured: ${err.message}`);
  taskEvents.logEvent({
    event: 'error',
    status: 'FAILED',
    details: err.message,
  });
});

console.log('✅ Task & Event Desk EventEmitter listeners registered successfully.');

module.exports = taskEvents;
