/**
 * Admin Routes
 * 
 * Port of MSME-Backend/routers/admin.js
 */

import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { getAuth } from 'firebase-admin/auth';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { authAdmin } from '../middleware/auth.middleware';
import { handleValidationErrors, adminValidation } from '../middleware/validation.middleware';
import { FirestoreRepo } from '../services/FirestoreRepository';
import { COLLECTIONS, Admin } from '../models/schemas';

const router = Router();
const auth = getAuth();

// JWT secret from environment - required for production
// Consider using Firebase Secret Manager for production deployments
function getJWTSecret(): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return process.env.JWT_SECRET;
}

/**
 * POST /api/admin/login
 * Admin login
 */
router.post('/login',
  adminValidation.login,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Find admin by email
      const admin = await FirestoreRepo.findOne<Admin>(
        COLLECTIONS.ADMINS,
        'email',
        email
      );
      
      if (!admin) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Create JWT token (same approach as old backend)
      const token = jwt.sign(
        { 
          id: admin.id, 
          email: admin.email, 
          role: admin.role || 'admin' 
        },
        getJWTSecret(),
        { expiresIn: '7d' }
      );
      
      res.json({
        message: 'Login successful',
        token: token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/admin/register
 * Create new admin (requires existing admin)
 */
router.post('/register',
  authAdmin,
  adminValidation.create,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    let userRecord: any = null;
    try {
      const { name, email, password, role = 'admin' } = req.body;
      
      // Check if email exists
      const existing = await FirestoreRepo.findOne<Admin>(
        COLLECTIONS.ADMINS,
        'email',
        email
      );
      
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // Validate role before creating Firebase user
      const allowedRoles = ['admin', 'user'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be admin or user' });
      }
      
      // Create Firebase Auth user
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });
      
      // Set custom claims - include admin boolean for frontend compatibility
      await auth.setCustomUserClaims(userRecord.uid, { 
        role,
        admin: role === 'admin'
      });
      
      // Hash password for Firestore
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create admin document
      try {
        const admin = await FirestoreRepo.createWithId<Admin>(
          COLLECTIONS.ADMINS,
          userRecord.uid,
          {
            name,
            email,
            password: hashedPassword,
            role: role as 'admin' | 'user',
          }
        );
        
        res.status(201).json({
          message: 'Admin created successfully',
          admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          }
        });
      } catch (firestoreError) {
        // Cleanup: delete the Firebase Auth user if Firestore fails
        if (userRecord?.uid) {
          await auth.deleteUser(userRecord.uid);
        }
        throw firestoreError;
      }
    } catch (error) {
      console.error('Admin registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/admin/profile
 * Get current admin profile
 */
router.get('/profile', authAdmin, async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    
    // Verify admin context exists
    if (!admin || !admin.id) {
      return res.status(401).json({ error: 'Unauthorized - admin context not found' });
    }
    
    res.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      }
    });
  } catch (error) {
    console.error('Error getting admin profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/list
 * List all admins
 */
router.get('/list', authAdmin, async (req: Request, res: Response) => {
  try {
    const result = await FirestoreRepo.list<Admin>(COLLECTIONS.ADMINS, {
      orderBy: 'createdAt',
      orderDirection: 'desc',
    });
    
    // Remove passwords from response
    const admins = result.rows.map(admin => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
    }));
    
    res.json({ data: admins });
  } catch (error) {
    console.error('Error listing admins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
