/**
 * Content Routes
 * 
 * Handles FAQs, Blogs, Banners, Downloads, Partners, Team, Subscribers, Feedback
 */

import { Router, Request, Response } from 'express';
import { body } from 'express-validator';

import { authAdmin } from '../middleware/auth.middleware';
import { handleValidationErrors, validateIdParam } from '../middleware/validation.middleware';
import { FirestoreRepo } from '../services/FirestoreRepository';
import { 
  COLLECTIONS, 
  FAQ, 
  Blog, 
  HomeBanner, 
  Download, 
  PartnersLogo, 
  TeamMember,
  Subscriber,
  Feedback 
} from '../models/schemas';

const router = Router();

// =============================================================================
// HELPER: Generic CRUD factory
// =============================================================================

function createCRUD<T extends Record<string, any>>(
  collectionName: string,
  createValidation: any[] = [],
  defaultOrder: { field: string; direction: 'asc' | 'desc' } = { field: 'createdAt', direction: 'desc' }
) {
  return {
    list: async (req: Request, res: Response) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;
        
        const result = await FirestoreRepo.list<T>(collectionName, {
          limit,
          offset,
          orderBy: defaultOrder.field,
          orderDirection: defaultOrder.direction,
        });
        
        // Match the old backend response format: { values: { rows, count }, page, limit, total_pages, total }
        res.json({
          values: {
            rows: result.rows,
            count: result.count,
          },
          page: result.currentPage,
          limit,
          total_pages: result.totalPages,
          total: result.count,
        });
      } catch (error) {
        console.error(`Error listing ${collectionName}:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    },
    
    get: async (req: Request, res: Response) => {
      try {
        const item = await FirestoreRepo.findById<T>(collectionName, req.params.id);
        
        if (!item) {
          return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ data: item });
      } catch (error) {
        console.error(`Error getting ${collectionName}:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    },
    
    create: async (req: Request, res: Response) => {
      try {
        const item = await FirestoreRepo.create<T>(collectionName, req.body);
        
        res.status(201).json({
          message: 'Created successfully',
          data: item,
        });
      } catch (error) {
        console.error(`Error creating ${collectionName}:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    },
    
    update: async (req: Request, res: Response) => {
      try {
        const updated = await FirestoreRepo.update<T>(collectionName, req.params.id, req.body);
        
        if (!updated) {
          return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({
          message: 'Updated successfully',
          data: updated,
        });
      } catch (error) {
        console.error(`Error updating ${collectionName}:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    },
    
    delete: async (req: Request, res: Response) => {
      try {
        const deleted = await FirestoreRepo.softDelete(collectionName, req.params.id);
        
        if (!deleted) {
          return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json({ message: 'Deleted successfully' });
      } catch (error) {
        console.error(`Error deleting ${collectionName}:`, error);
        res.status(500).json({ error: 'Internal server error' });
      }
    },
  };
}

// =============================================================================
// FAQ ROUTES (/api/faq)
// =============================================================================

// Note: Using 'createdAt' as default ordering since 'order' field may not exist in migrated data
const faqCRUD = createCRUD<FAQ>(COLLECTIONS.FAQS, [], { field: 'createdAt', direction: 'desc' });
const blogCRUD = createCRUD<Blog>(COLLECTIONS.BLOGS);
const bannerCRUD = createCRUD<HomeBanner>(COLLECTIONS.HOME_BANNERS, [], { field: 'createdAt', direction: 'desc' });
const downloadCRUD = createCRUD<Download>(COLLECTIONS.DOWNLOADS);
const partnersCRUD = createCRUD<PartnersLogo>(COLLECTIONS.PARTNERS_LOGOS, [], { field: 'createdAt', direction: 'desc' });
// Using 'team_members' collection name as that's what the migration used
const teamCRUD = createCRUD<TeamMember>('team_members', [], { field: 'createdAt', direction: 'desc' });
const subscriberCRUD = createCRUD<Subscriber>(COLLECTIONS.SUBSCRIBERS, [], { field: 'createdAt', direction: 'desc' });
const feedbackCRUD = createCRUD<Feedback>(COLLECTIONS.FEEDBACK, [], { field: 'createdAt', direction: 'desc' });

// =============================================================================
// GENERIC ROUTES - /list, /add, /update/:id, /delete/:id
// These work when router is mounted at specific path like /api/home-banner
// =============================================================================

// Helper to determine which CRUD to use based on the original request URL
function getCRUDForPath(req: Request) {
  const originalUrl = req.originalUrl || req.baseUrl || '';
  
  if (originalUrl.includes('/faq')) return { crud: faqCRUD, name: 'FAQ' };
  if (originalUrl.includes('/blog')) return { crud: blogCRUD, name: 'Blog' };
  if (originalUrl.includes('/home-banner')) return { crud: bannerCRUD, name: 'Banner' };
  if (originalUrl.includes('/downloads')) return { crud: downloadCRUD, name: 'Download' };
  if (originalUrl.includes('/partners-logo')) return { crud: partnersCRUD, name: 'Partner' };
  if (originalUrl.includes('/team')) return { crud: teamCRUD, name: 'Team' };
  if (originalUrl.includes('/subscribe')) return { crud: subscriberCRUD, name: 'Subscriber' };
  if (originalUrl.includes('/feedback')) return { crud: feedbackCRUD, name: 'Feedback' };
  
  // Default to faq for backward compatibility
  return { crud: faqCRUD, name: 'Content' };
}

// Generic list route
router.get('/list', async (req: Request, res: Response) => {
  const { crud } = getCRUDForPath(req);
  return crud.list(req, res);
});

// Generic get by ID route
router.get('/:id', validateIdParam('id'), handleValidationErrors, async (req: Request, res: Response) => {
  const { crud } = getCRUDForPath(req);
  return crud.get(req, res);
});

// Generic add route (admin only)
router.post('/add', authAdmin, handleValidationErrors, async (req: Request, res: Response) => {
  const { crud } = getCRUDForPath(req);
  return crud.create(req, res);
});

// Generic update route (admin only)
router.put('/update/:id', authAdmin, validateIdParam('id'), handleValidationErrors, async (req: Request, res: Response) => {
  const { crud } = getCRUDForPath(req);
  return crud.update(req, res);
});

// Generic delete route (admin only)
router.delete('/delete/:id', authAdmin, validateIdParam('id'), handleValidationErrors, async (req: Request, res: Response) => {
  const { crud } = getCRUDForPath(req);
  return crud.delete(req, res);
});

// =============================================================================
// SUBSCRIBER ROUTES (/api/subscribe)
// When mounted at /api/subscribe, /add becomes /api/subscribe/add
// =============================================================================

router.get('/subscribe/list', authAdmin, async (req: Request, res: Response) => {
  try {
    const result = await FirestoreRepo.list<Subscriber>(COLLECTIONS.SUBSCRIBERS, {
      orderBy: 'createdAt',
      orderDirection: 'desc',
    });
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error listing subscribers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/subscribe/add', [
  body('email').isEmail().withMessage('Valid email required'),
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    // Check if already subscribed
    const existing = await FirestoreRepo.findOne<Subscriber>(
      COLLECTIONS.SUBSCRIBERS,
      'email',
      email
    );
    
    if (existing) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }
    
    const subscriber = await FirestoreRepo.create<Subscriber>(
      COLLECTIONS.SUBSCRIBERS,
      {
        email,
        subscribed_at: require('firebase-admin/firestore').Timestamp.now(),
        is_active: true,
      }
    );
    
    res.status(201).json({
      message: 'Subscribed successfully',
      data: subscriber,
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// FEEDBACK ROUTES (/api/feedback)
// =============================================================================

router.get('/feedback/list', authAdmin, async (req: Request, res: Response) => {
  try {
    const result = await FirestoreRepo.list<Feedback>(COLLECTIONS.FEEDBACK, {
      orderBy: 'createdAt',
      orderDirection: 'desc',
    });
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error listing feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/feedback/add', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('message').notEmpty(),
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const feedback = await FirestoreRepo.create<Feedback>(
      COLLECTIONS.FEEDBACK,
      {
        ...req.body,
        is_read: false,
      }
    );
    
    res.status(201).json({
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/feedback/mark-read/:id', authAdmin, validateIdParam('id'), handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const updated = await FirestoreRepo.update<Feedback>(
        COLLECTIONS.FEEDBACK,
        req.params.id,
        { is_read: true }
      );
      
      if (!updated) {
        return res.status(404).json({ error: 'Feedback not found' });
      }
      
      res.json({ message: 'Marked as read', data: updated });
    } catch (error) {
      console.error('Error marking feedback as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
