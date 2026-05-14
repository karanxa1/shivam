/**
 * Diagnose HR login issue by attempting actual sign-in
 * Usage: cd firebase && node diagnose-hr.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyCACLPAwmqTHtzmMQ05K1JA1BkL9VMngqg',
  authDomain: 'nessbid-1.firebaseapp.com',
  projectId: 'nessbid-1',
});
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  console.log('=== HR Login Diagnosis ===\n');

  // 1. Check if auth user exists
  console.log('1. Checking Firebase Auth for sneha@company.com...');
  try {
    const methods = await fetchSignInMethodsForEmail(auth, 'sneha@company.com');
    console.log('   Sign-in methods:', methods.length ? methods : 'NONE');
  } catch (e) {
    console.log('   Error:', e.message);
  }

  // 2. Try actual login
  console.log('\n2. Attempting login: sneha@company.com / password1234');
  let uid = null;
  try {
    const cred = await signInWithEmailAndPassword(auth, 'sneha@company.com', 'password1234');
    uid = cred.user.uid;
    console.log('   ✅ Login SUCCESS! UID:', uid);
  } catch (e) {
    console.log('   ❌ Login FAILED:', e.code || '', '-', e.message);
    console.log('\n   Possible causes:');
    if (e.code === 'auth/user-not-found') {
      console.log('   - User does not exist in Firebase Authentication');
    }
    if (e.code === 'auth/wrong-password') {
      console.log('   - Password is incorrect');
    }
    if (e.code === 'auth/invalid-credential') {
      console.log('   - Invalid credentials (wrong email or password)');
    }
  }

  // 3. Check Firestore user doc
  console.log('\n3. Checking Firestore user document...');
  if (uid) {
    const docRef = doc(db, 'users', uid);
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        console.log('   ✓ Firestore doc found:', JSON.stringify(snap.data(), null, 2));
      } else {
        console.log('   ❌ NO Firestore user doc for this UID');
      }
    } catch (e) {
      console.log('   Firestore error:', e.code || e.message);
    }
  } else {
    // Try finding by email query
    try {
      const q = query(collection(db, 'users'), where('email', '==', 'sneha@company.com'));
      const snap = await getDocs(q);
      if (snap.empty) {
        console.log('   No user doc with email sneha@company.com');
      } else {
        console.log('   Found user doc by email (ID may not match auth):', snap.docs[0].id, snap.docs[0].data());
      }
    } catch (e) {
      console.log('   Firestore query error:', e.message);
    }
  }

  // 4. Try admin lookup via query
  console.log('\n4. Looking up all user docs...');
  try {
    const allUsers = await getDocs(collection(db, 'users'));
    allUsers.docs.filter(d => d.data().role === 'hr').forEach(d => {
      console.log(`   HR user: ${d.id} | ${d.data().email} | ${d.data().name}`);
    });
  } catch (e) {
    console.log('   Error:', e.message);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
