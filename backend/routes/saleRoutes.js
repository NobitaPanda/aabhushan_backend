const express = require('express');
const router = express.Router();
const saleCtrl = require('../controllers/saleController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.use(auth);

router.get('/my-orders', role('customer'), saleCtrl.getMyOrders);
router.get('/', role('admin', 'manager', 'sales', 'inventory'), saleCtrl.getAll);
router.get('/:id', role('admin', 'manager', 'sales', 'inventory'), saleCtrl.getById);
router.post('/checkout', role('customer'), saleCtrl.create);
router.post('/', role('admin', 'manager', 'sales'), saleCtrl.create);
router.post('/:id/razorpay-order', role('customer', 'admin', 'manager', 'sales'), saleCtrl.createRazorpayOrder);
router.post('/:id/verify-payment', role('customer', 'admin', 'manager', 'sales'), saleCtrl.verifyRazorpayPayment);
router.put('/:id/payment', role('admin', 'manager', 'sales'), saleCtrl.updatePayment);
router.delete('/:id', role('admin'), saleCtrl.delete);

module.exports = router;
