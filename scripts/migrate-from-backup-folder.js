/**
 * Migration Script for "Migrate folder then delete" data
 * 
 * This script migrates:
 * 1. SQL data from msme_db_backup_20260115_145816.sql to Firestore
 * 2. Images from backend_public/ to Firebase Storage
 * 3. Assets from cms_public/ to Firebase Storage
 * 
 * Run from project root: node scripts/migrate-from-backup-folder.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
} catch (error) {
  console.error('Error loading service account key:', error.message);
  process.exit(1);
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Source directories
const sourceArg = process.argv[2];
const MIGRATE_FOLDER = sourceArg
  ? path.resolve(sourceArg)
  : (process.env.MIGRATE_SOURCE_DIR
      ? path.resolve(process.env.MIGRATE_SOURCE_DIR)
      : path.join(__dirname, '../Migrate folder then delete'));

const sqlCandidates = fs
  .readdirSync(MIGRATE_FOLDER, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.sql'))
  .map(entry => path.join(MIGRATE_FOLDER, entry.name));

const SQL_FILE = sqlCandidates[0] || path.join(MIGRATE_FOLDER, 'msme_db_backup_20260115_145816.sql');
const backendPublicCandidates = [
  'backend_public',
  'public',
  'website-public',
];

const cmsPublicCandidates = [
  'cms_public',
  'cms-public',
];

const BACKEND_PUBLIC =
  backendPublicCandidates
    .map(dir => path.join(MIGRATE_FOLDER, dir))
    .find(candidate => fs.existsSync(candidate)) || path.join(MIGRATE_FOLDER, 'public');

const CMS_PUBLIC =
  cmsPublicCandidates
    .map(dir => path.join(MIGRATE_FOLDER, dir))
    .find(candidate => fs.existsSync(candidate)) || path.join(MIGRATE_FOLDER, 'cms_public');

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
  CONTACT_US: 'contact_us',
  TICKET_CATEGORIES: 'ticket_categories',
  TICKET_RESPONSES: 'ticket_responses',
  TICKET_ATTACHMENTS: 'ticket_attachments',
};

// Stats tracking
let stats = {
  businesses: { total: 0, success: 0, failed: 0 },
  directors: { total: 0, success: 0, failed: 0 },
  categories: { total: 0, success: 0, failed: 0 },
  subcategories: { total: 0, success: 0, failed: 0 },
  serviceProviders: { total: 0, success: 0, failed: 0 },
  serviceProviderCategories: { total: 0, success: 0, failed: 0 },
  blogs: { total: 0, success: 0, failed: 0 },
  banners: { total: 0, success: 0, failed: 0 },
  downloads: { total: 0, success: 0, failed: 0 },
  partners: { total: 0, success: 0, failed: 0 },
  team: { total: 0, success: 0, failed: 0 },
  faqs: { total: 0, success: 0, failed: 0 },
  feedback: { total: 0, success: 0, failed: 0 },
  subscribers: { total: 0, success: 0, failed: 0 },
  contactUs: { total: 0, success: 0, failed: 0 },
  admins: { total: 0, success: 0, failed: 0 },
  images: { total: 0, success: 0, failed: 0, skipped: 0 },
};

/**
 * Convert MySQL datetime to Firestore Timestamp
 */
