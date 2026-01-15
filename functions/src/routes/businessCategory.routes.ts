/**
 * Business Category Routes
 * 
 * Port of MSME-Backend/routers/businessCategories.js
 */

import { Router, Request, Response } from 'express';
import { body } from 'express-validator';

import { authAdmin } from '../middleware/auth.middleware';
import { handleValidationErrors, validateIdParam } from '../middleware/validation.middleware';
import { FirestoreRepo } from '../services/FirestoreRepository';
import { COLLECTIONS, BusinessCategory, BusinessSubCategory } from '../models/schemas';

const router = Router();

// =============================================================================
// BUSINESS CATEGORIES
// =============================================================================

/**
 * GET /api/business-category/list
 * List all categories
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = (page - 1) * limit;
    
    const result = await FirestoreRepo.list<BusinessCategory>(
      COLLECTIONS.BUSINESS_CATEGORIES,
      {
        limit,
        offset,
        orderBy: 'name',
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
    console.error('Error listing categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/business-category/:id
 * Get category by ID
 */
router.get('/:id',
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const category = await FirestoreRepo.findById<BusinessCategory>(
        COLLECTIONS.BUSINESS_CATEGORIES,
        req.params.id
      );
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ data: category });
    } catch (error) {
      console.error('Error getting category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/business-category/add
 * Create new category (admin only)
 */
router.post('/add',
  authAdmin,
  [body('category_name').notEmpty().withMessage('Category name is required')],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { category_name, category_image, description } = req.body;
      
      const category = await FirestoreRepo.create<BusinessCategory>(
        COLLECTIONS.BUSINESS_CATEGORIES,
        {
          category_name,
          category_image,
          description,
          businessCount: 0,
        }
      );
      
      res.status(201).json({
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/business-category/update/:id
 * Update category (admin only)
 */
router.put('/update/:id',
  authAdmin,
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { category_name, category_image, description } = req.body;
      
      const updated = await FirestoreRepo.update<BusinessCategory>(
        COLLECTIONS.BUSINESS_CATEGORIES,
        req.params.id,
        { category_name, category_image, description }
      );
      
      if (!updated) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({
        message: 'Category updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/business-category/delete/:id
 * Delete category (admin only)
 */
router.delete('/delete/:id',
  authAdmin,
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const deleted = await FirestoreRepo.softDelete(
        COLLECTIONS.BUSINESS_CATEGORIES,
        req.params.id
      );
      
      if (!deleted) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// =============================================================================
// BUSINESS SUB-CATEGORIES
// =============================================================================

/**
 * GET /api/business-sub-category/list-according-to-business-id/:BusinessCategorieId
 * List sub-categories by business category ID
 * Note: This route is mounted at /business-sub-category, so path is just /list-according-to-business-id
 */
router.get('/list-according-to-business-id/:BusinessCategorieId', async (req: Request, res: Response) => {
  try {
    const { BusinessCategorieId } = req.params;
    
    const result = await FirestoreRepo.list<BusinessSubCategory>(
      COLLECTIONS.BUSINESS_SUB_CATEGORIES,
      {
        searchParams: { category_id: BusinessCategorieId },
        limit: 100,
        offset: 0,
        orderBy: 'sub_category_name',
        orderDirection: 'asc',
      }
    );
    
    // Match the old backend response format
    res.json({
      values: {
        rows: result.rows,
        count: result.count,
      },
    });
  } catch (error: any) {
    console.error('Error listing sub-categories by business category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/business-sub-category/list
 * List all sub-categories
 */
router.get('/sub/list', async (req: Request, res: Response) => {
  try {
    const { category_id } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = (page - 1) * limit;
    
    const params: any = {
      limit,
      offset,
      orderBy: 'sub_category_name',
      orderDirection: 'asc',
    };
    
    if (category_id) {
      params.searchParams = { category_id };
    }
    
    const result = await FirestoreRepo.list<BusinessSubCategory>(
      COLLECTIONS.BUSINESS_SUB_CATEGORIES,
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
    console.error('Error listing sub-categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/business-sub-category/add
 * Create new sub-category (admin only)
 */
router.post('/sub/add',
  authAdmin,
  [
    body('sub_category_name').notEmpty().withMessage('Sub-category name is required'),
    body('category_id').notEmpty().withMessage('Category ID is required'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { sub_category_name, category_id, description } = req.body;
      
      // Get parent category name for denormalization
      const category = await FirestoreRepo.findById<BusinessCategory>(
        COLLECTIONS.BUSINESS_CATEGORIES,
        category_id
      );
      
      // Verify parent category exists
      if (!category) {
        return res.status(404).json({ error: 'Parent category not found' });
      }
      
      const subCategory = await FirestoreRepo.create<BusinessSubCategory>(
        COLLECTIONS.BUSINESS_SUB_CATEGORIES,
        {
          sub_category_name,
          category_id,
          category_name: category.category_name,
          description,
        }
      );
      
      res.status(201).json({
        message: 'Sub-category created successfully',
        data: subCategory,
      });
    } catch (error) {
      console.error('Error creating sub-category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/business-sub-category/update/:id
 * Update sub-category (admin only)
 */
router.put('/sub/update/:id',
  authAdmin,
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { sub_category_name, description } = req.body;
      
      const updated = await FirestoreRepo.update<BusinessSubCategory>(
        COLLECTIONS.BUSINESS_SUB_CATEGORIES,
        req.params.id,
        { sub_category_name, description }
      );
      
      if (!updated) {
        return res.status(404).json({ error: 'Sub-category not found' });
      }
      
      res.json({
        message: 'Sub-category updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Error updating sub-category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/business-sub-category/delete/:id
 * Delete sub-category (admin only)
 */
router.delete('/sub/delete/:id',
  authAdmin,
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const deleted = await FirestoreRepo.softDelete(
        COLLECTIONS.BUSINESS_SUB_CATEGORIES,
        req.params.id
      );
      
      if (!deleted) {
        return res.status(404).json({ error: 'Sub-category not found' });
      }
      
      res.json({ message: 'Sub-category deleted successfully' });
    } catch (error) {
      console.error('Error deleting sub-category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
