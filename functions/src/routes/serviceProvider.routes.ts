/**
 * Service Provider Routes
 * 
 * Port of MSME-Backend/routers/serviceProviders.js and serviceProviderCategories.js
 */

import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

import { authAdmin } from '../middleware/auth.middleware';
import { handleValidationErrors, validateIdParam } from '../middleware/validation.middleware';
import { FirestoreRepo } from '../services/FirestoreRepository';
import { COLLECTIONS, ServiceProvider, ServiceProviderCategory } from '../models/schemas';

const router = Router();
const db = getFirestore();

// =============================================================================
// SERVICE PROVIDER CATEGORIES
// =============================================================================

/**
 * GET /api/service-provider-category/list
 */
router.get('/category/list', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = (page - 1) * limit;
    
    const result = await FirestoreRepo.list<ServiceProviderCategory>(
      COLLECTIONS.SERVICE_PROVIDER_CATEGORIES,
      {
        limit,
        offset,
        orderBy: 'category_name',
        orderDirection: 'asc',
      }
    );
    
    // Match the old backend response format
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
    console.error('Error listing SP categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/service-provider-category/add
 */
router.post('/category/add',
  authAdmin,
  [body('category_name').notEmpty()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { category_name, category_image, description } = req.body;
      
      const category = await FirestoreRepo.create<ServiceProviderCategory>(
        COLLECTIONS.SERVICE_PROVIDER_CATEGORIES,
        {
          category_name,
          category_image,
          description,
          providerCount: 0,
        }
      );
      
      res.status(201).json({
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      console.error('Error creating SP category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/service-provider-category/update/:id
 */
router.put('/category/update/:id',
  authAdmin,
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const updated = await FirestoreRepo.update<ServiceProviderCategory>(
        COLLECTIONS.SERVICE_PROVIDER_CATEGORIES,
        req.params.id,
        req.body
      );
      
      if (!updated) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category updated successfully', data: updated });
    } catch (error) {
      console.error('Error updating SP category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/service-provider-category/delete/:id
 */
router.delete('/category/delete/:id',
  authAdmin,
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const deleted = await FirestoreRepo.softDelete(
        COLLECTIONS.SERVICE_PROVIDER_CATEGORIES,
        req.params.id
      );
      
      if (!deleted) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting SP category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// =============================================================================
// SERVICE PROVIDERS
// =============================================================================

/**
 * GET /api/service-providers/list
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const { category_id } = req.query;
    
    const params: any = {
      limit,
      offset,
      orderBy: 'createdAt',
      orderDirection: 'desc',
    };
    
    if (category_id) {
      params.searchParams = { category_id };
    }
    
    const result = await FirestoreRepo.list<ServiceProvider>(
      COLLECTIONS.SERVICE_PROVIDERS,
      params
    );
    
    // Match the old backend response format
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
    console.error('Error listing service providers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/service-providers/:id
 */
router.get('/:id',
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const provider = await FirestoreRepo.findById<ServiceProvider>(
        COLLECTIONS.SERVICE_PROVIDERS,
        req.params.id
      );
      
      if (!provider) {
        return res.status(404).json({ error: 'Service provider not found' });
      }
      
      res.json({ data: provider });
    } catch (error) {
      console.error('Error getting service provider:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/service-providers/add
 */
router.post('/add',
  authAdmin,
  [
    body('service_name').notEmpty().withMessage('Service name is required'),
    body('category_id').notEmpty().withMessage('Category is required'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const data = req.body;
      
      // Use transaction to atomically create provider and increment count
      const provider = await db.runTransaction(async (transaction) => {
        // Get category for denormalization
        const categoryRef = db.collection(COLLECTIONS.SERVICE_PROVIDER_CATEGORIES).doc(data.category_id);
        const categoryDoc = await transaction.get(categoryRef);
        
        if (!categoryDoc.exists) {
          throw new Error('Category not found');
        }
        
        const category = categoryDoc.data() as ServiceProviderCategory;
        
        // Create provider document
        const providerRef = db.collection(COLLECTIONS.SERVICE_PROVIDERS).doc();
        const now = Timestamp.now();
        const providerData = {
          ...data,
          id: providerRef.id,
          category_name: category.category_name,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        
        transaction.set(providerRef, providerData);
        
        // Increment category count
        transaction.update(categoryRef, {
          providerCount: FieldValue.increment(1),
          updatedAt: now,
        });
        
        return providerData;
      });
      
      res.status(201).json({
        message: 'Service provider created successfully',
        data: provider,
      });
    } catch (error: any) {
      console.error('Error creating service provider:', error);
      if (error.message === 'Category not found') {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/service-providers/update/:id
 */
router.put('/update/:id',
  authAdmin,
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const updated = await FirestoreRepo.update<ServiceProvider>(
        COLLECTIONS.SERVICE_PROVIDERS,
        req.params.id,
        req.body
      );
      
      if (!updated) {
        return res.status(404).json({ error: 'Service provider not found' });
      }
      
      res.json({
        message: 'Service provider updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Error updating service provider:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/service-providers/delete/:id
 */
router.delete('/delete/:id',
  authAdmin,
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const providerId = req.params.id;
      
      // Use transaction to atomically soft-delete provider and decrement count
      await db.runTransaction(async (transaction) => {
        const providerRef = db.collection(COLLECTIONS.SERVICE_PROVIDERS).doc(providerId);
        const providerDoc = await transaction.get(providerRef);
        
        if (!providerDoc.exists) {
          throw new Error('Provider not found');
        }
        
        const provider = providerDoc.data() as ServiceProvider;
        
        // Soft delete the provider
        const now = Timestamp.now();
        transaction.update(providerRef, {
          deletedAt: now,
          updatedAt: now,
        });
        
        // Decrement category count if category exists
        if (provider.category_id) {
          const categoryRef = db.collection(COLLECTIONS.SERVICE_PROVIDER_CATEGORIES).doc(provider.category_id);
          transaction.update(categoryRef, {
            providerCount: FieldValue.increment(-1),
            updatedAt: now,
          });
        }
      });
      
      res.json({ message: 'Service provider deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting service provider:', error);
      if (error.message === 'Provider not found') {
        return res.status(404).json({ error: 'Service provider not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/service-providers/by-category/:category_id
 */
router.get('/by-category/:category_id', async (req: Request, res: Response) => {
  try {
    const { category_id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    const result = await FirestoreRepo.list<ServiceProvider>(
      COLLECTIONS.SERVICE_PROVIDERS,
      {
        searchParams: { category_id },
        limit,
        offset,
        orderBy: 'service_name',
        orderDirection: 'asc',
      }
    );
    
    // Match the old backend response format
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
    console.error('Error listing providers by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
