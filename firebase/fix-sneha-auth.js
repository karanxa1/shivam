/**
 * Fix Sneha's Firebase Auth account
 * Usage: cd firebase && node fix-sneha-auth.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyCACLPAwmqTHtzmMQ05K1JA1BkL9VMngqg',
  authDomain: 'nessbid-1.firebaseapp.com',
  projectId: 'nessbid-1',
});
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  console.log('Fixing Sneha auth account...\n');

  // 1. Sign in as admin to get permissions to write to Firestore
  await signInWithEmailAndPassword(auth, 'admin@finmanager.com', 'Admin@123');
  const adminUid = auth.currentUser.uid;
  console.log('Admin signed in:', adminUid);

  // 2. Delete old Firestore user doc for sneha (if exists at wrong UID)
  const oldUid = 'YfFlbG6EjAavhVVsFuQ0qT0rbk33';
  console.log('\nDeleting old Firestore user doc:', oldUid);
  try {
    await deleteDoc(doc(db, 'users', oldUid));
    console.log('✓ Deleted old doc');
  } catch (e) {
    console.log('Could not delete (may not exist):', e.message);
  }

  // 3. Sign out so we can create a new auth user
  await signOut(auth);
  console.log('\nSigned out. Creating new auth user...');

  // 4. Create Sneha's auth account
  let snehaUid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'sneha@company.com', 'password1234');
    snehaUid = cred.user.uid;
    console.log('✓ Created auth user. UID:', snehaUid);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log('Auth user already exists, but sign-in failed earlier.');
      console.log('This means the password may be wrong. Resetting...');
      // Best we can do with client SDK: the user exists but we don't know UID
      console.log('ERROR: Cannot fix without Admin SDK. Please delete sneha@company.com from Firebase Console > Authentication and rerun.');
      process.exit(1);
    }
    console.error('Failed to create:', e.message);
    process.exit(1);
  }

  // 5. Create Firestore user doc with matching UID
  await setDoc(doc(db, 'users', snehaUid), {
    name: 'Sneha Reddy',
    email: 'sneha@company.com',
    role: 'hr',
    createdAt: serverTimestamp(),
    avatarUrl: '',
  });
  console.log('✓ Created Firestore user doc with role=hr');

  // 6. Verify by signing in
  console.log('\n⑥ Verifying login...');
  await signOut(auth);
  try {
    const cred = await signInWithEmailAndPassword(auth, 'sneha@company.com', 'password1234');
    console.log('✅ Login SUCCESS as', cred.user.email, '- UID:', cred.user.uid);

    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists()) {
      console.log('✅ Firestore doc verified:', JSON.stringify(userDoc.data(), null, 2));
    } else {
      console.log('❌ NO Firestore doc for this UID');
    }
  } catch (e) {
    console.log('❌ Login failed:', e.message);
  }

  // 7. Sign back in as admin so data seeding can continue if needed
  await signInWithEmailAndPassword(auth, 'admin@finmanager.com', 'Admin@123');
  console.log('\nRe-signed in as admin for subsequent operations.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
