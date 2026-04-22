const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  materialName: { type: String, required: true, trim: true },
  purity: { type: String, required: true, enum: ['24K','22K','18K','Other'] },
  weight: { type: Number, required: true, min: 0 },
  purchaseRate: { type: Number, required: true, min: 0 },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  availableStock: { type: Number, required: true, min: 0, default: 0 },
  remarks: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);