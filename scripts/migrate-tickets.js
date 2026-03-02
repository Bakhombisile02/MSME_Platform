// scripts/migrate-tickets.js
const admin = require('firebase-admin');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../MSME-Backend/.env') });

const serviceAccount = require('../serviceAccountKey.json');
// Only initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
}

const db = admin.firestore();

function toTimestamp(date) {
  if (!date) return null;
  const dateObj = new Date(date);
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

// Map tickets to Tickets collection
const mapTicket = (row) => {
  return removeUndefined({
    ticket_id: row.ticket_id || `TKT-LEGACY-${row.id}`,
    name: row.name || 'Unknown',
    email: row.email || 'no-email@example.com',
    phone: row.mobile || '',
    mobile: row.mobile || '',
    subject: row.subject || 'No Subject',
    message: row.message || 'No Message',
    category_id: row.category_id ? String(row.category_id) : undefined,
    status: row.status || 'open',
    priority: row.priority || 'medium',
    is_read: row.is_read ? true : false,
    assigned_to: row.assigned_to ? String(row.assigned_to) : undefined,
    response_count: row.response_count || 0,
    due_date: toTimestamp(row.due_date),
    first_response_at: toTimestamp(row.first_response_at),
    resolved_at: toTimestamp(row.resolved_at),
    closed_at: toTimestamp(row.closed_at),
    last_activity_at: toTimestamp(row.last_activity_at),
    satisfaction_rating: row.satisfaction_rating,
    satisfaction_feedback: row.satisfaction_feedback,
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  });
};

const mapTicketResponse = (row) => {
  return removeUndefined({
    message: row.message || '',
    is_internal: row.is_internal ? true : false,
    staff_id: row.admin_id ? String(row.admin_id) : undefined,
    read_at: toTimestamp(row.read_at),
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  });
};

const mapTicketCategory = (row) => {
    return removeUndefined({
      id: String(row.id),
      name: row.name || '',
      description: row.description || '',
      sla_hours: row.sla_hours,
      order: row.order || 0,
      is_active: row.is_active !== undefined ? row.is_active : true,
      createdAt: toTimestamp(row.createdAt),
      updatedAt: toTimestamp(row.updatedAt),
      deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
    });
  };

async function migrateTickets() {
  console.log('🔌 Connecting to legacy MySQL database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'msme_db',
  });

  try {
    // 1. Migrate Categories
    console.log('\n=======================================');
    console.log('🔄 Migrating Ticket Categories...');
    const [categories] = await connection.execute('SELECT * FROM ticket_categories');
    
    let categoriesMigrated = 0;
    const batchCategories = db.batch();
    for (const cat of categories) {
      const mapped = mapTicketCategory(cat);
      const ref = db.collection('ticket_categories').doc(String(cat.id));
      batchCategories.set(ref, mapped);
      categoriesMigrated++;
    }
    await batchCategories.commit();
    console.log(`✅ Migrated ${categoriesMigrated} ticket categories`);

    // 2. Migrate Tickets
    console.log('\n=======================================');
    console.log('🔄 Migrating Main Tickets...');
    const [tickets] = await connection.execute('SELECT * FROM contact_us');
    
    let ticketsMigrated = 0;
    for (let i = 0; i < tickets.length; i += 500) {
      const chunk = tickets.slice(i, i + 500);
      const batch = db.batch();
      
      for (const tkt of chunk) {
        const mapped = mapTicket(tkt);
        // Using old integer ID as the string ID to preserve relation to responses
        const ref = db.collection('tickets').doc(String(tkt.id));
        batch.set(ref, mapped);
        ticketsMigrated++;
      }
      
      await batch.commit();
      console.log(`  ...committed chunk, total migrated: ${ticketsMigrated}`);
    }
    console.log(`✅ Migrated ${ticketsMigrated} total tickets`);

    // 3. Migrate Responses
    console.log('\n=======================================');
    console.log('🔄 Migrating Ticket Responses...');
    const [responses] = await connection.execute('SELECT * FROM ticket_responses');
    
    let responsesMigrated = 0;
    for (let i = 0; i < responses.length; i += 500) {
      const chunk = responses.slice(i, i + 500);
      const batch = db.batch();

      for (const res of chunk) {
        const mapped = mapTicketResponse(res);
        if (res.ticket_id) {
           const ref = db.collection('tickets').doc(String(res.ticket_id)).collection('responses').doc(String(res.id));
           batch.set(ref, mapped);
           responsesMigrated++;
        }
      }
      await batch.commit();
      console.log(`  ...committed chunk, total migrated: ${responsesMigrated}`);
    }
    console.log(`✅ Migrated ${responsesMigrated} total responses`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await connection.end();
    console.log('\n🔌 MySQL connection closed');
  }
}

migrateTickets().then(() => {
  console.log('🎉 Done!');
  process.exit(0);
});
