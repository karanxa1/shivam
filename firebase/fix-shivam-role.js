/**
 * Quick fix: Set Shivam Pinjare's role to admin
 * Usage: cd firebase && node fix-shivam-role.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, updateDoc, query, where, getDocs, collection } from 'firebase/firestore';

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

async function main() {
  console.log('Signing in as admin…');
  await signInWithEmailAndPassword(auth, 'admin@finmanager.com', 'Admin@123');

  const q = query(collection(db, 'users'), where('email', '==', 'pinjareshivam@gmail.com'));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.error('Shivam user not found.');
    process.exit(1);
  }

  const uid = snap.docs[0].id;
  await updateDoc(doc(db, 'users', uid), { role: 'admin' });
  console.log(`✓ Shivam Pinjare (${uid}) role updated → admin`);
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Failed:', e.message ?? e);
  process.exit(1);
});
