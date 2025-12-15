/**
 * Validation Middleware - Security helpers for input validation and sanitization
 * 
 * This module provides:
 * - Parameter validation (ID, email, numeric values)
 * - XSS sanitization for user-generated content
 * - Common validation chains for express-validator
 */

const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');
const validator = require('validator');

// =============================================================================
// XSS SANITIZATION
// =============================================================================

/**
 * XSS filter configuration - whitelist approach for safety
 */
const xssOptions = {
    whiteList: {}, // No HTML tags allowed by default
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
};

/**
 * Sanitize a string to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeXSS(input) {
    if (typeof input !== 'string') return input;
    return xss(input, xssOptions);
}

/**
 * Recursively sanitize all string values in an object
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return typeof obj === 'string' ? sanitizeXSS(obj) : obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        // Skip password fields - they should not be sanitized
        if (key.toLowerCase().includes('password')) {
            sanitized[key] = value;
        } else {
            sanitized[key] = sanitizeObject(value);
        }
    }
    return sanitized;
}

/**
 * Express middleware to sanitize request body
 */
function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
}

/**
 * Express middleware to sanitize query parameters
 */
function sanitizeQuery(req, res, next) {
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }
    next();
}

// =============================================================================
// PARAMETER VALIDATION
// =============================================================================

/**
 * Validate that a parameter is a positive integer (for database IDs)
 * @param {string} paramName - The parameter name to validate
 * @returns {Function} - Express middleware
 */
function validateIdParam(paramName = 'id') {
    return [
        param(paramName)
            .trim()
            .notEmpty().withMessage(`${paramName} is required`)
            .isInt({ min: 1 }).withMessage(`${paramName} must be a positive integer`)
            .toInt(),
        handleValidationErrors
    ];
}

/**
 * Validate email parameter
 * @param {string} paramName - The parameter name to validate
 * @returns {Array} - Validation chain
 */
function validateEmailParam(paramName = 'email_address') {
    return [
        param(paramName)
            .trim()
            .notEmpty().withMessage('Email address is required')
            .isEmail().withMessage('Please enter a valid email address')
            .normalizeEmail(),
        handleValidationErrors
    ];
}

/**
 * Validate year parameter (for dashboard queries)
 * @param {string} paramName - The parameter name to validate
 * @returns {Array} - Validation chain
 */
function validateYearParam(paramName = 'year') {
    return [
        param(paramName)
            .trim()
            .notEmpty().withMessage('Year is required')
            .isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100')
            .toInt(),
        handleValidationErrors
    ];
}

// =============================================================================
// COMMON VALIDATION CHAINS
// =============================================================================

/**
 * Validate pagination query parameters
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt()
];

/**
 * Validate business verification status
 */
const validateVerificationStatus = [
    body('is_verified')
        .notEmpty().withMessage('Verification status is required')
        .isIn(['1', '2', '3', 1, 2, 3]).withMessage('Invalid verification status (1=pending, 2=approved, 3=rejected)'),
    body('is_verified_comments')
        .optional()
        .isLength({ max: 800 }).withMessage('Comments must not exceed 800 characters')
        .customSanitizer(value => sanitizeXSS(value))
];

/**
 * Validate common string fields
 */
function validateStringField(fieldName, minLength = 1, maxLength = 255, required = true) {
    let chain = body(fieldName).trim();
    
    if (required) {
        chain = chain.notEmpty().withMessage(`${fieldName} is required`);
    } else {
        chain = chain.optional();
    }
    
    return chain
        .isLength({ min: minLength, max: maxLength })
        .withMessage(`${fieldName} must be between ${minLength} and ${maxLength} characters`)
        .customSanitizer(value => sanitizeXSS(value));
}

// =============================================================================
// FILTER VALIDATION FOR MSME SEARCH
// =============================================================================

const validateFilters = [
    query('business_category_id')
        .optional()
        .custom(value => value === 'All' || validator.isInt(value, { min: 1 }))
        .withMessage('Invalid business category'),
    query('business_sub_category_id')
        .optional()
        .custom(value => value === 'All' || validator.isInt(value, { min: 1 }))
        .withMessage('Invalid business sub-category'),
    query('region')
        .optional()
        .isLength({ max: 200 }).withMessage('Region must not exceed 200 characters')
        .customSanitizer(value => sanitizeXSS(value)),
    query('inkhundla')
        .optional()
        .isLength({ max: 100 }).withMessage('Inkhundla must not exceed 100 characters')
        .customSanitizer(value => sanitizeXSS(value)),
    query('town')
        .optional()
        .isLength({ max: 100 }).withMessage('Town must not exceed 100 characters')
        .customSanitizer(value => sanitizeXSS(value)),
    query('rural_urban_classification')
        .optional()
        .isIn(['Rural', 'Urban', 'Semi Urban', 'All', '']).withMessage('Invalid classification'),
    query('employees')
        .optional()
        .isLength({ max: 50 }).withMessage('Employees filter invalid'),
    query('establishment_year')
        .optional()
        .isLength({ max: 50 }).withMessage('Establishment year filter invalid'),
    query('ownership_type')
        .optional()
        .isIn(['Individual', 'Partnership', 'All', '']).withMessage('Invalid ownership type'),
    query('keyword')
        .optional()
        .isLength({ max: 200 }).withMessage('Keyword must not exceed 200 characters')
        .customSanitizer(value => sanitizeXSS(value)),
    query('sort')
        .optional()
        .isIn(['asc', 'desc', 'name_asc', 'name_desc', '']).withMessage('Invalid sort option'),
    ...validatePagination
];

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Handle validation errors from express-validator
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg
            }))
        });
    }
    next();
}

// =============================================================================
// IDOR PROTECTION
// =============================================================================

/**
 * Middleware to verify user owns the resource they're trying to access
 * Must be used after auth middleware
 * @param {string} paramName - The ID parameter name
 * @returns {Function} - Express middleware
 */
function verifyResourceOwnership(paramName = 'id') {
    return async (req, res, next) => {
        const resourceId = parseInt(req.params[paramName]);
        const userId = req.user?.id;
        const userType = req.user?.type;
        
        // Admins can access any resource
        if (userType === 'admin') {
            return next();
        }
        
        // For regular users, check if they own the resource
        if (userId && resourceId !== userId) {
            return res.status(403).json({ 
                error: 'Access denied. You can only modify your own data.' 
            });
        }
        
        next();
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    // XSS sanitization
    sanitizeXSS,
    sanitizeObject,
    sanitizeBody,
    sanitizeQuery,
    
    // Parameter validation
    validateIdParam,
    validateEmailParam,
    validateYearParam,
    
    // Common validation chains
    validatePagination,
    validateVerificationStatus,
    validateStringField,
    validateFilters,
    
    // Error handling
    handleValidationErrors,
    
    // IDOR protection
    verifyResourceOwnership
};
