const jwt = require('jsonwebtoken');
const { error } = require('../utils/apiResponse');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return error(res, 401, 'Access denied. No token.');

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    error(res, 403, 'Invalid or expired token');
  }
};