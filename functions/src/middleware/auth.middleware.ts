/**
 * Firebase Auth Middleware
 * 
 * Supports both Firebase ID tokens and JWT tokens
 * Uses Firebase Admin SDK to verify Firebase tokens
 * Uses jsonwebtoken for JWT verification (legacy/admin login)
 */

import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as jwt from 'jsonwebtoken';
import { COLLECTIONS, Admin, MSMEBusiness } from '../models/schemas';

// JWT secret - required for production (must match the one in admin.routes.ts)
// Consider using Firebase Secret Manager for production deployments
function getJWTSecret(): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return process.env.JWT_SECRET;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        role?: 'admin' | 'user';
        businessId?: string;
      };
      admin?: Admin;
      business?: MSMEBusiness;
    }
  }
}

const auth = getAuth();
const db = getFirestore();

/**
 * Verify token from Authorization header
 * Tries Firebase ID token first, then falls back to JWT
 */
async function verifyToken(req: Request): Promise<{ uid: string; email?: string; role?: string } | null> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  // Try Firebase ID token first
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role as string | undefined,
    };
  } catch (firebaseError) {
    // Firebase token failed, try JWT
    try {
      const decoded = jwt.verify(token, getJWTSecret()) as { id: string; email: string; role: string };
      return {
        uid: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (jwtError) {
      console.error('Token verification failed (both Firebase and JWT)');
      return null;
    }
  }
}

/**
 * Middleware: Require authenticated user (MSME Business)
 * Replaces authUser from auth.middelware.js
 */
export async function authUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const tokenData = await verifyToken(req);
  
  if (!tokenData) {
    res.status(401).json({ error: 'Unauthorized: No valid token provided' });
    return;
  }
  
  try {
    // Get business associated with this user (don't filter by deletedAt to handle missing field)
    const businessSnapshot = await db
      .collection(COLLECTIONS.MSME_BUSINESSES)
      .where('userId', '==', tokenData.uid)
      .limit(1)
      .get();
    
    if (businessSnapshot.empty) {
      res.status(401).json({ error: 'Unauthorized: Business not found' });
      return;
    }
    
    const businessDoc = businessSnapshot.docs[0];
    const business = businessDoc.data() as MSMEBusiness;
    
    // Check if business is deleted (handle both missing and null deletedAt)
    const deletedAt = businessDoc.get('deletedAt');
    if (deletedAt !== null && deletedAt !== undefined) {
      res.status(401).json({ error: 'Unauthorized: Business not found' });
      return;
    }
    
    req.user = {
      uid: tokenData.uid,
      email: tokenData.email,
      role: 'user',
      businessId: business.id,
    };
    req.business = business;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware: Require authenticated admin
 * Replaces authAdmin from auth.middelware.js
 */
export async function authAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const tokenData = await verifyToken(req);
  
  if (!tokenData) {
    res.status(401).json({ error: 'Unauthorized: No valid token provided' });
    return;
  }
  
  // Check role from token (JWT tokens include role)
  if (tokenData.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }
  
  try {
    // Get admin document - try by document id first (JWT uses id), then by userId (Firebase)
    let adminDoc = await db.collection(COLLECTIONS.ADMINS).doc(tokenData.uid).get();
    
    if (!adminDoc.exists) {
      // Try finding by email
      const adminSnapshot = await db
        .collection(COLLECTIONS.ADMINS)
        .where('email', '==', tokenData.email)
        .where('deletedAt', '==', null)
        .limit(1)
        .get();
      
      if (adminSnapshot.empty) {
        res.status(401).json({ error: 'Unauthorized: Admin not found' });
        return;
      }
      adminDoc = adminSnapshot.docs[0];
    }
    
    const admin = { id: adminDoc.id, ...adminDoc.data() } as Admin;
    
    req.user = {
      uid: tokenData.uid,
      email: tokenData.email,
      role: 'admin',
    };
    req.admin = admin;
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware: Optional authentication
 * Attaches user info if token present, but doesn't require it
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const tokenData = await verifyToken(req);
  
  if (tokenData) {
    req.user = {
      uid: tokenData.uid,
      email: tokenData.email,
      role: tokenData.role as 'admin' | 'user' | undefined,
    };
  }
  
  next();
}

/**
 * Middleware: Verify resource ownership (IDOR protection)
 * Ensures users can only access/modify their own resources
 */
export function verifyResourceOwnership(paramName: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // First check if user is authenticated
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    // Admin can access any resource - check this BEFORE business check
    if (req.user.role === 'admin') {
      next();
      return;
    }
    
    // Non-admin users must have a business loaded
    if (!req.business) {
      res.status(401).json({ error: 'Unauthorized - no business context' });
      return;
    }
    
    const resourceId = req.params[paramName];
    
    // User can only access their own business
    if (req.business.id !== resourceId) {
      res.status(403).json({ error: 'Forbidden: You can only modify your own business' });
      return;
    }
    
    next();
  };
}

/**
 * Set custom claims for a user (admin function)
 */
export async function setUserRole(uid: string, role: 'admin' | 'user'): Promise<void> {
  await auth.setCustomUserClaims(uid, { role });
}

/**
 * Create admin user with custom claims
 */
export async function createAdminUser(email: string, password: string, name: string): Promise<string> {
  // Create Firebase Auth user
  const userRecord = await auth.createUser({
    email,
    password,
    displayName: name,
  });
  
  // Set admin custom claim
  await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
  
  return userRecord.uid;
}
