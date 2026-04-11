/**
 * Seed script — creates 4 demo users (admin, hr, employee, regular)
 * and populates Firestore with dummy data.
 *
 * Run:  node seed.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  Timestamp,
} from 'firebase/firestore';

const API_KEY = 'AIzaSyCACLPAwmqTHtzmMQ05K1JA1BkL9VMngqg';

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: 'nessbid-1.firebaseapp.com',
  projectId: 'nessbid-1',
  storageBucket: 'nessbid-1.firebasestorage.app',
  messagingSenderId: '763480870514',
  appId: '1:763480870514:web:dc0e4b17886f4d0ab1bceb',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const authInstance = getAuth(app);

// ── helpers ──────────────────────────────────────────────

async function createAuthUser(email, password, displayName) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (data.error) {
    if (data.error.message === 'EMAIL_EXISTS') {
      console.log(`  ~ ${email} already exists, signing in...`);
      const signInRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      const signInData = await signInRes.json();
      if (signInData.error) throw new Error(signInData.error.message);
      return signInData.localId;
    }
    throw new Error(data.error.message);
  }
  return data.localId;
}

function ts(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return Timestamp.fromDate(d);
}

function monthStr(monthsAgo = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── users ────────────────────────────────────────────────

const PASSWORD = 'shivam123';

const users = [
  { email: 'shivam.admin@finmanager.com',    role: 'admin',    name: 'Shivam' },
  { email: 'shivam.hr@finmanager.com',       role: 'hr',       name: 'Shivam' },
  { email: 'shivam.employee@finmanager.com', role: 'employee', name: 'Shivam' },
  { email: 'shivam.regular@finmanager.com',  role: 'regular',  name: 'Shivam' },
];

// ── main ─────────────────────────────────────────────────

async function seed() {
  // ── Step 1: Create all Firebase Auth users via REST ────
  console.log('=== Step 1: Creating auth users ===\n');

  const uids = {};

  for (const u of users) {
    console.log(`Creating ${u.role}: ${u.email}`);
    const uid = await createAuthUser(u.email, PASSWORD, u.name);
    uids[u.role] = uid;
    console.log(`  OK uid: ${uid}\n`);
  }

  // ── Step 2: Sign in as admin so Firestore SDK has auth ─
  console.log('=== Step 2: Signing in as admin for Firestore access ===\n');
  await signInWithEmailAndPassword(authInstance, users[0].email, PASSWORD);
  console.log('  Signed in as admin.\n');

  // ── Step 3: Write user docs (admin can write users/{uid}) ─
  // Note: Firestore rules allow users to write their own doc.
  // Admin can read all but can only write own doc by default.
  // We'll write each user doc by signing in as that user briefly.

  console.log('=== Step 3: Creating user documents ===\n');

  for (const u of users) {
    const uid = uids[u.role];
    // Sign in as this user to write their own doc
    await signInWithEmailAndPassword(authInstance, u.email, PASSWORD);
    await setDoc(doc(db, 'users', uid), {
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: ts(30),
    });
    console.log(`  OK user doc: ${u.role} (${uid})`);
  }

  // ── Step 4: Sign in as admin to write everything else ──
  console.log('\n=== Step 4: Signing in as admin for data seeding ===\n');
  await signInWithEmailAndPassword(authInstance, users[0].email, PASSWORD);

  const adminUid = uids.admin;
  const employeeUid = uids.employee;

  // ── employees ──────────────────────────────────────────
  console.log('=== Creating employees ===\n');

  const employeeDocs = [
    { uid: employeeUid, name: 'Shivam', email: 'shivam.employee@finmanager.com', department: 'Engineering', salary: 75000, overtimeHours: 12, createdBy: adminUid, createdAt: ts(25) },
    { uid: '',          name: 'Shivam Dev',    email: 'shivam.dev@finmanager.com',    department: 'Engineering', salary: 65000, overtimeHours: 8,  createdBy: adminUid, createdAt: ts(20) },
    { uid: '',          name: 'Shivam QA',     email: 'shivam.qa@finmanager.com',     department: 'QA',          salary: 55000, overtimeHours: 5,  createdBy: adminUid, createdAt: ts(15) },
    { uid: '',          name: 'Shivam Design', email: 'shivam.design@finmanager.com', department: 'Design',      salary: 60000, overtimeHours: 3,  createdBy: adminUid, createdAt: ts(10) },
    { uid: '',          name: 'Shivam Sales',  email: 'shivam.sales@finmanager.com',  department: 'Sales',       salary: 50000, overtimeHours: 10, createdBy: adminUid, createdAt: ts(5) },
  ];

  const empIds = [];
  for (const emp of employeeDocs) {
    const ref = await addDoc(collection(db, 'employees'), emp);
    empIds.push(ref.id);
    console.log(`  OK Employee: ${emp.name} (${emp.department}) -> ${ref.id}`);
  }

  // ── projects ───────────────────────────────────────────
  console.log('\n=== Creating projects ===\n');

  const projectDocs = [
    { title: 'Mobile App Redesign',   description: 'Complete UI overhaul of the mobile application', status: 'active',    kpiPercent: 65, assignedEmployeeIds: [empIds[0], empIds[1]], deadline: ts(-30), createdBy: adminUid, createdAt: ts(20) },
    { title: 'API Migration v3',      description: 'Migrate REST APIs to GraphQL',                   status: 'active',    kpiPercent: 40, assignedEmployeeIds: [empIds[1], empIds[2]], deadline: ts(-15), createdBy: adminUid, createdAt: ts(18) },
    { title: 'Dashboard Analytics',   description: 'Build analytics dashboard with charts',          status: 'pending',   kpiPercent: 0,  assignedEmployeeIds: [empIds[0]],            deadline: ts(-45), createdBy: adminUid, createdAt: ts(12) },
    { title: 'Customer Portal',       description: 'Self-service portal for customers',              status: 'completed', kpiPercent: 100,assignedEmployeeIds: [empIds[3], empIds[4]], deadline: ts(10),  createdBy: adminUid, createdAt: ts(60) },
  ];

  const projIds = [];
  for (const proj of projectDocs) {
    const ref = await addDoc(collection(db, 'projects'), proj);
    projIds.push(ref.id);
    console.log(`  OK Project: ${proj.title} (${proj.status}) -> ${ref.id}`);
  }

  // ── tasks ──────────────────────────────────────────────
  console.log('\n=== Creating tasks ===\n');

  const taskDocs = [
    { employeeId: empIds[0], title: 'Design login screen',          status: 'done',       dueDate: ts(5),   projectId: projIds[0], createdAt: ts(18) },
    { employeeId: empIds[0], title: 'Implement dashboard widgets',  status: 'inProgress', dueDate: ts(-5),  projectId: projIds[0], createdAt: ts(15) },
    { employeeId: empIds[0], title: 'Write unit tests',             status: 'pending',    dueDate: ts(-10), projectId: projIds[2], createdAt: ts(10) },
    { employeeId: empIds[1], title: 'Set up GraphQL server',        status: 'inProgress', dueDate: ts(-7),  projectId: projIds[1], createdAt: ts(16) },
    { employeeId: empIds[1], title: 'Migrate user endpoints',       status: 'pending',    dueDate: ts(-14), projectId: projIds[1], createdAt: ts(14) },
    { employeeId: empIds[2], title: 'QA test plan for API v3',      status: 'done',       dueDate: ts(2),   projectId: projIds[1], createdAt: ts(12) },
    { employeeId: empIds[2], title: 'Regression testing',           status: 'pending',    dueDate: ts(-3),  projectId: projIds[1], createdAt: ts(8) },
    { employeeId: empIds[3], title: 'Design customer portal UI',    status: 'done',       dueDate: ts(15),  projectId: projIds[3], createdAt: ts(55) },
    { employeeId: empIds[4], title: 'Sales demo preparation',       status: 'done',       dueDate: ts(5),   projectId: projIds[3], createdAt: ts(50) },
    { employeeId: empIds[4], title: 'Client onboarding docs',       status: 'pending',    dueDate: ts(-2),  projectId: projIds[3], createdAt: ts(5) },
  ];

  for (const task of taskDocs) {
    const ref = await addDoc(collection(db, 'tasks'), task);
    console.log(`  OK Task: ${task.title} (${task.status}) -> ${ref.id}`);
  }

  // ── payslips ───────────────────────────────────────────
  console.log('\n=== Creating payslips ===\n');

  for (let m = 0; m < 3; m++) {
    const month = monthStr(m);
    for (let i = 0; i < empIds.length; i++) {
      const emp = employeeDocs[i];
      const overtimePay = emp.overtimeHours * 250;
      const deductions = Math.round(emp.salary * 0.1);
      const netPay = emp.salary + overtimePay - deductions;
      const ref = await addDoc(collection(db, 'payslips'), {
        employeeId: empIds[i],
        month,
        basicSalary: emp.salary,
        overtimePay,
        deductions,
        netPay,
        generatedAt: ts(m * 30 + 1),
        generatedBy: adminUid,
      });
      console.log(`  OK Payslip: ${emp.name} ${month} -> ${ref.id}`);
    }
  }

  // ── transactions (for regular & employee users) ────────
  console.log('\n=== Creating transactions ===\n');

  // Need to sign in as each user to write their transactions (Firestore rules)
  const txUsers = [
    { uid: uids.regular,  email: users[3].email },
    { uid: uids.employee, email: users[2].email },
  ];

  for (const { uid: userId, email } of txUsers) {
    await signInWithEmailAndPassword(authInstance, email, PASSWORD);

    const txns = [
      { title: 'Monthly Salary',      amount: 75000, type: 'income',  category: 'salary',        date: ts(1),  note: 'April salary',       isRecurring: true,  recurrenceType: 'monthly' },
      { title: 'Grocery Shopping',     amount: 3500,  type: 'expense', category: 'food',          date: ts(2),  note: 'Weekly groceries',   isRecurring: true,  recurrenceType: 'weekly' },
      { title: 'Uber Rides',           amount: 1200,  type: 'expense', category: 'transport',     date: ts(3),  note: 'Office commute',     isRecurring: false },
      { title: 'Netflix Subscription', amount: 649,   type: 'expense', category: 'entertainment', date: ts(5),  note: '',                   isRecurring: true,  recurrenceType: 'monthly' },
      { title: 'Electricity Bill',     amount: 2100,  type: 'expense', category: 'utilities',     date: ts(7),  note: 'March bill',         isRecurring: true,  recurrenceType: 'monthly' },
      { title: 'Freelance Payment',    amount: 15000, type: 'income',  category: 'salary',        date: ts(10), note: 'Logo design project',isRecurring: false },
      { title: 'Gym Membership',       amount: 2000,  type: 'expense', category: 'health',        date: ts(12), note: 'Monthly gym',        isRecurring: true,  recurrenceType: 'monthly' },
      { title: 'Online Course',        amount: 4999,  type: 'expense', category: 'education',     date: ts(15), note: 'React course',       isRecurring: false },
      { title: 'New Shoes',            amount: 3200,  type: 'expense', category: 'shopping',      date: ts(18), note: '',                   isRecurring: false },
      { title: 'Dividend Income',      amount: 5000,  type: 'income',  category: 'investment',    date: ts(20), note: 'Q1 dividends',       isRecurring: false },
    ];

    for (const tx of txns) {
      await addDoc(collection(db, 'transactions'), {
        ...tx,
        userId,
        date: tx.date,
        createdAt: tx.date,
      });
    }
    console.log(`  OK 10 transactions for ${email}`);
  }

  // ── budgets (for regular & employee users) ─────────────
  console.log('\n=== Creating budgets ===\n');

  const currentMonth = monthStr(0);
  for (const { uid: userId, email } of txUsers) {
    // Already signed in as this user from transactions above
    await signInWithEmailAndPassword(authInstance, email, PASSWORD);

    const budgets = [
      { category: 'food',          limit: 8000,  spent: 3500 },
      { category: 'transport',     limit: 3000,  spent: 1200 },
      { category: 'entertainment', limit: 2000,  spent: 649 },
      { category: 'utilities',     limit: 3000,  spent: 2100 },
      { category: 'shopping',      limit: 5000,  spent: 3200 },
      { category: 'health',        limit: 3000,  spent: 2000 },
    ];

    for (const b of budgets) {
      await addDoc(collection(db, 'budgets'), {
        userId,
        category: b.category,
        limit: b.limit,
        spent: b.spent,
        month: currentMonth,
        createdAt: ts(25),
      });
    }
    console.log(`  OK 6 budgets for ${email}`);
  }

  // ── notifications ──────────────────────────────────────
  console.log('\n=== Creating notifications ===\n');

  // Sign back in as admin (can create notifications for anyone)
  await signInWithEmailAndPassword(authInstance, users[0].email, PASSWORD);

  const notifications = [
    { targetUid: employeeUid, type: 'task_assigned',      title: 'New Task Assigned',     body: 'You have been assigned: Implement dashboard widgets', read: false, createdAt: ts(1) },
    { targetUid: employeeUid, type: 'payslip_generated',  title: 'Payslip Generated',     body: `Your payslip for ${monthStr(0)} has been generated`,  read: false, createdAt: ts(2) },
    { targetUid: employeeUid, type: 'task_overdue',       title: 'Task Overdue',           body: 'Task "Write unit tests" is past its due date',        read: true,  createdAt: ts(5) },
    { targetUid: adminUid,    type: 'task_done',          title: 'Task Completed',         body: 'Shivam completed "Design login screen"',              read: false, createdAt: ts(3) },
    { targetUid: adminUid,    type: 'task_done',          title: 'Task Completed',         body: 'Shivam QA completed "QA test plan for API v3"',       read: true,  createdAt: ts(6) },
    { targetUid: uids.hr,     type: 'payslip_generated',  title: 'Payslips Generated',     body: `All payslips for ${monthStr(0)} have been generated`, read: false, createdAt: ts(1) },
  ];

  for (const n of notifications) {
    await addDoc(collection(db, 'notifications'), n);
    console.log(`  OK Notification: ${n.title} -> ${n.targetUid.substring(0, 8)}...`);
  }

  await signOut(authInstance);

  // ── summary ────────────────────────────────────────────
  console.log('\n========================================');
  console.log('         SEED COMPLETE');
  console.log('========================================\n');
  console.log('Password for ALL accounts: shivam123\n');
  console.log('+-----------+--------------------------------------+------------------------------+');
  console.log('| Role      | Email                                | UID                          |');
  console.log('+-----------+--------------------------------------+------------------------------+');
  for (const u of users) {
    const uid = uids[u.role];
    console.log(`| ${u.role.padEnd(9)} | ${u.email.padEnd(36)} | ${uid.padEnd(28)} |`);
  }
  console.log('+-----------+--------------------------------------+------------------------------+');
  console.log('\nData seeded:');
  console.log('  - 5 employees');
  console.log('  - 4 projects (2 active, 1 pending, 1 completed)');
  console.log('  - 10 tasks (4 done, 3 pending, 2 in-progress, 1 overdue)');
  console.log('  - 15 payslips (3 months x 5 employees)');
  console.log('  - 20 transactions (10 per regular & employee)');
  console.log('  - 12 budgets (6 per regular & employee)');
  console.log('  - 6 notifications');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
