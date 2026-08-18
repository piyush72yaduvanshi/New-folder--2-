const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminLoginLimiter } = require('../../../src/middleware/rateLimiters');
const {
  loginValidation,
  refreshTokenValidation
} = require('../validations/authValidation');

// POST /login — strict rate limit (10/15min per IP) to prevent brute force.
router.post('/login', adminLoginLimiter, loginValidation, AuthController.login);
router.post('/refresh-token', refreshTokenValidation, AuthController.refreshToken);

// Protected routes (authentication required)
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/profile', authMiddleware, AuthController.getProfile);

module.exports = router;

