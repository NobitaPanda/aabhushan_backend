const Customer = require('../models/Customer');
const { success, error } = require('../utils/apiResponse');

exports.getAll = async (req, res) => {
  try { const data = await Customer.find().sort({ createdAt: -1 }); success(res, 200, 'Customers fetched', data); }
  catch (err) { error(res, 500, err.message); }
};
exports.create = async (req, res) => {
  try { const data = await Customer.create(req.body); success(res, 201, 'Customer added', data); }
  catch (err) { error(res, 500, err.message); }
};
exports.update = async (req, res) => {
  try { const data = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return error(res, 404, 'Customer not found'); success(res, 200, 'Customer updated', data); }
  catch (err) { error(res, 500, err.message); }
};
exports.delete = async (req, res) => {
  try { const data = await Customer.findByIdAndDelete(req.params.id);
    if (!data) return error(res, 404, 'Customer not found'); success(res, 200, 'Customer deleted'); }
  catch (err) { error(res, 500, err.message); }
};