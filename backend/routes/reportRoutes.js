const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const auth = require('../middleware/authMiddleware');
// const role = require('../middleware/roleMiddleware'); // ❌ Ab zaroorat nahi (controller me handle hoga)

// ✅ Sirf authentication check karo, role check controller me hoga
router.use(auth);

// ✅ Function name change: getDashboardStats → getRoleDashboard
router.get('/dashboard', ctrl.getRoleDashboard);

module.exports = router;