const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true },
  address: { type: String, trim: true },
  orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sale' }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
