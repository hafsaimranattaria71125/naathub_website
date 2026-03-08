const pool = require('../db');
const jwt = require('jsonwebtoken');

// Register User
exports.register = async (req, res, next) => {
    try {
        const { email, password, full_name, role = 'listener' } = req.body;
        
        // Check if user exists
        const existingUser = await pool.query(
            'SELECT user_id FROM users WHERE email = $1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        // Create user 
        const result = await pool.query(
            `INSERT INTO users (email, password, full_name, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING user_id, email, full_name, role, profile_pic_url, created_at`,
            [email, password, full_name, role]
        );
        
        const user = result.rows[0];
        
        // Generate JWT token
        const authToken = jwt.sign(
            { userId: user.user_id, role: user.role },
            process.env.JWT_SECRET || "vZyVMdrmy704naSi0yZe3de4AAjua9",
            { expiresIn: '7d' }
        );
        
        // Set token in cookie
        res.setHeader('Set-cookie',`authToken:${authToken};HttpOnly;Path=\;Same-Site=Strict;Max-age=604,800,000`)
               
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                profile_pic_url: user.profile_pic_url
            }
        });
        
    } catch (error) {
        next(error);
    }
};

// Login User
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const result = await pool.query(
            'SELECT user_id, email, password, full_name, role, profile_pic_url, is_active FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const user = result.rows[0];
        
        // Check if account is active
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }
        
        // Check password (plain text comparison)
        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.user_id, role: user.role },
            process.env.JWT_SECRET || "vZyVMdrmy704naSi0yZe3de4AAjua9",
            { expiresIn: '7d' }
        );
        
        // Set token in cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production'
        });
        
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                profile_pic_url: user.profile_pic_url
            }
        });
        
    } catch (error) {
        next(error);
    }
};

// Get Current User (with caching)
exports.getMe = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT user_id, email, full_name, role, profile_pic_url, bio, 
                    followers_count, following_count, created_at 
             FROM users WHERE user_id = $1`,
            [req.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = result.rows[0];
        res.json({
            success: true,
            user
        });
        
    } catch (error) {
        next(error);
    }
};

// Logout
exports.logout = (req, res) => {
    res.clearCookie('authToken');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};