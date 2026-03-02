const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
}

const db = admin.firestore();

async function main() {
  const snapshot = await db.collection('home_banners').get();

  let active = 0;
  let deleted = 0;
  const samples = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.deletedAt == null) {
      active++;
    } else {
      deleted++;
    }

    if (samples.length < 20) {
      samples.push({
        id: doc.id,
        name: data.name,
        image_url: data.image_url,
        url: data.url,
        deletedAtType: data.deletedAt === null ? 'null' : typeof data.deletedAt,
        deletedAtValue: data.deletedAt,
      });
    }
  });

  console.log('home_banners stats:', { total: snapshot.size, active, deleted });
  console.log('sample banners:', samples);
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
