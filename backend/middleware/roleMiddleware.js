const { error } = require('../utils/apiResponse');

module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return error(res, 403, 'Unauthorized: Insufficient permissions');
    }
    next();
  };
};