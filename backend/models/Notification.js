const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['auth', 'password_reset', 'order_booked', 'order_arrived', 'system', 'activity'],
    default: 'system'
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  isRead: { type: Boolean, default: false },
  showAsPopup: { type: Boolean, default: false },
  todoStatus: { type: String, enum: ['pending', 'done'], default: 'pending' },
  metadata: {
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    invoiceNo: { type: String, trim: true },
    entityId: { type: String, trim: true },
    entityType: { type: String, trim: true },
    action: { type: String, trim: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
