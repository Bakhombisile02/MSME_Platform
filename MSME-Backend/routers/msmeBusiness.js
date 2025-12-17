const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const authMiddleware = require('../middelware/auth.middelware');
const MSMEBusinessController = require('../controllers/msmeBusiness.contoller');
const { 
    validateIdParam, 
    validateFilters, 
    validateVerificationStatus,
    sanitizeBody,
    verifyResourceOwnership,
    handleValidationErrors 
} = require('../middelware/validation.middelware');

// This route is used to add a new weather category
// It requires the user to be authenticated as an admin

// Done 
router.post('/add',[
    body('name_of_organization').isLength({min: 3}).withMessage('Name must be at least 3 characters long'),
], MSMEBusinessController.add);


router.post('/login',[
    body('email_address').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
], MSMEBusinessController.loginUser);

// check if email exists
router.get('/check-email-exists/:email_address', MSMEBusinessController.checkEmailExists);


router.put('/update/:id',
    validateIdParam('id'),
    sanitizeBody,
    [
        body('name_of_organization').isLength({min: 3}).withMessage('Name must be at least 3 characters long'),
    ],
    authMiddleware.authUser, 
    verifyResourceOwnership('id'),  // IDOR protection - users can only update their own business
    MSMEBusinessController.update
);

// Done 
router.get('/list', MSMEBusinessController.get);

router.get('/list-web/:is_verified', MSMEBusinessController.getWeb);

// Old API for getting MSME list according to category ID
router.get('/list-according-category-id/:business_category_id', MSMEBusinessController.getListAccordingToCategoryId);

// New API for getting MSME list according to category ID with pagination
router.get('/list-according-category-id-v2/:business_category_id', MSMEBusinessController.getListAccordingToCategoryIdV2);


router.get('/msme-details/:id', validateIdParam('id'), MSMEBusinessController.getMSMEDetails);

// Verify MSME Business
router.put('/verify-msme/:id',
    validateIdParam('id'),
    sanitizeBody,
    validateVerificationStatus,
    handleValidationErrors,
    authMiddleware.authAdmin, 
    MSMEBusinessController.verifyMSME
);


router.get('/search-by-name/:name_of_organization',[
], MSMEBusinessController.searchByName);

router.get('/search-by-region/:region',[
], MSMEBusinessController.searchByRegion);

router.get('/filters', validateFilters, handleValidationErrors, MSMEBusinessController.filtersAPI);

// =============================================================================
// SEARCH AUTOCOMPLETE & SUGGESTIONS
// =============================================================================
// Autocomplete - returns suggestions as user types (min 2 chars)
router.get('/autocomplete', MSMEBusinessController.autocomplete);

// Popular searches - returns top categories, locations for suggestions
router.get('/popular-searches', MSMEBusinessController.popularSearches);


router.put('/delete/:id', validateIdParam('id'), authMiddleware.authAdmin, MSMEBusinessController.delete);


// =============================================================================
// PASSWORD RESET FLOW - Secure implementation
// =============================================================================

// Step 1: Request OTP - sends 6-digit code to email
router.post('/forget-password/request-otp',[
    body('email_address').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
], MSMEBusinessController.forgetPasswordSendEmail);

// Step 2: Verify OTP - validates the code (invalidates on success)
router.post('/forget-password/verify-otp',[
    body('email_address').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('otp').isLength({min: 6, max: 6}).withMessage('OTP must be 6 digits'),
], MSMEBusinessController.forgetPasswordVerifyOTP);

// Step 3: Reset Password - requires valid verified session
router.post('/forget-password/reset',[
    body('email_address').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({min: 8}).withMessage('Password must be at least 8 characters long'),
    body('reset_token').notEmpty().withMessage('Reset token is required'),
], MSMEBusinessController.forgetPassword);

// =============================================================================
// LEGACY ROUTES - REMOVED FOR SECURITY
// =============================================================================
// The following routes have been removed due to security vulnerabilities:
// - PUT /forget-password-send-otp/:email_address - exposed email in URL
// - PUT /forget-password-otp-verify/:email_address/:otp - exposed OTP in URL
// - PUT /forget-password/:email_address/:password - CRITICAL: exposed password in URL
//
// Use the secure POST endpoints above instead:
// - POST /forget-password/request-otp
// - POST /forget-password/verify-otp  
// - POST /forget-password/reset


module.exports = router;