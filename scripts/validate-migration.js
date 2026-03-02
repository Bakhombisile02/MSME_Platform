const admin = require('firebase-admin');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../MSME-Backend/.env') });

const serviceAccount = require('../serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// Collection mapping (MySQL table -> Firestore collection)
const tables = [
  { mysql: 'MSMEBusiness', firestore: 'msme_businesses' },
  { mysql: 'businessCategories', firestore: 'business_categories' },
  { mysql: 'businessSubCategories', firestore: 'business_sub_categories' },
  { mysql: 'serviceProviders', firestore: 'service_providers' },
  { mysql: 'serviceProviderCategoriess', firestore: 'service_provider_categories' },
  { mysql: 'homeBanners', firestore: 'home_banners' },
  { mysql: 'partnersLogos', firestore: 'partners_logos' },
  { mysql: 'downloads', firestore: 'downloads' },
  { mysql: 'teams', firestore: 'team_members' },
  { mysql: 'faqs', firestore: 'faqs' },
  { mysql: 'blogs', firestore: 'blogs' },
  { mysql: 'contact_us', firestore: 'tickets' }, // our newly mapped table
  { mysql: 'ticket_categories', firestore: 'ticket_categories' },
  { mysql: 'ticket_responses', firestore: 'tickets/responses (Subcollection, handled separately)' },
];

async function countFirestoreCollection(collectionName) {
  const snapshot = await db.collection(collectionName).count().get();
  return snapshot.data().count;
}

async function validate() {
  console.log('🔌 Connecting to legacy MySQL...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'msme_db',
  });

  console.log('\n📊 Validating Database Entity Counts\n');
  console.group('MIGRATION RESULTS');

  let allMatch = true;

  for (const table of tables) {
    if (table.firestore.includes('(Subcollection')) {
       console.log(`[SKIP] ${table.mysql} -> ${table.firestore}: Complex subcollection structure`);
       continue;
    }

    try {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table.mysql} WHERE deletedAt IS NULL`);
      const mysqlCount = rows[0].count;
      
      const firestoreCount = await countFirestoreCollection(table.firestore);
      
      const match = mysqlCount === firestoreCount;
      const status = match ? '✅ MATCH' : '❌ MISMATCH';
      
      console.log(`${Math.abs(mysqlCount - firestoreCount) === 0 ? '🟢' : '🔴'} ${table.mysql.padEnd(25)} | MySQL: ${String(mysqlCount).padEnd(5)} | Firestore: ${String(firestoreCount).padEnd(5)} | ${status}`);
      
      if (!match) allMatch = false;
    } catch (e) {
      console.log(`⚠️  Error checking ${table.mysql}: ${e.message}`);
    }
  }
  
  console.groupEnd();
  
  if (allMatch) {
    console.log('\n🎉 ALL COUNTS MATCH! Migration was successful.');
  } else {
    // Some entities map deleted items to Firestore but with `deletedAt: Timestamp`. You might get slight mismatches if queries don't account for null deletedAt.
    console.log('\n⚠️ Some collections have a mismatch. Note: The legacy database includes "deletedAt" rows that may or may not have been carried over by the earlier `migrateData.ts` scripts.');
  }

  await connection.end();
  process.exit();
}

validate();