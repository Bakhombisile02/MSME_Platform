/**
 * Check MSME Business Counts in Firestore
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  console.log('=== Checking MSME Business Counts ===\n');
  
  const all = await db.collection('msme_businesses').get();
  
  let pending = 0, approved = 0, rejected = 0, other = 0;
  let deletedAtMissing = 0, deleted = 0;
  
  all.docs.forEach(doc => {
    const data = doc.data();
    const deletedAt = data.deletedAt;
    
    if (deletedAt === undefined) deletedAtMissing++;
    
    // Check if deleted
    if (deletedAt !== null && deletedAt !== undefined) {
      deleted++;
      return;
    }
    
    // Count by status
    if (data.is_verified === 1) pending++;
    else if (data.is_verified === 2) approved++;
    else if (data.is_verified === 3) rejected++;
    else other++;
  });
  
  console.log('Total documents:', all.size);
  console.log('Deleted (soft):', deleted);
  console.log('---');
  console.log('Pending (is_verified=1):', pending);
  console.log('Approved (is_verified=2):', approved);
  console.log('Rejected (is_verified=3):', rejected);
  console.log('Other status:', other);
  console.log('---');
  console.log('Missing deletedAt field:', deletedAtMissing);
  
  process.exit(0);
}

check().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
