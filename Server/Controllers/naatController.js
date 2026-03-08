const pool = require('../db');
const cache = require('../cache');
const fs = require('fs');
const path = require('path');

exports.getMyUploads = async (req, res, next) => {
    try {
        const userId = req.userId;
        
        const result = await pool.query(
            'SELECT * FROM naats WHERE artist_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};
// Delete Naat
exports.deleteNaat = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole;
        
        // Get naat details
        const naatResult = await pool.query(
            'SELECT naat_id, artist_id, audio_filename FROM naats WHERE naat_id = $1',
            [id]
        );
        
        if (naatResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Naat not found'
            });
        }
        
        const naat = naatResult.rows[0];
        
        // Check permissions
        // Allow: Admin, OR Artist who uploaded the naat
        if (userRole !== 'admin' && naat.artist_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this naat'
            });
        }
        
        // Start transaction
        await pool.query('BEGIN');
        
        try {
            // 1. Delete MP3 file from disk
            const filePath = path.join(__dirname, '../../Client/Public/naats', naat.audio_filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            // 2. Delete naat from database (CASCADE will delete comments, playlist entries, etc.)
            await pool.query(
                'DELETE FROM naats WHERE naat_id = $1',
                [id]
            );
            
            await pool.query('COMMIT');
            
            res.json({
                success: true,
                message: 'Naat deleted successfully'
            });
            
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
        
    } catch (error) {
        next(error);
    }
};
// Get All Naats (with client-side caching)
exports.getAllNaats = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, category, search } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT n.naat_id, n.title, n.description, n.audio_filename, 
                   n.duration_seconds, n.category, n.like_count, n.created_at,
                   u.user_id as artist_id, u.full_name as artist_name
            FROM naats n
            JOIN users u ON n.artist_id = u.user_id
            WHERE u.is_active = true
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (category) {
            query += ` AND n.category = $${paramCount}`;
            params.push(category);
            paramCount++;
        }
        
        if (search) {
            query += ` AND (n.title ILIKE $${paramCount} OR n.description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        
        query += ` ORDER BY n.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), offset);
        
        const result = await pool.query(query, params);
        
        // Apply client-side caching for naats list
        const isCached = cache.applyCacheHeaders(req, res, result.rows, cache.durations.NAATS_LIST);
        if (isCached) return;
        
        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) FROM naats n JOIN users u ON n.artist_id = u.user_id WHERE u.is_active = true`;
        if (category) countQuery += ` AND n.category = '${category}'`;
        if (search) countQuery += ` AND (n.title ILIKE '%${search}%' OR n.description ILIKE '%${search}%')`;
        
        const countResult = await pool.query(countQuery);
        const total = parseInt(countResult.rows[0].count);
        
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        next(error);
    }
};

// Get Single Naat (with client-side caching)
exports.getNaatById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT n.naat_id, n.title, n.description, n.audio_filename, 
                    n.duration_seconds, n.category, n.like_count, n.created_at,
                    u.user_id as artist_id, u.full_name as artist_name,
                    u.profile_pic_url as artist_avatar
             FROM naats n
             JOIN users u ON n.artist_id = u.user_id
             WHERE n.naat_id = $1 AND u.is_active = true`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Naat not found'
            });
        }
        
        const naat = result.rows[0];
        
        // Apply client-side caching for single naat
        const isCached = cache.applyCacheHeaders(req, res, naat, cache.durations.SINGLE_NAAT);
        if (isCached) return;
        
        res.json({
            success: true,
            data: naat
        });
        
    } catch (error) {
        next(error);
    }
};

// Like a Naat
exports.likeNaat = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Increment like count
        const result = await pool.query(
            'UPDATE naats SET like_count = like_count + 1 WHERE naat_id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Naat not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Naat liked successfully',
            like_count: result.rows[0].like_count
        });
        
    } catch (error) {
        next(error);
    }
};

// Upload Naat (Artist/Admin only)
exports.uploadNaat = async (req, res, next) => {
    try {
       
        const { title, description, category, duration_seconds } = req.body;
        const audio_filename = req.file ? req.file.filename : null;
        
        if (!audio_filename) {
            console.log('ERROR: No file uploaded');
            return res.status(400).json({
                success: false,
                message: 'Audio file is required'
            });
        }
        
        // Check if user is artist or admin
        if (req.userRole !== 'artist' && req.userRole !== 'admin') {
            console.log('ERROR: User not authorized. Role:', req.userRole);
            return res.status(403).json({
                success: false,
                message: 'Only artists or admins can upload naats'
            });
        }
        
        const result = await pool.query(
            `INSERT INTO naats (title, description, audio_filename, duration_seconds, artist_id, category) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [title, description, audio_filename, duration_seconds, req.userId, category]
        );
        
        console.log('Database insert successful:', result.rows[0]);
        
        
        res.status(201).json({
            success: true,
            message: 'Naat uploaded successfully',
            data: result.rows[0]
        });
        
    } catch (error) {
       
        next(error);
    }
};

// Get Naats by Category
exports.getNaatsByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const result = await pool.query(
            `SELECT n.naat_id, n.title, n.description, n.audio_filename, 
                    n.duration_seconds, n.category, n.like_count, n.created_at,
                    u.user_id as artist_id, u.full_name as artist_name
             FROM naats n
             JOIN users u ON n.artist_id = u.user_id
             WHERE n.category = $1 AND u.is_active = true
             ORDER BY n.created_at DESC
             LIMIT $2 OFFSET $3`,
            [category, limit, offset]
        );
        
        // Apply client-side caching
        const isCached = cache.applyCacheHeaders(req, res, result.rows, cache.durations.NAATS_LIST);
        if (isCached) return;
        
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM naats WHERE category = $1',
            [category]
        );
        
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            }
        });
        
    } catch (error) {
        next(error);
    }
};