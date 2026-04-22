const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');
const { sendEmail } = require('../utils/emailService');
const {
  INTERNAL_ROLES,
  createNotificationsForUsers,
  notifyRoles
} = require('../services/notificationService');
const {
  createOrder,
  fetchPayment,
  verifySignature,
  getRazorpayKeyId
} = require('../utils/razorpayService');

const generateInvoiceNo = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Sale.countDocuments({ invoiceNo: new RegExp(`^INV-${date}`) });
  return `INV-${date}-${String(count + 1).padStart(4, '0')}`;
};

exports.getAll = async (req, res) => {
  try {
    const data = await Sale.find()
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 });
    success(res, 200, 'Sales fetched', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.getMyOrders = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('customerProfileId');
    if (!user?.customerProfileId) return error(res, 404, 'Customer profile not found');

    const data = await Sale.find({ customerId: user.customerProfileId })
      .populate('customerId', 'name phone email')
      .populate('products.productId')
      .sort({ createdAt: -1 });

    success(res, 200, 'Customer orders fetched', data);
  } catch (err) { error(res, 500, err.message); }
};

exports.getById = async (req, res) => {
  try {
    const data = await Sale.findById(req.params.id)
      .populate('customerId', 'name phone email')
      .populate('products.productId');
    if (!data) return error(res, 404, 'Sale not found');
    success(res, 200, 'Sale details fetched', data);
  } catch (err) { error(res, 500, err.message); }
};

const prepareSaleItems = async (products, goldRateOverride) => {
  if (!Array.isArray(products) || !products.length) {
    throw new Error('At least one product is required');
  }

  const preparedItems = [];
  let totalWeight = 0;
  let totalMakingCharge = 0;
  let totalGoldAmount = 0;

  for (const item of products) {
    const product = await Product.findOne({ _id: item.productId, stockStatus: 'Available' });
    if (!product) throw new Error('One or more selected products are unavailable');

    const appliedGoldRate = goldRateOverride || product.goldRate;
    const productGoldAmount = product.netWeight * appliedGoldRate;
    const productPrice = productGoldAmount + product.makingCharge;

    preparedItems.push({
      productId: product._id,
      productName: product.productName,
      weight: product.netWeight,
      goldRate: appliedGoldRate,
      makingCharge: product.makingCharge,
      price: productPrice
    });

    totalWeight += product.netWeight;
    totalMakingCharge += product.makingCharge;
    totalGoldAmount += productGoldAmount;
  }

  return { preparedItems, totalWeight, totalMakingCharge, totalGoldAmount };
};

const notifyOrderStakeholders = async ({ customer, sale }) => {
  const customerUser = customer.userId ? await User.findById(customer.userId).select('_id email name notificationPreferences') : null;
  const internalUsers = await User.find({
    role: { $in: INTERNAL_ROLES },
    status: 'active'
  }).select('_id email name role notificationPreferences');

  const customerMessage = `Your order ${sale.invoiceNo} is booked successfully.`;
  const staffMessage = `A new order ${sale.invoiceNo} has arrived for customer ${customer.name}.`;

  if (customerUser?._id) {
    await createNotificationsForUsers({
      userIds: [customerUser._id],
      type: 'order_booked',
      title: 'Order booked',
      message: customerMessage,
      metadata: {
        saleId: sale._id,
        customerId: customer._id,
        invoiceNo: sale.invoiceNo
      }
    });
  }

  await notifyRoles({
    roles: INTERNAL_ROLES,
    type: 'order_arrived',
    title: 'New order arrived',
    message: staffMessage,
    metadata: {
      saleId: sale._id,
      customerId: customer._id,
      invoiceNo: sale.invoiceNo
    }
  });

  const emailJobs = [];

  if (customer.email && (!customerUser || customerUser.notificationPreferences?.emailOrders !== false)) {
    emailJobs.push(sendEmail({
      to: customer.email,
      subject: `Order booked: ${sale.invoiceNo}`,
      text: `Hello ${customer.name}, your order ${sale.invoiceNo} is booked successfully. Total amount: Rs. ${sale.totalAmount}.`,
      html: `<p>Hello ${customer.name},</p><p>Your order <strong>${sale.invoiceNo}</strong> is booked successfully.</p><p>Total amount: <strong>Rs. ${sale.totalAmount}</strong></p>`
    }));
  }

  for (const user of internalUsers) {
    if (!user.email || user.notificationPreferences?.emailOrders === false) continue;
    emailJobs.push(sendEmail({
      to: user.email,
      subject: `New order arrived: ${sale.invoiceNo}`,
      text: `Hello ${user.name}, a new order ${sale.invoiceNo} has arrived for customer ${customer.name}.`,
      html: `<p>Hello ${user.name},</p><p>A new order <strong>${sale.invoiceNo}</strong> has arrived for customer <strong>${customer.name}</strong>.</p>`
    }));
  }

  await Promise.allSettled(emailJobs);
};

