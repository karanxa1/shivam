/**
 * Fix Sneha auth + verify/fix Yash employee data linkage
 * Usage: cd firebase && node fix-auth-and-data.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, Timestamp, serverTimestamp,
} from 'firebase/firestore';

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
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Fix Sneha Auth + Verify Yash Data Linkage       ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // ── 1. Sign in as admin to get write access ──
  console.log('① Signing in as admin...');
  try {
    await signInWithEmailAndPassword(auth, 'admin@finmanager.com', 'Admin@123');
    console.log('   ✓ Admin signed in\n');
  } catch (e) {
    console.error('   ❌ Admin login failed:', e.message);
    process.exit(1);
  }

  // ── 2. Fix Sneha: recreate auth account ──
  console.log('② Fixing Sneha Reddy auth account...');
  let snehaUid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'sneha@company.com', 'password1234');
    snehaUid = cred.user.uid;
    console.log(`   ✓ Created auth user: ${snehaUid}`);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log('   ⚠ Auth user already exists, looking up UID...');
      const q = query(collection(db, 'users'), where('email', '==', 'sneha@company.com'));
      const snap = await getDocs(q);
      if (!snap.empty) snehaUid = snap.docs[0].id;
    } else {
      console.error('   ❌ Create failed:', e.message);
    }
  }

  if (snehaUid) {
    await updateDoc(doc(db, 'users', snehaUid), {
      name: 'Sneha Reddy',
      email: 'sneha@company.com',
      role: 'hr',
      createdAt: serverTimestamp(),
    });
    console.log(`   ✓ Updated Firestore user doc: role=hr, UID=${snehaUid}\n`);
  }

  // ── 3. Get Yash's real UID ──
  console.log('③ Looking up Yash UID...');
  const yashQ = query(collection(db, 'users'), where('email', '==', 'yashsh6055@gmail.com'));
  const yashSnap = await getDocs(yashQ);
  if (yashSnap.empty) {
    console.error('   ❌ Yash not found in Firestore users');
    process.exit(1);
  }
  const yashUid = yashSnap.docs[0].id;
  console.log(`   ✓ Yash UID: ${yashUid}`);

  // ── 4. Check + fix Yash employee record ──
  console.log('\n④ Checking Yash employee record...');
  const empQ = query(collection(db, 'employees'), where('email', '==', 'yashsh6055@gmail.com'));
  const empSnap = await getDocs(empQ);

  let yashEmpDocId;
  if (empSnap.empty) {
    console.log('   ⚠ No employee record found. Creating one...');
    const ref = await addDoc(collection(db, 'employees'), {
      uid: yashUid,
      name: 'Yash Sharma',
      email: 'yashsh6055@gmail.com',
      department: 'Engineering',
      salary: 70000,
      overtimeHours: 10,
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });
    yashEmpDocId = ref.id;
    console.log(`   ✓ Created employee doc: ${yashEmpDocId}`);
  } else {
    yashEmpDocId = empSnap.docs[0].id;
    const empData = empSnap.docs[0].data();
    console.log(`   Found employee doc: ${yashEmpDocId}`);
    console.log(`   Current uid field: "${empData.uid}"`);

    if (!empData.uid || empData.uid !== yashUid) {
      console.log(`   ⚠ Mismatched UID. Updating to: ${yashUid}`);
      await updateDoc(doc(db, 'employees', yashEmpDocId), { uid: yashUid });
      console.log('   ✓ Updated employee UID');
    } else {
      console.log('   ✓ UID is correct');
    }
  }

  // ── 5. Check Yash payslips ──
  console.log('\n⑤ Checking payslips for Yash...');
  const payQ = query(collection(db, 'payslips'), where('employeeId', '==', yashEmpDocId));
  const paySnap = await getDocs(payQ);
  console.log(`   Found ${paySnap.size} payslip(s) linked to employee doc ${yashEmpDocId}`);
  paySnap.forEach(d => {
    console.log(`   → ${d.data().month}: netPay=₹${d.data().netPay}`);
  });

  if (paySnap.empty) {
    console.log('   ⚠ No payslips found. Creating 2 months...');
    const months = ['2026-05', '2026-04'];
    const overtimePay = 10 * 250;
    const deductions = 2800;
    const netPay = 70000 + overtimePay - deductions;
    for (const month of months) {
      await addDoc(collection(db, 'payslips'), {
        employeeId: yashEmpDocId,
        month,
        basicSalary: 70000,
        overtimePay,
        deductions,
        netPay,
        generatedAt: serverTimestamp(),
        generatedBy: auth.currentUser.uid,
      });
      console.log(`   ✓ Created payslip for ${month}`);
    }
  }

  // ── 6. Check Yash tasks ──
  console.log('\n⑥ Checking tasks for Yash...');
  const taskQ = query(collection(db, 'tasks'), where('employeeId', '==', yashEmpDocId));
  const taskSnap = await getDocs(taskQ);
  console.log(`   Found ${taskSnap.size} task(s) linked to employee doc ${yashEmpDocId}`);

  if (taskSnap.empty) {
    console.log('   ⚠ No tasks found. Creating sample tasks...');
    const taskPool = [
      'Design wireframes',
      'Implement authentication',
      'Write unit tests',
      'Code review',
      'Update documentation',
      'Fix payment gateway bug',
      'Implement search feature',
      'Optimize database queries',
    ];
    const statuses = ['pending', 'inProgress', 'done'];
    const daysFromNow = (n) => Timestamp.fromDate(new Date(Date.now() + n * 86_400_000));
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    for (let i = 0; i < 5; i++) {
      await addDoc(collection(db, 'tasks'), {
        projectId: 'test-project',
        employeeId: yashEmpDocId,
        title: pick(taskPool),
        status: pick(statuses),
        dueDate: daysFromNow(randInt(1, 30)),
        createdAt: serverTimestamp(),
      });
      console.log(`   ✓ Created task ${i + 1}`);
    }
  }

  // ── 7. Summary ──
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Fix complete!                                   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('Yash credentials: yashsh6055@gmail.com / password1234');
  console.log('Sneha credentials: sneha@company.com / password1234');
  console.log(`Yash employee doc ID: ${yashEmpDocId}`);
  console.log(`Yash auth UID: ${yashUid}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌ Script failed:', e);
  process.exit(1);
});
