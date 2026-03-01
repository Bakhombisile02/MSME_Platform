const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteRejectedMSMEs() {
  try {
    console.log('🔍 Searching for rejected MSMEs (is_verified = 3)...\n');

    // Query for rejected businesses
    const rejectedSnapshot = await db.collection('businesses')
      .where('is_verified', '==', 3)
      .where('deletedAt', '==', null)
      .get();

    if (rejectedSnapshot.empty) {
      console.log('✅ No rejected MSMEs found to delete.');
      process.exit(0);
    }

    console.log(`📊 Found ${rejectedSnapshot.size} rejected MSMEs:\n`);

    // Display what will be deleted
    const businessesToDelete = [];
    rejectedSnapshot.forEach(doc => {
      const data = doc.data();
      businessesToDelete.push({
        id: doc.id,
        name: data.business_name || 'Unknown',
        email: data.email_address || 'N/A',
        rejectedAt: data.updatedAt ? new Date(data.updatedAt._seconds * 1000).toISOString() : 'N/A'
      });
    });

    businessesToDelete.forEach((business, index) => {
      console.log(`${index + 1}. ${business.name}`);
      console.log(`   ID: ${business.id}`);
      console.log(`   Email: ${business.email}`);
      console.log(`   Last Updated: ${business.rejectedAt}\n`);
    });

    console.log('⚠️  WARNING: This will permanently delete these businesses from Firestore!');
    console.log('⏳ Starting deletion in 5 seconds...\n');

    // Wait 5 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Batch delete
    const batch = db.batch();
    rejectedSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`✅ Successfully deleted ${rejectedSnapshot.size} rejected MSMEs from Firestore.`);

    // Verify deletion
    const verifySnapshot = await db.collection('businesses')
      .where('is_verified', '==', 3)
      .where('deletedAt', '==', null)
      .get();

    console.log(`\n🔍 Verification: ${verifySnapshot.size} rejected MSMEs remaining (should be 0).`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error deleting rejected MSMEs:', error);
    process.exit(1);
  }
}

// Run the script
deleteRejectedMSMEs();
