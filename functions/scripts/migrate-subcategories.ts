/**
 * One-time migration script to populate business_sub_categories in Firestore
 * Run from functions directory: npx ts-node scripts/migrate-subcategories.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as path from 'path';

// Initialize Firebase Admin with service account
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
initializeApp({
  credential: cert(serviceAccountPath),
});

const db = getFirestore();

// Data from MySQL backup
const subCategories = [
  { id: '3', category_id: '3', category_name: 'Agriculture & Agribusiness', sub_category_name: 'Crop Production' },
  { id: '4', category_id: '3', category_name: 'Agriculture & Agribusiness', sub_category_name: 'Livestock & Poultry' },
  { id: '5', category_id: '3', category_name: 'Agriculture & Agribusiness', sub_category_name: 'Food/Agro Processing' },
  { id: '6', category_id: '3', category_name: 'Agriculture & Agribusiness', sub_category_name: 'Forestry / Horticulture' },
  { id: '7', category_id: '4', category_name: 'Manufacturing', sub_category_name: 'Textiles & Apparel' },
  { id: '8', category_id: '4', category_name: 'Manufacturing', sub_category_name: 'Furniture & Wood Products' },
  { id: '9', category_id: '4', category_name: 'Manufacturing', sub_category_name: 'Building Materials' },
  { id: '11', category_id: '8', category_name: 'Services', sub_category_name: 'ICT / Digital Services' },
  { id: '12', category_id: '8', category_name: 'Services', sub_category_name: 'Logistics / Warehousing' },
  { id: '13', category_id: '8', category_name: 'Services', sub_category_name: 'Hospitality / Food & Bev' },
  { id: '14', category_id: '8', category_name: 'Services', sub_category_name: 'Health, Wellness & Beauty' },
  { id: '15', category_id: '9', category_name: 'Construction/ Contracting', sub_category_name: 'Building Construction' },
  { id: '16', category_id: '9', category_name: 'Construction/ Contracting', sub_category_name: 'Civil Works' },
  { id: '17', category_id: '9', category_name: 'Construction/ Contracting', sub_category_name: 'Electrical, Plumbing' },
  { id: '19', category_id: '8', category_name: 'Services', sub_category_name: 'Photography, Design' },
  { id: '21', category_id: '11', category_name: 'Energy, Waste/Environment', sub_category_name: 'Renewable Energy / Solar' },
  { id: '22', category_id: '11', category_name: 'Energy, Waste/Environment', sub_category_name: 'Waste Management /Recycle' },
  { id: '23', category_id: '11', category_name: 'Energy, Waste/Environment', sub_category_name: 'Water Treatment & Supply' },
  { id: '24', category_id: '10', category_name: 'Creative & Cultural Industries', sub_category_name: 'Arts & Crafts /Handicraft' },
  { id: '25', category_id: '10', category_name: 'Creative & Cultural Industries', sub_category_name: 'Fashion, Jewellery' },
  { id: '26', category_id: '10', category_name: 'Creative & Cultural Industries', sub_category_name: 'Media, Photography,Design' },
  { id: '27', category_id: '5', category_name: 'Wholesale & Retail Trade', sub_category_name: 'Street Vending' },
  { id: '28', category_id: '5', category_name: 'Wholesale & Retail Trade', sub_category_name: 'Retail Shops' },
  { id: '29', category_id: '5', category_name: 'Wholesale & Retail Trade', sub_category_name: 'Wholesale Distribution' },
  { id: '30', category_id: '5', category_name: 'Wholesale & Retail Trade', sub_category_name: 'E-Commerce /Online Retail' },
  { id: '31', category_id: '4', category_name: 'Manufacturing', sub_category_name: 'Stationary' },
  { id: '32', category_id: '12', category_name: 'Associations', sub_category_name: 'Innovation' },
  { id: '33', category_id: '9', category_name: 'Construction/ Contracting', sub_category_name: 'Glassware' },
  { id: '34', category_id: '8', category_name: 'Services', sub_category_name: 'Transport and Courier' },
  { id: '35', category_id: '8', category_name: 'Services', sub_category_name: 'Architecture & Project Management' },
  { id: '36', category_id: '8', category_name: 'Services', sub_category_name: 'Fintech' },
  { id: '38', category_id: '8', category_name: 'Services', sub_category_name: 'Garage & Spares' },
  { id: '39', category_id: '13', category_name: 'Housing & Real Estate', sub_category_name: 'Apartments / Flats' },
  { id: '40', category_id: '13', category_name: 'Housing & Real Estate', sub_category_name: 'Warehouses' },
  { id: '41', category_id: '13', category_name: 'Housing & Real Estate', sub_category_name: 'Land' },
  { id: '42', category_id: '8', category_name: 'Services', sub_category_name: 'Car Wash' },
];

async function migrate() {
  console.log('Starting sub-categories migration...');
  const now = Timestamp.now();
  const batch = db.batch();
  
  for (const subCat of subCategories) {
    const docRef = db.collection('business_sub_categories').doc(subCat.id);
    batch.set(docRef, {
      ...subCat,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }
  
  await batch.commit();
  console.log(`Migrated ${subCategories.length} sub-categories`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
