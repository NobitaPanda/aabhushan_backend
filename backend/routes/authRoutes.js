const express = require('express');
const { validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const {
  registerValidator,
  loginValidator,
  emailValidator,
  verifyOtpValidator,
  resetPasswordValidator
} = require('../validators/authValidator');
const authMiddleware = require('../middleware/authMiddleware');
const { error } = require('../utils/apiResponse');

const router = express.Router();

const validate = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return error(res, 400, errs.array()[0].msg);
  next();
};

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.post('/login/send-otp', emailValidator, validate, authController.sendLoginOtp);
router.post('/login/verify-otp', verifyOtpValidator, validate, authController.verifyLoginOtp);
router.post('/forgot-password', emailValidator, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
