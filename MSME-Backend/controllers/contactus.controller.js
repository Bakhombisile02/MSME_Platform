const BaseRepo = require('../services/BaseRepository');
const { ContactUsModel, TicketCategoryModel, TicketResponseModel, TicketAttachmentModel, AdminModel } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sendTicketConfirmationEmail, sendTicketResponseEmail, sendTicketAssignmentEmail } = require('../mailer/mailerFile');

// ==================== TICKET SUBMISSION ====================

// Create new ticket (public endpoint)
module.exports.add = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    const payload = req.body;

    try {
        const ticket = await BaseRepo.baseCreate(ContactUsModel, payload);
        if (!ticket) {
            return res.status(400).json({ error: 'Error creating ticket' });
        }

        // Send confirmation email to user
        try {
            await sendTicketConfirmationEmail({
                email: ticket.email,
                name: ticket.name,
                ticket_id: ticket.ticket_id,
                subject: ticket.subject
            });
        } catch (emailError) {
            console.error('Failed to send ticket confirmation email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Your ticket has been submitted successfully',
            ticket_id: ticket.ticket_id,
            data: ticket
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// ==================== TICKET LISTING & SEARCH ====================

// Get tickets with filters (Admin)
module.exports.get = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build search params from query
    const searchParams = {};
    
    if (req.query.status) {
        searchParams.status = req.query.status;
    }
    if (req.query.priority) {
        searchParams.priority = req.query.priority;
    }
    if (req.query.category_id) {
        searchParams.category_id = req.query.category_id;
    }
    if (req.query.assigned_to) {
        searchParams.assigned_to = req.query.assigned_to;
    }
    if (req.query.is_read !== undefined) {
        searchParams.is_read = req.query.is_read === 'true';
    }
    if (req.query.search) {
        searchParams[Op.or] = [
            { ticket_id: { [Op.like]: `%${req.query.search}%` } },
            { name: { [Op.like]: `%${req.query.search}%` } },
            { email: { [Op.like]: `%${req.query.search}%` } },
            { subject: { [Op.like]: `%${req.query.search}%` } }
        ];
    }

    const params = {
        searchParams,
        limit,
        offset,
        page,
        order: [["id", "DESC"]],
        include: [
            {
                model: TicketCategoryModel,
                as: 'category',
                attributes: ['id', 'name', 'color', 'sla_hours']
            },
            {
                model: AdminModel,
                as: 'assignee',
                attributes: ['id', 'name', 'email']
            }
        ]
    };

    try {
        const tickets = await BaseRepo.baseList(ContactUsModel, params);
        if (!tickets) {
            return res.status(400).json({ error: 'Error fetching tickets' });
        }
        res.status(200).json(tickets);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// Get tickets assigned to current admin
module.exports.getMyTickets = async (req, res, next) => {
    const adminId = req.Admin.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const searchParams = {
        assigned_to: adminId
    };

    if (req.query.status) {
        searchParams.status = req.query.status;
    }

    const params = {
        searchParams,
        limit,
        offset,
        page,
        order: [["priority", "DESC"], ["createdAt", "ASC"]],
        include: [
            {
                model: TicketCategoryModel,
                as: 'category',
                attributes: ['id', 'name', 'color']
            }
        ]
    };

    try {
        const tickets = await BaseRepo.baseList(ContactUsModel, params);
        res.status(200).json(tickets);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// ==================== TICKET DETAILS ====================

// Get single ticket with full details
module.exports.getDetail = async (req, res, next) => {
    const { id } = req.params;

    try {
        const ticket = await ContactUsModel.findOne({
            where: { id },
            include: [
                {
                    model: TicketCategoryModel,
                    as: 'category',
                    attributes: ['id', 'name', 'color', 'sla_hours', 'description']
                },
                {
                    model: AdminModel,
                    as: 'assignee',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: TicketResponseModel,
                    as: 'responses',
                    include: [
                        {
                            model: AdminModel,
                            as: 'responder',
                            attributes: ['id', 'name', 'email']
                        }
                    ],
                    order: [['createdAt', 'ASC']]
                },
                {
                    model: TicketAttachmentModel,
                    as: 'attachments'
                }
            ]
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Mark as read
        if (!ticket.is_read) {
            await ticket.update({ is_read: true });
        }

        res.status(200).json(ticket);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// ==================== TICKET UPDATES ====================

// Update ticket (status, priority, assignment)
module.exports.update = async (req, res, next) => {
    const { id } = req.params;
    const { status, priority, category_id, assigned_to } = req.body;
    const adminId = req.Admin.id;

    try {
        const ticket = await ContactUsModel.findByPk(id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const updateData = {};
        const changes = [];

        if (status && status !== ticket.status) {
            updateData.status = status;
            changes.push(`Status changed to ${status}`);
            
            if (status === 'resolved') {
                updateData.resolved_at = new Date();
            }
            if (status === 'closed') {
                updateData.closed_at = new Date();
            }
        }

        if (priority && priority !== ticket.priority) {
            updateData.priority = priority;
            changes.push(`Priority changed to ${priority}`);
        }

        if (category_id !== undefined && category_id !== ticket.category_id) {
            updateData.category_id = category_id;
            changes.push(`Category updated`);
            
            // Recalculate due date based on new category SLA
            if (category_id) {
                const category = await TicketCategoryModel.findByPk(category_id);
                if (category && category.sla_hours) {
                    updateData.due_date = new Date(ticket.createdAt.getTime() + category.sla_hours * 60 * 60 * 1000);
                }
            }
        }

        if (assigned_to !== undefined && assigned_to !== ticket.assigned_to) {
            updateData.assigned_to = assigned_to;
            
            if (assigned_to) {
                const assignee = await AdminModel.findByPk(assigned_to);
                if (assignee) {
                    changes.push(`Assigned to ${assignee.name}`);
                    
                    // Send assignment notification email
                    try {
                        await sendTicketAssignmentEmail({
                            admin_email: assignee.email,
                            admin_name: assignee.name,
                            ticket_id: ticket.ticket_id,
                            subject: ticket.subject,
                            customer_name: ticket.name
                        });
                    } catch (emailError) {
                        console.error('Failed to send assignment email:', emailError);
                    }
                }
            } else {
                changes.push(`Ticket unassigned`);
            }
        }

        updateData.last_activity_at = new Date();

        await ticket.update(updateData);

        // Create system response for tracking changes
        if (changes.length > 0) {
            await TicketResponseModel.create({
                ticket_id: id,
                responder_id: adminId,
                responder_type: 'system',
                message: changes.join('. '),
                is_internal_note: true
            });
        }

        const updatedTicket = await ContactUsModel.findOne({
            where: { id },
            include: [
                { model: TicketCategoryModel, as: 'category' },
                { model: AdminModel, as: 'assignee', attributes: ['id', 'name', 'email'] }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Ticket updated successfully',
            data: updatedTicket
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// ==================== TICKET RESPONSES ====================

// Add response to ticket
module.exports.addResponse = async (req, res, next) => {
    const { id } = req.params;
    const { message, is_internal_note } = req.body;
    const adminId = req.Admin.id;

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    try {
        const ticket = await ContactUsModel.findByPk(id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Create response
        const response = await TicketResponseModel.create({
            ticket_id: id,
            responder_id: adminId,
            responder_type: 'admin',
            message,
            is_internal_note: is_internal_note || false
        });

        // Update ticket
        const ticketUpdate = {
            last_activity_at: new Date(),
            response_count: ticket.response_count + 1
        };

        // Track first response time
        if (!ticket.first_response_at && !is_internal_note) {
            ticketUpdate.first_response_at = new Date();
        }

        // Auto-change status to in_progress if was open
        if (ticket.status === 'open' && !is_internal_note) {
            ticketUpdate.status = 'in_progress';
        }

        await ticket.update(ticketUpdate);

        // Send email notification to customer (unless internal note)
        if (!is_internal_note) {
            try {
                const admin = await AdminModel.findByPk(adminId);
                await sendTicketResponseEmail({
                    email: ticket.email,
                    name: ticket.name,
                    ticket_id: ticket.ticket_id,
                    subject: ticket.subject,
                    response_message: message,
                    responder_name: admin ? admin.name : 'Support Team'
                });
                await response.update({ email_sent: true, email_sent_at: new Date() });
            } catch (emailError) {
                console.error('Failed to send response email:', emailError);
            }
        }

        // Get response with responder details
        const responseWithDetails = await TicketResponseModel.findOne({
            where: { id: response.id },
            include: [
                { model: AdminModel, as: 'responder', attributes: ['id', 'name', 'email'] }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Response added successfully',
            data: responseWithDetails
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// Get responses for a ticket
module.exports.getResponses = async (req, res, next) => {
    const { id } = req.params;
    const includeInternal = req.query.include_internal === 'true';

    try {
        const whereClause = { ticket_id: id };
        if (!includeInternal) {
            whereClause.is_internal_note = false;
        }

        const responses = await TicketResponseModel.findAll({
            where: whereClause,
            include: [
                { model: AdminModel, as: 'responder', attributes: ['id', 'name', 'email'] }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.status(200).json(responses);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// ==================== TICKET DELETION ====================

// Soft delete ticket
module.exports.delete = async (req, res, next) => {
    const { id } = req.params;

    try {
        const ticket = await ContactUsModel.findByPk(id);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        await ticket.destroy();

        res.status(200).json({
            success: true,
            message: 'Ticket deleted successfully'
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// ==================== DASHBOARD STATS ====================

// Get help desk statistics
module.exports.getStats = async (req, res, next) => {
    try {
        const [
            totalTickets,
            openTickets,
            inProgressTickets,
            resolvedTickets,
            closedTickets,
            urgentTickets,
            unassignedTickets,
            overdueTickets
        ] = await Promise.all([
            ContactUsModel.count(),
            ContactUsModel.count({ where: { status: 'open' } }),
            ContactUsModel.count({ where: { status: 'in_progress' } }),
            ContactUsModel.count({ where: { status: 'resolved' } }),
            ContactUsModel.count({ where: { status: 'closed' } }),
            ContactUsModel.count({ where: { priority: 'urgent', status: { [Op.notIn]: ['resolved', 'closed'] } } }),
            ContactUsModel.count({ where: { assigned_to: null, status: { [Op.notIn]: ['resolved', 'closed'] } } }),
            ContactUsModel.count({
                where: {
                    due_date: { [Op.lt]: new Date() },
                    status: { [Op.notIn]: ['resolved', 'closed'] }
                }
            })
        ]);

        // Get tickets by category
        const ticketsByCategory = await ContactUsModel.findAll({
            attributes: [
                'category_id',
                [ContactUsModel.sequelize.fn('COUNT', ContactUsModel.sequelize.col('ContactUsModel.id')), 'count']
            ],
            include: [{
                model: TicketCategoryModel,
                as: 'category',
                attributes: ['name', 'color']
            }],
            group: ['category_id', 'category.id', 'category.name', 'category.color'],
            raw: false
        });

        // Get recent tickets
        const recentTickets = await ContactUsModel.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [
                { model: TicketCategoryModel, as: 'category', attributes: ['name', 'color'] }
            ]
        });

        res.status(200).json({
            totals: {
                total: totalTickets,
                open: openTickets,
                in_progress: inProgressTickets,
                resolved: resolvedTickets,
                closed: closedTickets
            },
            alerts: {
                urgent: urgentTickets,
                unassigned: unassignedTickets,
                overdue: overdueTickets
            },
            by_category: ticketsByCategory,
            recent_tickets: recentTickets
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// ==================== PUBLIC TICKET TRACKING ====================

// Track ticket by email and ticket_id (public)
module.exports.trackTicket = async (req, res, next) => {
    const { ticket_id, email } = req.body;

    try {
        const ticket = await ContactUsModel.findOne({
            where: {
                ticket_id,
                email: email.toLowerCase()
            },
            attributes: ['id', 'ticket_id', 'name', 'email', 'subject', 'message', 'status', 'priority', 'createdAt', 'resolved_at', 'response_count'],
            include: [
                {
                    model: TicketCategoryModel,
                    as: 'category',
                    attributes: ['name', 'color']
                },
                {
                    model: TicketResponseModel,
                    as: 'responses',
                    where: { is_internal_note: false },
                    required: false,
                    attributes: ['message', 'responder_type', 'createdAt'],
                    include: [
                        { model: AdminModel, as: 'responder', attributes: ['name'] }
                    ],
                    order: [['createdAt', 'ASC']]
                }
            ]
        });

        if (!ticket) {
            return res.status(404).json({ 
                error: 'Ticket not found. Please check your ticket ID and email address.' 
            });
        }

        res.status(200).json(ticket);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// Customer reply to ticket (public)
module.exports.customerReply = async (req, res, next) => {
    const { ticket_id, email, message } = req.body;

    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    try {
        const ticket = await ContactUsModel.findOne({
            where: {
                ticket_id,
                email: email.toLowerCase()
            }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Create customer response
        const response = await TicketResponseModel.create({
            ticket_id: ticket.id,
            responder_type: 'customer',
            message
        });

        // Update ticket
        await ticket.update({
            last_activity_at: new Date(),
            status: ticket.status === 'awaiting_response' ? 'in_progress' : ticket.status
        });

        res.status(201).json({
            success: true,
            message: 'Your reply has been submitted',
            data: response
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// Submit satisfaction rating (public)
module.exports.submitRating = async (req, res, next) => {
    const { ticket_id, email, rating, feedback } = req.body;

    try {
        const ticket = await ContactUsModel.findOne({
            where: {
                ticket_id,
                email: email.toLowerCase(),
                status: { [Op.in]: ['resolved', 'closed'] }
            }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found or not yet resolved' });
        }

        await ticket.update({
            satisfaction_rating: rating,
            satisfaction_feedback: feedback
        });

        res.status(200).json({
            success: true,
            message: 'Thank you for your feedback!'
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// ==================== CATEGORY MANAGEMENT ====================

// Get all categories (public - for contact form)
module.exports.getCategories = async (req, res, next) => {
    try {
        const categories = await TicketCategoryModel.findAll({
            where: { is_active: true },
            order: [['display_order', 'ASC'], ['name', 'ASC']],
            attributes: ['id', 'name', 'description', 'color']
        });

        res.status(200).json(categories);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// Get all categories with stats (Admin)
module.exports.getCategoriesAdmin = async (req, res, next) => {
    try {
        const categories = await TicketCategoryModel.findAll({
            order: [['display_order', 'ASC'], ['name', 'ASC']],
            include: [{
                model: ContactUsModel,
                as: 'tickets',
                attributes: []
            }],
            attributes: {
                include: [
                    [ContactUsModel.sequelize.fn('COUNT', ContactUsModel.sequelize.col('tickets.id')), 'ticket_count']
                ]
            },
            group: ['TicketCategoryModel.id']
        });

        res.status(200).json(categories);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// Create category (Admin)
module.exports.createCategory = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ error: error.array() });
    }

    try {
        const category = await BaseRepo.baseCreate(TicketCategoryModel, req.body);
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// Update category (Admin)
module.exports.updateCategory = async (req, res, next) => {
    const { id } = req.params;

    try {
        const category = await TicketCategoryModel.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        await category.update(req.body);

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// Delete category (Admin)
module.exports.deleteCategory = async (req, res, next) => {
    const { id } = req.params;

    try {
        const category = await TicketCategoryModel.findByPk(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if category has tickets
        const ticketCount = await ContactUsModel.count({ where: { category_id: id } });
        if (ticketCount > 0) {
            return res.status(400).json({ 
                error: `Cannot delete category with ${ticketCount} associated tickets. Please reassign tickets first.` 
            });
        }

        await category.destroy();

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};

// ==================== ADMIN LIST FOR ASSIGNMENT ====================

// Get admins for assignment dropdown
module.exports.getAdmins = async (req, res, next) => {
    try {
        const admins = await AdminModel.findAll({
            attributes: ['id', 'name', 'email'],
            order: [['name', 'ASC']]
        });

        res.status(200).json(admins);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'internal server error' });
    }
};
