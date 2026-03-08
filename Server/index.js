// Server/index.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./Middleware/errorHandler');

// Import routes
const authRoutes = require('./Routes/authRoutes');
const userRoutes = require('./Routes/userRoutes');
const naatRoutes = require('./Routes/naatRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const reportRoutes = require('./Routes/reportRoutes');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Get project paths
const projectRoot = path.join(__dirname, '..');
const clientPath = path.join(projectRoot, 'Client');
const pagesPath = path.join(clientPath, 'Pages');
const publicPath = path.join(projectRoot, 'Public');

console.log('📁 Serving from:');
console.log('- HTML Pages:', pagesPath);
console.log('- CSS File:', path.join(clientPath, 'style.css'));
console.log('- MP3 Files:', publicPath);

// Serve MP3 files from root Public folder
app.use('/Public', express.static(publicPath));


app.use(express.static(clientPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/naats', naatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
// Serve HTML pages with specific routes
app.get('/', (req, res) => {
    res.sendFile(path.join(pagesPath, 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(pagesPath, 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(pagesPath, 'register.html'));
});

app.get('/naats.html', (req, res) => {
    res.sendFile(path.join(pagesPath, 'naats.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(pagesPath, 'profile.html'));
});

app.get('/upload.html', (req, res) => {
    res.sendFile(path.join(pagesPath, 'upload.html'));
});

// Catch-all for other routes
app.use( (req, res) => {
    // Check if it's an API route
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: `API endpoint ${req.originalUrl} not found`
        });
    }
    
    // For non-API routes, redirect to home
    res.redirect('/');
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`
    ============================================
    🚀 Naat Hub Server Started!
    ============================================
    📍 Website:    http://localhost:${PORT}
    ============================================
    `);
});