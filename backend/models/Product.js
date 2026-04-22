const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: { type: String, required: true, unique: true, trim: true },
  productName: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Ring', 'Necklace', 'Bangle', 'Chain', 'Earrings', 'Bracelet', 'Other'] 
  },
  purity: { type: String, required: true, enum: ['24K', '22K', '18K', 'Other'] },
  grossWeight: { type: Number, required: true, min: 0 },
  netWeight: { type: Number, required: true, min: 0 },
  stoneWeight: { type: Number, min: 0, default: 0 },
  wastage: { type: Number, min: 0, default: 0 },
  makingCharge: { type: Number, min: 0, default: 0 },
  goldRate: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  stockStatus: { type: String, enum: ['Available', 'Sold', 'Reserved'], default: 'Available' },
  image: { type: String, default: '' },
  manufacturingOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManufacturingOrder' },
  remarks: String
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);