const express = require('express');
const router = express.Router();
const manufactoringCtrl = require('../controllers/manufactoringController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Manufactoring API working!' });
});

router.use(auth);

router.get('/', role('admin', 'manager', 'manufactoring', 'karigar'), manufactoringCtrl.getAll);
router.post('/', role('admin', 'manager', 'manufactoring'), manufactoringCtrl.create);
router.put('/:id/status', role('admin', 'manager', 'manufactoring', 'karigar'), manufactoringCtrl.updateStatus);
router.delete('/:id', role('admin', 'manufactoring'), manufactoringCtrl.delete);

module.exports = router;
