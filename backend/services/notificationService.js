const Notification = require('../models/Notification');
const User = require('../models/User');

const INTERNAL_ROLES = ['admin', 'manager', 'sales', 'karigar', 'manufactoring', 'inventory'];

const uniqueIds = (values = []) => [...new Set(values.filter(Boolean).map(String))];

exports.INTERNAL_ROLES = INTERNAL_ROLES;

exports.createNotificationsForUsers = async ({ userIds = [], type, title, message, metadata = {} }) => {
  const resolvedUserIds = uniqueIds(userIds);
  if (!resolvedUserIds.length) return [];

  return Notification.insertMany(
    resolvedUserIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      metadata
    }))
  );
};

exports.createActivityNotification = async ({
  userId,
  title,
  message,
  metadata = {},
  showAsPopup = true
}) => {
  if (!userId) return null;

  return Notification.create({
    userId,
    type: 'activity',
    title,
    message,
    showAsPopup,
    todoStatus: 'pending',
    metadata
  });
};

exports.notifyRoles = async ({ roles = INTERNAL_ROLES, type, title, message, metadata = {} }) => {
  const users = await User.find({
    role: { $in: roles },
    status: 'active'
  }).select('_id');

  return exports.createNotificationsForUsers({
    userIds: users.map((user) => user._id),
    type,
    title,
    message,
    metadata
  });
};
