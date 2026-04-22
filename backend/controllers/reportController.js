const RawMaterial = require('../models/RawMaterial');
const ManufactoringOrder = require('../models/manufactoringOrder');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');
const Customer = require('../models/Customer');
const { success, error } = require('../utils/apiResponse');

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalStock, pendingJobs, totalSales, availableProducts] = await Promise.all([
      RawMaterial.aggregate([{ $group: { _id: null, totalWeight: { $sum: '$availableStock' } } }]),
      ManufactoringOrder.countDocuments({ status: { $in: ['Pending', 'In Progress'] } }),
      Sale.countDocuments(),
      Product.countDocuments({ stockStatus: 'Available' })
    ]);

    success(res, 200, 'Dashboard stats', {
      totalGoldStock: totalStock[0]?.totalWeight || 0,
      pendingManufactoringJobs: pendingJobs,
      totalSalesCount: totalSales,
      availableProductsCount: availableProducts
    });
  } catch (err) { error(res, 500, err.message); }
};

exports.getRoleDashboard = async (req, res) => {
  try {
    const role = req.user.role;
    let stats = {};

    switch (role) {
      case 'admin':
      case 'manager':
        stats = await getAdminStats();
        break;
      case 'sales':
        stats = await getSalesStats();
        break;
      case 'karigar':
        stats = await getKarigarStats(req.user.id);
        break;
      case 'manufactoring':
        stats = await getManufactoringStats();
        break;
      case 'inventory':
        stats = await getInventoryStats();
        break;
      case 'customer':
        stats = await getCustomerStats(req.user.id);
        break;
      default:
        return error(res, 403, 'No dashboard configured for this role');
    }

    success(res, 200, `${role} dashboard data`, stats);
  } catch (err) {
    error(res, 500, err.message);
  }
};

async function getAdminStats() {
  const [stock, pending, sales, users, customers, availableProducts] = await Promise.all([
    RawMaterial.aggregate([{ $group: { _id: null, total: { $sum: '$availableStock' } } }]),
    ManufactoringOrder.countDocuments({ status: { $in: ['Pending', 'In Progress'] } }),
    Sale.countDocuments(),
    User.countDocuments({ role: { $ne: 'customer' } }),
    Customer.countDocuments(),
    Product.countDocuments({ stockStatus: 'Available' })
  ]);

  return {
    totalGoldStock: stock[0]?.total || 0,
    pendingJobs: pending,
    totalSales: sales,
    totalStaffUsers: users,
    totalCustomers: customers,
    availableProductsCount: availableProducts
  };
}

async function getSalesStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalSales, todaySales, pendingPayments, availableProducts] = await Promise.all([
    Sale.countDocuments(),
    Sale.countDocuments({ createdAt: { $gte: todayStart } }),
    Sale.countDocuments({ paymentStatus: { $ne: 'Paid' } }),
    Product.countDocuments({ stockStatus: 'Available' })
  ]);

  return {
    totalSales,
    todaySales,
    pendingPayments,
    availableProductsCount: availableProducts
  };
}

async function getKarigarStats(userId) {
  const myJobs = await ManufactoringOrder.find({ assignedKarigar: userId });

  return {
    assignedJobs: myJobs.length,
    pendingJobs: myJobs.filter((job) => job.status === 'Pending').length,
    inProgressJobs: myJobs.filter((job) => job.status === 'In Progress').length,
    completedJobs: myJobs.filter((job) => job.status === 'Completed').length
  };
}

async function getManufactoringStats() {
  const [totalOrders, pendingOrders, inProgressOrders, completedOrders] = await Promise.all([
    ManufactoringOrder.countDocuments(),
    ManufactoringOrder.countDocuments({ status: 'Pending' }),
    ManufactoringOrder.countDocuments({ status: 'In Progress' }),
    ManufactoringOrder.countDocuments({ status: 'Completed' })
  ]);

  return { totalOrders, pendingOrders, inProgressOrders, completedOrders };
}

async function getInventoryStats() {
  const [stock, totalMaterials, availableProducts, reservedProducts, soldProducts] = await Promise.all([
    RawMaterial.aggregate([{ $group: { _id: null, total: { $sum: '$availableStock' } } }]),
    RawMaterial.countDocuments(),
    Product.countDocuments({ stockStatus: 'Available' }),
    Product.countDocuments({ stockStatus: 'Reserved' }),
    Product.countDocuments({ stockStatus: 'Sold' })
  ]);

  return {
    totalGoldStock: stock[0]?.total || 0,
    totalMaterials,
    availableProductsCount: availableProducts,
    reservedProductsCount: reservedProducts,
    soldProductsCount: soldProducts
  };
}

async function getCustomerStats(userId) {
  const user = await User.findById(userId).select('customerProfileId');
  if (!user?.customerProfileId) return { totalOrders: 0, totalSpent: 0, recentOrders: [] };

  const orders = await Sale.find({ customerId: user.customerProfileId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('invoiceNo totalAmount paymentStatus createdAt');

  const totals = await Sale.aggregate([
    { $match: { customerId: user.customerProfileId } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' }
      }
    }
  ]);

  return {
    totalOrders: totals[0]?.totalOrders || 0,
    totalSpent: totals[0]?.totalSpent || 0,
    recentOrders: orders
  };
}
