/**
 * Upload Routes
 * 
 * File upload handling using Firebase Storage
 */

import { Router, Request, Response } from 'express';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

import { authAdmin, authUser } from '../middleware/auth.middleware';

const router = Router();

// Storage bucket reference
const bucket = getStorage().bucket();

/**
 * Generate signed upload URL for client-side uploads
 * This is the recommended approach for Firebase - clients upload directly to Storage
 */
async function generateSignedUploadUrl(
  folder: string, 
  fileName: string, 
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string; filePath: string }> {
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}-${uuidv4()}-${fileName}`;
  const filePath = `${folder}/${uniqueFileName}`;
  
  const file = bucket.file(filePath);
  
  // Generate signed URL for upload (valid for 15 minutes)
  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });
  
  // Generate public URL (after upload, file needs to be made public or use signed read URL)
  const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  
  return { uploadUrl, fileUrl, filePath };
}

/**
 * Generate signed download URL
 */
async function generateSignedDownloadUrl(filePath: string): Promise<string> {
  const file = bucket.file(filePath);
  
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  
  return url;
}

// =============================================================================
// ADMIN UPLOAD ENDPOINTS
// =============================================================================

/**
 * POST /api/upload/business-category-image
 * Get signed URL for business category image upload
 */
router.post('/business-category-image', authAdmin, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    
    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required' });
    }
    
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images are allowed' });
    }
    
    const urls = await generateSignedUploadUrl('business-categories', fileName, contentType);
    
    res.json({
      message: 'Upload URL generated',
      data: urls,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/upload/partners-logo-image
 */
router.post('/partners-logo-image', authAdmin, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    
    // Validate fileName and contentType
    if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
      return res.status(400).json({ error: 'fileName is required' });
    }
    
    if (!contentType?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images are allowed' });
    }
    
    const urls = await generateSignedUploadUrl('partners-logo', fileName, contentType);
    res.json({ message: 'Upload URL generated', data: urls });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/upload/team-member-image
 */
router.post('/team-member-image', authAdmin, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    
    if (!contentType?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images are allowed' });
    }
    
    const urls = await generateSignedUploadUrl('team-member', fileName, contentType);
    res.json({ message: 'Upload URL generated', data: urls });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/upload/home-banner-image
 */
router.post('/home-banner-image', authAdmin, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    
    if (!contentType?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images are allowed' });
    }
    
    const urls = await generateSignedUploadUrl('home-banner', fileName, contentType);
    res.json({ message: 'Upload URL generated', data: urls });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/upload/blog-image
 */
router.post('/blog-image', authAdmin, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    
    if (!contentType?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images are allowed' });
    }
    
    const urls = await generateSignedUploadUrl('blog-image', fileName, contentType);
    res.json({ message: 'Upload URL generated', data: urls });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/upload/service-provider-category-image
 */
router.post('/service-provider-category-image', authAdmin, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    
    if (!contentType?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images are allowed' });
    }
    
    const urls = await generateSignedUploadUrl('service-provider-categories', fileName, contentType);
    res.json({ message: 'Upload URL generated', data: urls });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/upload/service-provider-image
 */
router.post('/service-provider-image', authAdmin, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    
    if (!contentType?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images are allowed' });
    }
    
    const urls = await generateSignedUploadUrl('service-providers', fileName, contentType);
    res.json({ message: 'Upload URL generated', data: urls });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/upload/downloads
 * For downloadable documents
 */
router.post('/downloads', authAdmin, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/',
    ];
    
    const isAllowed = allowedTypes.some(type => 
      contentType?.startsWith(type) || contentType === type
    );
    
    if (!isAllowed) {
      return res.status(400).json({ error: 'File type not allowed' });
    }
    
    const urls = await generateSignedUploadUrl('downloads', fileName, contentType);
    res.json({ message: 'Upload URL generated', data: urls });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// USER UPLOAD ENDPOINTS (Business registration)
// =============================================================================

/**
 * POST /api/upload/business-image
 * Business profile image for registration
 */
router.post('/business-image', authUser, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    const userId = req.user?.uid;
    
    if (!contentType?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images are allowed' });
    }
    
    const urls = await generateSignedUploadUrl(`business/${userId}`, fileName, contentType);
    res.json({ message: 'Upload URL generated', data: urls });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/upload/business-profile
 */
router.post('/business-profile', authUser, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    const userId = req.user?.uid;
    
    if (!contentType?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images are allowed' });
    }
    
    const urls = await generateSignedUploadUrl(`business-profile/${userId}`, fileName, contentType);
    res.json({ message: 'Upload URL generated', data: urls });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/upload/incorporation-image
 * Incorporation certificate
 */
router.post('/incorporation-image', authUser, async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    const userId = req.user?.uid;
    
    const allowedTypes = ['image/', 'application/pdf'];
    const isAllowed = allowedTypes.some(type => contentType?.startsWith(type));
    
    if (!isAllowed) {
      return res.status(400).json({ error: 'Only images and PDFs are allowed' });
    }
    
    const urls = await generateSignedUploadUrl(`incorporation-profile/${userId}`, fileName, contentType);
    res.json({ message: 'Upload URL generated', data: urls });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// PUBLIC UPLOAD FOR REGISTRATION (before auth)
// =============================================================================

/**
 * POST /api/upload/public/business-image
 * For use during registration before user has auth token
 */
router.post('/public/business-image', async (req: Request, res: Response) => {
  try {
    const { fileName, contentType, tempId } = req.body;
    
    if (!tempId) {
      return res.status(400).json({ error: 'tempId is required for public uploads' });
    }
    
    if (!contentType?.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images are allowed' });
    }
    
    // Use temp folder, files will be moved after registration
    const urls = await generateSignedUploadUrl(`temp/${tempId}`, fileName, contentType);
    res.json({ message: 'Upload URL generated', data: urls });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// DELETE FILE
// =============================================================================

/**
 * DELETE /api/upload/file
 * Delete a file from storage
 */
router.delete('/file', authAdmin, async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }
    
    const file = bucket.file(filePath);
    await file.delete();
    
    res.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    if (error.code === 404) {
      return res.status(404).json({ error: 'File not found' });
    }
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
