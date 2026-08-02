const express = require('express');
const requestLogger = require('./middleware/logger');
const requireJson = require('./middleware/requireJson');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(requestLogger);   // logs every request first, before anything can short-circuit
app.use(requireJson);     // then checks Content-Type on POST/PUT

app.use('/tasks', taskRoutes);

app.use(notFound);        // 404 handler for undefined routes
app.use(errorHandler);    // global error handler — MUST be last

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));