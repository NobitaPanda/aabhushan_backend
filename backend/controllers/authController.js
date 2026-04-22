const User = require('../models/User');
const Customer = require('../models/Customer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { success, error } = require('../utils/apiResponse');
const { sendEmail, getEmailServiceStatus } = require('../utils/emailService');
const { createNotificationsForUsers } = require('../services/notificationService');

const buildAuthPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  customerProfileId: user.customerProfileId || null,
  lastLoginAt: user.lastLoginAt || null
});

const getRedirectUrl = (role) => {
  const dashboardMap = {
    customer: '/',
    admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    sales: '/sales/dashboard',
    karigar: '/karigar/dashboard',
    manufactoring: '/manufactoring/dashboard',
    inventory: '/inventory/dashboard'
  };

  return dashboardMap[role] || '/';
};

const createAuthToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const hashValue = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const isDevelopmentLike = () => process.env.NODE_ENV !== 'production';

const buildMailFailurePayload = ({ mailResult, otp, resetLink }) => ({
  delivery: mailResult,
  emailService: getEmailServiceStatus(),
  preview: isDevelopmentLike()
    ? {
        otp: otp || '',
        resetLink: resetLink || ''
      }
    : null
});

const getResetLink = (token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  if (normalizedBaseUrl.includes('#')) {
    return `${normalizedBaseUrl}/reset-password?token=${token}`;
  }
  return `${normalizedBaseUrl}/#/reset-password?token=${token}`;
};

