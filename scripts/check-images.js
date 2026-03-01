/**
 * Check Image URLs in Firestore
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'msmesite-53367.firebasestorage.app'
});

const db = admin.firestore();

async function check() {
  // Check banners
  const banners = await db.collection('home_banners').get();
  console.log('=== Home Banners ===');
  console.log('Total:', banners.size);
  banners.docs.slice(0, 3).forEach(doc => {
    const d = doc.data();
    console.log('ID:', doc.id);
    console.log('  image:', d.image);
    console.log('  deletedAt:', d.deletedAt);
  });
  
  // Check business categories
  const cats = await db.collection('business_categories').limit(2).get();
  console.log('\n=== Business Categories ===');
  cats.docs.forEach(doc => {
    const d = doc.data();
    console.log('ID:', doc.id, 'image:', d.image);
  });
  
  // Check a business with images
  const biz = await db.collection('msme_businesses')
    .where('business_profile', '!=', null)
    .limit(1)
    .get();
  console.log('\n=== Sample Business with Image ===');
  biz.docs.forEach(doc => {
    const d = doc.data();
    console.log('ID:', doc.id);
    console.log('  business_profile:', d.business_profile);
    console.log('  incorporation_profile:', d.incorporation_profile);
  });
  
  // List files in storage
  const bucket = admin.storage().bucket();
  console.log('\n=== Storage Files ===');
  const [files] = await bucket.getFiles({ prefix: 'home-banner/', maxResults: 5 });
  console.log('home-banner/ files:', files.length);
  files.forEach(f => console.log('  ', f.name));
  
  const [bizFiles] = await bucket.getFiles({ prefix: 'business/', maxResults: 5 });
  console.log('\nbusiness/ files:', bizFiles.length);
  bizFiles.forEach(f => console.log('  ', f.name));
  
  process.exit(0);
}

check().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
