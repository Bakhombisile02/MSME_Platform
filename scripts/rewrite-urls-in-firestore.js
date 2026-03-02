const admin = require('firebase-admin');

// Ensure correct service account points to production
const serviceAccount = require('../serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
}

const db = admin.firestore();
const FIREBASE_STORAGE_API = `https://storage.googleapis.com/msmesite-53367.firebasestorage.app`;

/**
 * Transforms relative directory path into absolute public url
 */
const toAbsoluteUrl = (val) => {
  if (!val || typeof val !== 'string') return val;
  // Make sure it doesn't already have standard public domains applied
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  
  // E.g. 'home-banner/my-image.jpg' -> 'https://storage.googleapis.com/msmesite-53367.firebasestorage.app/home-banner/my-image.jpg'
  // Remove starting slash if one exists
  const cleanPath = val.startsWith('/') ? val.slice(1) : val;
  return `${FIREBASE_STORAGE_API}/${cleanPath}`;
}

const updateCollection = async (collectionName, fieldsToUpdate) => {
    console.log(`\n🔄 Updating ${collectionName}...`);
    let updatedCount = 0;
    
    // Process in batches
    let lastDoc = null;
    let keepGoing = true;

    while (keepGoing) {
        let query = db.collection(collectionName).limit(500);
        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }
        
        const snapshot = await query.get();
        if (snapshot.empty) break;

        const batch = db.batch();
        let currentBatchHasChanges = false;
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            let changed = false;
            let changes = {};

            fieldsToUpdate.forEach(field => {
                if (data[field]) {
                    const newUrl = toAbsoluteUrl(data[field]);
                    if (newUrl !== data[field]) {
                         changes[field] = newUrl;
                         changed = true;
                    }
                }
            });

            if (changed) {
                batch.update(doc.ref, changes);
                updatedCount++;
                currentBatchHasChanges = true;
            }
        });

        if (currentBatchHasChanges) {
            await batch.commit();
            console.log(`  Committed batch... Total updated so far: ${updatedCount}`);
        }
        
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }
    
    console.log(`✅ Finished ${collectionName}. Migrated ${updatedCount} records.`);
}

async function main() {
    console.log('🚀 Changing all Image URLs to Absolute Cloud Storage References...\n');

    await updateCollection('business_categories', ['icon_url']);
    await updateCollection('business_sub_categories', ['icon_url']);
    await updateCollection('home_banners', ['image_url']);
    await updateCollection('team_members', ['url']);
    await updateCollection('partners_logos', ['url']);
    await updateCollection('blogs', ['image_url']);
    // Note: Some legacy keys are nested like directors/owners, limiting main msme keys below.
    await updateCollection('msme_businesses', ['business_image_url', 'business_profile_url', 'incorporation_image_url', 'national_id_image_url', 'director_signature_url']);
    
    console.log('\n🎉 All Absolute URL mapping complete.');
    process.exit(0);
}

main();
