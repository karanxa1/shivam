/**
 * Create a new HR account since sneha@company.com has an unknown password
 * Usage: cd firebase && node create-hr.js <email> <password>
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyCACLPAwmqTHtzmMQ05K1JA1BkL9VMngqg',
  authDomain: 'nessbid-1.firebaseapp.com',
  projectId: 'nessbid-1',
});
const auth = getAuth(app);
const db = getFirestore(app);

const EMAIL = process.argv[2] || 'sneha@company.com';
const PASSWORD = process.argv[3] || 'password1234';
const NAME = process.argv[4] || 'Sneha Reddy';

async function main() {
  console.log(`Creating HR user: ${EMAIL} / ${PASSWORD}\n`);

  try {
    const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
    console.log('✓ Auth user created:', cred.user.uid);

    await setDoc(doc(db, 'users', cred.user.uid), {
      name: NAME,
      email: EMAIL,
      role: 'hr',
      createdAt: serverTimestamp(),
      avatarUrl: '',
    });
    console.log('✓ Firestore doc created: role=hr');

    // Verify
    await signOut(auth);
    const login = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
    console.log('\n✅ Verification login SUCCESS:', login.user.email);

    const ok = await getDoc(doc(db, 'users', login.user.uid));
    console.log('✅ Firestore role:', ok.data()?.role);

    await signOut(auth);
    console.log('\n----------------------------------------');
    console.log('HR Login:');
    console.log('  Email:', EMAIL);
    console.log('  Password:', PASSWORD);
    console.log('  Role:', 'hr');
    console.log('----------------------------------------\n');
    process.exit(0);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log('❌ Email already exists. Use a different email or delete from Firebase Console.');
    } else {
      console.error('❌ Error:', e.code || '', '-', e.message);
    }
    process.exit(1);
  }
}

main();
