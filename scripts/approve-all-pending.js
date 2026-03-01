/**
 * Approve All Pending Businesses
 * Changes is_verified from 1 (pending) to 2 (approved)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function approveAllPending() {
  console.log('=== Approving All Pending Businesses ===\n');
  
  // Get all pending businesses (is_verified = 1)
  const snapshot = await db.collection('msme_businesses')
    .where('is_verified', '==', 1)
    .where('deletedAt', '==', null)
    .get();
  
  console.log(`Found ${snapshot.size} pending businesses\n`);
  
  if (snapshot.size === 0) {
    console.log('No pending businesses to approve.');
    process.exit(0);
  }
  
  let batch = db.batch();
  let count = 0;
  let total = 0;
  
  for (const doc of snapshot.docs) {
    batch.update(doc.ref, {
      is_verified: 2,
      verification_date: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    count++;
    total++;
    
    // Firestore batch limit is 500
    if (count >= 500) {
      await batch.commit();
      console.log(`Committed batch of ${count} (total: ${total})`);
      batch = db.batch();
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${count} (total: ${total})`);
  }
  
  console.log(`\n✅ Approved ${snapshot.size} pending businesses`);
  process.exit(0);
}

approveAllPending().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
