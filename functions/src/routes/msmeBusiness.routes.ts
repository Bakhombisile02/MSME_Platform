/**
 * MSME Business Routes
 * 
 * Port of MSME-Backend/routers/msmeBusiness.js
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { randomInt } from 'crypto';

import { authUser, authAdmin, verifyResourceOwnership } from '../middleware/auth.middleware';
import { 
  handleValidationErrors, 
  validateIdParam,
  msmeBusinessValidation 
} from '../middleware/validation.middleware';
import { FirestoreRepo } from '../services/FirestoreRepository';
import { sendBusinessEmail } from '../services/emailService';
import { 
  COLLECTIONS, 
  MSMEBusiness, 
  Director, 
  BusinessOwner,
  VerificationStatus 
} from '../models/schemas';

const router = Router();
const auth = getAuth();
const db = getFirestore();

// =============================================================================
// OTP RATE LIMITING (Firestore-based for stateless Cloud Functions)
// =============================================================================

const OTP_RATE_LIMIT_COLLECTION = 'otp_rate_limits';
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCKOUT_MINUTES = 30;

async function checkOtpRateLimit(email: string): Promise<{ allowed: boolean; message?: string }> {
  const key = email.toLowerCase();
  const docRef = db.collection(OTP_RATE_LIMIT_COLLECTION).doc(key);
  
  try {
    const doc = await docRef.get();
    if (!doc.exists) return { allowed: true };
    
    const record = doc.data();
    if (!record) return { allowed: true };
    
    // Check if locked out
    if (record.lockoutUntil) {
      const lockoutTime = record.lockoutUntil.toDate ? record.lockoutUntil.toDate() : new Date(record.lockoutUntil);
      if (lockoutTime > new Date()) {
        const minutesLeft = Math.ceil((lockoutTime.getTime() - Date.now()) / 60000);
        return { 
          allowed: false, 
          message: `Too many failed attempts. Please try again in ${minutesLeft} minutes.`
        };
      }
      // Lockout expired, reset the record
      await docRef.delete();
      return { allowed: true };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Error checking OTP rate limit:', error);
    // Fail-closed for security - deny on error to prevent abuse during outages
    return { allowed: false, message: 'Service temporarily unavailable. Please try again.' };
  }
}

async function recordOtpAttempt(email: string, success: boolean): Promise<void> {
  const key = email.toLowerCase();
  const docRef = db.collection(OTP_RATE_LIMIT_COLLECTION).doc(key);
  
  try {
    if (success) {
      // Reset on success
      await docRef.delete();
      return;
    }
    
    // Use transaction to atomically increment attempts
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      const record = doc.data() || { attempts: 0 };
      const newAttempts = (record.attempts || 0) + 1;
      
      const updateData: Record<string, any> = {
        attempts: newAttempts,
        lastAttempt: Timestamp.now(),
      };
      
      if (newAttempts >= OTP_MAX_ATTEMPTS) {
        updateData.lockoutUntil = Timestamp.fromMillis(Date.now() + (OTP_LOCKOUT_MINUTES * 60 * 1000));
      }
      
      transaction.set(docRef, updateData, { merge: true });
    });
  } catch (error) {
    console.error('Error recording OTP attempt:', error);
  }
}

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * POST /api/msme-business/add
 * Register a new MSME business
 */
