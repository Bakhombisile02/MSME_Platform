/**
 * Help Desk Routes
 * 
 * Handles support tickets, categories, and responses
 */

import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { authAdmin, authUser, optionalAuth } from '../middleware/auth.middleware';
import { handleValidationErrors, validateIdParam } from '../middleware/validation.middleware';
import { FirestoreRepo } from '../services/FirestoreRepository';
import { sendHelpdeskEmail } from '../services/emailService';
import { 
  COLLECTIONS, 
  Ticket, 
  TicketResponse, 
  TicketCategory,
  TicketStatus,
  TicketPriority 
} from '../models/schemas';

const router = Router();
const db = getFirestore();

// =============================================================================
// TICKET CATEGORIES
// =============================================================================

router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    const result = await FirestoreRepo.list<TicketCategory>(
      COLLECTIONS.TICKET_CATEGORIES,
      {
        searchParams: { is_active: true },
        orderBy: 'order',
        orderDirection: 'asc',
      }
    );
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error listing ticket categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/categories/add', authAdmin, [
  body('name').notEmpty().withMessage('Category name is required'),
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const category = await FirestoreRepo.create<TicketCategory>(
      COLLECTIONS.TICKET_CATEGORIES,
      {
        ...req.body,
        is_active: true,
        ticketCount: 0,
      }
    );
    
    res.status(201).json({
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error creating ticket category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/categories/update/:id', authAdmin, validateIdParam('id'), handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const updated = await FirestoreRepo.update<TicketCategory>(
        COLLECTIONS.TICKET_CATEGORIES,
        req.params.id,
        req.body
      );
      
      if (!updated) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category updated successfully', data: updated });
    } catch (error) {
      console.error('Error updating ticket category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// =============================================================================
// TICKETS
// =============================================================================

/**
 * Generate ticket ID like "TKT-2026-0001"
 */
async function generateTicketId(): Promise<string> {
  const year = new Date().getFullYear();
  const counterRef = db.collection(COLLECTIONS.COUNTERS).doc(`tickets_${year}`);
  
  const result = await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let count = 1;
    
    if (counterDoc.exists) {
      count = (counterDoc.data()?.count || 0) + 1;
    }
    
    transaction.set(counterRef, { count, lastUpdated: Timestamp.now() });
    return count;
  });
  
  return `TKT-${year}-${result.toString().padStart(4, '0')}`;
}

/**
 * GET /api/contact/list (admin) or /api/helpdesk/tickets
 * List all tickets
 */
