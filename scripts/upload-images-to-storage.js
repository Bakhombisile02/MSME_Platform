/**
 * Upload local images from MSME-Backend/public to Firebase Storage
 * 
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json node upload-images-to-storage.js
 * Or: Run with Application Default Credentials
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp({
  projectId: 'msmesite-53367',
  storageBucket: 'msmesite-53367.firebasestorage.app'
});

const bucket = admin.storage().bucket();
const PUBLIC_DIR = path.join(__dirname, '../MSME-Backend/public');

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

async function uploadFile(localPath, remotePath) {
  try {
    const contentType = getMimeType(localPath);
    await bucket.upload(localPath, {
      destination: remotePath,
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });
    console.log(`✅ ${remotePath}`);
    return true;
  } catch (error) {
    console.log(`❌ ${remotePath}: ${error.message}`);
    return false;
  }
}

async function walkDir(dir, baseDir = '') {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      files.push(...await walkDir(fullPath, relativePath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx'].includes(ext)) {
        files.push({ localPath: fullPath, remotePath: relativePath });
      }
    }
  }
  
  return files;
}

async function main() {
  console.log('📤 Uploading images to Firebase Storage...\n');
  console.log(`Source: ${PUBLIC_DIR}`);
  console.log(`Bucket: msmesite-53367.firebasestorage.app\n`);
  
  const files = await walkDir(PUBLIC_DIR);
  console.log(`Found ${files.length} files to upload\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const file of files) {
    const result = await uploadFile(file.localPath, file.remotePath);
    if (result) success++;
    else failed++;
  }
  
  console.log(`\n========================================`);
  console.log(`Uploaded: ${success}, Failed: ${failed}`);
  console.log(`========================================`);
  
  // Exit with non-zero code if any uploads failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
