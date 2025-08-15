const { body, validationResult } = require('express-validator');

// Input sanitization utility
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            })),
            code: 'VALIDATION_ERROR'
        });
    }
    next();
};

// Registration validation rules
const validateRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .customSanitizer(sanitizeInput),
    
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 255 })
        .withMessage('Email cannot exceed 255 characters'),
    
    body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
    
    handleValidationErrors
];

// Login validation rules
const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

// Task validation rules
const validateTask = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Title must be between 1 and 255 characters')
        .customSanitizer(sanitizeInput),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters')
        .customSanitizer(sanitizeInput),
    
    body('status')
        .optional()
        .isIn(['To Do', 'In Progress', 'Done'])
        .withMessage('Status must be one of: To Do, In Progress, Done'),
    
    body('deadline')
        .optional()
        .isISO8601()
        .withMessage('Deadline must be a valid date')
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('Deadline cannot be in the past');
            }
            return true;
        }),
    
    body('reminder_time')
        .optional()
        .isISO8601()
        .withMessage('Reminder time must be a valid date'),
    
    handleValidationErrors
];

// Task update validation (all fields optional)
const validateTaskUpdate = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Title must be between 1 and 255 characters')
        .customSanitizer(sanitizeInput),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters')
        .customSanitizer(sanitizeInput),
    
    body('status')
        .optional()
        .isIn(['To Do', 'In Progress', 'Done'])
        .withMessage('Status must be one of: To Do, In Progress, Done'),
    
    body('deadline')
        .optional()
        .isISO8601()
        .withMessage('Deadline must be a valid date')
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('Deadline cannot be in the past');
            }
            return true;
        }),
    
    body('reminder_time')
        .optional()
        .isISO8601()
        .withMessage('Reminder time must be a valid date'),
    
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateTask,
    validateTaskUpdate,
    sanitizeInput,
    handleValidationErrors
};
