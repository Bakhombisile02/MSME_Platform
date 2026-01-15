/**
 * Migrate contact_us from MySQL to Firestore
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

function toTimestamp(dateValue) {
  if (!dateValue) return null;
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return Timestamp.fromDate(date);
}

async function migrateContactUs() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'msme_db'
    });

    console.log('Connected to MySQL');

    const [rows] = await connection.execute('SELECT * FROM contact_us WHERE deletedAt IS NULL');
    console.log(`Found ${rows.length} contact_us records in MySQL`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        const docId = `contact_${row.id}`;
        await db.collection('contact_us').doc(docId).set({
          id: docId,
          name: row.name || '',
          email: row.email || '',
          phone: row.phone || '',
          subject: row.subject || '',
          message: row.message || '',
          status: row.status || 'pending',
          createdAt: toTimestamp(row.createdAt) || Timestamp.now(),
          updatedAt: toTimestamp(row.updatedAt) || Timestamp.now(),
          deletedAt: toTimestamp(row.deletedAt),
        });
        
        migratedCount++;
        console.log(`Migrated contact_us ${row.id}`);
      } catch (error) {
        console.error(`Error migrating contact_us ${row.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Successfully migrated: ${migratedCount} contact_us records`);
    console.log(`Errors: ${errorCount}`);

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Error migrating contact_us:', error);
    process.exit(1);
  }
}

migrateContactUs();
