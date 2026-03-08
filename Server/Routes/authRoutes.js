const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authController');
const { authenticateToken } = require('../Middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;