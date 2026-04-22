const Product = require('../models/Product');
const { success, error } = require('../utils/apiResponse');
const { createActivityNotification } = require('../services/notificationService');

const buildProductQuery = (req, publicOnly = false) => {
  const { category, stockStatus, purity } = req.query;
  const query = {};

  if (category) query.category = category;
  if (purity) query.purity = purity;

  if (publicOnly) {
    query.stockStatus = 'Available';
  } else if (stockStatus) {
    query.stockStatus = stockStatus;
  }

  return query;
};

exports.getAll = async (req, res) => {
  try {
    const publicOnly = req.user?.role === 'customer' || req.path.includes('/public');
    const query = buildProductQuery(req, publicOnly);
    const data = await Product.find(query).sort({ createdAt: -1 });
    success(res, 200, 'Products fetched', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.getPublicById = async (req, res) => {
  try {
    const data = await Product.findOne({ _id: req.params.id, stockStatus: 'Available' });
    if (!data) return error(res, 404, 'Product not found');
    success(res, 200, 'Product fetched', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.getById = async (req, res) => {
  try {
    const data = await Product.findById(req.params.id);
    if (!data) return error(res, 404, 'Product not found');
    success(res, 200, 'Product fetched', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { stockStatus: 'Available' });
    success(res, 200, 'Product categories fetched', categories.sort());
  } catch (err) { error(res, 500, err.message); }
};

exports.create = async (req, res) => {
  try {
    const data = await Product.create(req.body);
    await createActivityNotification({
      userId: req.user.id,
      title: 'Item added',
      message: `Item "${data.productName}" added successfully.`,
      metadata: {
        entityId: String(data._id),
        entityType: 'product',
        action: 'created'
      }
    });
    success(res, 201, 'Product added successfully', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.update = async (req, res) => {
  try {
    const data = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return error(res, 404, 'Product not found');
    success(res, 200, 'Product updated', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.delete = async (req, res) => {
  try {
    const data = await Product.findByIdAndDelete(req.params.id);
    if (!data) return error(res, 404, 'Product not found');
    await createActivityNotification({
      userId: req.user.id,
      title: 'Item deleted',
      message: `Item "${data.productName}" deleted successfully.`,
      metadata: {
        entityId: String(data._id),
        entityType: 'product',
        action: 'deleted'
      }
    });
    success(res, 200, 'Product deleted');
  } catch (err) { error(res, 500, err.message); }
};
