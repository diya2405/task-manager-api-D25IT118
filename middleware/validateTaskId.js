function validateTaskId(req, res, next) {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return res.status(400).json({ error: "Invalid task ID format" });
  }
  next();
}

module.exports = validateTaskId;