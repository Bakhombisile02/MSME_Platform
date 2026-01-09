/**
 * Migrate images from old server to Firebase Storage
 * 
 * This script downloads images from the old server and uploads them
 * to Firebase Storage with proper folder structure.
 */

const admin = require('firebase-admin');
const https = require('https');
const http = require('http');
const path = require('path');

// Initialize Firebase Admin with application default credentials
admin.initializeApp({
  projectId: 'msmesite-53367',
  storageBucket: 'msmesite-53367.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const OLD_SERVER_URL = 'https://ceec-msme.com';

/**
 * Download file from URL with redirect limit and timeout
 */
function downloadFile(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Too many redirects'));
      return;
    }
    
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect with decremented counter
        const redirectUrl = response.headers.location;
        // Handle relative URLs
        const fullUrl = redirectUrl.startsWith('http') 
          ? redirectUrl 
          : new URL(redirectUrl, url).href;
        downloadFile(fullUrl, maxRedirects - 1).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
    
    // Add timeout
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

/**
 * Upload buffer to Firebase Storage
 */
async function uploadToStorage(buffer, storagePath, contentType) {
  const file = bucket.file(storagePath);
  
  await file.save(buffer, {
    metadata: {
      contentType: contentType || 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
    },
    public: true,
  });
  
  return storagePath;
}

/**
 * Get content type from filename
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Migrate business category images
 */
async function migrateBusinessCategories() {
  console.log('\n📁 Migrating Business Category images...');
  
  const snapshot = await db.collection('business_categories').get();
  let migrated = 0;
  let failed = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const iconUrl = data.icon_url;
    
    if (!iconUrl) continue;
    
    // Skip if already has folder path
    if (iconUrl.includes('/')) {
      console.log(`  ⏭️  ${doc.id}: Already has path: ${iconUrl}`);
      continue;
    }
    
    try {
      // Download from old server
      const oldUrl = `${OLD_SERVER_URL}/business-category/${iconUrl}`;
      console.log(`  ⬇️  Downloading: ${oldUrl}`);
      
      const buffer = await downloadFile(oldUrl);
      
      // Upload to Firebase Storage
      const storagePath = `business-categories/${iconUrl}`;
      await uploadToStorage(buffer, storagePath, getContentType(iconUrl));
      
      // Update Firestore with new path
      await doc.ref.update({ icon_url: storagePath });
      
      console.log(`  ✅ ${doc.id}: Migrated to ${storagePath}`);
      migrated++;
    } catch (error) {
      console.log(`  ❌ ${doc.id}: Failed - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`  📊 Business Categories: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

/**
 * Migrate home banner images
 */
async function migrateHomeBanners() {
  console.log('\n📁 Migrating Home Banner images...');
  
  const snapshot = await db.collection('home_banners').get();
  let migrated = 0;
  let failed = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const imageUrl = data.image_url;
    
    if (!imageUrl) continue;
    
    // Skip if already has full path
    if (imageUrl.startsWith('home-banner/')) {
      // Check if file exists in storage, if not download and upload
      try {
        const [exists] = await bucket.file(imageUrl).exists();
        if (exists) {
          console.log(`  ⏭️  ${doc.id}: Already exists in storage`);
          continue;
        }
      } catch (e) {
        // Continue to migrate
      }
    }
    
    const filename = imageUrl.includes('/') ? imageUrl.split('/').pop() : imageUrl;
    
    try {
      // Download from old server
      const oldUrl = `${OLD_SERVER_URL}/${imageUrl}`;
      console.log(`  ⬇️  Downloading: ${oldUrl}`);
      
      const buffer = await downloadFile(oldUrl);
      
      // Upload to Firebase Storage
      const storagePath = imageUrl.startsWith('home-banner/') ? imageUrl : `home-banner/${filename}`;
      await uploadToStorage(buffer, storagePath, getContentType(filename));
      
      // Update Firestore if path changed
      if (data.image_url !== storagePath) {
        await doc.ref.update({ image_url: storagePath });
      }
      
      console.log(`  ✅ ${doc.id}: Migrated to ${storagePath}`);
      migrated++;
    } catch (error) {
      console.log(`  ❌ ${doc.id}: Failed - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`  📊 Home Banners: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

/**
 * Migrate team member images
 */
async function migrateTeamMembers() {
  console.log('\n📁 Migrating Team Member images...');
  
  const snapshot = await db.collection('team_members').get();
  let migrated = 0;
  let failed = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const url = data.url;
    
    if (!url) continue;
    
    // Check if file exists in storage
    if (url.startsWith('team-member/')) {
      try {
        const [exists] = await bucket.file(url).exists();
        if (exists) {
          console.log(`  ⏭️  ${doc.id}: Already exists in storage`);
          continue;
        }
      } catch (e) {
        // Continue to migrate
      }
    }
    
    const filename = url.includes('/') ? url.split('/').pop() : url;
    
    try {
      // Download from old server
      const oldUrl = `${OLD_SERVER_URL}/${url}`;
      console.log(`  ⬇️  Downloading: ${oldUrl}`);
      
      const buffer = await downloadFile(oldUrl);
      
      // Upload to Firebase Storage
      const storagePath = url.startsWith('team-member/') ? url : `team-member/${filename}`;
      await uploadToStorage(buffer, storagePath, getContentType(filename));
      
      // Update Firestore with new path
      if (data.url !== storagePath) {
        await doc.ref.update({ url: storagePath });
      }
      
      console.log(`  ✅ ${doc.id}: Migrated to ${storagePath}`);
      migrated++;
    } catch (error) {
      console.log(`  ❌ ${doc.id}: Failed - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`  📊 Team Members: ${migrated} migrated, ${failed} failed`);
  return { migrated, failed };
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting image migration to Firebase Storage...\n');
  console.log(`📍 Old server: ${OLD_SERVER_URL}`);
  console.log(`📍 Storage bucket: ${bucket.name}\n`);
  
  const results = {
    businessCategories: await migrateBusinessCategories(),
    homeBanners: await migrateHomeBanners(),
    teamMembers: await migrateTeamMembers(),
  };
  
  console.log('\n========================================');
  console.log('📊 MIGRATION SUMMARY');
  console.log('========================================');
  
  let totalMigrated = 0;
  let totalFailed = 0;
  
  for (const [key, value] of Object.entries(results)) {
    console.log(`${key}: ${value.migrated} migrated, ${value.failed} failed`);
    totalMigrated += value.migrated;
    totalFailed += value.failed;
  }
  
  console.log('----------------------------------------');
  console.log(`TOTAL: ${totalMigrated} migrated, ${totalFailed} failed`);
  console.log('========================================\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
