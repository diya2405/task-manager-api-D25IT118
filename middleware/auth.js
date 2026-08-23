const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: <userId>, iat, exp }
    next();
  } catch (err) {
    // jwt.verify throws on missing/invalid/expired token — never let this crash the process
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
