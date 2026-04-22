const mongoose = require('mongoose');

const manufactoringOrderSchema = new mongoose.Schema({
  orderCode: { type: String, required: true, unique: true, trim: true },
  designName: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['Ring','Necklace','Bangle','Chain','Earrings','Bracelet','Other'] },
  rawMaterialId: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial', required: true },
  assignedKarigar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issueDate: { type: Date, default: Date.now },
  expectedDate: Date,
  status: { type: String, enum: ['Pending','In Progress','Completed','Delivered to Stock'], default: 'Pending' },
  grossWeight: { type: Number, min: 0 },
  netWeight: { type: Number, min: 0 },
  stoneWeight: { type: Number, min: 0, default: 0 },
  wastage: { type: Number, min: 0, default: 0 },
  makingCharge: { type: Number, min: 0, default: 0 },
  remarks: String
}, { timestamps: true });

module.exports = mongoose.model('ManufacturingOrder', manufactoringOrderSchema);
