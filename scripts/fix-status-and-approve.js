/**
 * Fix MSME Business Status Types and Approve Pending
 * 
 * Converts string status values to numbers and approves all pending
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixAndApprove() {
  console.log('=== Fixing Status Types and Approving Pending ===\n');
  
  const all = await db.collection('msme_businesses').get();
  
  let batch = db.batch();
  let count = 0;
  let total = 0;
  let fixedType = 0;
  let approved = 0;
  
  for (const doc of all.docs) {
    const data = doc.data();
    
    // Skip deleted
    if (data.deletedAt !== null && data.deletedAt !== undefined) continue;
    
    const updates = {};
    let needsUpdate = false;
    
    // Fix string status to number and approve pending
    if (data.is_verified === '1' || data.is_verified === 1) {
      // Pending - approve it
      updates.is_verified = 2;
      updates.verification_date = admin.firestore.FieldValue.serverTimestamp();
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      needsUpdate = true;
      approved++;
      if (typeof data.is_verified === 'string') fixedType++;
    } else if (typeof data.is_verified === 'string') {
      // Fix other string types
      updates.is_verified = parseInt(data.is_verified, 10);
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      needsUpdate = true;
      fixedType++;
    }
    
    if (needsUpdate) {
      batch.update(doc.ref, updates);
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
  }
  
  if (count > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${count} (total: ${total})`);
  }
  
  console.log(`\n✅ Summary:`);
  console.log(`   Fixed type (string→number): ${fixedType}`);
  console.log(`   Approved pending: ${approved}`);
  console.log(`   Total updated: ${total}`);
  
  process.exit(0);
}

fixAndApprove().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
