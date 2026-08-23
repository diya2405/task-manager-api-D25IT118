module.exports = function validateTaskInput(req, res, next) {
  const { title } = req.body;

  // On create, title is required. On update, only validate it if the caller is trying to change it.
  if (req.method === 'POST' && (!title || typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }
  if (req.method === 'PUT' && title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'Title must be a non-empty string' });
  }

  next();
};
