/**
 * Migrate directors from MySQL to Firestore subcollections
 */

const admin = require('firebase-admin');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../MSME-Backend/.env' });

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;

function toFirestoreId(mysqlId, prefix) {
  return `${prefix}_${mysqlId}`;
}

function toTimestamp(dateValue) {
  if (!dateValue) return null;
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return Timestamp.fromDate(date);
}

async function migrateDirectors() {
  try {
    // Connect to MySQL
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'msme_db'
    });

    console.log('Connected to MySQL');

    // Get all directors from MySQL
    const [directorRows] = await connection.execute('SELECT * FROM directorsInfos WHERE deletedAt IS NULL');
    console.log(`Found ${directorRows.length} directors in MySQL`);

    // Group directors by business_id
    const directorsByBusiness = new Map();
    directorRows.forEach(dir => {
      const bizMysqlId = dir.business_id;
      const list = directorsByBusiness.get(bizMysqlId) || [];
      list.push(dir);
      directorsByBusiness.set(bizMysqlId, list);
    });

    console.log(`Directors spread across ${directorsByBusiness.size} businesses`);

    // For each business with directors, migrate them
    let migratedCount = 0;
    let errorCount = 0;
    let skippedBusinesses = 0;

    // Migrate directors - use MySQL business ID directly as it's the Firestore doc ID
    for (const [mysqlBusinessId, directors] of directorsByBusiness.entries()) {
      const firestoreBusinessId = mysqlBusinessId.toString();
      
      // Check if business exists in Firestore
      const businessDoc = await db.collection('msme_businesses').doc(firestoreBusinessId).get();
      
      if (!businessDoc.exists) {
        skippedBusinesses++;
        continue;
      }

      for (const dir of directors) {
        try {
          const dirId = toFirestoreId(dir.id, 'dir');
          await db.collection('msme_businesses')
            .doc(firestoreBusinessId)
            .collection('directors')
            .doc(dirId)
            .set({
              id: dirId,
              mysql_id: dir.id,
              full_name: dir.name || '',
              email: dir.email || '',
              phone: dir.phone || '',
              gender: dir.gender || '',
              age: dir.age && !isNaN(Number(dir.age)) ? Number(dir.age) : null,
              nationality: dir.nationality || '',
              position: dir.position || '',
              qualification: dir.qualification || '',
              id_number: dir.id_number || '',
              createdAt: toTimestamp(dir.createdAt) || Timestamp.now(),
              updatedAt: toTimestamp(dir.updatedAt) || Timestamp.now(),
              deletedAt: toTimestamp(dir.deletedAt),
            });
          
          migratedCount++;
          if (migratedCount % 100 === 0) {
            console.log(`Migrated ${migratedCount} directors...`);
          }
        } catch (error) {
          console.error(`Error migrating director ${dir.id}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Successfully migrated: ${migratedCount} directors`);
    console.log(`Skipped businesses not in Firestore: ${skippedBusinesses}`);
    console.log(`Errors: ${errorCount}`);

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Error migrating directors:', error);
    process.exit(1);
  }
}

migrateDirectors();
