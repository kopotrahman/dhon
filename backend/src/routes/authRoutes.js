const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  register, 
  login, 
  logout,
  oauthLogin,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshAccessToken,
  getProfile, 
  updateProfile,
  deactivateAccount,
  completeOAuthProfile
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['owner', 'driver', 'admin']).withMessage('Invalid role'),
  body('phone').notEmpty().withMessage('Phone is required')
];

const passwordValidation = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', login);
router.post('/oauth', oauthLogin);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', body('email').isEmail(), forgotPassword);
router.post('/reset-password/:token', passwordValidation, resetPassword);
router.post('/refresh-token', refreshAccessToken);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, upload.single('profilePhoto'), updateProfile);
router.post('/logout', authenticate, logout);
router.post('/resend-verification', authenticate, resendVerificationEmail);
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], changePassword);
router.post('/deactivate', authenticate, deactivateAccount);
router.post('/complete-oauth-profile', authenticate, [
  body('phone').notEmpty().withMessage('Phone is required')
], completeOAuthProfile);

module.exports = router;
