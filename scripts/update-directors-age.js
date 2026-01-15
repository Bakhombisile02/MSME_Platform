/**
 * Update directors subcollections with age field from MySQL
 */

const admin = require('firebase-admin');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../MSME-Backend/.env' });

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateDirectorsAge() {
  // Validate required environment variables
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please ensure MSME-Backend/.env contains all required database credentials');
    process.exit(1);
  }

  let connection;
  
  try {
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Connected to MySQL');

    // Get all directors from MySQL
    const [directorRows] = await connection.execute('SELECT id, age, business_id FROM directorsInfos WHERE deletedAt IS NULL');
    console.log(`Found ${directorRows.length} directors in MySQL`);

    // Create a map of MySQL director ID to age
    const directorAgeMap = new Map();
    directorRows.forEach(dir => {
      directorAgeMap.set(dir.id, dir.age);
    });

    // Get all businesses from Firestore
    const businessesSnapshot = await db.collection('msme_businesses').get();
    console.log(`Found ${businessesSnapshot.size} businesses in Firestore`);

    let updatedCount = 0;
    let errorCount = 0;

    // Iterate through each business
    for (const businessDoc of businessesSnapshot.docs) {
      const businessId = businessDoc.id;
      
      // Get directors subcollection
      const directorsSnapshot = await db
        .collection('msme_businesses')
        .doc(businessId)
        .collection('directors')
        .get();

      for (const directorDoc of directorsSnapshot.docs) {
        const director = directorDoc.data();
        const mysqlId = director.mysql_id;

        if (mysqlId && directorAgeMap.has(mysqlId)) {
          const age = directorAgeMap.get(mysqlId);
          
          try {
            await db
              .collection('msme_businesses')
              .doc(businessId)
              .collection('directors')
              .doc(directorDoc.id)
              .update({ age });
            
            updatedCount++;
            if (updatedCount % 50 === 0) {
              console.log(`Updated ${updatedCount} directors...`);
            }
          } catch (error) {
            console.error(`Error updating director ${directorDoc.id}:`, error.message);
            errorCount++;
          }
        }
      }
    }

    console.log(`\nUpdate complete!`);
    console.log(`Successfully updated: ${updatedCount} directors`);
    console.log(`Errors: ${errorCount}`);

  } catch (error) {
    console.error('Error updating directors:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('MySQL connection closed');
    }
    process.exit(0);
  }
}

updateDirectorsAge();
