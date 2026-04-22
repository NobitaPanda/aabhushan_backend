const ManufactoringOrder = require('../models/manufactoringOrder');
const { success, error } = require('../utils/apiResponse');

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const data = await ManufactoringOrder.find(query)
      .populate('rawMaterialId', 'materialName purity')
      .populate('assignedKarigar', 'name')
      .sort({ createdAt: -1 });
    success(res, 200, 'Manufactoring orders fetched', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.create = async (req, res) => {
  try {
    const { designName, category, rawMaterialId, assignedKarigar, expectedDate, remarks } = req.body;
    const orderCode = `MFG-${Date.now()}`;
    const data = await ManufactoringOrder.create({
      orderCode, designName, category, rawMaterialId, assignedKarigar, expectedDate, remarks
    });
    success(res, 201, 'Manufactoring order created', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, grossWeight, netWeight, stoneWeight, wastage, makingCharge } = req.body;
    const updateData = { status };
    if (grossWeight !== undefined) updateData.grossWeight = grossWeight;
    if (netWeight !== undefined) updateData.netWeight = netWeight;
    if (stoneWeight !== undefined) updateData.stoneWeight = stoneWeight;
    if (wastage !== undefined) updateData.wastage = wastage;
    if (makingCharge !== undefined) updateData.makingCharge = makingCharge;
    
    const data = await ManufactoringOrder.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!data) return error(res, 404, 'Order not found');
    success(res, 200, 'Order status updated', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.delete = async (req, res) => {
  try {
    const data = await ManufactoringOrder.findByIdAndDelete(req.params.id);
    if (!data) return error(res, 404, 'Order not found');
    success(res, 200, 'Order deleted');
  } catch (err) { error(res, 500, err.message); }
};
