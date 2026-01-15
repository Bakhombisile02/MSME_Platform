/**
 * MySQL to Firestore Data Migration Script
 * 
 * This script migrates all data from the MySQL database to Firebase Firestore.
 * Run from the project root: node scripts/migrate-to-firestore.js
 */

const admin = require('firebase-admin');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../MSME-Backend/.env') });

// Initialize Firebase Admin SDK
// You need to download service account key from Firebase Console
// Go to: Project Settings > Service Accounts > Generate New Private Key
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
} catch (error) {
  console.error('Error loading service account key:', error.message);
  console.log('\n📋 To get your service account key:');
  console.log('1. Go to: https://console.firebase.google.com/project/msmesite-53367/settings/serviceaccounts/adminsdk');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save the file as "serviceAccountKey.json" in the project root');
  console.log('4. Run this script again\n');
  process.exit(1);
}

const db = admin.firestore();
const storage = admin.storage().bucket();

// Collection names mapping
const COLLECTIONS = {
  ADMINS: 'admins',
  MSME_BUSINESSES: 'msme_businesses',
  DIRECTORS: 'directors',
  BUSINESS_OWNERS: 'business_owners',
  BUSINESS_CATEGORIES: 'business_categories',
  BUSINESS_SUB_CATEGORIES: 'business_sub_categories',
  SERVICE_PROVIDERS: 'service_providers',
  SERVICE_PROVIDER_CATEGORIES: 'service_provider_categories',
  FAQS: 'faqs',
  BLOGS: 'blogs',
  HOME_BANNERS: 'home_banners',
  DOWNLOADS: 'downloads',
  PARTNERS_LOGOS: 'partners_logos',
  TEAM_MEMBERS: 'team_members',
  SUBSCRIBERS: 'subscribers',
  FEEDBACK: 'feedback',
  TICKETS: 'tickets',
  TICKET_CATEGORIES: 'ticket_categories',
  TICKET_RESPONSES: 'ticket_responses',
  TICKET_ATTACHMENTS: 'ticket_attachments',
  ANALYTICS: 'analytics',
  SEARCH_ANALYTICS: 'search_analytics',
};

// MySQL connection config
const mysqlConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'msme_db',
};

let connection;
let stats = {
  total: 0,
  success: 0,
  failed: 0,
  collections: {}
};

/**
 * Convert MySQL datetime to Firestore Timestamp with validation
 */
function toTimestamp(date) {
  if (!date) return null;
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    console.warn(`Invalid date value: ${date}`);
    return null;
  }
  return admin.firestore.Timestamp.fromDate(dateObj);
}

/**
 * Safely parse JSON with fallback
 */
function safeJsonParse(str, fallback = []) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn(`Failed to parse JSON: ${str.substring(0, 50)}...`);
    return fallback;
  }
}

/**
 * Remove undefined values from an object (Firestore doesn't accept undefined)
 */
function removeUndefined(obj) {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Migrate a single table to Firestore
 */
const ALLOWED_TABLES = [
  'admins', 'businessCategories', 'businessSubCategories', 'MSMEBusiness',
  'directorsInfos', 'business_owners', 'serviceProviderCategoriess', 'serviceProviders',
  'faqs', 'blogs', 'homeBanners', 'downloads', 'partnersLogos', 'teams',
  'subscribes', 'feedbasks', 'contact_us', 'ticket_categories', 'ticket_responses'
];

async function migrateTable(tableName, collectionName, transformer = (row) => row) {
  console.log(`\n📦 Migrating ${tableName} → ${collectionName}...`);
  
  // Validate table name to prevent SQL injection
  if (!ALLOWED_TABLES.includes(tableName)) {
    console.error(`   ❌ Invalid table name: ${tableName}`);
    stats.collections[collectionName] = { total: 0, success: 0, failed: 0, error: 'Invalid table name' };
    return;
  }
  
  try {
    const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
    console.log(`   Found ${rows.length} records`);
    
    if (rows.length === 0) {
      stats.collections[collectionName] = { total: 0, success: 0, failed: 0 };
      return;
    }
    
    let batch = db.batch();  // Use let so we can reassign
    let batchCount = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    
    for (const row of rows) {
      try {
        const rawData = transformer(row);
        const data = removeUndefined(rawData); // Clean undefined values
        const docRef = db.collection(collectionName).doc(String(row.id));
        batch.set(docRef, data);
        batchCount++;
        
        // Firestore batches have a limit of 500 operations
        if (batchCount >= 450) {
          await batch.commit();
          totalSuccess += batchCount;
          batchCount = 0;
          batch = db.batch(); // Create a NEW batch after commit
        }
      } catch (error) {
        console.error(`   ❌ Error processing record ${row.id}:`, error.message);
        totalFailed++;
      }
    }
    
    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
      totalSuccess += batchCount;
    }
    
    stats.collections[collectionName] = { total: rows.length, success: totalSuccess, failed: totalFailed };
    stats.total += rows.length;
    stats.success += totalSuccess;
    stats.failed += totalFailed;
    
    console.log(`   ✅ Migrated ${totalSuccess}/${rows.length} records`);
  } catch (error) {
    console.error(`   ❌ Error migrating ${tableName}:`, error.message);
    stats.collections[collectionName] = { total: 0, success: 0, failed: 0, error: error.message };
  }
}

