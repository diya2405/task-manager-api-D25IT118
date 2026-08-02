function requireJson(req, res, next) {
  if (['POST', 'PUT'].includes(req.method)) {
    if (!req.is('application/json')) {
      return res.status(400).json({ error: "Content-Type must be application/json" });
    }
  }
  next();
}

module.exports = requireJson;
