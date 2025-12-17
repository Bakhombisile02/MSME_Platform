const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middelware/auth.middelware');
const ContactUsController = require('../controllers/contactus.controller');

// ==================== PUBLIC ENDPOINTS ====================

// Submit new ticket (contact form)
router.post('/add', [
    body('name').isLength({ min: 3 }).withMessage('Name must be at least 3 characters long'),
    body('mobile').isLength({ min: 3 }).withMessage('Mobile must be at least 3 characters long'),
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('subject').isLength({ min: 3 }).withMessage('Subject must be at least 3 characters long'),
    body('message').isLength({ min: 3 }).withMessage('Message must be at least 3 characters long'),
    body('category_id').optional().isInt().withMessage('Category ID must be a number'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], ContactUsController.add);

// Get categories for contact form dropdown
router.get('/categories', ContactUsController.getCategories);

// Track ticket status (public)
router.post('/track', [
    body('ticket_id').notEmpty().withMessage('Ticket ID is required'),
    body('email').isEmail().withMessage('Please provide a valid email address')
], ContactUsController.trackTicket);

// Customer reply to ticket (public)
router.post('/reply', [
    body('ticket_id').notEmpty().withMessage('Ticket ID is required'),
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('message').isLength({ min: 3 }).withMessage('Message must be at least 3 characters long')
], ContactUsController.customerReply);

// Submit satisfaction rating (public)
router.post('/rating', [
    body('ticket_id').notEmpty().withMessage('Ticket ID is required'),
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('feedback').optional().isString()
], ContactUsController.submitRating);

// ==================== ADMIN ENDPOINTS ====================

// Get all tickets with filters (Admin)
router.get('/list', authMiddleware.authAdmin, ContactUsController.get);

// Get help desk dashboard stats (Admin)
router.get('/stats', authMiddleware.authAdmin, ContactUsController.getStats);

// Get tickets assigned to current admin
router.get('/my-tickets', authMiddleware.authAdmin, ContactUsController.getMyTickets);

// Get admins for assignment dropdown
router.get('/admins', authMiddleware.authAdmin, ContactUsController.getAdmins);

// Get single ticket details (Admin)
router.get('/detail/:id', [
    param('id').isInt().withMessage('Invalid ticket ID')
], authMiddleware.authAdmin, ContactUsController.getDetail);

// Update ticket (status, priority, assignment) (Admin)
router.put('/update/:id', [
    param('id').isInt().withMessage('Invalid ticket ID'),
    body('status').optional().isIn(['open', 'in_progress', 'awaiting_response', 'resolved', 'closed']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('category_id').optional().isInt().withMessage('Category ID must be a number'),
    body('assigned_to').optional()
], authMiddleware.authAdmin, ContactUsController.update);

// Add response to ticket (Admin)
router.post('/respond/:id', [
    param('id').isInt().withMessage('Invalid ticket ID'),
    body('message').isLength({ min: 1 }).withMessage('Message is required'),
    body('is_internal_note').optional().isBoolean().withMessage('is_internal_note must be boolean')
], authMiddleware.authAdmin, ContactUsController.addResponse);

// Get responses for a ticket (Admin)
router.get('/responses/:id', [
    param('id').isInt().withMessage('Invalid ticket ID')
], authMiddleware.authAdmin, ContactUsController.getResponses);

// Delete ticket (Admin)
router.delete('/delete/:id', [
    param('id').isInt().withMessage('Invalid ticket ID')
], authMiddleware.authAdmin, ContactUsController.delete);

// ==================== CATEGORY MANAGEMENT (Admin) ====================

// Get all categories with stats
router.get('/categories/admin', authMiddleware.authAdmin, ContactUsController.getCategoriesAdmin);

// Create category
router.post('/categories', [
    body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('description').optional().isString(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex code'),
    body('sla_hours').optional().isInt({ min: 1 }).withMessage('SLA hours must be a positive integer'),
    body('is_active').optional().isBoolean(),
    body('display_order').optional().isInt()
], authMiddleware.authAdmin, ContactUsController.createCategory);

// Update category
router.put('/categories/:id', [
    param('id').isInt().withMessage('Invalid category ID'),
    body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('description').optional().isString(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex code'),
    body('sla_hours').optional().isInt({ min: 1 }).withMessage('SLA hours must be a positive integer'),
    body('is_active').optional().isBoolean(),
    body('display_order').optional().isInt()
], authMiddleware.authAdmin, ContactUsController.updateCategory);

// Delete category
router.delete('/categories/:id', [
    param('id').isInt().withMessage('Invalid category ID')
], authMiddleware.authAdmin, ContactUsController.deleteCategory);

module.exports = router;
