/**
 * Create Admin User Script
 * 
 * Creates a Firebase Auth user with admin custom claims
 * and adds them to the admins Firestore collection
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'msmesite-53367.firebasestorage.app'
});

const auth = admin.auth();
const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdminUser() {
  console.log('\n=== Create Admin User ===\n');
  
  const email = await question('Enter admin email: ');
  const password = await question('Enter password (min 6 chars): ');
  const displayName = await question('Enter display name: ');
  
  if (!email || !password || password.length < 6) {
    console.error('Invalid input. Email required and password must be at least 6 characters.');
    rl.close();
    process.exit(1);
  }
  
  try {
    // Check if user already exists
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`\nUser already exists: ${user.uid}`);
      console.log('Updating custom claims...');
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        // Create new user
        console.log('\nCreating new user...');
        user = await auth.createUser({
          email,
          password,
          displayName: displayName || email.split('@')[0],
          emailVerified: true
        });
        console.log(`User created: ${user.uid}`);
      } else {
        throw e;
      }
    }
    
    // Set admin custom claim
    await auth.setCustomUserClaims(user.uid, { admin: true });
    console.log('Admin claim set successfully');
    
    // Add to admins collection in Firestore
    await db.collection('admins').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || displayName || email.split('@')[0],
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('Admin document created in Firestore');
    
    console.log('\n✅ Admin user ready!');
    console.log(`   Email: ${email}`);
    console.log(`   UID: ${user.uid}`);
    console.log('\nYou can now log in to the CMS.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
  
  rl.close();
  process.exit(0);
}

createAdminUser();
