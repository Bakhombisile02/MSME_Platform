/**
 * Data Migration Script
 * 
 * Migrates data from MySQL to Firestore
 * Run this script once to transfer all data
 * 
 * Usage: npx ts-node scripts/migrateData.ts
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// Load service account from environment or file
// const serviceAccount = require('../../serviceAccountKey.json');

// Initialize Firebase Admin
// initializeApp({
//   credential: cert(serviceAccount as ServiceAccount),
// });

// For now, use default credentials (when running in Firebase environment)
initializeApp();

const db = getFirestore();
const auth = getAuth();

// MySQL connection config - update with your values
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'msme_db',
};

// Collection names
const COLLECTIONS = {
  ADMINS: 'admins',
  BUSINESS_CATEGORIES: 'business_categories',
  BUSINESS_SUB_CATEGORIES: 'business_sub_categories',
  MSME_BUSINESSES: 'msme_businesses',
  BUSINESS_OWNERS: 'business_owners',
  DIRECTORS: 'directors',
  SERVICE_PROVIDER_CATEGORIES: 'service_provider_categories',
  SERVICE_PROVIDERS: 'service_providers',
  BLOGS: 'blogs',
  FAQS: 'faqs',
  HOME_BANNERS: 'home_banners',
  PARTNERS_LOGOS: 'partners_logos',
  TEAM_MEMBERS: 'team_members',
  DOWNLOADS: 'downloads',
  SUBSCRIBERS: 'subscribers',
  FEEDBACK: 'feedback',
  CONTACT_US: 'contact_us',
  TICKET_CATEGORIES: 'ticket_categories',
  TICKETS: 'tickets',
  TICKET_RESPONSES: 'ticket_responses',
};

interface MigrationResult {
  collection: string;
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Convert MySQL date to Firestore Timestamp
 */
function toTimestamp(date: Date | string | null): Timestamp | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return Timestamp.fromDate(d);
}

/**
 * Generate a Firestore-friendly ID from MySQL integer ID
 */
function toFirestoreId(mysqlId: number, prefix: string = ''): string {
  return prefix ? `${prefix}_${mysqlId}` : String(mysqlId);
}

/**
 * Migrate admins table
 */
