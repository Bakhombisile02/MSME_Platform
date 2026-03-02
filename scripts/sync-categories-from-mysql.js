const admin = require('firebase-admin');
const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../MSME-Backend/.env') });

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app',
  });
}

const db = admin.firestore();

function toTimestamp(value) {
  if (!value) return null;
  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(dateObj);
}

async function syncBusinessCategories(connection) {
  const [rows] = await connection.execute('SELECT * FROM businessCategories');
  console.log(`Syncing businessCategories: ${rows.length} rows`);

  let batch = db.batch();
  let count = 0;

  for (const row of rows) {
    const id = String(row.id);
    const name = row.name || row.category_name || '';
    const image = row.icon_url || row.category_image || '';

    const docData = {
      id,
      name,
      category_name: name,
      icon_url: image,
      category_image: image,
      createdAt: toTimestamp(row.createdAt),
      updatedAt: toTimestamp(row.updatedAt),
      deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
    };

    batch.set(db.collection('business_categories').doc(id), docData, { merge: true });
    count++;

    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log('businessCategories sync complete');
}

async function syncBusinessSubCategories(connection) {
  const [rows] = await connection.execute('SELECT * FROM businessSubCategories');
  console.log(`Syncing businessSubCategories: ${rows.length} rows`);

  let batch = db.batch();
  let count = 0;

  for (const row of rows) {
    const id = String(row.id);
    const subCategoryName = row.name || row.sub_category_name || '';
    const categoryId = row.BusinessCategorieId !== null && row.BusinessCategorieId !== undefined
      ? String(row.BusinessCategorieId)
      : (row.category_id !== null && row.category_id !== undefined ? String(row.category_id) : '');
    const categoryName = row.BusinessCategorieName || row.category_name || '';

    const docData = {
      id,
      name: subCategoryName,
      sub_category_name: subCategoryName,
      BusinessCategorieId: categoryId,
      category_id: categoryId,
      BusinessCategorieName: categoryName,
      category_name: categoryName,
      createdAt: toTimestamp(row.createdAt),
      updatedAt: toTimestamp(row.updatedAt),
      deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
    };

    batch.set(db.collection('business_sub_categories').doc(id), docData, { merge: true });
    count++;

    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log('businessSubCategories sync complete');
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await syncBusinessCategories(connection);
    await syncBusinessSubCategories(connection);
    console.log('Category sync from MySQL completed successfully');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Category sync failed:', error);
  process.exit(1);
});
