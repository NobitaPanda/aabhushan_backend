const crypto = require('crypto');
const Razorpay = require('razorpay');

let razorpayInstance;

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }

  return razorpayInstance;
};

exports.getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID;

exports.createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const client = getRazorpayClient();
  return client.orders.create({
    amount,
    currency,
    receipt,
    notes
  });
};

exports.fetchPayment = async (paymentId) => {
  const client = getRazorpayClient();
  return client.payments.fetch(paymentId);
};

exports.verifySignature = ({ orderId, paymentId, signature }) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};
