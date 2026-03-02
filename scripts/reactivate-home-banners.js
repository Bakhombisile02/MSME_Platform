const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function main() {
  const snapshot = await db.collection('home_banners').get();

  let reactivated = 0;
  let skippedNoImage = 0;

  const batch = db.batch();

  snapshot.forEach(doc => {
    const data = doc.data();
    const hasImage = !!(data.image_url && String(data.image_url).trim());

    if (hasImage) {
      batch.set(doc.ref, {
        deletedAt: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      reactivated++;
    } else {
      skippedNoImage++;
    }
  });

  if (reactivated > 0) {
    await batch.commit();
  }

  console.log({ total: snapshot.size, reactivated, skippedNoImage });
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
