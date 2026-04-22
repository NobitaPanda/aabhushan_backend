const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { success, error } = require('../utils/apiResponse');
const { createActivityNotification, createNotificationsForUsers } = require('../services/notificationService');

exports.getAll = async (req, res) => {
  try { const data = await User.find().select('-password -loginOtpHash -loginOtpExpiresAt -passwordResetTokenHash -passwordResetExpiresAt').sort({ createdAt: -1 }); success(res, 200, 'Users fetched', data); }
  catch (err) { error(res, 500, err.message); }
};
exports.create = async (req, res) => {
  try {
    const user = await User.create(req.body);
    const data = await User.findById(user._id).select('-password -loginOtpHash -loginOtpExpiresAt -passwordResetTokenHash -passwordResetExpiresAt');

    if (user.role !== 'customer') {
      await createActivityNotification({
        userId: req.user.id,
        title: 'New staff added',
        message: `Staff "${user.name}" added successfully with role "${user.role}".`,
        metadata: {
          entityId: String(user._id),
          entityType: 'user',
          action: 'staff_created'
        }
      });

      await createNotificationsForUsers({
        userIds: [user._id],
        type: 'system',
        title: 'Welcome onboard',
        message: `Your ${user.role} account has been created by admin.`,
        metadata: {
          entityId: String(user._id),
          entityType: 'user',
          action: 'account_created'
        }
      });
    }

    success(res, 201, 'User created', data);
  }
  catch (err) { error(res, 500, err.message); }
};
exports.update = async (req, res) => {
  try {
    if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
    const data = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password -loginOtpHash -loginOtpExpiresAt -passwordResetTokenHash -passwordResetExpiresAt');
    if (!data) return error(res, 404, 'User not found'); success(res, 200, 'User updated', data);
  } catch (err) { error(res, 500, err.message); }
};
exports.delete = async (req, res) => {
  try { const data = await User.findByIdAndDelete(req.params.id);
    if (!data) return error(res, 404, 'User not found'); success(res, 200, 'User deleted'); }
  catch (err) { error(res, 500, err.message); }
};
