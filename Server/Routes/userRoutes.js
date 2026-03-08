const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController');
const { authenticateToken } = require('../Middleware/auth');

// Public route (cached)
router.get('/:id', userController.getUserProfile);

// Protected routes
router.get('/profile/me', authenticateToken, userController.getUserProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.delete('/profile', authenticateToken, userController.deleteProfile); // NEW

module.exports = router;