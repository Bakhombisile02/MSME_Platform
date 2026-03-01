/**
 * Check Firebase Business Status
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
}

const db = admin.firestore();

async function check() {
  const snapshot = await db.collection('msme_businesses').get();
  
  const stats = { status1: 0, status2: 0, status3: 0, other: 0, deleted: 0 };
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const status = data.is_verified;
    const deleted = data.deletedAt;
    
    if (deleted) stats.deleted++;
    else if (status === 1 || status === '1') stats.status1++;
    else if (status === 2 || status === '2') stats.status2++;
    else if (status === 3 || status === '3') stats.status3++;
    else stats.other++;
  });
  
  console.log('Firebase Business Status:');
  console.log('  Pending (1):', stats.status1);
  console.log('  Approved (2):', stats.status2);
  console.log('  Rejected (3):', stats.status3);
  console.log('  Other:', stats.other);
  console.log('  Soft Deleted:', stats.deleted);
  console.log('  Total:', snapshot.size);
}

check().then(() => process.exit(0));
