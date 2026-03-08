// Server/Routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../Controllers/reportController');
const { authenticateToken } = require('../Middleware/auth');

// Create report
router.post('/', authenticateToken, (req, res, next) => {
    reportController.createReport(req, res, next);
});

// Get all reports (admin/moderator only)
router.get('/', authenticateToken, (req, res, next) => {
    reportController.getAllReports(req, res, next);
});

// Get user's own reports
router.get('/user', authenticateToken, (req, res, next) => {
    reportController.getUserReports(req, res, next);
});

// Resolve report (admin/moderator only)
router.put('/:id/resolve', authenticateToken, (req, res, next) => {
    reportController.resolveReport(req, res, next);
});

// Delete report (admin can delete any, user can delete own)
router.delete('/:id', authenticateToken, (req, res, next) => {
    reportController.deleteReport(req, res, next);
});

module.exports = router;