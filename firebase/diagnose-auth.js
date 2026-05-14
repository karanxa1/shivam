/**
 * Auth diagnostic script - check if a user exists in Firebase Auth & Firestore
 * Usage: cd firebase && node diagnose-auth.js <email>
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

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

const email = process.argv[2] || 'sneha@company.com';
const password = process.argv[3] || 'password1234';

async function main() {
  console.log(`\n🔍 Diagnosing user: ${email}\n`);

  // 1. Check Firestore user record
  console.log('① Checking Firestore users collection...');
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.log('   ❌ No user document found in Firestore');
  } else {
    const doc = snap.docs[0];
    console.log(`   ✓ Found Firestore doc: ID=${doc.id}`);
    console.log(`   Data:`, JSON.stringify(doc.data(), null, 2));
  }

  // 2. Check Auth sign-in methods
  console.log('\n② Checking Firebase Auth sign-in methods...');
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    console.log(`   Sign-in methods: ${methods.length ? methods.join(', ') : 'NONE'}`);
    if (methods.length === 0) {
      console.log('   ⚠️  User does NOT exist in Firebase Authentication');
    }
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }

  // 3. Try actual login
  console.log('\n③ Attempting login...');
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log(`   ✅ Login SUCCESS! UID: ${cred.user.uid}`);
    
    // Check if user doc matches
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists()) {
      console.log(`   Firestore doc for UID:`, JSON.stringify(userDoc.data(), null, 2));
    } else {
      console.log('   ⚠️  No Firestore doc exists for this auth UID');
    }
  } catch (e) {
    console.log(`   ❌ Login FAILED: ${e.code || 'unknown'} - ${e.message}`);
  }

  console.log('\n──────────────────────────────────────\n');
  process.exit(0);
}

main().catch((e) => {
  console.error('Script error:', e);
  process.exit(1);
});
