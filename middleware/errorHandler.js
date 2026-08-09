module.exports = function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  if (err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate value', field: Object.keys(err.keyValue)[0] });
  }

  res.status(500).json({ error: 'Internal server error' });
};