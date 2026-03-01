/**
 * Sync Verification Status Script
 * 
 * This script syncs the verification status from the SQL backup to Firebase.
 * In the SQL backup (Migrate folder then delete):
 * - All businesses have is_verified = 2 (approved)
 * - Rejected businesses have been removed
 * 
 * This script will:
 * 1. Update businesses migrated from the backup to is_verified: 2
 * 2. Remove any rejected businesses that shouldn't exist
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
}

const db = admin.firestore();

// Parse the SQL file to get business IDs that should be approved
function parseApprovedBusinessIds(sqlContent) {
  const approvedIds = new Set();
  
  // Match INSERT INTO MSMEBusiness statements
  const insertRegex = /INSERT INTO `?MSMEBusiness`?\s+(?:\([^)]+\)\s+)?VALUES\s+([\s\S]*?)(?=;)/gi;
  let match;
  
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const valuesBlock = match[1];
    
    // Match individual value tuples - extract the ID (first value in each tuple)
    const tupleRegex = /\((\d+),'/g;
    let tupleMatch;
    
    while ((tupleMatch = tupleRegex.exec(valuesBlock)) !== null) {
      const id = tupleMatch[1];
      approvedIds.add(id);
    }
  }
  
  return approvedIds;
}

async function syncVerificationStatus() {
  console.log('='.repeat(60));
  console.log('SYNC VERIFICATION STATUS');
  console.log('='.repeat(60));
  
  // Read the SQL backup file
  const sqlPath = path.join(__dirname, '../Migrate folder then delete/msme_db_backup_20260115_145816.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL backup file not found:', sqlPath);
    return;
  }
  
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const approvedIds = parseApprovedBusinessIds(sqlContent);
  
  console.log(`\nFound ${approvedIds.size} approved business IDs in SQL backup`);
  console.log('Sample IDs:', Array.from(approvedIds).slice(0, 10).join(', '));
  
  // Get all businesses from Firestore
  console.log('\nFetching businesses from Firestore...');
  const businessesSnapshot = await db.collection('msme_businesses').get();
  
  console.log(`Found ${businessesSnapshot.size} businesses in Firestore`);
  
  // Categorize businesses
  const stats = {
    alreadyApproved: 0,
    needsApproval: 0,
    toBeRemoved: 0,
    updated: 0,
    errors: 0
  };
  
  const toUpdate = [];
  const toRemove = [];
  
  businessesSnapshot.forEach(doc => {
    const data = doc.data();
    const legacyId = data.legacy_id?.toString() || doc.id;
    const isVerified = data.is_verified;
    
    // Check if this business ID exists in the SQL backup (approved list)
    const isInBackup = approvedIds.has(legacyId);
    
    if (isInBackup) {
      // Business should be approved
      if (isVerified === 2 || isVerified === '2') {
        stats.alreadyApproved++;
      } else {
        stats.needsApproval++;
        toUpdate.push({
          docId: doc.id,
          legacyId: legacyId,
          currentStatus: isVerified,
          name: data.name
        });
      }
    } else if (isVerified === 3 || isVerified === '3') {
      // Rejected business not in backup - should be removed
      stats.toBeRemoved++;
      toRemove.push({
        docId: doc.id,
        legacyId: legacyId,
        name: data.name
      });
    }
  });
  
  console.log('\n--- STATUS SUMMARY ---');
  console.log(`Already approved (is_verified=2): ${stats.alreadyApproved}`);
  console.log(`Needs approval update: ${stats.needsApproval}`);
  console.log(`Rejected to be removed: ${stats.toBeRemoved}`);
  
  // Update businesses that need approval
  if (toUpdate.length > 0) {
    console.log('\n--- UPDATING BUSINESSES TO APPROVED ---');
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const business of toUpdate) {
      console.log(`  Updating: ${business.name} (legacy_id: ${business.legacyId}) from status ${business.currentStatus} to 2`);
      
      const docRef = db.collection('msme_businesses').doc(business.docId);
      batch.update(docRef, {
        is_verified: 2,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      batchCount++;
      
      // Firestore batch limit is 500
      if (batchCount >= 450) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} updates`);
        batchCount = 0;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  Committed final batch of ${batchCount} updates`);
    }
    
    stats.updated = toUpdate.length;
  }
  
  // Remove rejected businesses (soft delete)
  if (toRemove.length > 0) {
    console.log('\n--- SOFT DELETING REJECTED BUSINESSES ---');
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const business of toRemove) {
      console.log(`  Soft deleting: ${business.name} (legacy_id: ${business.legacyId})`);
      
      const docRef = db.collection('msme_businesses').doc(business.docId);
      batch.update(docRef, {
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      batchCount++;
      
      if (batchCount >= 450) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} soft deletes`);
        batchCount = 0;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  Committed final batch of ${batchCount} soft deletes`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SYNC COMPLETE');
  console.log('='.repeat(60));
  console.log(`Updated to approved: ${stats.updated}`);
  console.log(`Soft deleted (rejected): ${toRemove.length}`);
  console.log('='.repeat(60));
}

// Run the sync
syncVerificationStatus()
  .then(() => {
    console.log('\nSync completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
  });
