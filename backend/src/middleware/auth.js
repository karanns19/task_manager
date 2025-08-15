const jwt = require('jsonwebtoken');

// Validate JWT secret environment variable
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required for security');
}

const JWT_SECRET = process.env.JWT_SECRET;

// Input sanitization utility
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
};

// Enhanced JWT token verification middleware
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access token required',
                code: 'MISSING_TOKEN'
            });
        }

        const token = authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token format',
                code: 'INVALID_TOKEN_FORMAT'
            });
        }

        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ 
                        success: false, 
                        message: 'Token has expired',
                        code: 'TOKEN_EXPIRED'
                    });
                } else if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ 
                        success: false, 
                        message: 'Invalid token',
                        code: 'INVALID_TOKEN'
                    });
                } else {
                    return res.status(401).json({ 
                        success: false, 
                        message: 'Token verification failed',
                        code: 'TOKEN_VERIFICATION_FAILED'
                    });
                }
            }
            
            // Add user info to request
            req.user = {
                userId: decoded.userId,
                tokenIssuedAt: decoded.iat,
                tokenExpiresAt: decoded.exp
            };
            
            next();
        });
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

// Generate JWT token with enhanced options
const generateToken = (userId) => {
    const payload = { 
        userId,
        iat: Math.floor(Date.now() / 1000),
        type: 'access'
    };
    
    const options = {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: process.env.JWT_ISSUER || 'task-manager-api',
        audience: process.env.JWT_AUDIENCE || 'task-manager-users'
    };
    
    return jwt.sign(payload, JWT_SECRET, options);
};

// Refresh token generation (for future use)
const generateRefreshToken = (userId) => {
    const payload = { 
        userId,
        iat: Math.floor(Date.now() / 1000),
        type: 'refresh'
    };
    
    const options = {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: process.env.JWT_ISSUER || 'task-manager-api',
        audience: process.env.JWT_AUDIENCE || 'task-manager-users'
    };
    
    return jwt.sign(payload, JWT_SECRET, options);
};

// Token validation utility
const validateToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};

// Rate limiting for authentication endpoints
const authRateLimit = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
};

module.exports = {
    authenticateToken,
    generateToken,
    generateRefreshToken,
    validateToken,
    sanitizeInput,
    authRateLimit
};
