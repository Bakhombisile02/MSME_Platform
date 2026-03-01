const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
}

const db = admin.firestore();

// The active home banners from the SQL backup (IDs 6, 7, 8 are NOT deleted)
const activeBanners = [
  {
    id: 6,
    title: 'Discover',
    description: '<p>Biolab Eswatini is a wholly Swazi owned medical diagnostic laboratory</p>',
    image: 'home-banner/1761726887428-WhatsApp_Image_2025_10_29_at_09.56.52_cacba26b.jpg',
    link: 'https://biolabeswatini.com/',
    createdAt: new Date('2025-10-29T08:34:47'),
    updatedAt: new Date('2025-10-29T08:34:47'),
    deletedAt: null
  },
  {
    id: 7,
    title: 'Did you know?',
    description: '<p>Yadah Technologies has a branch in Gables Ezulwini</p>',
    image: 'home-banner/1761726996321-357720494_678184970993376_139376617035765418_n.jpg',
    link: 'https://yadahtechnologies.com/',
    createdAt: new Date('2025-10-29T08:36:36'),
    updatedAt: new Date('2025-10-29T08:36:36'),
    deletedAt: null
  },
  {
    id: 8,
    title: 'Get in touch',
    description: '<p>Datamatics is making superior data management available and afford</p>',
    image: 'home-banner/1761727129714-WhatsApp_Image_2025_10_29_at_09.51.01_e1788d8b.jpg',
    link: 'https://datamatics.co.sz/',
    createdAt: new Date('2025-10-29T08:38:50'),
    updatedAt: new Date('2025-11-11T16:48:50'),
    deletedAt: null
  }
];

async function fixHomeBanners() {
  console.log('=== FIXING HOME BANNERS ===\n');
  
  // First, let's see what's currently in Firestore
  const snapshot = await db.collection('home_banners').get();
  console.log('Current home_banners count:', snapshot.size);
  
  // Show current state
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`  Doc ${doc.id}: ${data.title || 'no title'}, deletedAt: ${data.deletedAt ? 'DELETED' : 'active'}`);
  });
  
  // Update/create the active banners
  console.log('\n--- Fixing active banners ---');
  for (const banner of activeBanners) {
    const docRef = db.collection('home_banners').doc(String(banner.id));
    
    await docRef.set({
      title: banner.title,
      description: banner.description,
      image: banner.image,
      link: banner.link,
      createdAt: admin.firestore.Timestamp.fromDate(banner.createdAt),
      updatedAt: admin.firestore.Timestamp.fromDate(banner.updatedAt),
      deletedAt: null
    }, { merge: true });
    
    console.log(`  Fixed banner ${banner.id}: ${banner.title}`);
  }
  
  console.log('\n=== Done! Active banners restored ===');
  
  // Verify
  const verifySnapshot = await db.collection('home_banners')
    .where('deletedAt', '==', null)
    .get();
  console.log('Active banners now:', verifySnapshot.size);
}

fixHomeBanners().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