router.get('/tickets', authAdmin, async (req: Request, res: Response) => {
  try {
    const { status, priority, assigned_to } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    const searchParams: any = {};
    if (status) searchParams.status = status;
    if (priority) searchParams.priority = priority;
    if (assigned_to) searchParams.assigned_to = assigned_to;
    
    const result = await FirestoreRepo.list<Ticket>(
      COLLECTIONS.TICKETS,
      {
        searchParams,
        limit,
        offset,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      }
    );
    
    res.json({
      data: result.rows,
      pagination: {
        page: result.currentPage,
        limit,
        totalPages: result.totalPages,
        totalCount: result.count,
      }
    });
  } catch (error) {
    console.error('Error listing tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/helpdesk/my-tickets
 * List user's own tickets - requires authentication
 */
router.get('/my-tickets', authUser, async (req: Request, res: Response) => {
  try {
    // Use authenticated user's email from token, not query param (IDOR protection)
    const authenticatedEmail = req.user?.email;
    
    if (!authenticatedEmail) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // If client provides email param, verify it matches authenticated user
    const queryEmail = req.query.email as string;
    if (queryEmail && queryEmail.toLowerCase() !== authenticatedEmail.toLowerCase()) {
      return res.status(403).json({ error: 'Cannot access tickets for other users' });
    }
    
    const result = await FirestoreRepo.list<Ticket>(
      COLLECTIONS.TICKETS,
      {
        searchParams: { email: authenticatedEmail },
        orderBy: 'createdAt',
        orderDirection: 'desc',
      }
    );
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error listing user tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/helpdesk/ticket/:id
 * Get ticket details with responses
 */
router.get('/ticket/:id', validateIdParam('id'), handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const ticket = await FirestoreRepo.findById<Ticket>(
        COLLECTIONS.TICKETS,
        req.params.id
      );
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      // Get responses
      const responses = await FirestoreRepo.listFromSubcollection<TicketResponse>(
        COLLECTIONS.TICKETS,
        req.params.id,
        'responses'
      );
      
      res.json({
        data: {
          ...ticket,
          responses,
        }
      });
    } catch (error) {
      console.error('Error getting ticket:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/contact/add or /api/helpdesk/create
 * Create new ticket
 */
router.post('/create', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message, category_id } = req.body;
    
    // Generate ticket ID
    const ticket_id = await generateTicketId();
    
    // Get category name if provided
    let category_name: string | undefined;
    if (category_id) {
      const category = await FirestoreRepo.findById<TicketCategory>(
        COLLECTIONS.TICKET_CATEGORIES,
        category_id
      );
      category_name = category?.name;
    }
    
    const ticket = await FirestoreRepo.create<Ticket>(
      COLLECTIONS.TICKETS,
      {
        ticket_id,
        name,
        email,
        phone,
        subject,
        message,
        category_id,
        category_name,
        status: 'open' as TicketStatus,
        priority: 'medium' as TicketPriority,
      }
    );
    
    // Update category count
    if (category_id) {
      await FirestoreRepo.incrementField(
        COLLECTIONS.TICKET_CATEGORIES,
        category_id,
        'ticketCount',
        1
      );
    }
    
    // Send confirmation email
    await sendHelpdeskEmail('ticketCreated', ticket, email);
    
    res.status(201).json({
      message: 'Ticket created successfully',
      data: {
        ticket_id,
        id: ticket.id,
      }
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/helpdesk/ticket/:id/status
 * Update ticket status (admin only)
 */
router.put('/ticket/:id/status', authAdmin, validateIdParam('id'), [
  body('status').isIn(['open', 'in_progress', 'pending', 'resolved', 'closed']),
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { status, resolution_notes } = req.body;
    
    const ticket = await FirestoreRepo.findById<Ticket>(
      COLLECTIONS.TICKETS,
      req.params.id
    );
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const updateData: Partial<Ticket> = { status };
    
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = Timestamp.now();
      updateData.resolution_notes = resolution_notes;
    }
    
    const updated = await FirestoreRepo.update<Ticket>(
      COLLECTIONS.TICKETS,
      req.params.id,
      updateData
    );
    
    // Send status notification email
    await sendHelpdeskEmail('ticketStatusChanged', {
      ...ticket,
      status,
      resolution_notes,
    }, ticket.email);
    
    res.json({ message: 'Ticket status updated', data: updated });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/helpdesk/ticket/:id/assign
 * Assign ticket to admin
 */
router.put('/ticket/:id/assign', authAdmin, validateIdParam('id'), [
  body('assigned_to').notEmpty(),
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { assigned_to, assigned_to_name } = req.body;
    
    const updated = await FirestoreRepo.update<Ticket>(
      COLLECTIONS.TICKETS,
      req.params.id,
      {
        assigned_to,
        assigned_to_name,
        assigned_at: Timestamp.now(),
        status: 'in_progress' as TicketStatus,
      }
    );
    
    if (!updated) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ message: 'Ticket assigned', data: updated });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/helpdesk/ticket/:id/response
 * Add response to ticket (admin only)
 */
router.post('/ticket/:id/response', authAdmin, validateIdParam('id'), [
  body('message').notEmpty().withMessage('Message is required'),
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { message, is_internal = false } = req.body;
    
    const ticket = await FirestoreRepo.findById<Ticket>(
      COLLECTIONS.TICKETS,
      req.params.id
    );
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const response = await FirestoreRepo.createInSubcollection<TicketResponse>(
      COLLECTIONS.TICKETS,
      req.params.id,
      'responses',
      {
        ticket_id: req.params.id,
        message,
        responder_type: 'admin',
        responder_id: req.admin?.id,
        responder_name: req.admin?.name,
        is_internal,
      }
    );
    
    // Send email notification if not internal
    if (!is_internal) {
      await sendHelpdeskEmail('ticketResponse', {
        ...ticket,
        response_message: message,
      }, ticket.email);
    }
    
    res.status(201).json({
      message: 'Response added',
      data: response,
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/helpdesk/stats
 * Get ticket statistics (admin only)
 */
router.get('/stats', authAdmin, async (req: Request, res: Response) => {
  try {
    const [open, inProgress, pending, resolved, closed] = await Promise.all([
      FirestoreRepo.countByField(COLLECTIONS.TICKETS, 'status', 'open'),
      FirestoreRepo.countByField(COLLECTIONS.TICKETS, 'status', 'in_progress'),
      FirestoreRepo.countByField(COLLECTIONS.TICKETS, 'status', 'pending'),
      FirestoreRepo.countByField(COLLECTIONS.TICKETS, 'status', 'resolved'),
      FirestoreRepo.countByField(COLLECTIONS.TICKETS, 'status', 'closed'),
    ]);
    
    res.json({
      data: {
        open,
        in_progress: inProgress,
        pending,
        resolved,
        closed,
        total: open + inProgress + pending + resolved + closed,
      }
    });
  } catch (error) {
    console.error('Error getting ticket stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Legacy route mapping for /api/contact
router.get('/list', authAdmin, async (req: Request, res: Response) => {
  try {
    // Forward to tickets list
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await FirestoreRepo.list<Ticket>(COLLECTIONS.TICKETS, {
      limit,
      offset: (page - 1) * limit,
      orderBy: 'createdAt',
      orderDirection: 'desc',
    });
    
    res.json({ data: result.rows, pagination: { page, totalPages: result.totalPages, totalCount: result.count } });
  } catch (error) {
    console.error('Error listing tickets:', error);
    res.status(500).json({ error: 'Failed to list tickets' });
  }
});

router.post('/add', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    // Forward to create
    const ticket = await FirestoreRepo.create<Ticket>(COLLECTIONS.TICKETS, {
      ...req.body,
      status: 'open',
      priority: 'medium',
    });
    res.status(201).json({ message: 'Ticket created', data: ticket });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// =============================================================================
// ADMIN ROUTES (CMS compatibility)
// =============================================================================

/**
 * GET /api/contact/categories/admin
 * Get all categories (including inactive) for admin management
 */
router.get('/categories/admin', authAdmin, async (req: Request, res: Response) => {
  try {
    const result = await FirestoreRepo.list<TicketCategory>(
      COLLECTIONS.TICKET_CATEGORIES,
      {
        orderBy: 'display_order',
        orderDirection: 'asc',
        limit: 100,
      }
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing ticket categories for admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/contact/categories
 * Create a new ticket category
 */
router.post('/categories', authAdmin, [
  body('name').notEmpty().withMessage('Category name is required'),
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const category = await FirestoreRepo.create<TicketCategory>(
      COLLECTIONS.TICKET_CATEGORIES,
      {
        name: req.body.name,
        description: req.body.description || '',
        color: req.body.color || '#3B82F6',
        sla_hours: req.body.sla_hours || 48,
        is_active: req.body.is_active !== false,
        display_order: req.body.display_order || 0,
        ticket_count: 0,
      }
    );
    
    res.status(201).json({
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error creating ticket category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/contact/categories/:id
 * Update a ticket category
 */
router.put('/categories/:id', authAdmin, validateIdParam('id'), handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const updated = await FirestoreRepo.update<TicketCategory>(
        COLLECTIONS.TICKET_CATEGORIES,
        req.params.id,
        req.body
      );
      
      if (!updated) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category updated successfully', data: updated });
    } catch (error) {
      console.error('Error updating ticket category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/contact/categories/:id
 * Delete a ticket category
 */
router.delete('/categories/:id', authAdmin, validateIdParam('id'), handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const deleted = await FirestoreRepo.softDelete(
        COLLECTIONS.TICKET_CATEGORIES,
        req.params.id
      );
      
      if (!deleted) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting ticket category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/contact/admins
 * Get list of admin users for ticket assignment
 */
router.get('/admins', authAdmin, async (req: Request, res: Response) => {
  try {
    const result = await FirestoreRepo.list<any>(
      COLLECTIONS.ADMINS,
      {
        limit: 100,
      }
    );
    
    // Return only necessary fields for assignment dropdown
    const admins = result.rows.map(admin => ({
      id: admin.id,
      name: admin.name || admin.email,
      email: admin.email,
    }));
    
    res.json(admins);
  } catch (error) {
    console.error('Error listing admins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/contact/detail/:id
 * Get ticket details including responses
 */
router.get('/detail/:id', authAdmin, validateIdParam('id'), handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const ticket = await FirestoreRepo.findById<Ticket>(
        COLLECTIONS.TICKETS,
        req.params.id
      );
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      // Get responses for this ticket
      const responses = await FirestoreRepo.list<TicketResponse>(
        COLLECTIONS.TICKET_RESPONSES,
        {
          searchParams: { ticket_id: req.params.id },
          orderBy: 'createdAt',
          orderDirection: 'asc',
        }
      );
      
      // Get category if exists
      let category = null;
      if (ticket.category_id) {
        category = await FirestoreRepo.findById<TicketCategory>(
          COLLECTIONS.TICKET_CATEGORIES,
          ticket.category_id
        );
      }
      
      // Mark as read
      if (!ticket.is_read) {
        await FirestoreRepo.update(COLLECTIONS.TICKETS, req.params.id, { is_read: true });
      }
      
      res.json({
        ...ticket,
        responses: responses.rows,
        category,
      });
    } catch (error) {
      console.error('Error getting ticket detail:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/contact/update/:id
 * Update ticket fields (status, priority, assignment, etc.)
 */
router.put('/update/:id', authAdmin, validateIdParam('id'), handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const allowedFields = ['status', 'priority', 'assigned_to', 'category_id', 'due_date', 'is_read'];
      const updateData: any = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      // Track status changes
      if (updateData.status) {
        updateData.last_activity_at = Timestamp.now();
        if (updateData.status === 'resolved') {
          updateData.resolved_at = Timestamp.now();
        }
      }
      
      const updated = await FirestoreRepo.update<Ticket>(
        COLLECTIONS.TICKETS,
        req.params.id,
        updateData
      );
      
      if (!updated) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      res.json({ message: 'Ticket updated successfully', data: updated });
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/contact/delete/:id
 * Delete a ticket
 */
router.delete('/delete/:id', authAdmin, validateIdParam('id'), handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const deleted = await FirestoreRepo.softDelete(
        COLLECTIONS.TICKETS,
        req.params.id
      );
      
      if (!deleted) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/contact/respond/:id
 * Add a response to a ticket
 */
router.post('/respond/:id', authAdmin, validateIdParam('id'), [
  body('message').notEmpty().withMessage('Response message is required'),
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const ticket = await FirestoreRepo.findById<Ticket>(
      COLLECTIONS.TICKETS,
      req.params.id
    );
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const isInternalNote = req.body.is_internal_note === true;
    
    // Create response
    const response = await FirestoreRepo.create<TicketResponse>(
      COLLECTIONS.TICKET_RESPONSES,
      {
        ticket_id: req.params.id,
        message: req.body.message,
        responder_type: 'admin',
        responder_id: (req as any).admin?.id,
        is_internal_note: isInternalNote,
        email_sent: false,
      }
    );
    
    // Update ticket
    const ticketUpdate: any = {
      response_count: (ticket.response_count || 0) + 1,
      last_activity_at: Timestamp.now(),
    };
    
    if (!ticket.first_response_at) {
      ticketUpdate.first_response_at = Timestamp.now();
    }
    
    // Change status to awaiting_response if not internal note
    if (!isInternalNote && ticket.status === 'open') {
      ticketUpdate.status = 'awaiting_response';
    }
    
    await FirestoreRepo.update(COLLECTIONS.TICKETS, req.params.id, ticketUpdate);
    
    // Send email if not internal note
    if (!isInternalNote && ticket.email) {
      try {
        await sendHelpdeskEmail('ticketResponse', {
          ...ticket,
          responseMessage: req.body.message,
        }, ticket.email);
        
        await FirestoreRepo.update(COLLECTIONS.TICKET_RESPONSES, response.id, {
          email_sent: true,
          email_sent_at: Timestamp.now(),
        });
      } catch (emailError) {
        console.error('Error sending response email:', emailError);
      }
    }
    
    res.status(201).json({
      message: isInternalNote ? 'Internal note added' : 'Response sent successfully',
      data: response,
    });
  } catch (error) {
    console.error('Error adding ticket response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
