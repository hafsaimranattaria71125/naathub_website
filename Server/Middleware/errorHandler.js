const errorHandler = (err, req, res, next) => {
    console.error('🚨 Error:', err.stack);
    
    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errorCode = 'SERVER_ERROR';
    
    // Database errors
    if (err.code === '23505') { // Unique violation
        statusCode = 409;
        message = 'Resource already exists';
        errorCode = 'DUPLICATE_ENTRY';
    } else if (err.code === '23503') { // Foreign key violation
        statusCode = 400;
        message = 'Related resource not found';
        errorCode = 'FOREIGN_KEY_VIOLATION';
    } else if (err.code === '23502') { // Not null violation
        statusCode = 400;
        message = 'Required field missing';
        errorCode = 'REQUIRED_FIELD_MISSING';
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        errorCode = 'INVALID_TOKEN';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
    }
    
    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message: message,
            timestamp: new Date().toISOString()
        }
    });
};

module.exports = errorHandler;