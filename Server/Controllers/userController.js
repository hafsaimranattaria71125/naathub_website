const pool = require('../db');
const cache = require('../cache');
const path = require('path');


// Delete User Profile
exports.deleteProfile = async (req, res, next) => {
    try {
        const userId = req.userId;
        
        // Start transaction
        await pool.query('BEGIN');
        
        try {
            // 1. Get user's uploaded naats to delete files
            const naatsResult = await pool.query(
                'SELECT audio_filename FROM naats WHERE artist_id = $1',
                [userId]
            );
            
            // 2. Delete MP3 files from disk
            for (const naat of naatsResult.rows) {
                const filePath = path.join(__dirname, '../../Client/Public/naats', naat.audio_filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            // 3. Delete user from database (CASCADE will delete related records)
            await pool.query(
                'DELETE FROM users WHERE user_id = $1',
                [userId]
            );
            
            await pool.query('COMMIT');
            
            // Clear auth cookie
            res.clearCookie('authToken');
            
            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
            
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
        
    } catch (error) {
        next(error);
    }
};
// Get User Profile (with client-side caching)
exports.getUserProfile = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id) || req.userId;
        
        const result = await pool.query(
            `SELECT user_id, email, full_name, role, profile_pic_url, bio, 
                    followers_count, following_count, created_at 
             FROM users WHERE user_id = $1 AND is_active = true`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const userData = result.rows[0];
        
        // Apply client-side caching
        const isCached = cache.applyCacheHeaders(req, res, userData, cache.durations.USER_PROFILE);
        if (isCached) return;
        
        res.json({
            success: true,
            user: userData
        });
        
    } catch (error) {
        next(error);
    }
};

// Update User Profile (clears cache)
exports.updateProfile = async (req, res, next) => {
    try {
        const { full_name, bio } = req.body;
        
        const result = await pool.query(
            `UPDATE users 
             SET full_name = COALESCE($1, full_name),
                 bio = COALESCE($2, bio),
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $3 
             RETURNING user_id, email, full_name, role, profile_pic_url, bio, created_at`,
            [full_name, bio, req.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: result.rows[0]
        });
        
    } catch (error) {
        next(error);
    }
};