/**
 * Verification script for migration from backup folder
 * Checks that data was correctly migrated to Firestore
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
} catch (error) {
  console.error('Error loading service account key:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function verifyCollection(name, expectedMin = 0) {
  const snapshot = await db.collection(name).get();
  const count = snapshot.size;
  const status = count >= expectedMin ? '✅' : '⚠️';
  console.log(`${status} ${name}: ${count} documents`);
  return count;
}

async function verifyStorageFolder(folder) {
  try {
    const [files] = await bucket.getFiles({ prefix: folder, maxResults: 10 });
    console.log(`✅ Storage folder "${folder}": ${files.length}+ files found`);
    return files.length;
  } catch (error) {
    console.log(`❌ Storage folder "${folder}": Error - ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🔍 Verifying Migration Results');
  console.log('==============================\n');
  
  console.log('📚 Firestore Collections:');
  console.log('--------------------------');
  
  await verifyCollection('business_categories', 10);
  await verifyCollection('business_sub_categories', 40);
  await verifyCollection('msme_businesses', 250);
  await verifyCollection('directors', 1000);
  await verifyCollection('home_banners', 5);
  await verifyCollection('team_members', 10);
  await verifyCollection('faqs', 1);
  await verifyCollection('feedback', 1);
  await verifyCollection('subscribers', 10);
  await verifyCollection('contact_us', 1);
  await verifyCollection('admins', 1);
  await verifyCollection('service_providers', 0);
  await verifyCollection('service_provider_categories', 0);
  await verifyCollection('blogs', 0);
  await verifyCollection('downloads', 0);
  await verifyCollection('partners_logos', 0);
  
  console.log('\n📁 Firebase Storage Folders:');
  console.log('-----------------------------');
  
  await verifyStorageFolder('business/');
  await verifyStorageFolder('business-categories/');
  await verifyStorageFolder('home-banner/');
  await verifyStorageFolder('team-member/');
  await verifyStorageFolder('cms-assets/');
  
  console.log('\n📊 Sample Business Data:');
  console.log('--------------------------');
  
  // Get a sample business
  const businessSnapshot = await db.collection('msme_businesses')
    .where('is_verified', '==', 2)
    .limit(3)
    .get();
  
  businessSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`\n  Business ID: ${doc.id}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  Category: ${data.category_name}`);
    console.log(`  Region: ${data.region}`);
    console.log(`  Image: ${data.business_image || 'None'}`);
  });
  
  console.log('\n==============================');
  console.log('✅ Verification Complete!');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
