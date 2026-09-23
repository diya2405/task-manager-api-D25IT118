function requireJson(req, res, next) {
  if (['POST', 'PUT'].includes(req.method)) {
    const contentLength = req.headers['content-length'];
    if (contentLength && contentLength !== '0' && !req.is('application/json')) {
      return res.status(400).json({ error: 'Content-Type must be application/json' });
    }
  }
  next();
}

module.exports = requireJson;
