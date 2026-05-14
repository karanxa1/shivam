/**
 * Enrich Yash employee data with more tasks and payslips
 * Usage: cd firebase && node enrich-yash.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyCACLPAwmqTHtzmMQ05K1JA1BkL9VMngqg',
  authDomain: 'nessbid-1.firebaseapp.com',
  projectId: 'nessbid-1',
});
const auth = getAuth(app);
const db = getFirestore(app);

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  await signInWithEmailAndPassword(auth, 'admin@finmanager.com', 'Admin@123');
  console.log('Admin signed in.\n');

  // Find Yash employee doc
  const empQ = query(collection(db, 'employees'), where('email', '==', 'yashsh6055@gmail.com'));
  const empSnap = await getDocs(empQ);
  if (empSnap.empty) { console.error('Yash employee not found'); process.exit(1); }
  const yashEmpDocId = empSnap.docs[0].id;
  console.log(`Yash employee doc: ${yashEmpDocId}`);

  // Find Yash auth uid
  const userQ = query(collection(db, 'users'), where('email', '==', 'yashsh6055@gmail.com'));
  const userSnap = await getDocs(userQ);
  const yashUid = userSnap.docs[0].id;

  // ── 1. Add more diverse tasks ──
  console.log('\nAdding tasks...');
  const statuses = ['pending', 'inProgress', 'done'];
  const taskPool = [
    'Implement JWT auth', 'Build REST API', 'Fix navigation bug',
    'Write Jest tests', 'Code review PR #42', 'Update API docs',
    'Optimize React hooks', 'Integrate Stripe payments', 'Deploy to Vercel',
    'Setup Docker compose', 'Migrate to TypeScript', 'Redis caching layer',
    'Webpack config update', 'CI/CD pipeline fix', 'Add error logging',
    'User profile page', 'Dark mode toggle', 'Notification system',
    'Analytics dashboard', 'Email service setup', 'SMS OTP flow',
  ];
  const projectIds = [
    'proj-mobile-app', 'proj-cloud-migration', 'proj-marketing-q3', 'proj-crm-integration',
  ];

  let created = 0;
  // Ensure a good mix: 5 pending, 4 in-progress, 6 done
  const distribution = [
    ...Array(5).fill('pending'),
    ...Array(4).fill('inProgress'),
    ...Array(6).fill('done'),
  ];

  for (const status of distribution) {
    await addDoc(collection(db, 'tasks'), {
      projectId: pick(projectIds),
      employeeId: yashEmpDocId,
      title: pick(taskPool),
      status,
      dueDate: Timestamp.fromDate(new Date(Date.now() + randInt(1, 30) * 86_400_000)),
      createdAt: serverTimestamp(),
    });
    created++;
  }
  console.log(`  ✓ Created ${created} tasks`);

  // ── 2. Add more payslips (last 4 months) ──
  console.log('\nAdding payslips...');
  const months = ['2026-02', '2026-03', '2026-04', '2026-05'];
  const basicSalary = 70000;
  const overtimeHours = randInt(5, 15);
  for (const month of months) {
    const overtimePay = overtimeHours * 250;
    const deductions = randInt(2000, 5000);
    const netPay = basicSalary + overtimePay - deductions;
    await addDoc(collection(db, 'payslips'), {
      employeeId: yashEmpDocId,
      month,
      basicSalary,
      overtimePay,
      deductions,
      netPay,
      generatedAt: serverTimestamp(),
      generatedBy: auth.currentUser.uid,
    });
    console.log(`  ✓ Payslip ${month}: ₹${netPay}`);
  }

  // ── 3. Add notifications for Yash ──
  console.log('\nAdding notifications...');
  const notifs = [
    { title: 'New Task Assigned', body: 'You have been assigned: Implement JWT auth', type: 'task_assigned' },
    { title: 'Payslip Generated', body: 'Your payslip for 2026-05 is ready', type: 'payslip_generated' },
    { title: 'Task Completed', body: '"Design wireframes" has been marked as done', type: 'task_done' },
    { title: 'New Task Assigned', body: 'You have been assigned: Build REST API', type: 'task_assigned' },
    { title: 'Upcoming Deadline', body: '3 tasks due this week', type: 'task_overdue' },
  ];
  for (const n of notifs) {
    await addDoc(collection(db, 'notifications'), {
      targetUid: yashUid,
      type: n.type,
      title: n.title,
      body: n.body,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
  console.log(`  ✓ ${notifs.length} notifications`);

  console.log('\nDone. Yash now has rich data on the mobile employee dashboard.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
