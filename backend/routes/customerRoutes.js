const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customerController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.use(auth);
router.get('/', role('admin','manager','sales'), ctrl.getAll);
router.post('/', role('admin','manager','sales'), ctrl.create);
router.put('/:id', role('admin','manager','sales'), ctrl.update);
router.delete('/:id', role('admin'), ctrl.delete);
module.exports = router;