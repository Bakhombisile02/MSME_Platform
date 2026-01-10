/**
 * Validation Middleware
 * 
 * Port of middleware/validation.middleware.js to TypeScript
 * Provides XSS sanitization and validation helpers
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import xss, { IFilterXSSOptions } from 'xss';

// =============================================================================
// XSS SANITIZATION
// =============================================================================

const xssOptions: IFilterXSSOptions = {
  whiteList: {}, // No HTML tags allowed by default
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * Sanitize a string to prevent XSS attacks
 */
function sanitizeXSS(input: string): string {
  if (typeof input !== 'string') return input;
  return xss(input, xssOptions);
}

/**
 * Recursively sanitize all string values in an object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeXSS(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip password fields
    if (key.toLowerCase().includes('password')) {
      sanitized[key] = value;
    } else {
      sanitized[key] = sanitizeObject(value);
    }
  }
  return sanitized;
}

/**
 * Middleware: Sanitize request body
 */
export function sanitizeBody(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Middleware: Sanitize query parameters
 */
export function sanitizeQuery(req: Request, res: Response, next: NextFunction): void {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query) as typeof req.query;
  }
  next();
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Middleware: Handle validation errors
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
    return;
  }
  
  next();
}

/**
 * Validate ID parameter
 */
export function validateIdParam(paramName: string = 'id'): ValidationChain {
  return param(paramName)
    .notEmpty()
    .withMessage(`${paramName} is required`)
    .isString()
    .withMessage(`${paramName} must be a string`);
}

/**
 * Validate email field
 */
export function validateEmail(fieldName: string = 'email'): ValidationChain {
  return body(fieldName)
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail();
}

/**
 * Validate required string field
 */
export function validateRequiredString(fieldName: string, minLength: number = 1): ValidationChain {
  return body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isLength({ min: minLength })
    .withMessage(`${fieldName} must be at least ${minLength} characters`);
}

/**
 * Validate optional string field
 */
export function validateOptionalString(fieldName: string): ValidationChain {
  return body(fieldName)
    .optional()
    .isString()
    .withMessage(`${fieldName} must be a string`);
}

/**
 * Validate verification status (1, 2, or 3)
 */
export const validateVerificationStatus: ValidationChain = body('is_verified')
  .isIn([1, 2, 3])
  .withMessage('is_verified must be 1 (pending), 2 (approved), or 3 (rejected)');

/**
 * Validate pagination parameters
 * Uses query() for GET request query string params
 */
export function validatePagination(): ValidationChain[] {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ];
}

/**
 * Validate filters for MSME business search
 * Uses query() for GET request query string params
 */
export function validateFilters(): ValidationChain[] {
  return [
    query('region').optional().isString(),
    query('category').optional().isString(),
    query('search').optional().isString(),
    query('is_verified').optional().isIn(['1', '2', '3', 1, 2, 3]),
  ];
}

// =============================================================================
// COMMON VALIDATION CHAINS
// =============================================================================

export const msmeBusinessValidation = {
  create: [
    body('name_of_organization')
      .notEmpty()
      .withMessage('Organization name is required')
      .isLength({ min: 3 })
      .withMessage('Organization name must be at least 3 characters'),
    body('email_address')
      .isEmail()
      .withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('phone_number')
      .notEmpty()
      .withMessage('Phone number is required'),
    body('physical_address')
      .notEmpty()
      .withMessage('Physical address is required'),
    body('region')
      .notEmpty()
      .withMessage('Region is required'),
    body('business_category_id')
      .notEmpty()
      .withMessage('Business category is required'),
  ],
  
  update: [
    body('name_of_organization')
      .optional()
      .isLength({ min: 3 })
      .withMessage('Organization name must be at least 3 characters'),
    body('email_address')
      .optional()
      .isEmail()
      .withMessage('Please enter a valid email'),
  ],
  
  login: [
    body('email_address')
      .isEmail()
      .withMessage('Please enter a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
};

export const adminValidation = {
  login: [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name is required'),
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
};