function toTimestamp(date) {
  if (!date || date === 'NULL') return null;
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(dateObj);
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Parse SQL INSERT statement and extract values
 */
function parseInsertValues(sql, tableName) {
  const regex = new RegExp(`INSERT INTO \`${tableName}\` VALUES \\((.+?)\\);?$`, 'gm');
  const values = [];
  let match;
  
  // Find all INSERT statements for this table
  const insertMatch = sql.match(new RegExp(`INSERT INTO \`${tableName}\` VALUES (.+?);`, 's'));
  if (!insertMatch) return values;
  
  let insertData = insertMatch[1];
  
  // Parse individual records - handling complex nested parentheses and quotes
  let depth = 0;
  let currentRecord = '';
  let inQuote = false;
  let escapeNext = false;
  
  for (let i = 0; i < insertData.length; i++) {
    const char = insertData[i];
    
    if (escapeNext) {
      currentRecord += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      currentRecord += char;
      escapeNext = true;
      continue;
    }
    
    if (char === "'" && !escapeNext) {
      inQuote = !inQuote;
      currentRecord += char;
      continue;
    }
    
    if (!inQuote) {
      if (char === '(') {
        if (depth === 0) {
          currentRecord = '';
        } else {
          currentRecord += char;
        }
        depth++;
        continue;
      }
      if (char === ')') {
        depth--;
        if (depth === 0) {
          values.push(currentRecord);
          currentRecord = '';
        } else {
          currentRecord += char;
        }
        continue;
      }
    }
    
    if (depth > 0) {
      currentRecord += char;
    }
  }
  
  return values;
}

/**
 * Parse a single record's values
 */
function parseRecordValues(record) {
  const values = [];
  let current = '';
  let inQuote = false;
  let escapeNext = false;
  
  for (let i = 0; i < record.length; i++) {
    const char = record[i];
    
    if (escapeNext) {
      if (char === 'n') current += '\n';
      else if (char === 'r') current += '\r';
      else if (char === 't') current += '\t';
      else current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === "'" && !escapeNext) {
      inQuote = !inQuote;
      continue;
    }
    
    if (char === ',' && !inQuote) {
      values.push(current.trim() === 'NULL' ? null : current);
      current = '';
      continue;
    }
    
    current += char;
  }
  
  // Don't forget the last value
  values.push(current.trim() === 'NULL' ? null : current);
  
  return values;
}

/**
 * Upload a file to Firebase Storage
 */
async function uploadFile(localPath, remotePath) {
  try {
    // Check if file already exists in storage
    const [exists] = await bucket.file(remotePath).exists();
    if (exists) {
      stats.images.skipped++;
      return true;
    }
    
    const contentType = getMimeType(localPath);
    await bucket.upload(localPath, {
      destination: remotePath,
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });
    stats.images.success++;
    console.log(`  ✅ Uploaded: ${remotePath}`);
    return true;
  } catch (error) {
    stats.images.failed++;
    console.log(`  ❌ Failed: ${remotePath} - ${error.message}`);
    return false;
  }
}

/**
 * Walk directory and get all files
 */
function walkDir(dir, baseDir = '') {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // Skip hidden files
    
    const fullPath = path.join(dir, entry.name);
    const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath, relativePath));
    } else if (entry.isFile()) {
      files.push({ localPath: fullPath, remotePath: relativePath });
    }
  }
  
  return files;
}

/**
 * Migrate MSMEBusiness table
 */
