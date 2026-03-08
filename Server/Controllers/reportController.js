const pool = require('../db');

// Create report
exports.createReport = async (req, res, next) => {
    try {
        const { reported_naat_id, description, report_type } = req.body;
        const reporter_id = req.user.userId;
        console.log("this is",reporter_id);
        const reported_u_id_row=await pool.query(
            `SELECT artist_id FROM naats WHERE naat_id=${reported_naat_id} `
        );
        const reported_u_id=reported_u_id_row.rows[0].artist_id;
        const result = await pool.query(
            `INSERT INTO reports (reporter_id, reported_naat_id, description, report_type,reported_user_id) 
             VALUES ($1, $2, $3, $4,$5) 
             RETURNING *`,
            [reporter_id, reported_naat_id, description, report_type,reported_u_id]
        );
        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            report: result.rows[0]
        });
        
    } catch (error) {
        next(error);
    }
};

// Get all reports (for admin/moderator)
exports.getAllReports = async (req, res, next) => {
    try {
        const userRole = req.user.role;
        
        // Only admin and moderator can view reports
        if (userRole !== 'admin' && userRole !== 'moderator') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        const result = await pool.query(`
            SELECT r.*, 
                   u1.full_name as reporter_name,
                   u2.full_name as reported_user_name,
                   n.title as naat_title
            FROM reports r
            LEFT JOIN users u1 ON r.reporter_id = u1.user_id
            LEFT JOIN users u2 ON r.reported_user_id = u2.user_id
            LEFT JOIN naats n ON r.reported_naat_id = n.naat_id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
        `);
        
        res.json({
            success: true,
            reports: result.rows
        });
        
    } catch (error) {
        next(error);
    }
};

// Delete/Resolve report (admin/moderator only)
exports.resolveReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { resolution, action_taken } = req.body;
        const resolved_by = req.user.userId;
        const userRole = req.user.role;
        
        // Only admin and moderator can resolve reports
        if (userRole !== 'admin' && userRole !== 'moderator') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to resolve reports'
            });
        }
        
        // Get report details
        const reportResult = await pool.query(
            'SELECT * FROM reports WHERE report_id = $1',
            [id]
        );
        
        if (reportResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        // Update report status
        const result = await pool.query(
            `UPDATE reports 
             SET status = 'resolved',
                 resolution = $1,
                 action_taken = $2,
                 resolved_by = $3,
                 resolved_at = CURRENT_TIMESTAMP
             WHERE report_id = $4
             RETURNING *`,
            [resolution, action_taken, resolved_by, id]
        );
        
        // If action is "delete_naat", delete the reported naat
        if (action_taken === 'delete_naat' && reportResult.rows[0].reported_naat_id) {
            await pool.query(
                'DELETE FROM naats WHERE naat_id = $1',
                [reportResult.rows[0].reported_naat_id]
            );
        }
        
        // If action is "delete_user", delete the reported user
        if (action_taken === 'delete_user' && reportResult.rows[0].reported_user_id) {
            await pool.query(
                'UPDATE users SET is_active = false WHERE user_id = $1',
                [reportResult.rows[0].reported_user_id]
            );
        }
        
        res.json({
            success: true,
            message: 'Report resolved successfully',
            report: result.rows[0]
        });
        
    } catch (error) {
        next(error);
    }
};


/// In deleteReport function - Update permissions:
exports.deleteReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        
        // Check if report exists
        const reportResult = await pool.query(
            'SELECT * FROM reports WHERE report_id = $1',
            [id]
        );
        
        if (reportResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        const report = reportResult.rows[0];
        
        // Check permissions:
        // 1. Admin can delete ANY report
        // 2. User can delete only their OWN report
        if (userRole !== 'admin' && report.reporter_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this report'
            });
        }
        
        // Delete the report
        await pool.query('DELETE FROM reports WHERE report_id = $1', [id]);
        
        res.json({
            success: true,
            message: 'Report deleted successfully'
        });
        
    } catch (error) {
        next(error);
    }
};
// Get reports submitted by the current user
exports.getUserReports = async (req, res) => {
    try {
        const userId = req.user.userId; // Get user ID from token
        
        // Query to get reports where this user is the reporter
        const query = `
            SELECT 
                r.*,
                u1.full_name as reporter_name,
                u2.full_name as reported_user_name,
                n.title as naat_title
            FROM reports r
            LEFT JOIN users u1 ON r.reporter_id = u1.user_id
            LEFT JOIN users u2 ON r.reported_user_id = u2.user_id
            LEFT JOIN naats n ON r.reported_naat_id = n.naat_id
            WHERE r.reporter_id = $1
            ORDER BY r.created_at DESC
        `;
        
        const { rows } = await pool.query(query, [userId]);
        
        res.status(200).json({
            success: true,
            reports: rows
        });
        
    } catch (error) {
        console.error('Error fetching user reports:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user reports'
        });
    }
};