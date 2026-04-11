/**
 * Add specific users to Firebase
 * Usage: node add-users.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
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

const users = [
  { email: 'pinjareshivam@gmail.com', name: 'Shivam Pinjare', role: 'authority' },
  { email: 'shyampawar@gmail.com',   name: 'Shyam Pawar',      role: 'regular'   },
  { email: 'yashsh6055@gmail.com',   name: 'Yash',       role: 'regular'   },
];

const PASSWORD = 'password1234';

async function addUser({ email, name, role }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, PASSWORD);
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      role,
      createdAt: serverTimestamp(),
      avatarUrl: '',
    });
    console.log(`  ✓ [${role.padEnd(9)}] ${email}  →  ${cred.user.uid}`);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log(`  ⚠ already exists: ${email}`);
    } else {
      console.error(`  ✗ ${email}: ${e.message}`);
    }
  }
}

async function main() {
  console.log('\n Adding users to nessbid-1...\n');
  for (const u of users) await addUser(u);
  console.log('\n Done.\n');
  console.log('  pinjareshivam@gmail.com  →  authority  (password1234)');
  console.log('  shyampawar@gmail.com    →  regular    (password1234)');
  console.log('  yashsh6055@gmail.com    →  regular    (password1234)\n');
  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌ Failed:', e.message ?? e);
  process.exit(1);
});
