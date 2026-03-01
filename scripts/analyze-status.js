/**
 * Analyze MSME Business Status Values
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function analyze() {
  console.log('=== Analyzing MSME Business Status Values ===\n');
  
  const all = await db.collection('msme_businesses').get();
  
  const statusCounts = {};
  const statusTypes = {};
  
  all.docs.forEach(doc => {
    const data = doc.data();
    const deletedAt = data.deletedAt;
    
    // Skip deleted
    if (deletedAt !== null && deletedAt !== undefined) return;
    
    const status = data.is_verified;
    const type = typeof status;
    
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    statusTypes[status] = type;
  });
  
  console.log('Status counts:');
  Object.keys(statusCounts).sort().forEach(status => {
    console.log(`  is_verified=${status} (${statusTypes[status]}): ${statusCounts[status]}`);
  });
  
  // Check if some are strings instead of numbers
  console.log('\n--- Sample documents with non-standard status ---');
  let count = 0;
  for (const doc of all.docs) {
    const data = doc.data();
    if (data.deletedAt !== null && data.deletedAt !== undefined) continue;
    
    if (data.is_verified !== 1 && data.is_verified !== 2 && data.is_verified !== 3) {
      if (count < 5) {
        console.log(`ID: ${doc.id}, is_verified: ${data.is_verified} (${typeof data.is_verified}), name: ${data.business_name}`);
        count++;
      }
    }
  }
  
  process.exit(0);
}

analyze().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
