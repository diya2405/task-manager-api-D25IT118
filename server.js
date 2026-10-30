const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const requestLogger = require('./middleware/logger');
const requireJson = require('./middleware/requireJson');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const aiRoutes = require('./routes/aiRoutes');
require('./listeners');

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  exposedHeaders: ['X-Cache'],
}));
app.use(express.json());
app.use(requestLogger);
app.use(requireJson);

// Health check / identity endpoint (Practical 12 CI verification)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'task-manager-api-D25IT118',
    student: 'Diya Shah',
    rollNo: 'D25IT118',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/events', eventRoutes);
app.use('/ai', aiRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
