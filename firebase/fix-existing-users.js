/**
 * Update existing users' Firestore docs + reset passwords
 * Usage: node fix-existing-users.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCACLPAwmqTHtzmMQ05K1JA1BkL9VMngqg',
  authDomain: 'nessbid-1.firebaseapp.com',
  projectId: 'nessbid-1',
  storageBucket: 'nessbid-1.firebasestorage.app',
  messagingSenderId: '763480870514',
  appId: '1:763480870514:web:dc0e4b17886f4d0ab1bceb',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const NEW_PASSWORD = 'karan@1234';

// Sign in with current password, update to new password, update Firestore role
async function fixUser(email, currentPassword, name, role) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, currentPassword);
    const uid = cred.user.uid;

    // Update password
    await updatePassword(cred.user, NEW_PASSWORD);

    // Upsert Firestore doc with correct role
    await setDoc(doc(db, 'users', uid), {
      name,
      email,
      role,
      createdAt: serverTimestamp(),
      avatarUrl: '',
    }, { merge: true });

    console.log(`  ✓ [${role.padEnd(9)}] ${email}  →  ${uid}`);
  } catch (e) {
    console.error(`  ✗ ${email}: ${e.message}`);
    console.log(`    → Try signing in manually and changing password to: ${NEW_PASSWORD}`);
  }
}

console.log('\n Fixing existing users...\n');

// Try common passwords they might have been created with
await fixUser('karanravirajput@gmail.com', 'karan@1234', 'Karan Ravi Rajput', 'authority')
  .catch(() => fixUser('karanravirajput@gmail.com', 'Admin@123', 'Karan Ravi Rajput', 'authority'))
  .catch(() => fixUser('karanravirajput@gmail.com', 'password123', 'Karan Ravi Rajput', 'authority'));

await fixUser('karanrajputxa@gmail.com', 'karan@1234', 'Karan Rajput', 'regular')
  .catch(() => fixUser('karanrajputxa@gmail.com', 'User@123', 'Karan Rajput', 'regular'))
  .catch(() => fixUser('karanrajputxa@gmail.com', 'password123', 'Karan Rajput', 'regular'));

console.log('\n Done.\n');
process.exit(0);
