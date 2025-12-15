const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const authMiddleware = require('../middelware/auth.middelware');
const adminController = require('../controllers/admin.controller');


// Admin registration - PROTECTED: Only existing admins can create new admins
// For initial setup, use the seed script: npm run seed:admin
router.post('/ragister',[
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({min: 8}).withMessage('Password must be at least 8 characters long'),
    body('name').trim().isLength({min: 3}).withMessage('Name must be at least 3 characters long'),
], authMiddleware.authAdmin, adminController.ragisterAdmin);


router.post('/login',[
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({min: 5}).withMessage('Password is required'),
], adminController.loginAdmin);


// router.get('/profile',authMiddleware.authAdmin, adminController.getProfile);

router.get('/logout',authMiddleware.authAdmin, adminController.logout);

module.exports = router;