const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'msmesite-53367.firebasestorage.app'
  });
}

const bucket = admin.storage().bucket();

// All prefixes that need to be public
const prefixes = [
  'business-categories/',
  'business-category/',
  'partners-logo/',
  'team-member/',
  'blog-image/',
  'service-provider-categories/',
  'service-providers/',
  'downloads/',
  'incorporation-profile/',
  'business-profile/'
];

async function makeAllPublic() {
  console.log('Making all storage files public...\n');
  
  for (const prefix of prefixes) {
    try {
      const [files] = await bucket.getFiles({ prefix });
      console.log(`\n${prefix}: ${files.length} files`);
      
      for (const file of files) {
        try {
          await file.makePublic();
          console.log(`  ✓ ${file.name}`);
        } catch (error) {
          console.log(`  ✗ ${file.name}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`Error getting files for ${prefix}: ${error.message}`);
    }
  }
  
  console.log('\n\nDone!');
}

makeAllPublic().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
