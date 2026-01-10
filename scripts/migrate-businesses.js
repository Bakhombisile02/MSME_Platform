/**
 * Migration script specifically for MSME Businesses table
 */

const admin = require('firebase-admin');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../MSME-Backend/.env') });

const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'msmesite-53367.firebasestorage.app'
});

const db = admin.firestore();

function toTimestamp(date) {
  if (!date) return null;
  const dateObj = new Date(date);
  // Validate the date is parseable
  if (isNaN(dateObj.getTime())) {
    console.warn(`Invalid date value: ${date}`);
    return null;
  }
  return admin.firestore.Timestamp.fromDate(dateObj);
}

function removeUndefined(obj) {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

const transform = (row) => ({
  id: String(row.id),
  name_of_organization: row.name_of_organization || '',
  brief_company_description: row.brief_company_description || '',
  business_category_id: row.business_category_id ? String(row.business_category_id) : null,
  business_category_name: row.business_category_name || '',
  business_sub_category_id: row.business_sub_category_id ? String(row.business_sub_category_id) : null,
  business_sub_category_name: row.business_sub_category_name || '',
  service_offered: row.service_offered || '',
  product_offered: row.product_offered || '',
  business_type: row.business_type || '',
  ownerType: row.ownerType || '',
  disability_owned: row.disability_owned || '',
  turnover: row.turnover || '',
  establishment_year: row.establishment_year || '',
  employees: row.employees || '',
  contact_number: row.contact_number || '',
  email_address: row.email_address || '',
  street_address: row.street_address || '',
  town: row.town || '',
  region: row.region || '',
  primary_contact_name: row.primary_contact_name || '',
  primary_contact_number: row.primary_contact_number || '',
  primary_contact_email: row.primary_contact_email || '',
  business_profile_url: row.business_profile_url || '',
  business_image_url: row.business_image_url || '',
  incorporation_image_url: row.incorporation_image_url || '',
  // Do NOT migrate passwords - users must use Firebase Auth or reset password
  // password field intentionally omitted for security
  is_verified: row.is_verified || '1',
  is_verified_comments: row.is_verified_comments || '',
  // Invalidate all time-bound credentials - users must request new ones
  otp: null,
  otp_expiry: null,
  otp_verified: false,
  reset_token: null,
  reset_token_expiry: null,
  lat: row.lat || '',
  longe: row.longe || '',
  ownership_type: row.ownership_type || '',
  inkhundla: row.inkhundla || '',
  rural_urban_classification: row.rural_urban_classification || '',
  telephone_number: row.telephone_number || '',
  owner_gender_summary: row.owner_gender_summary || '',
  createdAt: toTimestamp(row.createdAt),
  updatedAt: toTimestamp(row.updatedAt),
  deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
});

async function migrate() {
  console.log('🚀 Starting MSME Business Migration\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'msme_db',
  });
  
  console.log('📦 Migrating MSMEBusiness → msme_businesses...');
  const [rows] = await connection.execute('SELECT * FROM MSMEBusiness');
  console.log('   Found ' + rows.length + ' records');
  
  let batch = db.batch();
  let batchCount = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const row of rows) {
    try {
      const rawData = transform(row);
      const data = removeUndefined(rawData);
      const docRef = db.collection('msme_businesses').doc(String(row.id));
      batch.set(docRef, data);
      batchCount++;
      
      if (batchCount >= 450) {
        await batch.commit();
        totalSuccess += batchCount;
        console.log('   Committed batch: ' + totalSuccess + ' records');
        batchCount = 0;
        batch = db.batch();
      }
    } catch (error) {
      console.error('   ❌ Error on record ' + row.id + ': ' + error.message);
      totalFailed++;
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
    totalSuccess += batchCount;
  }
  
  console.log('\n✅ Migrated ' + totalSuccess + '/' + rows.length + ' records');
  if (totalFailed > 0) {
    console.log('❌ Failed: ' + totalFailed);
  }
  
  await connection.end();
  console.log('📡 MySQL connection closed');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
