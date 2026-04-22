const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true, trim: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: String,
    weight: Number,
    goldRate: Number,
    makingCharge: Number,
    price: Number
  }],
  totalWeight: { type: Number, required: true, min: 0 },
  goldRate: { type: Number, required: true, min: 0 },
  totalGoldAmount: { type: Number, required: true, min: 0 },
  totalMakingCharge: { type: Number, required: true, min: 0 },
  wastageAmount: { type: Number, min: 0, default: 0 },
  tax: { type: Number, min: 0, default: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Pending'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Cash', 'Online'], default: 'Cash' },
  paidAmount: { type: Number, min: 0, default: 0 },
  pendingAmount: { type: Number, min: 0, default: 0 },
  paymentGateway: {
    provider: { type: String, enum: ['razorpay'], default: 'razorpay' },
    orderId: { type: String, trim: true },
    paymentId: { type: String, trim: true },
    signature: { type: String, trim: true },
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
    amount: { type: Number, min: 0 },
    currency: { type: String, trim: true, default: 'INR' },
    receipt: { type: String, trim: true },
    paidAt: { type: Date }
  },
  saleDate: { type: Date, default: Date.now },
  remarks: String
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
