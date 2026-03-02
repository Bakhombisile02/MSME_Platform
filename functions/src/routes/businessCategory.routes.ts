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

const isSubCategoryRoute = (req: Request) => {
  const routePath = `${req.baseUrl || ''}${req.path || ''}`;
  return routePath.includes('/business-sub-category');
};

const normalizeSubCategory = (item: any) => {
  const normalizedCategoryId = String(item.category_id ?? item.BusinessCategorieId ?? '');
  const normalizedCategoryName = item.category_name || item.BusinessCategorieName || '';
  const normalizedSubCategoryName = item.sub_category_name || item.name || '';

  return {
    ...item,
    name: item.name || normalizedSubCategoryName,
    BusinessCategorieId: item.BusinessCategorieId ?? normalizedCategoryId,
    BusinessCategorieName: item.BusinessCategorieName || normalizedCategoryName,
    sub_category_name: normalizedSubCategoryName,
    category_id: normalizedCategoryId,
    category_name: normalizedCategoryName,
  };
};

// =============================================================================
// BUSINESS CATEGORIES
// =============================================================================

/**
 * GET /api/business-category/list
 * List all categories
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    if (isSubCategoryRoute(req)) {
      const { category_id, BusinessCategorieId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = (page - 1) * limit;

      const params: any = {
        limit,
        offset,
        orderBy: 'name',
        orderDirection: 'asc',
      };

      const filterCategoryId = String(category_id || BusinessCategorieId || '').trim();
      if (filterCategoryId) {
        params.searchParams = { BusinessCategorieId: filterCategoryId };
      }

      const subResult = await FirestoreRepo.list<BusinessSubCategory>(
        COLLECTIONS.BUSINESS_SUB_CATEGORIES,
        params
      );

      const rows = subResult.rows.map((row: any) => normalizeSubCategory(row));

      return res.json({
        values: {
          rows,
          count: subResult.count,
        },
        page: subResult.currentPage,
        limit,
        total_pages: subResult.totalPages,
        total: subResult.count,
      });
    }

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
  [body('category_name').optional(), body('name').optional()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      if (isSubCategoryRoute(req)) {
        const subCategoryName = req.body.sub_category_name || req.body.name;
        const categoryId = req.body.category_id || req.body.BusinessCategorieId;
        const categoryName = req.body.category_name || req.body.BusinessCategorieName;

        if (!subCategoryName || !categoryId) {
          return res.status(400).json({ error: 'Sub-category name and category ID are required' });
        }

        const subCategory = await FirestoreRepo.create<BusinessSubCategory>(
          COLLECTIONS.BUSINESS_SUB_CATEGORIES,
          {
            name: subCategoryName,
            sub_category_name: subCategoryName,
            BusinessCategorieId: String(categoryId),
            category_id: String(categoryId),
            BusinessCategorieName: categoryName || '',
            category_name: categoryName || '',
            description: req.body.description || '',
          }
        );

        return res.status(201).json({
          message: 'Sub-category created successfully',
          data: normalizeSubCategory(subCategory),
        });
      }

      const { category_name, category_image, description } = req.body;
      const resolvedName = category_name || req.body.name;
      const resolvedImage = category_image || req.body.icon_url;

      if (!resolvedName) {
        return res.status(400).json({ error: 'Category name is required' });
      }
      
      const category = await FirestoreRepo.create<BusinessCategory>(
        COLLECTIONS.BUSINESS_CATEGORIES,
        {
          category_name: resolvedName,
          name: resolvedName,
          category_image: resolvedImage,
          icon_url: resolvedImage,
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
      if (isSubCategoryRoute(req)) {
        const subCategoryName = req.body.sub_category_name || req.body.name;
        const categoryId = req.body.category_id || req.body.BusinessCategorieId;
        const categoryName = req.body.category_name || req.body.BusinessCategorieName;

        const updatedSubCategory = await FirestoreRepo.update<BusinessSubCategory>(
          COLLECTIONS.BUSINESS_SUB_CATEGORIES,
          req.params.id,
          {
            ...(subCategoryName ? { name: subCategoryName, sub_category_name: subCategoryName } : {}),
            ...(categoryId ? { BusinessCategorieId: String(categoryId), category_id: String(categoryId) } : {}),
            ...(categoryName ? { BusinessCategorieName: categoryName, category_name: categoryName } : {}),
            ...(req.body.description !== undefined ? { description: req.body.description } : {}),
          }
        );

        if (!updatedSubCategory) {
          return res.status(404).json({ error: 'Sub-category not found' });
        }

        return res.json({
          message: 'Sub-category updated successfully',
          data: normalizeSubCategory(updatedSubCategory),
        });
      }

      const { category_name, category_image, description } = req.body;
      const resolvedName = category_name || req.body.name;
      const resolvedImage = category_image || req.body.icon_url;
      
      const updated = await FirestoreRepo.update<BusinessCategory>(
        COLLECTIONS.BUSINESS_CATEGORIES,
        req.params.id,
        {
          ...(resolvedName ? { category_name: resolvedName, name: resolvedName } : {}),
          ...(resolvedImage ? { category_image: resolvedImage, icon_url: resolvedImage } : {}),
          ...(description !== undefined ? { description } : {}),
        }
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
      if (isSubCategoryRoute(req)) {
        const deletedSub = await FirestoreRepo.softDelete(
          COLLECTIONS.BUSINESS_SUB_CATEGORIES,
          req.params.id
        );

        if (!deletedSub) {
          return res.status(404).json({ error: 'Sub-category not found' });
        }

        return res.json({ message: 'Sub-category deleted successfully' });
      }

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

// Legacy CMS compatibility (uses PUT for soft delete)
router.put('/delete/:id',
  authAdmin,
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const collectionName = isSubCategoryRoute(req)
        ? COLLECTIONS.BUSINESS_SUB_CATEGORIES
        : COLLECTIONS.BUSINESS_CATEGORIES;

      const deleted = await FirestoreRepo.softDelete(collectionName, req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: 'Item not found' });
      }

      return res.json({ message: 'Deleted successfully' });
    } catch (error) {
      console.error('Error deleting item:', error);
      return res.status(500).json({ error: 'Internal server error' });
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
        limit: 500,
        offset: 0,
        orderBy: 'name',
        orderDirection: 'asc',
      }
    );

    const rows = result.rows
      .map((row: any) => normalizeSubCategory(row))
      .filter((row: any) => String(row.category_id) === String(BusinessCategorieId));
    
    // Match the old backend response format
    res.json({
      values: {
        rows,
        count: rows.length,
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
    const rows = result.rows.map((row: any) => normalizeSubCategory(row));
    
    // Match the old backend response format
    res.json({
      values: {
        rows,
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