router.post('/add', 
  msmeBusinessValidation.create,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { directorsInfo, owners, password, ...msmeData } = req.body;
      
      // Check if email already exists
      const existingBusiness = await FirestoreRepo.findOne<MSMEBusiness>(
        COLLECTIONS.MSME_BUSINESSES,
        'email_address',
        msmeData.email_address
      );
      
      if (existingBusiness) {
        return res.status(400).json({ 
          error: 'This email is already registered. Please use a different email address.' 
        });
      }
      
      // Create Firebase Auth user
      let userRecord;
      try {
        userRecord = await auth.createUser({
          email: msmeData.email_address,
          password: password,
          displayName: msmeData.name_of_organization,
        });
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-exists') {
          return res.status(400).json({ 
            error: 'This email is already registered. Please use a different email address.' 
          });
        }
        throw authError;
      }
      
      // Set user custom claim
      await auth.setCustomUserClaims(userRecord.uid, { role: 'user' });
      
      // Compute owner gender summary
      let ownerGenderSummary = '';
      if (owners && Array.isArray(owners)) {
        const maleCount = owners.filter((o: any) => o.gender === 'Male').length;
        const femaleCount = owners.filter((o: any) => o.gender === 'Female').length;
        ownerGenderSummary = `${maleCount}M,${femaleCount}F`;
      }
      
      // Create MSME business document
      const business = await FirestoreRepo.createWithId<MSMEBusiness>(
        COLLECTIONS.MSME_BUSINESSES,
        userRecord.uid, // Use Firebase Auth UID as document ID
        {
          ...msmeData,
          userId: userRecord.uid,
          name_of_organization_lower: msmeData.name_of_organization.toLowerCase(),
          is_verified: 1 as VerificationStatus, // Pending
          owner_gender_summary: ownerGenderSummary,
        }
      );
      
      // Create directors subcollection
      const createdDirectors: Director[] = [];
      if (directorsInfo && Array.isArray(directorsInfo)) {
        for (const director of directorsInfo) {
          const created = await FirestoreRepo.createInSubcollection<Director>(
            COLLECTIONS.MSME_BUSINESSES,
            business.id!,
            'directors',
            {
              ...director,
              business_id: business.id!,
            }
          );
          createdDirectors.push(created);
        }
      }
      
      // Create business owners subcollection
      if (owners && Array.isArray(owners)) {
        for (const owner of owners) {
          await FirestoreRepo.createInSubcollection<BusinessOwner>(
            COLLECTIONS.MSME_BUSINESSES,
            business.id!,
            'owners',
            {
              business_id: business.id!,
              gender: owner.gender,
            }
          );
        }
      }
      
      // Send registration email
      await sendBusinessEmail(msmeData, 1, msmeData.email_address);
      
      res.status(201).json({
        message: 'MSME and directors saved successfully',
        data: {
          msme: business,
          directors: createdDirectors,
        }
      });
    } catch (error) {
      console.error('Error creating MSME business:', error);
      next(error);
    }
  }
);

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * POST /api/msme-business/login
 * User login - returns Firebase custom token
 */
