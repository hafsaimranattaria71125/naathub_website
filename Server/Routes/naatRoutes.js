
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const naatController = require('../Controllers/naatController');
const { authenticateToken } = require('../Middleware/auth');

// Configure multer for file upload 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use absolute path - FIXED
        cb(null, path.join(__dirname, '../../Client/Public/'));
    },
    filename: (req, file, cb) => {
    // Use original filename exactly as uploaded
    cb(null, file.originalname);
}
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        // Accept only audio files
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'), false);
        }
    }
});


// Public routes 
router.get('/', naatController.getAllNaats);
router.get('/category/:category', naatController.getNaatsByCategory);
router.get('/:id', naatController.getNaatById);

// Protected routes
router.post('/:id/like', authenticateToken, naatController.likeNaat);
router.delete('/:id', authenticateToken, naatController.deleteNaat); // NEW
// Add this route
router.get('/user/my-uploads', authenticateToken, naatController.getMyUploads);
// Artist/Admin routes
router.post('/upload', 
    authenticateToken, 
    upload.single('audio'), 
    naatController.uploadNaat
);

module.exports = router;