exports.create = async (req, res) => {
  try {
    const { customerId, products, goldRate, tax = 0, paymentStatus, paidAmount = 0, remarks, paymentMethod } = req.body;
    const isCustomerCheckout = req.user.role === 'customer';

    let resolvedCustomerId = customerId;
    if (isCustomerCheckout) {
      const user = await User.findById(req.user.id).select('customerProfileId');
      if (!user?.customerProfileId) return error(res, 403, 'Customer account is not linked to a buyer profile');
      resolvedCustomerId = user.customerProfileId;
    }

    if (!resolvedCustomerId) return error(res, 400, 'Customer is required');

    const customer = await Customer.findById(resolvedCustomerId);
    if (!customer) return error(res, 404, 'Customer not found');

    const { preparedItems, totalWeight, totalMakingCharge, totalGoldAmount } = await prepareSaleItems(products, goldRate);
    const effectiveGoldRate = preparedItems[0].goldRate;
    const wastageAmount = totalGoldAmount * 0.02;
    const totalAmount = totalGoldAmount + totalMakingCharge + wastageAmount + tax;
    const normalizedPaymentStatus = isCustomerCheckout ? 'Pending' : (paymentStatus || 'Pending');
    const normalizedPaidAmount = isCustomerCheckout ? 0 : paidAmount;
    const pending = normalizedPaymentStatus === 'Paid' ? 0 : (totalAmount - normalizedPaidAmount);
    const normalizedPaymentMethod = paymentMethod === 'Online' ? 'Online' : 'Cash';

    const sale = await Sale.create({
      invoiceNo: await generateInvoiceNo(),
      customerId: resolvedCustomerId,
      products: preparedItems,
      totalWeight,
      goldRate: effectiveGoldRate,
      totalGoldAmount,
      totalMakingCharge,
      wastageAmount,
      tax,
      totalAmount,
      paymentStatus: normalizedPaymentStatus,
      paymentMethod: normalizedPaymentMethod,
      paidAmount: normalizedPaidAmount,
      pendingAmount: pending,
      remarks
    });

    for (const item of preparedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        stockStatus: isCustomerCheckout ? 'Reserved' : 'Sold'
      });
    }

    await Customer.findByIdAndUpdate(resolvedCustomerId, {
      $addToSet: { orderHistory: sale._id }
    });

    await notifyOrderStakeholders({ customer, sale });

    const populatedSale = await Sale.findById(sale._id)
      .populate('customerId', 'name phone')
      .populate('products.productId');

    success(
      res,
      201,
      isCustomerCheckout ? 'Order placed successfully' : 'Sale created successfully',
      populatedSale
    );
  } catch (err) { error(res, 500, err.message); }
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('customerId', 'name email phone');
    if (!sale) return error(res, 404, 'Sale not found');

    if (req.user.role === 'customer') {
      const user = await User.findById(req.user.id).select('customerProfileId');
      if (!user?.customerProfileId || String(user.customerProfileId) !== String(sale.customerId?._id)) {
        return error(res, 403, 'You are not allowed to create payment for this order');
      }
    }

    if (sale.paymentStatus === 'Paid') return error(res, 400, 'This order is already paid');

    const amountInPaise = Math.round(sale.totalAmount * 100);
    const razorpayOrder = await createOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: sale.invoiceNo,
      notes: {
        saleId: String(sale._id),
        invoiceNo: sale.invoiceNo,
        customerName: sale.customerId?.name || ''
      }
    });

    sale.paymentMethod = 'Online';
    sale.paymentGateway = {
      provider: 'razorpay',
      orderId: razorpayOrder.id,
      status: 'created',
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt
    };
    await sale.save();

    success(res, 200, 'Razorpay order created successfully', {
      saleId: sale._id,
      invoiceNo: sale.invoiceNo,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: getRazorpayKeyId(),
      customer: sale.customerId
    });
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return error(res, 400, 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required');
    }

    const sale = await Sale.findById(req.params.id).populate('customerId', 'name email phone');
    if (!sale) return error(res, 404, 'Sale not found');

    if (req.user.role === 'customer') {
      const user = await User.findById(req.user.id).select('customerProfileId');
      if (!user?.customerProfileId || String(user.customerProfileId) !== String(sale.customerId?._id)) {
        return error(res, 403, 'You are not allowed to verify payment for this order');
      }
    }

    if (!sale.paymentGateway?.orderId || sale.paymentGateway.orderId !== razorpay_order_id) {
      return error(res, 400, 'Razorpay order does not match this sale');
    }

    const isValidSignature = verifySignature({
      orderId: sale.paymentGateway.orderId,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValidSignature) {
      sale.paymentGateway.status = 'failed';
      await sale.save();
      return error(res, 400, 'Invalid payment signature');
    }

    const payment = await fetchPayment(razorpay_payment_id);
    if (!payment || payment.order_id !== sale.paymentGateway.orderId) {
      return error(res, 400, 'Payment does not belong to this order');
    }

    sale.paymentStatus = 'Paid';
    sale.paymentMethod = 'Online';
    sale.paidAmount = sale.totalAmount;
    sale.pendingAmount = 0;
    sale.paymentGateway.paymentId = razorpay_payment_id;
    sale.paymentGateway.signature = razorpay_signature;
    sale.paymentGateway.status = 'paid';
    sale.paymentGateway.paidAt = new Date();
    await sale.save();

    success(res, 200, 'Payment verified successfully', {
      saleId: sale._id,
      invoiceNo: sale.invoiceNo,
      paymentStatus: sale.paymentStatus,
      paymentMethod: sale.paymentMethod,
      razorpayOrderId: sale.paymentGateway.orderId,
      razorpayPaymentId: sale.paymentGateway.paymentId
    });
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { paymentStatus, paidAmount } = req.body;
    const sale = await Sale.findById(req.params.id);
    if (!sale) return error(res, 404, 'Sale not found');

    sale.paymentStatus = paymentStatus || sale.paymentStatus;
    sale.paidAmount = paidAmount !== undefined ? paidAmount : sale.paidAmount;
    sale.pendingAmount = sale.totalAmount - sale.paidAmount;

    await sale.save();
    success(res, 200, 'Payment updated', sale);
  } catch (err) { error(res, 500, err.message); }
};

exports.delete = async (req, res) => {
  try {
    const data = await Sale.findByIdAndDelete(req.params.id);
    if (!data) return error(res, 404, 'Sale not found');
    success(res, 200, 'Sale deleted');
  } catch (err) { error(res, 500, err.message); }
};
