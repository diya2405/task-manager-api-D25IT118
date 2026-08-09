const mongoose = require('mongoose');

module.exports = function validateTaskId(req, res, next) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Task not found' });
  }
  next();
};