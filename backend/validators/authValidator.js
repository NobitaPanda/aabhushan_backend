const { body } = require('express-validator');

exports.registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars'),
  body('address').optional().isString().withMessage('Address must be text')
];

exports.loginValidator = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars')
];

exports.emailValidator = [
  body('email').isEmail().withMessage('Valid email required')
];

exports.verifyOtpValidator = [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp')
    .trim()
    .isLength({ min: 4, max: 8 })
    .withMessage('Valid OTP required')
];

exports.resetPasswordValidator = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars')
];
