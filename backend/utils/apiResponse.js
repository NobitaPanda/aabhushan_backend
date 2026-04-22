const success = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({ success: true, message, data });
};

const error = (res, statusCode, message) => {
  res.status(statusCode).json({ success: false, message });
};

module.exports = { success, error };