async function migrateAdmins(connection: mysql.Connection): Promise<MigrationResult> {
  const result: MigrationResult = { collection: 'admins', success: 0, failed: 0, errors: [] };
  
  try {
    const [rows] = await connection.execute('SELECT * FROM admin');
    const admins = rows as any[];
    
    for (const admin of admins) {
      try {
        const docId = toFirestoreId(admin.id, 'admin');
        
        // Create Firebase Auth user with secure random password
        let firebaseUid: string | undefined;
        try {
          // Generate a cryptographically secure random password (not stored/logged)
          const securePassword = crypto.randomBytes(32).toString('base64url');
          
          const userRecord = await auth.createUser({
            email: admin.email,
            password: securePassword,
            displayName: `${admin.first_name} ${admin.last_name}`,
          });
          firebaseUid = userRecord.uid;
          
          // Set admin custom claim
          await auth.setCustomUserClaims(userRecord.uid, { 
            admin: true, 
            role: admin.role || 'admin' 
          });
          
          // Generate password reset link for admin to set their own password
          try {
            const resetLink = await auth.generatePasswordResetLink(admin.email);
            console.log(`Password reset link generated for admin ${admin.email}`);
            // TODO: Send reset link via email service
            // await sendPasswordResetEmail(admin.email, resetLink);
          } catch (resetError) {
            console.error(`Failed to generate reset link for ${admin.email}:`, resetError);
          }
        } catch (authError: any) {
          if (authError.code !== 'auth/email-already-exists') {
            throw authError;
          }
          // Get existing user
          const existingUser = await auth.getUserByEmail(admin.email);
          firebaseUid = existingUser.uid;
        }
        
        // Create Firestore document
        await db.collection(COLLECTIONS.ADMINS).doc(firebaseUid || docId).set({
          id: firebaseUid || docId,
          mysql_id: admin.id,
          first_name: admin.first_name,
          last_name: admin.last_name,
          email: admin.email,
          role: admin.role || 'admin',
          status: admin.status || 1,
          profile_picture: admin.profile_picture,
          createdAt: toTimestamp(admin.createdAt) || Timestamp.now(),
          updatedAt: toTimestamp(admin.updatedAt) || Timestamp.now(),
          deletedAt: toTimestamp(admin.deletedAt),
        });
        
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Admin ${admin.id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Query failed: ${error.message}`);
  }
  
  return result;
}

/**
 * Migrate business categories
 */
async function migrateBusinessCategories(connection: mysql.Connection): Promise<MigrationResult> {
  const result: MigrationResult = { collection: 'business_categories', success: 0, failed: 0, errors: [] };
  
  try {
    const [rows] = await connection.execute('SELECT * FROM business_categories');
    const categories = rows as any[];
    
    for (const cat of categories) {
      try {
        const docId = toFirestoreId(cat.id, 'bcat');
        
        await db.collection(COLLECTIONS.BUSINESS_CATEGORIES).doc(docId).set({
          id: docId,
          mysql_id: cat.id,
          category_name: cat.category_name,
          description: cat.description,
          image: cat.image,
          status: cat.status,
          businessCount: 0, // Will be updated later
          createdAt: toTimestamp(cat.createdAt) || Timestamp.now(),
          updatedAt: toTimestamp(cat.updatedAt) || Timestamp.now(),
          deletedAt: toTimestamp(cat.deletedAt),
        });
        
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Category ${cat.id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Query failed: ${error.message}`);
  }
  
  return result;
}

/**
 * Migrate business sub-categories
 */
async function migrateBusinessSubCategories(connection: mysql.Connection): Promise<MigrationResult> {
  const result: MigrationResult = { collection: 'business_sub_categories', success: 0, failed: 0, errors: [] };
  
  try {
    const [rows] = await connection.execute('SELECT * FROM business_sub_categories');
    const subCategories = rows as any[];
    
    for (const subCat of subCategories) {
      try {
        const docId = toFirestoreId(subCat.id, 'bscat');
        const parentId = subCat.category_id ? toFirestoreId(subCat.category_id, 'bcat') : null;
        
        await db.collection(COLLECTIONS.BUSINESS_SUB_CATEGORIES).doc(docId).set({
          id: docId,
          mysql_id: subCat.id,
          category_id: parentId,
          sub_category_name: subCat.sub_category_name,
          description: subCat.description,
          status: subCat.status,
          createdAt: toTimestamp(subCat.createdAt) || Timestamp.now(),
          updatedAt: toTimestamp(subCat.updatedAt) || Timestamp.now(),
          deletedAt: toTimestamp(subCat.deletedAt),
        });
        
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`SubCategory ${subCat.id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Query failed: ${error.message}`);
  }
  
  return result;
}

/**
 * Migrate MSME businesses with owners and directors
 */
async function migrateMSMEBusinesses(connection: mysql.Connection): Promise<MigrationResult> {
  const result: MigrationResult = { collection: 'msme_businesses', success: 0, failed: 0, errors: [] };
  
  try {
    // Get all businesses
    const [businessRows] = await connection.execute('SELECT * FROM msme_businesses');
    const businesses = businessRows as any[];
    
    // Get all owners
    const [ownerRows] = await connection.execute('SELECT * FROM business_owners');
    const owners = ownerRows as any[];
    const ownersByBusiness = new Map<number, any[]>();
    owners.forEach(o => {
      const list = ownersByBusiness.get(o.business_id) || [];
      list.push(o);
      ownersByBusiness.set(o.business_id, list);
    });
    
    // Get all directors
    const [directorRows] = await connection.execute('SELECT * FROM directors_info');
    const directors = directorRows as any[];
    const directorsByBusiness = new Map<number, any[]>();
    directors.forEach(d => {
      const list = directorsByBusiness.get(d.business_id) || [];
      list.push(d);
      directorsByBusiness.set(d.business_id, list);
    });
    
    for (const biz of businesses) {
      try {
        const docId = toFirestoreId(biz.id, 'msme');
        const categoryId = biz.business_category_id 
          ? toFirestoreId(biz.business_category_id, 'bcat') 
          : null;
        
        // Get category name for denormalization
        let categoryName = '';
        if (categoryId) {
          const catDoc = await db.collection(COLLECTIONS.BUSINESS_CATEGORIES).doc(categoryId).get();
          if (catDoc.exists) {
            categoryName = catDoc.data()?.category_name || '';
          }
        }
        
        // Calculate owner gender summary
        const bizOwners = ownersByBusiness.get(biz.id) || [];
        const genders = bizOwners.map(o => o.gender).filter(Boolean);
        const genderSummary = genders.length > 0 
          ? [...new Set(genders)].sort().join(',')
          : null;
        
        // Create business document
        await db.collection(COLLECTIONS.MSME_BUSINESSES).doc(docId).set({
          id: docId,
          mysql_id: biz.id,
          name_of_organization: biz.name_of_organization,
          name_of_organization_lower: biz.name_of_organization?.toLowerCase(),
          email: biz.email,
          password_hash: biz.password, // Keep hashed password
          telephone: biz.telephone,
          business_image: biz.business_image,
          business_profile: biz.business_profile,
          incorporation_certificate: biz.incorporation_certificate,
          is_verified: biz.is_verified || 1,
          verification_notes: biz.verification_notes,
          verified_by: biz.verified_by,
          verified_at: toTimestamp(biz.verified_at),
          
          // Category
          business_category_id: categoryId,
          category_name: categoryName,
          business_sub_category_id: biz.business_sub_category_id 
            ? toFirestoreId(biz.business_sub_category_id, 'bscat') 
            : null,
          
          // Location
          physical_address: biz.physical_address,
          postal_address: biz.postal_address,
          region: biz.region,
          city: biz.city,
          
          // Business info
          year_established: biz.year_established,
          annual_turnover: biz.annual_turnover,
          business_description: biz.business_description,
          number_of_directors: biz.number_of_directors,
          
          // Ownership
          number_of_owners: bizOwners.length,
          owner_gender_summary: genderSummary,
          
          // Social
          website_link: biz.website_link,
          facebook_link: biz.facebook_link,
          twitter_link: biz.twitter_link,
          instagram_link: biz.instagram_link,
          youtube_link: biz.youtube_link,
          linkedin_link: biz.linkedin_link,
          
          // Password reset (migration: clear these)
          reset_otp: null,
          reset_otp_expires: null,
          reset_token: null,
          reset_token_expires: null,
          
          createdAt: toTimestamp(biz.createdAt) || Timestamp.now(),
          updatedAt: toTimestamp(biz.updatedAt) || Timestamp.now(),
          deletedAt: toTimestamp(biz.deletedAt),
        });
        
        // Migrate owners as subcollection
        for (const owner of bizOwners) {
          const ownerId = toFirestoreId(owner.id, 'owner');
          await db.collection(COLLECTIONS.MSME_BUSINESSES)
            .doc(docId)
            .collection('owners')
            .doc(ownerId)
            .set({
              id: ownerId,
              mysql_id: owner.id,
              full_name: owner.full_name,
              email: owner.email,
              phone: owner.phone,
              gender: owner.gender,
              nationality: owner.nationality,
              ownership_percentage: owner.ownership_percentage,
              id_number: owner.id_number,
              createdAt: toTimestamp(owner.createdAt) || Timestamp.now(),
              updatedAt: toTimestamp(owner.updatedAt) || Timestamp.now(),
              deletedAt: toTimestamp(owner.deletedAt),
            });
        }
        
        // Migrate directors as subcollection
        const bizDirectors = directorsByBusiness.get(biz.id) || [];
        for (const dir of bizDirectors) {
          const dirId = toFirestoreId(dir.id, 'dir');
          await db.collection(COLLECTIONS.MSME_BUSINESSES)
            .doc(docId)
            .collection('directors')
            .doc(dirId)
            .set({
              id: dirId,
              mysql_id: dir.id,
              full_name: dir.full_name,
              email: dir.email,
              phone: dir.phone,
              gender: dir.gender,
              nationality: dir.nationality,
              position: dir.position,
              id_number: dir.id_number,
              createdAt: toTimestamp(dir.createdAt) || Timestamp.now(),
              updatedAt: toTimestamp(dir.updatedAt) || Timestamp.now(),
              deletedAt: toTimestamp(dir.deletedAt),
            });
        }
        
        // Update category business count
        if (categoryId && !biz.deletedAt && biz.is_verified === 2) {
          const catRef = db.collection(COLLECTIONS.BUSINESS_CATEGORIES).doc(categoryId);
          await db.runTransaction(async (t) => {
            const catDoc = await t.get(catRef);
            if (catDoc.exists) {
              const currentCount = catDoc.data()?.businessCount || 0;
              t.update(catRef, { businessCount: currentCount + 1 });
            }
          });
        }
        
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Business ${biz.id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Query failed: ${error.message}`);
  }
  
  return result;
}

/**
 * Migrate service provider categories
 */
async function migrateServiceProviderCategories(connection: mysql.Connection): Promise<MigrationResult> {
  const result: MigrationResult = { collection: 'service_provider_categories', success: 0, failed: 0, errors: [] };
  
  try {
    const [rows] = await connection.execute('SELECT * FROM service_provider_categories');
    const categories = rows as any[];
    
    for (const cat of categories) {
      try {
        const docId = toFirestoreId(cat.id, 'spcat');
        
        await db.collection(COLLECTIONS.SERVICE_PROVIDER_CATEGORIES).doc(docId).set({
          id: docId,
          mysql_id: cat.id,
          category_name: cat.category_name,
          description: cat.description,
          image: cat.image,
          status: cat.status,
          providerCount: 0,
          createdAt: toTimestamp(cat.createdAt) || Timestamp.now(),
          updatedAt: toTimestamp(cat.updatedAt) || Timestamp.now(),
          deletedAt: toTimestamp(cat.deletedAt),
        });
        
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`SP Category ${cat.id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Query failed: ${error.message}`);
  }
  
  return result;
}

/**
 * Migrate service providers
 */
async function migrateServiceProviders(connection: mysql.Connection): Promise<MigrationResult> {
  const result: MigrationResult = { collection: 'service_providers', success: 0, failed: 0, errors: [] };
  
  try {
    const [rows] = await connection.execute('SELECT * FROM service_providers');
    const providers = rows as any[];
    
    for (const sp of providers) {
      try {
        const docId = toFirestoreId(sp.id, 'sp');
        const categoryId = sp.category_id ? toFirestoreId(sp.category_id, 'spcat') : null;
        
        // Get category name
        let categoryName = '';
        if (categoryId) {
          const catDoc = await db.collection(COLLECTIONS.SERVICE_PROVIDER_CATEGORIES).doc(categoryId).get();
          if (catDoc.exists) {
            categoryName = catDoc.data()?.category_name || '';
          }
        }
        
        await db.collection(COLLECTIONS.SERVICE_PROVIDERS).doc(docId).set({
          id: docId,
          mysql_id: sp.id,
          name: sp.name,
          description: sp.description,
          image: sp.image,
          website: sp.website,
          email: sp.email,
          phone: sp.phone,
          address: sp.address,
          category_id: categoryId,
          category_name: categoryName,
          status: sp.status,
          createdAt: toTimestamp(sp.createdAt) || Timestamp.now(),
          updatedAt: toTimestamp(sp.updatedAt) || Timestamp.now(),
          deletedAt: toTimestamp(sp.deletedAt),
        });
        
        // Update category provider count
        if (categoryId && !sp.deletedAt && sp.status === 1) {
          const catRef = db.collection(COLLECTIONS.SERVICE_PROVIDER_CATEGORIES).doc(categoryId);
          await db.runTransaction(async (t) => {
            const catDoc = await t.get(catRef);
            if (catDoc.exists) {
              const currentCount = catDoc.data()?.providerCount || 0;
              t.update(catRef, { providerCount: currentCount + 1 });
            }
          });
        }
        
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`Service Provider ${sp.id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Query failed: ${error.message}`);
  }
  
  return result;
}

/**
 * Generic migration for simple tables
 * 
 * SECURITY: tableName is validated against allowlist to prevent SQL injection
 */

// Allowlist of valid MySQL table names that can be migrated
const ALLOWED_TABLES = new Set([
  'blog', 'faq', 'home_banner', 'partners_logo', 'team_member', 
  'downloads', 'subscriber', 'feedback', 'contact_us',
  'ticket_category', 'ticket', 'ticket_responses'
]);

async function migrateSimpleTable(
  connection: mysql.Connection,
  tableName: string,
  collectionName: string,
  idPrefix: string,
  fieldMapper?: (row: any) => Record<string, any>
): Promise<MigrationResult> {
  const result: MigrationResult = { collection: collectionName, success: 0, failed: 0, errors: [] };
  
  // Validate table name against allowlist to prevent SQL injection
  if (!ALLOWED_TABLES.has(tableName)) {
    result.errors.push(`Invalid table name: ${tableName}. Not in allowed tables list.`);
    return result;
  }
  
  try {
    // Table name is validated above, safe to use in query
    const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
    const items = rows as any[];
    
    for (const item of items) {
      try {
        const docId = toFirestoreId(item.id, idPrefix);
        
        let data: Record<string, any> = {
          id: docId,
          mysql_id: item.id,
          createdAt: toTimestamp(item.createdAt) || Timestamp.now(),
          updatedAt: toTimestamp(item.updatedAt) || Timestamp.now(),
          deletedAt: toTimestamp(item.deletedAt),
        };
        
        // Apply custom field mapping or copy all fields
        if (fieldMapper) {
          data = { ...data, ...fieldMapper(item) };
        } else {
          // Copy all fields except id, createdAt, updatedAt, deletedAt
          Object.keys(item).forEach(key => {
            if (!['id', 'createdAt', 'updatedAt', 'deletedAt'].includes(key)) {
              data[key] = item[key];
            }
          });
        }
        
        await db.collection(collectionName).doc(docId).set(data);
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`${tableName} ${item.id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Query failed: ${error.message}`);
  }
  
  return result;
}

/**
 * Main migration function
 */
async function runMigration(): Promise<void> {
  console.log('Starting MySQL to Firestore migration...\n');
  
  const connection = await mysql.createConnection(mysqlConfig);
  console.log('Connected to MySQL database\n');
  
  const results: MigrationResult[] = [];
  
  try {
    // 1. Migrate admins first (creates Firebase Auth users)
    console.log('Migrating admins...');
    results.push(await migrateAdmins(connection));
    
    // 2. Migrate categories
    console.log('Migrating business categories...');
    results.push(await migrateBusinessCategories(connection));
    
    console.log('Migrating business sub-categories...');
    results.push(await migrateBusinessSubCategories(connection));
    
    console.log('Migrating service provider categories...');
    results.push(await migrateServiceProviderCategories(connection));
    
    // 3. Migrate main entities
    console.log('Migrating MSME businesses (with owners and directors)...');
    results.push(await migrateMSMEBusinesses(connection));
    
    console.log('Migrating service providers...');
    results.push(await migrateServiceProviders(connection));
    
    // 4. Migrate content
    console.log('Migrating blogs...');
    results.push(await migrateSimpleTable(connection, 'blogs', COLLECTIONS.BLOGS, 'blog'));
    
    console.log('Migrating FAQs...');
    results.push(await migrateSimpleTable(connection, 'faqs', COLLECTIONS.FAQS, 'faq'));
    
    console.log('Migrating home banners...');
    results.push(await migrateSimpleTable(connection, 'home_banners', COLLECTIONS.HOME_BANNERS, 'banner'));
    
    console.log('Migrating partners logos...');
    results.push(await migrateSimpleTable(connection, 'partners_logos', COLLECTIONS.PARTNERS_LOGOS, 'partner'));
    
    console.log('Migrating team members...');
    results.push(await migrateSimpleTable(connection, 'team_members', COLLECTIONS.TEAM_MEMBERS, 'team'));
    
    console.log('Migrating downloads...');
    results.push(await migrateSimpleTable(connection, 'downloads', COLLECTIONS.DOWNLOADS, 'download'));
    
    // 5. Migrate user interactions
    console.log('Migrating subscribers...');
    results.push(await migrateSimpleTable(connection, 'subscribers', COLLECTIONS.SUBSCRIBERS, 'sub'));
    
    console.log('Migrating feedback...');
    results.push(await migrateSimpleTable(connection, 'feedback', COLLECTIONS.FEEDBACK, 'fb'));
    
    console.log('Migrating contact us submissions...');
    results.push(await migrateSimpleTable(connection, 'contact_us', COLLECTIONS.CONTACT_US, 'contact'));
    
    // 6. Migrate helpdesk (if tables exist)
    try {
      console.log('Migrating ticket categories...');
      results.push(await migrateSimpleTable(connection, 'ticket_categories', COLLECTIONS.TICKET_CATEGORIES, 'tcat'));
      
      console.log('Migrating tickets...');
      results.push(await migrateSimpleTable(connection, 'tickets', COLLECTIONS.TICKETS, 'ticket'));
      
      console.log('Migrating ticket responses...');
      results.push(await migrateSimpleTable(connection, 'ticket_responses', COLLECTIONS.TICKET_RESPONSES, 'tresp'));
    } catch (err) {
      console.error('Helpdesk tables migration failed:', err);
      console.log('Helpdesk tables not found, skipping...');
    }
    
  } finally {
    await connection.end();
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const result of results) {
    console.log(`\n${result.collection}:`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Failed: ${result.failed}`);
    
    totalSuccess += result.success;
    totalFailed += result.failed;
    
    if (result.errors.length > 0) {
      console.log(`  Errors:`);
      result.errors.slice(0, 5).forEach(e => console.log(`    - ${e}`));
      if (result.errors.length > 5) {
        console.log(`    ... and ${result.errors.length - 5} more errors`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL: ${totalSuccess} migrated, ${totalFailed} failed`);
  console.log('='.repeat(60));
}

// Run migration
runMigration()
  .then(() => {
    console.log('\nMigration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });
