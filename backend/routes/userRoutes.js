const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.use(auth);
router.get('/', role('admin', 'manager', 'sales', 'manufactoring', 'inventory'), ctrl.getAll);
router.post('/', role('admin'), ctrl.create);
router.put('/:id', role('admin'), ctrl.update);
router.delete('/:id', role('admin'), ctrl.delete);
module.exports = router;