/**
 * Transform functions for each table
 * These match the actual MySQL model field names
 */
const transformers = {
  admins: (row) => ({
    id: String(row.id),
    name: row.name || '',
    email: row.email || '',
    // Note: Password is NOT migrated - use Firebase Auth for authentication
    role: row.role || 'admin',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  msmeBusinesses: (row) => ({
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
    password: row.password || '', // Already hashed
    is_verified: row.is_verified || '1', // 1=pending, 2=approved, 3=rejected
    is_verified_comments: row.is_verified_comments || '',
    // OTP fields
    otp: row.otp || null,
    otp_expiry: toTimestamp(row.otp_expiry),
    otp_verified: row.otp_verified === 1,
    reset_token: row.reset_token || null,
    reset_token_expiry: toTimestamp(row.reset_token_expiry),
    // Location fields
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
  }),
  
  // DirectorsInfoModel: name, age, gender, qualification, nationality, business_id
  directors: (row) => ({
    id: String(row.id),
    business_id: row.business_id ? String(row.business_id) : '',
    name: row.name || '',
    age: row.age || '',
    gender: row.gender || '',
    qualification: row.qualification || '',
    nationality: row.nationality || '',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  // BusinessOwnersModel: business_id, gender
  businessOwners: (row) => ({
    id: String(row.id),
    business_id: row.business_id ? String(row.business_id) : '',
    gender: row.gender || '',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  // BusinessCategoriesModel: name, icon_url
  businessCategories: (row) => ({
    id: String(row.id),
    name: row.name || '',
    icon_url: row.icon_url || '',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  // BusinessSubCategoriesModel: BusinessCategorieId, BusinessCategorieName, name
  businessSubCategories: (row) => ({
    id: String(row.id),
    BusinessCategorieId: row.BusinessCategorieId ? String(row.BusinessCategorieId) : '',
    BusinessCategorieName: row.BusinessCategorieName || '',
    name: row.name || '',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  serviceProviders: (row) => ({
    id: String(row.id),
    organization_name: row.organization_name || '',
    category_id: row.category_id ? String(row.category_id) : null,
    region: row.region || '',
    physical_address: row.physical_address || '',
    telephone: row.telephone || '',
    email_address: row.email_address || '',
    website: row.website || '',
    brief_description: row.brief_description || '',
    services_offered: row.services_offered || '',
    image: row.image || '',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  serviceProviderCategories: (row) => ({
    id: String(row.id),
    name: row.name || '',
    description: row.description || '',
    image: row.image || '',
    is_active: row.is_active !== 0,
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  // FAQModel: question, answer (no title field)
  faqs: (row) => ({
    id: String(row.id),
    question: row.question || '',
    answer: row.answer || '',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  blogs: (row) => ({
    id: String(row.id),
    title: row.title || '',
    slug: row.slug || '',
    content: row.content || '',
    image: row.image || '',
    author: row.author || '',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  // HomeBannerModel: name, description, image_url, url
  homeBanners: (row) => ({
    id: String(row.id),
    name: row.name || '',
    description: row.description || '',
    image_url: row.image_url || '',
    url: row.url || '',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  downloads: (row) => ({
    id: String(row.id),
    title: row.title || '',
    description: row.description || '',
    file: row.file || '',
    file_type: row.file_type || '',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  partnersLogos: (row) => ({
    id: String(row.id),
    name: row.name || '',
    logo: row.logo || '',
    website: row.website || '',
    is_active: row.is_active !== 0,
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  // TeamModel: name, possition (typo in model), url
  teamMembers: (row) => ({
    id: String(row.id),
    name: row.name || '',
    possition: row.possition || '', // Using the actual field name (typo)
    url: row.url || '',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  subscribers: (row) => ({
    id: String(row.id),
    email: row.email || '',
    is_active: row.is_active !== 0,
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  // FeedbackModel: feedbackType, name, mobile, email, message
  feedback: (row) => ({
    id: String(row.id),
    feedbackType: row.feedbackType || '',
    name: row.name || '',
    mobile: row.mobile || '',
    email: row.email || '',
    message: row.message || '',
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  // ContactUsModel: ticket_id, name, mobile, email, subject, message, status, priority, category_id, assigned_to, etc.
  contactUs: (row) => ({
    id: String(row.id),
    ticket_id: row.ticket_id || '',
    category_id: row.category_id ? String(row.category_id) : null,
    name: row.name || '',
    email: row.email || '',
    mobile: row.mobile || '',
    subject: row.subject || '',
    message: row.message || '',
    status: row.status || 'open',
    priority: row.priority || 'medium',
    assigned_to: row.assigned_to ? String(row.assigned_to) : null,
    business_id: row.business_id ? String(row.business_id) : null,
    resolved_at: toTimestamp(row.resolved_at),
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  // TicketCategoryModel: name, description, color, sla_hours, is_active, display_order
  ticketCategories: (row) => ({
    id: String(row.id),
    name: row.name || '',
    description: row.description || '',
    color: row.color || '#3B82F6',
    sla_hours: row.sla_hours || 48,
    is_active: row.is_active !== 0,
    display_order: row.display_order || 0,
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
  
  ticketResponses: (row) => ({
    id: String(row.id),
    ticket_id: row.ticket_id ? String(row.ticket_id) : '',
    admin_id: row.admin_id ? String(row.admin_id) : null,
    message: row.message || '',
    response_type: row.response_type || 'reply',
    is_internal: row.is_internal === 1,
    attachments: safeJsonParse(row.attachments, []),
    createdAt: toTimestamp(row.createdAt),
    updatedAt: toTimestamp(row.updatedAt),
    deletedAt: row.deletedAt ? toTimestamp(row.deletedAt) : null,
  }),
};

/**
 * Main migration function
 */
async function migrate() {
  let connection;
  let exitCode = 0;
  
  console.log('🚀 Starting MySQL to Firestore Migration\n');
  console.log('MySQL Config:', { ...mysqlConfig, password: '***' });
  
  try {
    // Connect to MySQL
    console.log('\n📡 Connecting to MySQL...');
    connection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connected to MySQL\n');
    
    // Migrate all tables
    await migrateTable('admins', COLLECTIONS.ADMINS, transformers.admins);
    await migrateTable('businessCategories', COLLECTIONS.BUSINESS_CATEGORIES, transformers.businessCategories);
    await migrateTable('businessSubCategories', COLLECTIONS.BUSINESS_SUB_CATEGORIES, transformers.businessSubCategories);
    await migrateTable('MSMEBusiness', COLLECTIONS.MSME_BUSINESSES, transformers.msmeBusinesses);
    await migrateTable('directorsInfos', COLLECTIONS.DIRECTORS, transformers.directors);
    await migrateTable('business_owners', COLLECTIONS.BUSINESS_OWNERS, transformers.businessOwners);
    await migrateTable('serviceProviderCategoriess', COLLECTIONS.SERVICE_PROVIDER_CATEGORIES, transformers.serviceProviderCategories);
    await migrateTable('serviceProviders', COLLECTIONS.SERVICE_PROVIDERS, transformers.serviceProviders);
    await migrateTable('faqs', COLLECTIONS.FAQS, transformers.faqs);
    await migrateTable('blogs', COLLECTIONS.BLOGS, transformers.blogs);
    await migrateTable('homeBanners', COLLECTIONS.HOME_BANNERS, transformers.homeBanners);
    await migrateTable('downloads', COLLECTIONS.DOWNLOADS, transformers.downloads);
    await migrateTable('partnersLogos', COLLECTIONS.PARTNERS_LOGOS, transformers.partnersLogos);
    await migrateTable('teams', COLLECTIONS.TEAM_MEMBERS, transformers.teamMembers);
    await migrateTable('subscribes', COLLECTIONS.SUBSCRIBERS, transformers.subscribers);
    await migrateTable('feedbasks', COLLECTIONS.FEEDBACK, transformers.feedback);
    await migrateTable('contact_us', COLLECTIONS.TICKETS, transformers.contactUs);
    await migrateTable('ticket_categories', COLLECTIONS.TICKET_CATEGORIES, transformers.ticketCategories);
    await migrateTable('ticket_responses', COLLECTIONS.TICKET_RESPONSES, transformers.ticketResponses);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total records: ${stats.total}`);
    console.log(`Successful: ${stats.success}`);
    console.log(`Failed: ${stats.failed}`);
    console.log('\nPer collection:');
    for (const [collection, data] of Object.entries(stats.collections)) {
      const status = data.failed === 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${collection}: ${data.success}/${data.total}`);
    }
    console.log('='.repeat(60));
    
    // Set exit code based on failures
    if (stats.failed > 0) {
      console.log('\n⚠️ Migration completed with errors!\n');
      exitCode = 1;
    } else {
      console.log('\n✅ Migration completed successfully!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
      console.log('📡 MySQL connection closed');
    }
    process.exit(exitCode);
  }
}

// Track exit code for success/failure
let exitCode = 0;

// Run migration
migrate();
