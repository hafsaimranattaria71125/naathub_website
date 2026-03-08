const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || "vZyVMdrmy704naSi0yZe3de4AAjua9";

const authenticateToken = (req, res, next) => {
    try {
        const token = req.cookies.authToken;
        
        if (token == undefined || token == null || token == "") 
            return res.status(401).send("Unauthorized User");
            
        const userinfo = jwt.verify(token, SECRET_KEY);
        req.user = userinfo;
        req.userId = userinfo.userId;
        req.userRole = userinfo.role; // ADD THIS LINE for checkAdmin
        next();
    } catch (err) {
        return res.status(401).json({ message: err.name });
    }
};

const checkAdmin = (req, res, next) => {
    // Check if user is admin or super_admin
    if (req.userRole !== 'admin' && req.userRole !== 'super_admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Export with correct names
module.exports = {
    authenticateToken,  
    checkAdmin
};