const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

async function checkImageUrls() {
  console.log('=== CHECKING IMAGE URL FORMATS ===\n');
  
  // Get some home-banner files
  const [homeBannerFiles] = await bucket.getFiles({ prefix: 'home-banner/', maxResults: 3 });
  console.log('Home banner files in storage:', homeBannerFiles.length);
  
  for (const file of homeBannerFiles) {
    console.log('\nFile:', file.name);
    console.log('  Public URL (storage.googleapis.com):', 
      `https://storage.googleapis.com/${bucket.name}/${file.name}`);
    console.log('  Firebase URL:', 
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`);
  }
  
  // Get some business files
  const [businessFiles] = await bucket.getFiles({ prefix: 'business/', maxResults: 3 });
  console.log('\n\nBusiness files in storage:', businessFiles.length);
  
  for (const file of businessFiles) {
    console.log('\nFile:', file.name);
    console.log('  Public URL:', 
      `https://storage.googleapis.com/${bucket.name}/${file.name}`);
  }
  
  // Check what's in Firestore for home_banners
  const db = admin.firestore();
  const bannersSnap = await db.collection('home_banners')
    .where('deletedAt', '==', null)
    .get();
  
  console.log('\n\n=== HOME BANNER IMAGE PATHS IN FIRESTORE ===');
  bannersSnap.forEach(doc => {
    const data = doc.data();
    console.log(`\nBanner ${doc.id}: ${data.title}`);
    console.log('  Stored image path:', data.image);
    console.log('  Full URL would be: https://storage.googleapis.com/msmesite-53367.firebasestorage.app/' + data.image);
  });
  
  // Check if files actually exist in Storage
  console.log('\n\n=== VERIFYING BANNER FILES EXIST ===');
  for (const doc of bannersSnap.docs) {
    const imagePath = doc.data().image;
    if (imagePath) {
      const file = bucket.file(imagePath);
      const [exists] = await file.exists();
      console.log(`  ${imagePath}: ${exists ? 'EXISTS' : 'MISSING'}`);
    }
  }
}

checkImageUrls().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