async function migrateBusinesses(sql) {
  console.log('\n📦 Migrating MSME Businesses...');
  
  const records = parseInsertValues(sql, 'MSMEBusiness');
  console.log(`Found ${records.length} business records`);
  
  const batch = db.batch();
  let batchCount = 0;
  
  for (const record of records) {
    stats.businesses.total++;
    try {
      const values = parseRecordValues(record);
      if (values.length < 30) continue;
      
      const [
        id, name, description, category_id, category_name, sub_category_id, sub_category_name,
        services, products, registration_status, registration_number, is_exporter, business_size,
        year_established, number_of_employees, phone, email, physical_address, town,
        region, contact_person, contact_person_phone, contact_person_email,
        business_profile, business_image, incorporation_profile, password, is_verified,
        otp, otp_expires_at, email_verified_at, lat, lng, createdAt, updatedAt, deletedAt,
        ownership_type, constituency, area_type, alternative_phone, gender
      ] = values;
      
      const businessData = {
        name: name || '',
        description: description || '',
        category_id: parseInt(category_id) || null,
        category_name: category_name || '',
        sub_category_id: parseInt(sub_category_id) || null,
        sub_category_name: sub_category_name || '',
        services: services || '',
        products: products || '',
        registration_status: registration_status || '',
        registration_number: registration_number || '',
        is_exporter: is_exporter === 'Yes',
        business_size: business_size || '',
        year_established: year_established || '',
        number_of_employees: parseInt(number_of_employees) || 0,
        phone: phone || '',
        email: (email || '').toLowerCase(),
        physical_address: physical_address || '',
        town: town || '',
        region: region || '',
        contact_person: contact_person || '',
        contact_person_phone: contact_person_phone || '',
        contact_person_email: contact_person_email || '',
        business_profile: business_profile || '',
        business_image: business_image || '',
        incorporation_profile: incorporation_profile || '',
        password: password || '',
        is_verified: parseInt(is_verified) || 1,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        ownership_type: ownership_type || '',
        constituency: constituency || '',
        area_type: area_type || '',
        alternative_phone: alternative_phone || '',
        gender: gender || '',
        mysql_id: parseInt(id) || null,
      };
      
      const docRef = db.collection(COLLECTIONS.MSME_BUSINESSES).doc(id.toString());
      batch.set(docRef, businessData, { merge: true });
      batchCount++;
      stats.businesses.success++;
      
      // Commit batch every 450 operations (leaving room for other ops)
      if (batchCount >= 450) {
        await batch.commit();
        batchCount = 0;
        console.log(`  Committed batch of businesses...`);
      }
    } catch (error) {
      stats.businesses.failed++;
      console.error(`  Failed to process business: ${error.message}`);
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`  ✅ Businesses: ${stats.businesses.success} success, ${stats.businesses.failed} failed`);
}

/**
 * Migrate Directors table
 */
async function migrateDirectors(sql) {
  console.log('\n👥 Migrating Directors...');
  
  const records = parseInsertValues(sql, 'directorsInfos');
  console.log(`Found ${records.length} director records`);
  
  for (const record of records) {
    stats.directors.total++;
    try {
      const values = parseRecordValues(record);
      
      const [
        id, msme_business_id, name, phone, id_number, nationality, gender, dob, age,
        createdAt, updatedAt, deletedAt
      ] = values;
      
      const directorData = {
        msme_business_id: msme_business_id ? msme_business_id.toString() : null,
        name: name || '',
        phone: phone || '',
        id_number: id_number || '',
        nationality: nationality || '',
        gender: gender || '',
        dob: dob || '',
        age: parseInt(age) || null,
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.DIRECTORS).doc(id.toString()).set(directorData, { merge: true });
      stats.directors.success++;
    } catch (error) {
      stats.directors.failed++;
      console.error(`  Failed to process director: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Directors: ${stats.directors.success} success, ${stats.directors.failed} failed`);
}

/**
 * Migrate Business Categories table
 */
async function migrateBusinessCategories(sql) {
  console.log('\n📁 Migrating Business Categories...');
  
  const records = parseInsertValues(sql, 'businessCategories');
  console.log(`Found ${records.length} category records`);
  
  for (const record of records) {
    stats.categories.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, name, image, createdAt, updatedAt, deletedAt] = values;
      
      const categoryData = {
        name: name || '',
        image: image || '',
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.BUSINESS_CATEGORIES).doc(id.toString()).set(categoryData, { merge: true });
      stats.categories.success++;
    } catch (error) {
      stats.categories.failed++;
      console.error(`  Failed to process category: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Categories: ${stats.categories.success} success, ${stats.categories.failed} failed`);
}

/**
 * Migrate Business Sub-Categories table
 */
async function migrateBusinessSubCategories(sql) {
  console.log('\n📂 Migrating Business Sub-Categories...');
  
  const records = parseInsertValues(sql, 'businessSubCategories');
  console.log(`Found ${records.length} sub-category records`);
  
  for (const record of records) {
    stats.subcategories.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, name, category_id, createdAt, updatedAt, deletedAt] = values;
      
      const subCategoryData = {
        name: name || '',
        category_id: category_id ? category_id.toString() : null,
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.BUSINESS_SUB_CATEGORIES).doc(id.toString()).set(subCategoryData, { merge: true });
      stats.subcategories.success++;
    } catch (error) {
      stats.subcategories.failed++;
      console.error(`  Failed to process sub-category: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Sub-Categories: ${stats.subcategories.success} success, ${stats.subcategories.failed} failed`);
}

/**
 * Migrate Service Provider Categories table
 */
async function migrateServiceProviderCategories(sql) {
  console.log('\n🏷️ Migrating Service Provider Categories...');
  
  const records = parseInsertValues(sql, 'serviceProviderCategoriess');
  console.log(`Found ${records.length} service provider category records`);
  
  for (const record of records) {
    stats.serviceProviderCategories.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, name, image, createdAt, updatedAt, deletedAt] = values;
      
      const categoryData = {
        name: name || '',
        image: image || '',
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.SERVICE_PROVIDER_CATEGORIES).doc(id.toString()).set(categoryData, { merge: true });
      stats.serviceProviderCategories.success++;
    } catch (error) {
      stats.serviceProviderCategories.failed++;
      console.error(`  Failed to process service provider category: ${error.message}`);
    }
  }
  
  console.log(`  ✅ SP Categories: ${stats.serviceProviderCategories.success} success, ${stats.serviceProviderCategories.failed} failed`);
}

/**
 * Migrate Service Providers table
 */
async function migrateServiceProviders(sql) {
  console.log('\n🏢 Migrating Service Providers...');
  
  const records = parseInsertValues(sql, 'serviceProviders');
  console.log(`Found ${records.length} service provider records`);
  
  for (const record of records) {
    stats.serviceProviders.total++;
    try {
      const values = parseRecordValues(record);
      
      const [
        id, name, email, description, contact, address, website, image, category_id,
        is_verified, createdAt, updatedAt, deletedAt
      ] = values;
      
      const providerData = {
        name: name || '',
        email: (email || '').toLowerCase(),
        description: description || '',
        contact: contact || '',
        address: address || '',
        website: website || '',
        image: image || '',
        category_id: category_id ? category_id.toString() : null,
        is_verified: parseInt(is_verified) || 1,
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.SERVICE_PROVIDERS).doc(id.toString()).set(providerData, { merge: true });
      stats.serviceProviders.success++;
    } catch (error) {
      stats.serviceProviders.failed++;
      console.error(`  Failed to process service provider: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Service Providers: ${stats.serviceProviders.success} success, ${stats.serviceProviders.failed} failed`);
}

/**
 * Migrate Blogs table
 */
async function migrateBlogs(sql) {
  console.log('\n📰 Migrating Blogs...');
  
  const records = parseInsertValues(sql, 'blogs');
  console.log(`Found ${records.length} blog records`);
  
  for (const record of records) {
    stats.blogs.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, title, body, image, createdAt, updatedAt, deletedAt] = values;
      
      const blogData = {
        title: title || '',
        body: body || '',
        image: image || '',
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.BLOGS).doc(id.toString()).set(blogData, { merge: true });
      stats.blogs.success++;
    } catch (error) {
      stats.blogs.failed++;
      console.error(`  Failed to process blog: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Blogs: ${stats.blogs.success} success, ${stats.blogs.failed} failed`);
}

/**
 * Migrate Home Banners table
 */
async function migrateHomeBanners(sql) {
  console.log('\n🖼️ Migrating Home Banners...');
  
  const records = parseInsertValues(sql, 'homeBanners');
  console.log(`Found ${records.length} banner records`);
  
  for (const record of records) {
    stats.banners.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, name, image, createdAt, updatedAt, deletedAt] = values;
      
      const bannerData = {
        name: name || '',
        image: image || '',
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.HOME_BANNERS).doc(id.toString()).set(bannerData, { merge: true });
      stats.banners.success++;
    } catch (error) {
      stats.banners.failed++;
      console.error(`  Failed to process banner: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Banners: ${stats.banners.success} success, ${stats.banners.failed} failed`);
}

/**
 * Migrate Downloads table
 */
async function migrateDownloads(sql) {
  console.log('\n📥 Migrating Downloads...');
  
  const records = parseInsertValues(sql, 'downloads');
  console.log(`Found ${records.length} download records`);
  
  for (const record of records) {
    stats.downloads.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, name, file, createdAt, updatedAt, deletedAt] = values;
      
      const downloadData = {
        name: name || '',
        file: file || '',
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.DOWNLOADS).doc(id.toString()).set(downloadData, { merge: true });
      stats.downloads.success++;
    } catch (error) {
      stats.downloads.failed++;
      console.error(`  Failed to process download: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Downloads: ${stats.downloads.success} success, ${stats.downloads.failed} failed`);
}

/**
 * Migrate Partners Logos table
 */
async function migratePartnersLogos(sql) {
  console.log('\n🤝 Migrating Partners Logos...');
  
  const records = parseInsertValues(sql, 'partnersLogos');
  console.log(`Found ${records.length} partner logo records`);
  
  for (const record of records) {
    stats.partners.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, name, website, logo, createdAt, updatedAt, deletedAt] = values;
      
      const partnerData = {
        name: name || '',
        website: website || '',
        logo: logo || '',
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.PARTNERS_LOGOS).doc(id.toString()).set(partnerData, { merge: true });
      stats.partners.success++;
    } catch (error) {
      stats.partners.failed++;
      console.error(`  Failed to process partner: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Partners: ${stats.partners.success} success, ${stats.partners.failed} failed`);
}

/**
 * Migrate Team Members table
 */
async function migrateTeamMembers(sql) {
  console.log('\n👨‍💼 Migrating Team Members...');
  
  const records = parseInsertValues(sql, 'teams');
  console.log(`Found ${records.length} team member records`);
  
  for (const record of records) {
    stats.team.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, name, position, photo, createdAt, updatedAt, deletedAt] = values;
      
      const memberData = {
        name: name || '',
        position: position || '',
        photo: photo || '',
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.TEAM_MEMBERS).doc(id.toString()).set(memberData, { merge: true });
      stats.team.success++;
    } catch (error) {
      stats.team.failed++;
      console.error(`  Failed to process team member: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Team Members: ${stats.team.success} success, ${stats.team.failed} failed`);
}

/**
 * Migrate FAQs table
 */
async function migrateFaqs(sql) {
  console.log('\n❓ Migrating FAQs...');
  
  const records = parseInsertValues(sql, 'faqs');
  console.log(`Found ${records.length} FAQ records`);
  
  for (const record of records) {
    stats.faqs.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, question, answer, createdAt, updatedAt, deletedAt] = values;
      
      const faqData = {
        question: question || '',
        answer: answer || '',
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.FAQS).doc(id.toString()).set(faqData, { merge: true });
      stats.faqs.success++;
    } catch (error) {
      stats.faqs.failed++;
      console.error(`  Failed to process FAQ: ${error.message}`);
    }
  }
  
  console.log(`  ✅ FAQs: ${stats.faqs.success} success, ${stats.faqs.failed} failed`);
}

/**
 * Migrate Feedback table
 */
async function migrateFeedback(sql) {
  console.log('\n💬 Migrating Feedback...');
  
  const records = parseInsertValues(sql, 'feedbasks');
  console.log(`Found ${records.length} feedback records`);
  
  for (const record of records) {
    stats.feedback.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, name, email, subject, message, createdAt, updatedAt, deletedAt] = values;
      
      const feedbackData = {
        name: name || '',
        email: (email || '').toLowerCase(),
        subject: subject || '',
        message: message || '',
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.FEEDBACK).doc(id.toString()).set(feedbackData, { merge: true });
      stats.feedback.success++;
    } catch (error) {
      stats.feedback.failed++;
      console.error(`  Failed to process feedback: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Feedback: ${stats.feedback.success} success, ${stats.feedback.failed} failed`);
}

/**
 * Migrate Subscribers table
 */
async function migrateSubscribers(sql) {
  console.log('\n📧 Migrating Subscribers...');
  
  const records = parseInsertValues(sql, 'subscribes');
  console.log(`Found ${records.length} subscriber records`);
  
  for (const record of records) {
    stats.subscribers.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, email, createdAt, updatedAt, deletedAt] = values;
      
      const subscriberData = {
        email: (email || '').toLowerCase(),
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.SUBSCRIBERS).doc(id.toString()).set(subscriberData, { merge: true });
      stats.subscribers.success++;
    } catch (error) {
      stats.subscribers.failed++;
      console.error(`  Failed to process subscriber: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Subscribers: ${stats.subscribers.success} success, ${stats.subscribers.failed} failed`);
}

/**
 * Migrate Contact Us table
 */
async function migrateContactUs(sql) {
  console.log('\n📞 Migrating Contact Us...');
  
  const records = parseInsertValues(sql, 'contact_us');
  console.log(`Found ${records.length} contact us records`);
  
  for (const record of records) {
    stats.contactUs.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, name, email, subject, message, createdAt, updatedAt, deletedAt] = values;
      
      const contactData = {
        name: name || '',
        email: (email || '').toLowerCase(),
        subject: subject || '',
        message: message || '',
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.CONTACT_US).doc(id.toString()).set(contactData, { merge: true });
      stats.contactUs.success++;
    } catch (error) {
      stats.contactUs.failed++;
      console.error(`  Failed to process contact: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Contact Us: ${stats.contactUs.success} success, ${stats.contactUs.failed} failed`);
}

/**
 * Migrate Admins table
 */
async function migrateAdmins(sql) {
  console.log('\n👤 Migrating Admins...');
  
  const records = parseInsertValues(sql, 'admins');
  console.log(`Found ${records.length} admin records`);
  
  for (const record of records) {
    stats.admins.total++;
    try {
      const values = parseRecordValues(record);
      
      const [id, name, password, email, role, createdAt, updatedAt, deletedAt] = values;
      
      const adminData = {
        name: name || '',
        email: (email || '').toLowerCase(),
        password: password || '',
        role: role || 'admin',
        createdAt: toTimestamp(createdAt) || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: toTimestamp(updatedAt) || admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: toTimestamp(deletedAt),
        mysql_id: parseInt(id) || null,
      };
      
      await db.collection(COLLECTIONS.ADMINS).doc(id.toString()).set(adminData, { merge: true });
      stats.admins.success++;
    } catch (error) {
      stats.admins.failed++;
      console.error(`  Failed to process admin: ${error.message}`);
    }
  }
  
  console.log(`  ✅ Admins: ${stats.admins.success} success, ${stats.admins.failed} failed`);
}

/**
 * Upload images from backend_public
 */
async function uploadBackendImages() {
  console.log('\n📤 Uploading Backend Images...');

  if (!fs.existsSync(BACKEND_PUBLIC)) {
    console.log(`  ℹ️ Skipping backend image upload: folder not found (${BACKEND_PUBLIC})`);
    return;
  }
  
  const files = walkDir(BACKEND_PUBLIC);
  stats.images.total = files.length;
  console.log(`Found ${files.length} files to upload`);
  
  for (const file of files) {
    await uploadFile(file.localPath, file.remotePath);
  }
  
  console.log(`  ✅ Images: ${stats.images.success} success, ${stats.images.failed} failed, ${stats.images.skipped} skipped (already exist)`);
}

/**
 * Upload assets from cms_public
 */
async function uploadCmsAssets() {
  console.log('\n📤 Uploading CMS Assets...');

  if (!fs.existsSync(CMS_PUBLIC)) {
    console.log(`  ℹ️ Skipping CMS assets upload: folder not found (${CMS_PUBLIC})`);
    return;
  }
  
  const files = walkDir(CMS_PUBLIC);
  const prevTotal = stats.images.total;
  stats.images.total += files.length;
  console.log(`Found ${files.length} files to upload`);
  
  for (const file of files) {
    // Upload CMS files to a cms-assets folder in storage
    const remotePath = `cms-assets/${file.remotePath}`;
    await uploadFile(file.localPath, remotePath);
  }
  
  console.log(`  ✅ CMS Assets uploaded`);
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Migration from Backup Folder');
  console.log('========================================');
  console.log(`Source Folder: ${MIGRATE_FOLDER}`);
  console.log(`SQL File: ${SQL_FILE}`);
  console.log(`Backend Public: ${BACKEND_PUBLIC}`);
  console.log(`CMS Public: ${CMS_PUBLIC}`);
  console.log('========================================\n');
  
  // Check if files exist
  if (!fs.existsSync(SQL_FILE)) {
    console.error('❌ SQL file not found:', SQL_FILE);
    process.exit(1);
  }
  
  // Read SQL file
  console.log('📖 Reading SQL file...');
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  console.log(`  SQL file size: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);
  
  // Migrate database tables
  await migrateBusinessCategories(sql);
  await migrateBusinessSubCategories(sql);
  await migrateServiceProviderCategories(sql);
  await migrateServiceProviders(sql);
  await migrateBusinesses(sql);
  await migrateDirectors(sql);
  await migrateBlogs(sql);
  await migrateHomeBanners(sql);
  await migrateDownloads(sql);
  await migratePartnersLogos(sql);
  await migrateTeamMembers(sql);
  await migrateFaqs(sql);
  await migrateFeedback(sql);
  await migrateSubscribers(sql);
  await migrateContactUs(sql);
  await migrateAdmins(sql);
  
  // Upload images
  await uploadBackendImages();
  await uploadCmsAssets();
  
  // Print summary
  console.log('\n========================================');
  console.log('📊 MIGRATION SUMMARY');
  console.log('========================================');
  console.log(`Business Categories: ${stats.categories.success}/${stats.categories.total}`);
  console.log(`Business Sub-Categories: ${stats.subcategories.success}/${stats.subcategories.total}`);
  console.log(`Service Provider Categories: ${stats.serviceProviderCategories.success}/${stats.serviceProviderCategories.total}`);
  console.log(`Service Providers: ${stats.serviceProviders.success}/${stats.serviceProviders.total}`);
  console.log(`MSME Businesses: ${stats.businesses.success}/${stats.businesses.total}`);
  console.log(`Directors: ${stats.directors.success}/${stats.directors.total}`);
  console.log(`Blogs: ${stats.blogs.success}/${stats.blogs.total}`);
  console.log(`Home Banners: ${stats.banners.success}/${stats.banners.total}`);
  console.log(`Downloads: ${stats.downloads.success}/${stats.downloads.total}`);
  console.log(`Partners Logos: ${stats.partners.success}/${stats.partners.total}`);
  console.log(`Team Members: ${stats.team.success}/${stats.team.total}`);
  console.log(`FAQs: ${stats.faqs.success}/${stats.faqs.total}`);
  console.log(`Feedback: ${stats.feedback.success}/${stats.feedback.total}`);
  console.log(`Subscribers: ${stats.subscribers.success}/${stats.subscribers.total}`);
  console.log(`Contact Us: ${stats.contactUs.success}/${stats.contactUs.total}`);
  console.log(`Admins: ${stats.admins.success}/${stats.admins.total}`);
  console.log(`Images Uploaded: ${stats.images.success}/${stats.images.total} (${stats.images.skipped} skipped)`);
  console.log('========================================');
  console.log('✅ Migration Complete!');
  
  process.exit(0);
}

// Run the migration
main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
