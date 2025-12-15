const router = require('express').Router();
const FileController = require('../controllers/file.controller');
const uploader = require('../middelware/uploads');
const authMiddleware = require('../middelware/auth.middelware');
const rateLimit = require('express-rate-limit');

// Rate limiter for public file uploads to prevent abuse
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Max 20 uploads per hour per IP
    message: { error: 'Too many file uploads. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// =============================================================================
// ADMIN-ONLY UPLOADS - CMS Management
// =============================================================================

// Image uploads - 50MB limit for high-resolution photos (Admin only)
router.post('/business-categories-image', authMiddleware.authAdmin, uploader("image", 50, "weatherCategories").single("file"), FileController.uploadFile);

router.post('/partners-logo-image', authMiddleware.authAdmin, uploader("image", 50, "partnersLogo").single("file"), FileController.uploadFile);

router.post('/team-member-image', authMiddleware.authAdmin, uploader("image", 50, "teamMemberImage").single("file"), FileController.uploadFile);

router.post('/home-banner-image', authMiddleware.authAdmin, uploader("image", 50, "homeBannerImage").single("file"), FileController.uploadFile);

router.post('/blog-image', authMiddleware.authAdmin, uploader("image", 50, "blogImage").single("file"), FileController.uploadFile);

router.post('/service-provider-categories-image', authMiddleware.authAdmin, uploader("image", 50, "serviceProviderCategoriesImage").single("file"), FileController.uploadFile);

router.post('/service-providers-image', authMiddleware.authAdmin, uploader("image", 50, "serviceProvidersImage").single("file"), FileController.uploadFile);

// Document uploads - 100MB limit for larger files (Admin only)
router.post('/downloads', authMiddleware.authAdmin, uploader("document", 100, "downloadsFile").single("file"), FileController.uploadFile);

// =============================================================================
// USER UPLOADS - Business Registration (Rate limited to prevent abuse)
// =============================================================================
// These endpoints are rate-limited (20 uploads/hour/IP) instead of requiring auth
// because they're needed during the registration flow before users have tokens

// Business image - allowed for authenticated users OR during registration
router.post('/business-image', uploadLimiter, uploader("image", 50, "businessImage").single("file"), FileController.uploadFile);

// Business profile document - allowed for authenticated users OR during registration
router.post('/business-profile', uploadLimiter, uploader("document", 100, "businessProfile").single("file"), FileController.uploadFile);

// Mixed image-document uploads - 100MB limit
router.post('/incorporation-image', uploadLimiter, uploader("image-document", 100, "incorporationProfile").single("file"), FileController.uploadFile);



// router.post('/gallery-image', uploader("image", 50, "galleryImage").array("file",15), FileController.uploadMultipleFiles);

module.exports = router;