exports.register = async (req, res) => {
  try {
    const { name, phone, password, address } = req.body;
    const email = normalizeEmail(req.body.email);
    const exists = await User.findOne({ email });
    if (exists) return error(res, 400, 'Email already registered');

    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { phone }]
    });
    if (existingCustomer) return error(res, 400, 'Customer already registered with this email or phone');

    const customer = await Customer.create({ name, email, phone, address });
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'customer',
      customerProfileId: customer._id
    });

    customer.userId = user._id;
    await customer.save();

    const token = createAuthToken(user);

    await createNotificationsForUsers({
      userIds: [user._id],
      type: 'auth',
      title: 'Welcome to Aabhusan',
      message: 'Your customer account has been created successfully.'
    });

    success(res, 201, 'Customer registered successfully', {
      token,
      user: buildAuthPayload(user),
      redirectUrl: getRedirectUrl(user.role)
    });
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user || user.status !== 'active') return error(res, 401, 'Invalid credentials or inactive account');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return error(res, 401, 'Invalid credentials');

    user.lastLoginAt = new Date();
    await user.save();

    const token = createAuthToken(user);

    success(res, 200, 'Login successful', {
      token,
      user: buildAuthPayload(user),
      redirectUrl: getRedirectUrl(user.role)
    });
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.sendLoginOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user || user.status !== 'active') return error(res, 404, 'User not found or inactive');

    const otp = generateOtp();
    user.loginOtpHash = hashValue(otp);
    user.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const mailResult = await sendEmail({
      to: user.email,
      subject: 'Aabhushan login verification code',
      text: `Hello ${user.name}, your Aabhushan login OTP is ${otp}. It will expire in 10 minutes. If you did not request this code, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2933; max-width: 560px; margin: 0 auto; padding: 24px;">
          <p style="font-size: 14px; letter-spacing: 1.5px; text-transform: uppercase; color: #9a7b2f; margin-bottom: 8px;">Aabhushan Secure Access</p>
          <h2 style="margin: 0 0 16px;">Your login verification code</h2>
          <p>Hello ${user.name},</p>
          <p>Use the code below to complete your sign in. This code will expire in <strong>10 minutes</strong>.</p>
          <div style="margin: 24px 0; padding: 18px; border-radius: 16px; background: #f8f1de; border: 1px solid #e5d2a0; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: 700;">
            ${otp}
          </div>
          <p style="margin-bottom: 0;">If you did not request this code, you can safely ignore this email.</p>
        </div>`
    });

    if (!mailResult.delivered) {
      return success(
        res,
        isDevelopmentLike() ? 202 : 503,
        isDevelopmentLike()
          ? 'Email service is not configured, so a development OTP preview has been returned.'
          : 'Email service is unavailable right now. Please try again later.',
        buildMailFailurePayload({ mailResult, otp })
      );
    }

    await createNotificationsForUsers({
      userIds: [user._id],
      type: 'auth',
      title: 'Login OTP sent',
      message: 'A login OTP has been sent to your email address.'
    });

    success(res, 200, 'Login OTP sent successfully', {
      delivery: mailResult
    });
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email }).select('+loginOtpHash +loginOtpExpiresAt');
    if (!user || user.status !== 'active') return error(res, 404, 'User not found or inactive');

    const isOtpExpired = !user.loginOtpExpiresAt || user.loginOtpExpiresAt.getTime() < Date.now();
    const isOtpValid = user.loginOtpHash && user.loginOtpHash === hashValue(otp);

    if (!isOtpValid || isOtpExpired) return error(res, 401, 'Invalid or expired OTP');

    user.loginOtpHash = undefined;
    user.loginOtpExpiresAt = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const token = createAuthToken(user);
    success(res, 200, 'OTP verified successfully', {
      token,
      user: buildAuthPayload(user),
      redirectUrl: getRedirectUrl(user.role)
    });
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user || user.status !== 'active') return error(res, 404, 'User not found or inactive');

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashValue(rawToken);
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const resetLink = getResetLink(rawToken);
    const mailResult = await sendEmail({
      to: user.email,
      subject: 'Reset your Aabhushan password',
      text: `Hello ${user.name}, reset your password using this link: ${resetLink}. This link expires in 30 minutes. If you did not request a password reset, ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2933; max-width: 560px; margin: 0 auto; padding: 24px;">
          <p style="font-size: 14px; letter-spacing: 1.5px; text-transform: uppercase; color: #9a7b2f; margin-bottom: 8px;">Aabhushan Account Recovery</p>
          <h2 style="margin: 0 0 16px;">Reset your password</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your password. Use the button below to continue. This link will expire in <strong>30 minutes</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 14px 22px; background: #9a7b2f; color: #ffffff; border-radius: 999px; text-decoration: none; font-weight: 700;">
              Reset Password
            </a>
          </p>
          <p style="word-break: break-all; color: #52606d;">${resetLink}</p>
          <p style="margin-bottom: 0;">If you did not request this reset, you can safely ignore this email.</p>
        </div>`
    });

    if (!mailResult.delivered) {
      return success(
        res,
        isDevelopmentLike() ? 202 : 503,
        isDevelopmentLike()
          ? 'Email service is not configured, so a development reset link preview has been returned.'
          : 'Email service is unavailable right now. Please try again later.',
        buildMailFailurePayload({ mailResult, resetLink })
      );
    }

    await createNotificationsForUsers({
      userIds: [user._id],
      type: 'password_reset',
      title: 'Password reset requested',
      message: 'A password reset link has been sent to your email address.'
    });

    success(res, 200, 'Password reset link sent successfully', {
      delivery: mailResult
    });
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      passwordResetTokenHash: hashValue(token),
      passwordResetExpiresAt: { $gt: new Date() }
    }).select('+passwordResetTokenHash +passwordResetExpiresAt');

    if (!user) return error(res, 400, 'Invalid or expired reset token');

    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    await createNotificationsForUsers({
      userIds: [user._id],
      type: 'password_reset',
      title: 'Password changed',
      message: 'Your password has been reset successfully.'
    });

    success(res, 200, 'Password reset successfully');
  } catch (err) {
    error(res, 500, err.message);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -loginOtpHash -loginOtpExpiresAt -passwordResetTokenHash -passwordResetExpiresAt')
      .populate('customerProfileId');

    if (!user) return error(res, 404, 'User not found');
    success(res, 200, 'Profile fetched', user);
  } catch (err) {
    error(res, 500, err.message);
  }
};
