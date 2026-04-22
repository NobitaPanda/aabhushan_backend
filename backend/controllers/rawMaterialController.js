const RawMaterial = require('../models/RawMaterial');
const { success, error } = require('../utils/apiResponse');
const { createActivityNotification } = require('../services/notificationService');

exports.getAll = async (req, res) => {
  try {
    const data = await RawMaterial.find().populate('supplierId', 'supplierName').sort({ createdAt: -1 });
    success(res, 200, 'Raw materials fetched', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.getById = async (req, res) => {
  try {
    const data = await RawMaterial.findById(req.params.id).populate('supplierId');
    if (!data) return error(res, 404, 'Material not found');
    success(res, 200, 'Material fetched', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.create = async (req, res) => {
  try {
    const { materialName, purity, weight, purchaseRate, supplierId, remarks } = req.body;
    const data = await RawMaterial.create({
      materialName, purity, weight, purchaseRate, supplierId,
      availableStock: weight, remarks
    });
    await createActivityNotification({
      userId: req.user.id,
      title: 'Material added',
      message: `Raw material "${data.materialName}" added successfully.`,
      metadata: {
        entityId: String(data._id),
        entityType: 'raw_material',
        action: 'created'
      }
    });
    success(res, 201, 'Material added successfully', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.update = async (req, res) => {
  try {
    const data = await RawMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return error(res, 404, 'Material not found');
    success(res, 200, 'Material updated', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.delete = async (req, res) => {
  try {
    const data = await RawMaterial.findByIdAndDelete(req.params.id);
    if (!data) return error(res, 404, 'Material not found');
    await createActivityNotification({
      userId: req.user.id,
      title: 'Material deleted',
      message: `Raw material "${data.materialName}" deleted successfully.`,
      metadata: {
        entityId: String(data._id),
        entityType: 'raw_material',
        action: 'deleted'
      }
    });
    success(res, 200, 'Material deleted');
  } catch (err) { error(res, 500, err.message); }
};
