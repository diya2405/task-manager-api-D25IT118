const { taskEvents, logEvent } = require('./taskEvents');

// Listener 1: 'task-created' — Asynchronous background notification worker
taskEvents.on('task-created', (data) => {
  const receivedAt = new Date().toISOString();
  console.log(`[Event: task-created] Listener triggered at ${receivedAt} for Task: "${data.title}"`);

  // Asynchronous side-effect simulation (e.g., email notification, push notification)
  // Uses setTimeout to demonstrate non-blocking background execution
  setTimeout(() => {
    const completedAt = new Date().toISOString();
    console.log(
      `[Notification Worker] Background job finished for Task "${data.title}" (User: ${data.user}) at ${completedAt}`
    );

    logEvent({
      type: 'task-created',
      taskTitle: data.title,
      taskId: data._id,
      userId: data.user,
      receivedAt,
      completedAt,
      delayMs: 1500,
      status: 'PROCESSED_ASYNC',
      details: `Email & push notification dispatched for "${data.title}"`,
    });
  }, 1500); // 1.5s simulated async background processing
});

// Listener 2: 'task-deleted' — Asynchronous background audit worker (Supplementary)
taskEvents.on('task-deleted', (data) => {
  const receivedAt = new Date().toISOString();
  console.log(`[Event: task-deleted] Listener triggered at ${receivedAt} for Task ID: "${data._id}"`);

  setTimeout(() => {
    const completedAt = new Date().toISOString();
    console.log(
      `[Audit Worker] Background audit record archived for deleted Task "${data.title}" at ${completedAt}`
    );

    logEvent({
      type: 'task-deleted',
      taskTitle: data.title,
      taskId: data._id,
      userId: data.user,
      receivedAt,
      completedAt,
      delayMs: 1000,
      status: 'PROCESSED_ASYNC',
      details: `Audit record permanently archived for deleted task "${data.title}"`,
    });
  }, 1000); // 1.0s simulated async background audit
});

// Listener 3: 'error' — Safe error handling to prevent unhandled EventEmitter throws
taskEvents.on('error', (err) => {
  console.error(`[Event Error] Unhandled EventEmitter error captured:`, err.message);
  logEvent({
    type: 'error',
    status: 'FAILED',
    details: err.message,
  });
});

console.log('✅ Task EventEmitter listeners registered successfully.');
