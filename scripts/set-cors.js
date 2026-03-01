const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

async function setCors() {
  try {
    await bucket.setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ['GET', 'HEAD'],
        origin: ['*'],
        responseHeader: ['Content-Type', 'Access-Control-Allow-Origin']
      }
    ]);
    console.log('CORS configuration set successfully!');
  } catch (error) {
    console.error('Error setting CORS:', error.message);
    
    // Alternative: try to get metadata
    const [metadata] = await bucket.getMetadata();
    console.log('\nBucket metadata:', JSON.stringify(metadata, null, 2));
  }
}

setCors().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
