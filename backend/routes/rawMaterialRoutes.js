const express = require('express');
const router = express.Router();
const rawCtrl = require('../controllers/rawMaterialController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.use(auth);

router.get('/', role('admin', 'manager', 'inventory'), rawCtrl.getAll);
router.get('/:id', role('admin', 'manager', 'sales', 'inventory'), rawCtrl.getById);
router.post('/', role('admin', 'manager', 'inventory'), rawCtrl.create);
router.put('/:id', role('admin', 'manager', 'inventory'), rawCtrl.update);
router.delete('/:id', role('admin'), rawCtrl.delete);

module.exports = router;
