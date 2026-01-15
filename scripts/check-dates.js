/**
 * Check if createdAt timestamps exist in Firestore collections
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkDates() {
  console.log('🔍 Checking createdAt timestamps in Firestore collections\n');
  
  const collections = [
    'msme_businesses',
    'service_providers',
    'subscribers',
    'feedback',
    'contact_us'
  ];
  
  for (const collectionName of collections) {
    console.log(`\n📋 Collection: ${collectionName}`);
    console.log('─'.repeat(60));
    
    const snapshot = await db.collection(collectionName).limit(10).get();
    
    if (snapshot.empty) {
      console.log('   ⚠️  No documents found');
      continue;
    }
    
    let withCreatedAt = 0;
    let withoutCreatedAt = 0;
    let withInvalidCreatedAt = 0;
    const examples = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.createdAt) {
        // Check if it's a valid Timestamp
        if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
          withCreatedAt++;
          if (examples.length < 3) {
            const date = data.createdAt.toDate();
            examples.push({
              id: doc.id,
              name: data.name_of_organization || data.name || data.email || 'N/A',
              createdAt: date.toISOString(),
              year: date.getFullYear(),
              month: date.getMonth() + 1
            });
          }
        } else {
          withInvalidCreatedAt++;
        }
      } else {
        withoutCreatedAt++;
      }
    });
    
    console.log(`   ✅ Documents with valid createdAt: ${withCreatedAt}/${snapshot.size}`);
    console.log(`   ❌ Documents missing createdAt: ${withoutCreatedAt}/${snapshot.size}`);
    if (withInvalidCreatedAt > 0) {
      console.log(`   ⚠️  Documents with invalid createdAt: ${withInvalidCreatedAt}/${snapshot.size}`);
    }
    
    if (examples.length > 0) {
      console.log('\n   Sample dates:');
      examples.forEach(ex => {
        console.log(`   • ${ex.name.substring(0, 30).padEnd(30)} - ${ex.createdAt.substring(0, 10)} (${ex.year}-${String(ex.month).padStart(2, '0')})`);
      });
    }
  }
  
  // Check for monthly registration capability
  console.log('\n\n📊 Monthly Registration Analysis');
  console.log('═'.repeat(60));
  
  const businessSnapshot = await db.collection('msme_businesses').get();
  const businessesByMonth = {};
  let missingDates = 0;
  
  businessSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.createdAt && data.createdAt.toDate) {
      const date = data.createdAt.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      businessesByMonth[monthKey] = (businessesByMonth[monthKey] || 0) + 1;
    } else {
      missingDates++;
    }
  });
  
  console.log(`\nTotal businesses: ${businessSnapshot.size}`);
  console.log(`Businesses with valid dates: ${businessSnapshot.size - missingDates}`);
  console.log(`Businesses missing dates: ${missingDates}`);
  
  if (missingDates > 0) {
    console.log('\n⚠️  WARNING: Some businesses are missing createdAt timestamps!');
    console.log('   Monthly calculations will be incomplete.');
  } else {
    console.log('\n✅ All businesses have valid createdAt timestamps!');
  }
  
  console.log('\nMonthly registrations:');
  const sortedMonths = Object.keys(businessesByMonth).sort();
  sortedMonths.forEach(month => {
    console.log(`   ${month}: ${businessesByMonth[month]} registrations`);
  });
  
  process.exit(0);
}

checkDates().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
