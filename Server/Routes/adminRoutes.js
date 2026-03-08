
const express = require('express');
const router = express.Router();
const { authenticateToken, checkAdmin } = require('../Middleware/auth');
const pool = require('../db');
const fs = require('fs');
const path = require('path');

// ... existing admin routes ...

// Admin delete any naat
router.delete('/naats/:id', authenticateToken, checkAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Get naat details
        const naatResult = await pool.query(
            'SELECT audio_filename FROM naats WHERE naat_id = $1',
            [id]
        );
        
        if (naatResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Naat not found'
            });
        }
        
        const audioFilename = naatResult.rows[0].audio_filename;
        
        // Delete file from disk
        const filePath = path.join(__dirname, '../../Client/Public/naats', audioFilename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Delete from database
        await pool.query(
            'DELETE FROM naats WHERE naat_id = $1',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Naat deleted by admin'
        });
        
    } catch (error) {
        next(error);
    }
});

module.exports = router;
// Get all users (admin only)
router.get('/users', authenticateToken, checkAdmin, async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT user_id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC'
        );
        
        res.json({
            success: true,
            users: result.rows
        });
    } catch (error) {
        next(error);
    }
});

// Update user role (admin only)
router.put('/users/:id/role', authenticateToken, checkAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        const validRoles = ['listener', 'artist', 'moderator', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }
        
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE user_id = $2 RETURNING user_id, email, role',
            [role, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User role updated',
            user: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// Get all naats for admin (with filters)
router.get('/naats', authenticateToken, checkAdmin, async (req, res, next) => {
    try {
        const { status } = req.query;
        
        let query = `
            SELECT n.*, u.full_name as artist_name 
            FROM naats n 
            JOIN users u ON n.artist_id = u.user_id
        `;
        
        if (status) {
            query += ` WHERE n.status = '${status}'`;
        }
        
        query += ' ORDER BY n.created_at DESC';
        
        const result = await pool.query(query);
        
        res.json({
            success: true,
            naats: result.rows
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;