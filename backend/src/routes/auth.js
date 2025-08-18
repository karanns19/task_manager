const express = require('express');
const bcrypt = require('bcryptjs');
const { runQuery, getRow } = require('../database');
const { generateToken, sanitizeInput, authRateLimit } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Apply rate limiting to auth endpoints
router.use(rateLimit(authRateLimit));

// Input validation middleware
const validateRegistration = (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;
    const errors = [];

    // Name validation
    if (!name || typeof name !== 'string') {
        errors.push('Name is required and must be a string');
    } else if (name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    } else if (name.trim().length > 100) {
        errors.push('Name cannot exceed 100 characters');
    }

    // Email validation
    if (!email || typeof email !== 'string') {
        errors.push('Email is required and must be a string');
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            errors.push('Please provide a valid email address');
        }
        if (email.trim().length > 255) {
            errors.push('Email cannot exceed 255 characters');
        }
    }

    // Password validation
    if (!password || typeof password !== 'string') {
        errors.push('Password is required and must be a string');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    } else if (password.length > 128) {
        errors.push('Password cannot exceed 128 characters');
    }

    // Confirm password validation
    if (!confirmPassword || typeof confirmPassword !== 'string') {
        errors.push('Password confirmation is required');
    } else if (password !== confirmPassword) {
        errors.push('Passwords do not match');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors,
            code: 'VALIDATION_ERROR'
        });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    // Email validation
    if (!email || typeof email !== 'string') {
        errors.push('Email is required and must be a string');
    } else if (email.trim().length === 0) {
        errors.push('Email cannot be empty');
    }

    // Password validation
    if (!password || typeof password !== 'string') {
        errors.push('Password is required and must be a string');
    } else if (password.trim().length === 0) {
        errors.push('Password cannot be empty');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors,
            code: 'VALIDATION_ERROR'
        });
    }

    next();
};

// User Registration
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Sanitize inputs
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email).toLowerCase();

        // Additional server-side validation
        if (sanitizedName.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long',
                code: 'INVALID_NAME'
            });
        }

        if (sanitizedEmail.length === 0 || !sanitizedEmail.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address',
                code: 'INVALID_EMAIL'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long',
                code: 'INVALID_PASSWORD'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match',
                code: 'PASSWORD_MISMATCH'
            });
        }

        // Check if user already exists
        const existingUser = await getRow('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists',
                code: 'USER_EXISTS'
            });
        }

        // Hash password with increased salt rounds for security
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user with sanitized data
        const insertResult = await runQuery(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [sanitizedName, sanitizedEmail, hashedPassword]
        );

        if (!insertResult.id) {
            throw new Error('Failed to create user');
        }

        // Generate token
        const token = generateToken(insertResult.id);

        // Log successful registration (without sensitive data)
        console.log(`✅ New user registered: ${sanitizedEmail} (ID: ${insertResult.id})`);

        // Fetch created user
        const createdUser = await getRow(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [insertResult.id]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userId: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                token,
                createdAt: createdUser.created_at
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        
        // Handle specific database errors
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists',
                code: 'USER_EXISTS'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during registration',
            code: 'REGISTRATION_ERROR'
        });
    }
});

// User Login
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Sanitize email
        const sanitizedEmail = sanitizeInput(email).toLowerCase();

        // Find user
        const user = await getRow(
            'SELECT id, name, email, password, created_at FROM users WHERE email = ?', 
            [sanitizedEmail]
        );

        if (!user) {
            // Use generic message for security (don't reveal if email exists)
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            // Log failed login attempt
            console.log(`❌ Failed login attempt for email: ${sanitizedEmail}`);
            
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Log successful login
        console.log(`✅ User logged in: ${sanitizedEmail} (ID: ${user.id})`);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                userId: user.id,
                name: user.name,
                email: user.email,
                token,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login',
            code: 'LOGIN_ERROR'
        });
    }
});

// Get current user info (protected route)
router.get('/me', async (req, res) => {
    try {
        // This would typically use authenticateToken middleware
        // For now, we'll return a message indicating it's a protected endpoint
        res.json({
            success: true,
            message: 'Protected endpoint - use authenticateToken middleware',
            code: 'PROTECTED_ENDPOINT'
        });
    } catch (error) {
        console.error('❌ Get user info error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            code: 'GET_USER_ERROR'
        });
    }
});

// Health check for auth service
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth service is healthy',
        timestamp: new Date().toISOString(),
        service: 'authentication'
    });
});

module.exports = router;
