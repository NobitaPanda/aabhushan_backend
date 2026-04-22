const Notification = require('../models/Notification');
const { success, error } = require('../utils/apiResponse');

exports.getMine = async (req, res) => {
  try {
    const data = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    const popupItems = data.filter((item) => item.showAsPopup && !item.isRead);
    success(res, 200, 'Notifications fetched', { items: data, unreadCount, popupItems });
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const data = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true, todoStatus: 'done' },
      { new: true }
    );
    if (!data) return error(res, 404, 'Notification not found');
    success(res, 200, 'Notification marked as read', data);
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true, todoStatus: 'done' }
    );
    success(res, 200, 'All notifications marked as read');
  } catch (err) {
    error(res, 500, err.message);
  }
};
