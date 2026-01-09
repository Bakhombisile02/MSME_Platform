/**
 * Upload Public Files to Firebase Storage
 * 
 * This script uploads all files from MSME-Backend/public to Firebase Storage
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin if not already initialized
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'msmesite-53367.firebasestorage.app'
    });
  }
} catch (error) {
  console.error('Error loading service account key:', error.message);
  process.exit(1);
}

const bucket = admin.storage().bucket();
const publicDir = path.join(__dirname, '../MSME-Backend/public');

let stats = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0
};

/**
 * Get content type based on file extension
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Upload a single file to Firebase Storage
 */
async function uploadFile(localPath, storagePath) {
  try {
    const contentType = getContentType(localPath);
    
    await bucket.upload(localPath, {
      destination: storagePath,
      metadata: {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });
    
    // Make the file publicly accessible
    await bucket.file(storagePath).makePublic();
    
    stats.success++;
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to upload ${storagePath}: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * Recursively upload all files in a directory
 */
async function uploadDirectory(localDir, storagePrefix = '') {
  const items = fs.readdirSync(localDir);
  
  for (const item of items) {
    const localPath = path.join(localDir, item);
    const storagePath = storagePrefix ? `${storagePrefix}/${item}` : item;
    const stat = fs.statSync(localPath);
    
    if (stat.isDirectory()) {
      console.log(`\n📁 Uploading folder: ${storagePath}/`);
      await uploadDirectory(localPath, storagePath);
    } else if (stat.isFile()) {
      // Skip hidden files and system files
      if (item.startsWith('.') || item === 'Thumbs.db' || item === '.DS_Store') {
        stats.skipped++;
        continue;
      }
      
      stats.total++;
      process.stdout.write(`   📤 ${storagePath}... `);
      const success = await uploadFile(localPath, storagePath);
      if (success) {
        console.log('✅');
      }
    }
  }
}

/**
 * Main upload function
 */
async function main() {
  console.log('🚀 Starting Firebase Storage Upload\n');
  console.log(`Source: ${publicDir}`);
  console.log(`Destination: gs://msmesite-53367.firebasestorage.app\n`);
  
  if (!fs.existsSync(publicDir)) {
    console.error('❌ Public directory not found:', publicDir);
    process.exit(1);
  }
  
  const startTime = Date.now();
  
  await uploadDirectory(publicDir);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files: ${stats.total}`);
  console.log(`Successful: ${stats.success}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Duration: ${duration}s`);
  console.log('='.repeat(60));
  
  if (stats.success > 0) {
    console.log('\n✅ Files are now publicly accessible at:');
    console.log('   https://storage.googleapis.com/msmesite-53367.firebasestorage.app/[filepath]');
    console.log('\n   Example:');
    console.log('   https://storage.googleapis.com/msmesite-53367.firebasestorage.app/home-banner/image.jpg');
  }
  
  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch(console.error);
