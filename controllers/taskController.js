const Task = require('../models/Task');
const cacheUtil = require('../utils/cache');
const { taskEvents, getEventLogs, clearEventLogs } = require('../events/taskEvents');

// GET /tasks — Cached per user
exports.getAllTasks = async (req, res, next) => {
  try {
    const cacheKey = `tasks_${req.user.id}`;
    const cachedTasks = cacheUtil.get(cacheKey);

    if (cachedTasks) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json(cachedTasks);
    }

    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    cacheUtil.set(cacheKey, tasks);

    res.set('X-Cache', 'MISS');
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
};

// GET /tasks/:id — Cached per user and task ID
exports.getTaskById = async (req, res, next) => {
  try {
    const cacheKey = `task_${req.user.id}_${req.params.id}`;
    const cachedTask = cacheUtil.get(cacheKey);

    if (cachedTask) {
      res.set('X-Cache', 'HIT');
      return res.status(200).json(cachedTask);
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    cacheUtil.set(cacheKey, task);
    res.set('X-Cache', 'MISS');
    res.status(200).json(task);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ error: 'Task not found' });
    next(err);
  }
};

// POST /tasks — Asynchronous Event Emission (Practical 10) + Invalidate Cache (Practical 9)
exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create({
      ...req.body,
      user: req.user.id,
    });

    // Invalidate user's tasks list cache
    cacheUtil.del(`tasks_${req.user.id}`);

    // Practical 10: Log immediate API response timestamp and return response first
    const responseTime = new Date().toISOString();
    console.log(`[API Response] Task created (201) sent at ${responseTime} for "${task.title}"`);
    res.status(201).json(task);

    // Emit asynchronous background event non-blockingly
    taskEvents.emit('task-created', task);
  } catch (err) {
    next(err);
  }
};

// PUT /tasks/:id — Invalidate cache on update
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Invalidate both list and single-task caches
    cacheUtil.del(`tasks_${req.user.id}`);
    cacheUtil.del(`task_${req.user.id}_${req.params.id}`);

    res.status(200).json(task);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ error: 'Task not found' });
    next(err);
  }
};

// DELETE /tasks/:id — Asynchronous Event Emission (Practical 10) + Invalidate Cache
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Invalidate both list and single-task caches
    cacheUtil.del(`tasks_${req.user.id}`);
    cacheUtil.del(`task_${req.user.id}_${req.params.id}`);

    // Practical 10: Log immediate API response timestamp and return response first
    const responseTime = new Date().toISOString();
    console.log(`[API Response] Task deleted (200) sent at ${responseTime} for "${task.title}"`);
    res.status(200).json({ message: 'Task deleted', task });

    // Emit asynchronous background event non-blockingly
    taskEvents.emit('task-deleted', task);
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ error: 'Task not found' });
    next(err);
  }
};

// GET /tasks/cache/stats — Debug & telemetry endpoint
exports.getCacheStatsEndpoint = (req, res) => {
  const stats = cacheUtil.getCacheStats();
  res.status(200).json(stats);
};

// POST /tasks/cache/flush — Manual cache invalidation endpoint
exports.flushCacheEndpoint = (req, res) => {
  cacheUtil.flushAllCache();
  res.status(200).json({ message: 'Cache flushed successfully', stats: cacheUtil.getCacheStats() });
};

// POST /tasks/seed-dummy — Helper to populate realistic sample tasks for caching demo
exports.seedDummyTasks = async (req, res, next) => {
  try {
    const sampleTasks = [
      { title: 'Set up in-memory caching with node-cache', description: 'Configure 60s TTL and cache invalidation on write operations', completed: true },
      { title: 'Optimize MongoDB query execution', description: 'Analyze explain plans and build compound indexes for user lookups', completed: true },
      { title: 'Benchmark API response times with Postman', description: 'Capture 3 cached vs 3 uncached response time readings for lab report', completed: false },
      { title: 'Implement JWT authentication & route guards', description: 'Protect REST endpoints with Authorization Bearer tokens', completed: true },
      { title: 'Measure First Contentful Paint (FCP)', description: 'Profile React bundle load metrics using Chrome DevTools Performance tab', completed: false },
      { title: 'Conduct multi-instance cache trade-off analysis', description: 'Document why process-local cache requires Redis in clustered deployments', completed: false }
    ];

    const tasksToInsert = sampleTasks.map(t => ({ ...t, user: req.user.id }));
    const inserted = await Task.insertMany(tasksToInsert);

    // Invalidate user cache so fresh items appear
    cacheUtil.del(`tasks_${req.user.id}`);

    res.status(201).json({
      message: `Successfully seeded ${inserted.length} sample tasks`,
      count: inserted.length,
      tasks: inserted
    });
  } catch (err) {
    next(err);
  }
};

// Practical 10: Event Telemetry & Audit Log Endpoints
exports.getEventLogsEndpoint = (req, res) => {
  res.status(200).json(getEventLogs());
};

exports.clearEventLogsEndpoint = (req, res) => {
  clearEventLogs();
  res.status(200).json({ message: 'Event logs cleared', logs: [] });
};