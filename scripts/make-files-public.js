const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

async function makePublic() {
  console.log('Making files public...\n');
  
  // Get all home-banner files
  const [files] = await bucket.getFiles({ prefix: 'home-banner/' });
  
  for (const file of files) {
    try {
      await file.makePublic();
      console.log(`Made public: ${file.name}`);
    } catch (error) {
      console.log(`Already public or error: ${file.name} - ${error.message}`);
    }
  }
  
  // Get all business files
  const [businessFiles] = await bucket.getFiles({ prefix: 'business/' });
  
  for (const file of businessFiles) {
    try {
      await file.makePublic();
      console.log(`Made public: ${file.name}`);
    } catch (error) {
      console.log(`Already public or error: ${file.name} - ${error.message}`);
    }
  }
  
  console.log('\nDone!');
}

makePublic().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
