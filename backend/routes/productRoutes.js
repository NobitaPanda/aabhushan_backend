const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/productController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.get('/public/categories', productCtrl.getCategories);
router.get('/public', productCtrl.getAll);
router.get('/public/:id', productCtrl.getPublicById);

router.use(auth);

router.get('/', role('admin', 'manager', 'sales', 'inventory'), productCtrl.getAll);
router.get('/:id', role('admin', 'manager', 'sales', 'inventory'), productCtrl.getById);
router.post('/', role('admin', 'manager', 'inventory', 'manufactoring'), productCtrl.create);
router.put('/:id', role('admin', 'manager', 'inventory', 'manufactoring'), productCtrl.update);
router.delete('/:id', role('admin'), productCtrl.delete);

module.exports = router;