router.post('/login',
  msmeBusinessValidation.login,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email_address, password } = req.body;
      
      // Find business by email
      const business = await FirestoreRepo.findOne<MSMEBusiness>(
        COLLECTIONS.MSME_BUSINESSES,
        'email_address',
        email_address
      );
      
      if (!business) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Verify password if stored (for migrated users)
      // Note: New users authenticate via Firebase Auth on client
      if (business.password_hash) {
        const passwordValid = await bcrypt.compare(password, business.password_hash);
        if (!passwordValid) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
      } else if (business.password) {
        // Legacy plaintext password (from migration) - use constant-time comparison
        const crypto = require('crypto');
        const passwordBuffer = Buffer.from(password);
        const storedBuffer = Buffer.from(business.password);
        
        // Ensure equal length for constant-time comparison
        const maxLength = Math.max(passwordBuffer.length, storedBuffer.length);
        const paddedPassword = Buffer.alloc(maxLength);
        const paddedStored = Buffer.alloc(maxLength);
        passwordBuffer.copy(paddedPassword);
        storedBuffer.copy(paddedStored);
        
        try {
          if (!crypto.timingSafeEqual(paddedPassword, paddedStored)) {
            return res.status(401).json({ error: 'Invalid email or password' });
          }
        } catch {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Upgrade to hashed password and delete plaintext field
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = require('firebase-admin');
        await FirestoreRepo.update(COLLECTIONS.MSME_BUSINESSES, business.id!, {
          password_hash: hashedPassword,
          password: admin.firestore.FieldValue.delete(), // Remove plaintext
        });
      }
      // If no password stored, this user uses Firebase Auth client-side
      
      // Create custom token for the user
      const customToken = await auth.createCustomToken(business.userId, {
        role: 'user',
        businessId: business.id,
      });
      
      res.json({
        message: 'Login successful',
        token: customToken,
        user: {
          id: business.id,
          name: business.name_of_organization,
          email: business.email_address,
          is_verified: business.is_verified,
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/msme-business/check-email-exists/:email_address
 * Check if email is already registered
 */
router.get('/check-email-exists/:email_address', async (req: Request, res: Response) => {
  try {
    const { email_address } = req.params;
    
    const business = await FirestoreRepo.findOne<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      'email_address',
      email_address
    );
    
    res.json({ exists: !!business });
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// LIST / GET
// =============================================================================

/**
 * GET /api/msme-business/list
 * List all businesses (admin view)
 */
router.get('/list', authAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    const result = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      {
        limit,
        offset,
        orderBy: 'createdAt',
        orderDirection: 'desc',
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
    console.error('Error listing businesses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/msme-business/list-web/:is_verified
 * List businesses for public website (only approved)
 */
router.get('/list-web/:is_verified', async (req: Request, res: Response) => {
  try {
    const is_verified_param = parseInt(req.params.is_verified);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Use Firestore filtering instead of in-memory
    // 0 = ALL (no filter), 1 = pending, 2 = approved, 3 = rejected
    const listParams: any = {
      limit,
      offset,
      orderBy: 'createdAt',
      orderDirection: 'desc',
    };
    
    // Add is_verified filter if not requesting all
    if (is_verified_param !== 0) {
      listParams.searchParams = { is_verified: is_verified_param };
    }
    
    const result = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      listParams
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
    console.error('Error listing businesses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/msme-business/popular-searches
 * Get popular categories, towns, and regions based on business counts
 */
router.get('/popular-searches', async (req: Request, res: Response) => {
  try {
    // Get all approved businesses for aggregation
    // Note: is_verified may be stored as string "2" in some records
    const result = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      {
        searchParams: { is_verified: 2 },
        limit: 5000,
        offset: 0,
      }
    );
    
    const businesses = result.rows;
    
    // Aggregate by category
    const categoryCount = new Map<string, { id: string; name: string; count: number }>();
    const townCount = new Map<string, { name: string; count: number }>();
    const regionCount = new Map<string, { name: string; count: number }>();
    
    for (const business of businesses) {
      // Count by category - use business_category_name field
      const catName = (business as any).business_category_name;
      if (business.business_category_id && catName) {
        const key = business.business_category_id;
        if (categoryCount.has(key)) {
          categoryCount.get(key)!.count++;
        } else {
          categoryCount.set(key, {
            id: business.business_category_id,
            name: catName,
            count: 1,
          });
        }
      }
      
      // Count by town - use town field (not city)
      const town = (business as any).town;
      if (town) {
        const key = town.toString().trim();
        if (key) {
          if (townCount.has(key)) {
            townCount.get(key)!.count++;
          } else {
            townCount.set(key, { name: key, count: 1 });
          }
        }
      }
      
      // Count by region
      if (business.region) {
        const key = business.region;
        if (regionCount.has(key)) {
          regionCount.get(key)!.count++;
        } else {
          regionCount.set(key, { name: business.region, count: 1 });
        }
      }
    }
    
    // Sort and get top 10
    const popularCategories = Array.from(categoryCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const popularTowns = Array.from(townCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const popularRegions = Array.from(regionCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    console.log('popular-searches: Returning categories:', popularCategories.length);
    
    res.json({
      categories: popularCategories,
      towns: popularTowns,
      regions: popularRegions,
    });
  } catch (error: any) {
    console.error('Error getting popular searches:', error.message || error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/msme-business/list-according-category-id/:business_category_id
 * List businesses by category
 */
router.get('/list-according-category-id/:business_category_id', async (req: Request, res: Response) => {
  try {
    const { business_category_id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get all businesses in this category, then filter by is_verified in code
    // because is_verified might be stored as string or number
    const result = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      {
        searchParams: { business_category_id },
        limit: 10000, // Get all then filter
        offset: 0,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      }
    );
    
    // Filter for approved only (is_verified = 2 or "2")
    const approved = result.rows.filter(b => 
      b.is_verified === 2 || b.is_verified === '2' as any
    );
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedRows = approved.slice(offset, offset + limit);
    const totalCount = approved.length;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Match the old backend response format
    res.json({
      values: {
        rows: paginatedRows,
        count: totalCount,
      },
      page,
      limit,
      total_pages: totalPages,
      total: totalCount,
    });
  } catch (error) {
    console.error('Error listing businesses by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/msme-business/list-according-category-id-v2/:business_category_id
 * List businesses by category (V2 with enhanced filtering)
 */
router.get('/list-according-category-id-v2/:business_category_id', async (req: Request, res: Response) => {
  try {
    const { business_category_id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    console.log('list-according-category-id-v2: category_id=', business_category_id);
    
    // Get all businesses in this category, then filter by is_verified in code
    const result = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      {
        searchParams: { business_category_id },
        limit: 10000,
        offset: 0,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      }
    );
    
    // Filter for approved only (is_verified = 2 or "2")
    const approved = result.rows.filter(b => 
      b.is_verified === 2 || b.is_verified === '2' as any
    );
    
    console.log('list-according-category-id-v2: got', approved.length, 'approved businesses');
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedRows = approved.slice(offset, offset + limit);
    const totalCount = approved.length;
    const totalPages = Math.ceil(totalCount / limit);
    
    // Match the old backend response format
    res.json({
      values: {
        rows: paginatedRows,
        count: totalCount,
      },
      page,
      limit,
      total_pages: totalPages,
      total: totalCount,
    });
  } catch (error: any) {
    console.error('Error listing businesses by category (v2):', error.message || error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/msme-business/msme-details/:id
 * Get business details
 */
router.get('/msme-details/:id',
  validateIdParam('id'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const business = await FirestoreRepo.findById<MSMEBusiness>(
        COLLECTIONS.MSME_BUSINESSES,
        id
      );
      
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }
      
      // Get directors
      const directors = await FirestoreRepo.listFromSubcollection<Director>(
        COLLECTIONS.MSME_BUSINESSES,
        id,
        'directors'
      );
      
      // Get owners
      const owners = await FirestoreRepo.listFromSubcollection<BusinessOwner>(
        COLLECTIONS.MSME_BUSINESSES,
        id,
        'owners'
      );
      
      res.json({
        data: {
          ...business,
          directors,
          owners,
        }
      });
    } catch (error) {
      console.error('Error getting business details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// =============================================================================
// UPDATE
// =============================================================================

/**
 * PUT /api/msme-business/update/:id
 * Update business (owner only)
 */
router.put('/update/:id',
  validateIdParam('id'),
  authUser,
  verifyResourceOwnership('id'),
  msmeBusinessValidation.update,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Don't allow updating certain fields
      delete updateData.is_verified;
      delete updateData.userId;
      delete updateData.email_address; // Email change requires re-verification
      
      // Update lowercase name if name changed
      if (updateData.name_of_organization) {
        updateData.name_of_organization_lower = updateData.name_of_organization.toLowerCase();
      }
      
      const updated = await FirestoreRepo.update<MSMEBusiness>(
        COLLECTIONS.MSME_BUSINESSES,
        id,
        updateData
      );
      
      if (!updated) {
        return res.status(404).json({ error: 'Business not found' });
      }
      
      res.json({
        message: 'Business updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Error updating business:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/msme-business/verify-msme/:id
 * Verify/reject business (admin only)
 */
router.put('/verify-msme/:id',
  validateIdParam('id'),
  authAdmin,
  [body('is_verified').isIn([1, 2, 3])],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { is_verified, verification_notes } = req.body;
      
      const business = await FirestoreRepo.findById<MSMEBusiness>(
        COLLECTIONS.MSME_BUSINESSES,
        id
      );
      
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }
      
      const updated = await FirestoreRepo.update<MSMEBusiness>(
        COLLECTIONS.MSME_BUSINESSES,
        id,
        {
          is_verified,
          verification_notes,
          verified_by: req.admin?.id,
          verified_at: Timestamp.now(),
        }
      );
      
      // Send status email
      if (is_verified === 2 || is_verified === 3) {
        await sendBusinessEmail(
          { ...business, verification_notes },
          is_verified,
          business.email_address
        );
      }
      
      res.json({
        message: 'Business verification status updated',
        data: updated,
      });
    } catch (error) {
      console.error('Error verifying business:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// =============================================================================
// DELETE
// =============================================================================

/**
 * PUT /api/msme-business/delete/:id
 * Soft delete business (admin only)
 */
router.put('/delete/:id',
  validateIdParam('id'),
  authAdmin,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const deleted = await FirestoreRepo.softDelete(COLLECTIONS.MSME_BUSINESSES, id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Business not found' });
      }
      
      res.json({ message: 'Business deleted successfully' });
    } catch (error) {
      console.error('Error deleting business:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// =============================================================================
// PASSWORD RESET
// =============================================================================

/**
 * POST /api/msme-business/forget-password/request-otp
 * Request password reset OTP
 */
router.post('/forget-password/request-otp',
  [body('email').isEmail()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      // Rate limit check
      const rateCheck = await checkOtpRateLimit(email);
      if (!rateCheck.allowed) {
        return res.status(429).json({ error: rateCheck.message });
      }
      
      const business = await FirestoreRepo.findOne<MSMEBusiness>(
        COLLECTIONS.MSME_BUSINESSES,
        'email_address',
        email
      );
      
      // Don't reveal if email exists
      if (!business) {
        return res.json({ message: 'If the email exists, an OTP will be sent.' });
      }
      
      // Generate 6-digit OTP using cryptographically secure random
      const otp = randomInt(100000, 999999).toString().padStart(6, '0');
      const otpExpires = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes
      
      // Store OTP
      await FirestoreRepo.update(
        COLLECTIONS.MSME_BUSINESSES,
        business.id!,
        {
          reset_otp: otp,
          reset_otp_expires: otpExpires,
        }
      );
      
      // Send OTP email
      await sendBusinessEmail({ ...business, otp }, 4, email);
      
      res.json({ message: 'If the email exists, an OTP will be sent.' });
    } catch (error) {
      console.error('Error requesting OTP:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/msme-business/forget-password/verify-otp
 * Verify OTP and get reset token
 */
router.post('/forget-password/verify-otp',
  [
    body('email').isEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      
      // Rate limit check
      const rateCheck = await checkOtpRateLimit(email);
      if (!rateCheck.allowed) {
        return res.status(429).json({ error: rateCheck.message });
      }
      
      const business = await FirestoreRepo.findOne<MSMEBusiness>(
        COLLECTIONS.MSME_BUSINESSES,
        'email_address',
        email
      );
      
      if (!business || !business.reset_otp || !business.reset_otp_expires) {
        recordOtpAttempt(email, false);
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
      
      // Check if OTP expired
      if (business.reset_otp_expires.toDate() < new Date()) {
        recordOtpAttempt(email, false);
        return res.status(400).json({ error: 'OTP has expired' });
      }
      
      // Verify OTP
      if (business.reset_otp !== otp) {
        recordOtpAttempt(email, false);
        return res.status(400).json({ error: 'Invalid OTP' });
      }
      
      // Generate reset token
      const resetToken = uuidv4();
      const tokenExpires = Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000)); // 15 minutes
      
      // Store reset token, clear OTP
      await FirestoreRepo.update(
        COLLECTIONS.MSME_BUSINESSES,
        business.id!,
        {
          reset_token: resetToken,
          reset_token_expires: tokenExpires,
          reset_otp: null,
          reset_otp_expires: null,
        }
      );
      
      recordOtpAttempt(email, true);
      
      res.json({ 
        message: 'OTP verified',
        reset_token: resetToken,
      });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/msme-business/forget-password/reset
 * Reset password with token
 */
router.post('/forget-password/reset',
  [
    body('reset_token').notEmpty(),
    body('new_password').isLength({ min: 6 }),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { reset_token, new_password } = req.body;
      
      const business = await FirestoreRepo.findOne<MSMEBusiness>(
        COLLECTIONS.MSME_BUSINESSES,
        'reset_token',
        reset_token
      );
      
      if (!business || !business.reset_token_expires) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      
      // Check if token expired
      if (business.reset_token_expires.toDate() < new Date()) {
        return res.status(400).json({ error: 'Reset token has expired' });
      }
      
      // Update password in Firebase Auth
      await auth.updateUser(business.userId, {
        password: new_password,
      });
      
      // Clear reset token
      await FirestoreRepo.update(
        COLLECTIONS.MSME_BUSINESSES,
        business.id!,
        {
          reset_token: null,
          reset_token_expires: null,
        }
      );
      
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// =============================================================================
// SEARCH
// =============================================================================

/**
 * GET /api/msme-business/search-by-name/:name_of_organization
 * Search businesses by name
 */
router.get('/search-by-name/:name_of_organization', async (req: Request, res: Response) => {
  try {
    const { name_of_organization } = req.params;
    const searchTerm = name_of_organization.toLowerCase();
    
    // Firestore doesn't support fulltext search, so we do prefix matching
    const snapshot = await db.collection(COLLECTIONS.MSME_BUSINESSES)
      .where('deletedAt', '==', null)
      .where('is_verified', '==', 2)
      .where('name_of_organization_lower', '>=', searchTerm)
      .where('name_of_organization_lower', '<=', searchTerm + '\uf8ff')
      .limit(20)
      .get();
    
    const results = snapshot.docs.map(doc => doc.data() as MSMEBusiness);
    
    res.json({ data: results });
  } catch (error) {
    console.error('Error searching businesses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/msme-business/search-by-region/:region
 * Search businesses by region
 */
router.get('/search-by-region/:region', async (req: Request, res: Response) => {
  try {
    const { region } = req.params;
    
    const result = await FirestoreRepo.list<MSMEBusiness>(
      COLLECTIONS.MSME_BUSINESSES,
      {
        searchParams: { 
          region,
          is_verified: 2,
        },
        limit: 50,
        orderBy: 'name_of_organization_lower',
        orderDirection: 'asc',
      }
    );
    
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error searching businesses by region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/msme-business/filters
 * Get available filter options
 */
router.get('/filters', async (req: Request, res: Response) => {
  try {
    // Get unique regions
    const businessSnapshot = await db.collection(COLLECTIONS.MSME_BUSINESSES)
      .where('deletedAt', '==', null)
      .where('is_verified', '==', 2)
      .select('region')
      .get();
    
    const regions = [...new Set(
      businessSnapshot.docs
        .map(doc => doc.data().region)
        .filter(Boolean)
    )].sort();
    
    // Get categories
    const categoriesSnapshot = await db.collection(COLLECTIONS.BUSINESS_CATEGORIES)
      .where('deletedAt', '==', null)
      .orderBy('category_name')
      .get();
    
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().category_name,
    }));
    
    res.json({
      regions,
      categories,
    });
  } catch (error) {
    console.error('Error getting filters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
