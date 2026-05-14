/**
 * Setup Real Users & Seed Data Script
 *
 * Adjusts roles for existing users, creates missing users, and seeds
 * realistic data so every dashboard looks filled.
 *
 * Usage: cd firebase && node setup-real-users.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
  updateDoc,
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

// ── Helpers ─────────────────────────────────────────────────────────────────
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function monthString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function tsFromDate(date) {
  return Timestamp.fromDate(date);
}

const MONTHS_TO_SEED = (() => {
  const now = new Date();
  const m1 = new Date(now.getFullYear(), now.getMonth(), 1);
  const m2 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return [monthString(m1), monthString(m2)]; // [current, prev]
})();

// ── Auth helpers ────────────────────────────────────────────────────────────
async function createUserIfMissing(email, password, name, role) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      role,
      createdAt: serverTimestamp(),
      avatarUrl: '',
    });
    console.log(`  ✓ Created [${role}] ${email} → ${cred.user.uid}`);
    return cred.user.uid;
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log(`  ⚠ Already exists: ${email}`);
      return null;
    }
    console.error(`  ✗ Error creating ${email}:`, e.message);
    return null;
  }
}

async function signInAdmin() {
  const ADMIN_EMAIL = 'admin@finmanager.com';
  const ADMIN_PASSWORD = 'Admin@123';
  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✓ Signed in as admin');
    return true;
  } catch (e) {
    console.error('❌ Failed to sign in as admin:', e.message);
    return false;
  }
}

// ── Find UID by email ───────────────────────────────────────────────────────
async function findUserUidByEmail(email) {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return snapshot.docs[0].id;
  } catch (e) {
    console.error(`Error looking up ${email}:`, e.message);
  }
  return null;
}

async function updateUserRole(uid, role) {
  try {
    await updateDoc(doc(db, 'users', uid), { role });
    console.log(`  ✓ Updated role → ${role}`);
  } catch (e) {
    console.error(`  ✗ Failed to update role:`, e.message);
  }
}

// ── Seed Transactions ───────────────────────────────────────────────────────
async function seedTransactionsForUser(userId, months, countPerMonth = 14) {
  const incomeItems = [
    { title: 'Monthly Salary', category: 'Salary' },
    { title: 'Freelance Project', category: 'Salary' },
    { title: 'Performance Bonus', category: 'Salary' },
    { title: 'Interest Income', category: 'Other' },
    { title: 'Dividend Payout', category: 'Other' },
    { title: 'Cashback Reward', category: 'Other' },
  ];
  const expenseItems = [
    { title: 'Grocery Shopping', category: 'Food' },
    { title: 'Restaurant Dinner', category: 'Food' },
    { title: 'Swiggy Order', category: 'Food' },
    { title: 'Electricity Bill', category: 'Bills' },
    { title: 'Internet Bill', category: 'Bills' },
    { title: 'Phone Recharge', category: 'Bills' },
    { title: 'Uber Ride', category: 'Transport' },
    { title: 'Petrol', category: 'Transport' },
    { title: 'Amazon Shopping', category: 'Shopping' },
    { title: 'Netflix Subscription', category: 'Entertainment' },
    { title: 'Movie Tickets', category: 'Entertainment' },
    { title: 'Gym Membership', category: 'Health' },
    { title: 'Medical Checkup', category: 'Health' },
    { title: 'Online Course', category: 'Education' },
  ];

  let total = 0;
  for (const month of months) {
    const [year, m] = month.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();

    for (let i = 0; i < countPerMonth; i++) {
      const day = randInt(1, daysInMonth);
      const date = new Date(year, m - 1, day, randInt(8, 22), randInt(0, 59));
      const isIncome = Math.random() > 0.6;
      const item = isIncome ? pick(incomeItems) : pick(expenseItems);
      const amount = isIncome ? randInt(15000, 85000) : randInt(200, 7000);

      await addDoc(collection(db, 'transactions'), {
        userId,
        title: item.title,
        amount,
        type: isIncome ? 'income' : 'expense',
        category: item.category,
        date: tsFromDate(date),
        note: '',
        createdAt: serverTimestamp(),
      });
      total++;
    }
  }
  console.log(`    → ${total} transactions`);
}

// ── Seed Budgets ─────────────────────────────────────────────────────────────
async function seedBudgetsForUser(userId, months) {
  const budgets = [
    { category: 'Food', limit: 12000, spent: 8400 },
    { category: 'Transport', limit: 4000, spent: 2800 },
    { category: 'Bills', limit: 8000, spent: 7600 },
    { category: 'Shopping', limit: 10000, spent: 6200 },
    { category: 'Entertainment', limit: 3000, spent: 2100 },
    { category: 'Health', limit: 5000, spent: 1800 },
  ];

  let total = 0;
  for (const month of months) {
    for (const b of budgets) {
      const variance = randInt(-1500, 2000);
      const spent = Math.max(0, b.spent + variance);
      const limit = Math.max(spent + 500, b.limit + randInt(-500, 500));

      await addDoc(collection(db, 'budgets'), {
        userId,
        category: b.category,
        limit,
        spent,
        month,
        createdAt: serverTimestamp(),
      });
      total++;
    }
  }
  console.log(`    → ${total} budgets`);
}

// ── Seed Employees ──────────────────────────────────────────────────────────
async function seedEmployees(authorityUid, list) {
  const ids = [];
  for (const e of list) {
    const ref = await addDoc(collection(db, 'employees'), {
      uid: e.uid ?? '',
      name: e.name,
      email: e.email,
      department: e.department,
      salary: e.salary,
      overtimeHours: e.overtimeHours,
      createdBy: authorityUid,
      createdAt: serverTimestamp(),
    });
    ids.push(ref.id);
    console.log(`  ✓ Employee ${e.name} → ${ref.id}`);
  }
  return ids;
}

// ── Seed Projects ───────────────────────────────────────────────────────────
async function seedProjects(authorityUid, employeeIds) {
  const projects = [
    { title: 'Mobile App Redesign', status: 'active', kpiPercent: 72, daysUntilDeadline: 28, assignCount: 3 },
    { title: 'Website Migration to Cloud', status: 'active', kpiPercent: 55, daysUntilDeadline: 45, assignCount: 2 },
    { title: 'Q3 Marketing Campaign', status: 'pending', kpiPercent: 15, daysUntilDeadline: 60, assignCount: 2 },
    { title: 'CRM System Integration', status: 'completed', kpiPercent: 100, daysUntilDeadline: -5, assignCount: 3 },
  ];

  const daysFromNow = (n) => tsFromDate(new Date(Date.now() + n * 86_400_000));

  const projectIds = [];
  for (const p of projects) {
    const assigned = [...employeeIds]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(p.assignCount, employeeIds.length));

    const ref = await addDoc(collection(db, 'projects'), {
      title: p.title,
      status: p.status,
      kpiPercent: p.kpiPercent,
      assignedEmployeeIds: assigned,
      deadline: daysFromNow(p.daysUntilDeadline),
      createdBy: authorityUid,
      createdAt: serverTimestamp(),
    });
    projectIds.push({ id: ref.id, assigned });
  }
  console.log(`  → ${projectIds.length} projects`);
  return projectIds;
}

// ── Seed Tasks ──────────────────────────────────────────────────────────────
async function seedTasks(projectData) {
  const taskPool = [
    'Design wireframes',
    'Implement authentication',
    'Write unit tests',
    'Code review',
    'Update documentation',
    'Fix payment gateway bug',
    'Implement search feature',
    'Optimize database queries',
    'Deploy to staging',
    'Performance testing',
    'Security audit',
    'UI polish & animations',
    'API integration',
    'Data migration script',
    'Set up CI/CD pipeline',
  ];
  const statuses = ['pending', 'inProgress', 'done'];
  const daysFromNow = (n) => tsFromDate(new Date(Date.now() + n * 86_400_000));

  let total = 0;
  for (const project of projectData) {
    if (project.assigned.length === 0) continue;
    const numTasks = randInt(3, 6);
    for (let i = 0; i < numTasks; i++) {
      await addDoc(collection(db, 'tasks'), {
        projectId: project.id,
        employeeId: pick(project.assigned),
        title: pick(taskPool),
        status: pick(statuses),
        dueDate: daysFromNow(randInt(1, 30)),
        createdAt: serverTimestamp(),
      });
      total++;
    }
  }
  console.log(`  → ${total} tasks`);
}

// ── Seed Payslips ───────────────────────────────────────────────────────────
async function seedPayslips(authorityUid, employeeIds, employeeData, months) {
  let total = 0;
  for (let i = 0; i < employeeIds.length; i++) {
    const empId = employeeIds[i];
    const salary = employeeData[i].salary;
    const overtimeHours = employeeData[i].overtimeHours;

    for (const month of months) {
      const overtimePay = overtimeHours * 250;
      const deductions = randInt(1200, 4500);
      const netPay = salary + overtimePay - deductions;

      await addDoc(collection(db, 'payslips'), {
        employeeId: empId,
        month,
        basicSalary: salary,
        overtimePay,
        deductions,
        netPay,
        generatedAt: serverTimestamp(),
        generatedBy: authorityUid,
      });
      total++;
    }
  }
  console.log(`  → ${total} payslips`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   Setup Real Users & Seed Data                   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // 1️⃣  Create missing auth accounts first (client SDK signs in each new user)
  console.log('① Creating missing auth users...\n');

  await createUserIfMissing('admin@finmanager.com', 'Admin@123', 'Arjun Sharma', 'authority');
  await createUserIfMissing('sneha@company.com', 'password1234', 'Sneha Reddy', 'hr');

  // 2️⃣  Sign in as admin so we can write everything else
  console.log('\n② Signing in as admin...');
  const ok = await signInAdmin();
  if (!ok) {
    console.error('Cannot proceed without admin login. Exiting.');
    process.exit(1);
  }

  // 3️⃣  Resolve all UIDs by email
  console.log('\n③ Resolving user UIDs...');
  const uids = {
    shivam: await findUserUidByEmail('pinjareshivam@gmail.com'),
    shyam: await findUserUidByEmail('shyampawar@gmail.com'),
    yash: await findUserUidByEmail('yashsh6055@gmail.com'),
    sneha: await findUserUidByEmail('sneha@company.com'),
    admin: await findUserUidByEmail('admin@finmanager.com'),
  };

  for (const [key, uid] of Object.entries(uids)) {
    if (uid) {
      console.log(`  ✓ ${key}: ${uid}`);
    } else {
      console.log(`  ⚠ ${key}: NOT FOUND`);
    }
  }

  if (!uids.admin) {
    console.error('Admin user not found in Firestore. Exiting.');
    process.exit(1);
  }

  // 4️⃣  Update roles
  console.log('\n④ Updating roles...');
  if (uids.shivam) await updateUserRole(uids.shivam, 'regular');
  if (uids.yash) await updateUserRole(uids.yash, 'employee');
  if (uids.sneha) await updateUserRole(uids.sneha, 'hr');
  // Ensure admin doc is authority
  await updateUserRole(uids.admin, 'authority');

  // 5️⃣  Seed regular user data (Shivam & Shyam)
  console.log('\n⑤ Seeding regular user data...');
  console.log('  Shivam Pinjare:');
  if (uids.shivam) {
    await seedTransactionsForUser(uids.shivam, MONTHS_TO_SEED, 14);
    await seedBudgetsForUser(uids.shivam, MONTHS_TO_SEED);
  }
  console.log('  Shyam Pawar:');
  if (uids.shyam) {
    await seedTransactionsForUser(uids.shyam, MONTHS_TO_SEED, 12);
    await seedBudgetsForUser(uids.shyam, MONTHS_TO_SEED);
  }

  // 6️⃣  Seed employees (Yash + dummies) for admin dashboard
  console.log('\n⑥ Seeding employees...');
  const employeeData = [
    { name: 'Yash Sharma', email: 'yashsh6055@gmail.com', department: 'Engineering', salary: 70000, overtimeHours: 10, uid: uids.yash ?? '' },
    { name: 'Rahul Kumar', email: 'rahul@company.com', department: 'Engineering', salary: 75000, overtimeHours: 12, uid: '' },
    { name: 'Priya Sharma', email: 'priya@company.com', department: 'Design', salary: 65000, overtimeHours: 8, uid: '' },
    { name: 'Amit Patel', email: 'amit@company.com', department: 'Marketing', salary: 55000, overtimeHours: 5, uid: '' },
  ];

  const employeeIds = await seedEmployees(uids.admin, employeeData);

  // 7️⃣  Seed projects
  console.log('\n⑦ Seeding projects...');
  const projectData = await seedProjects(uids.admin, employeeIds);

  // 8️⃣  Seed tasks
  console.log('\n⑧ Seeding tasks...');
  await seedTasks(projectData);

  // 9️⃣  Seed payslips (2 months)
  console.log('\n⑨ Seeding payslips...');
  await seedPayslips(uids.admin, employeeIds, employeeData, MONTHS_TO_SEED);

  // 🔟  Seed notifications for everyone
  console.log('\n⑩ Seeding notifications...');
  const notifTargets = [
    { uid: uids.yash, msg: 'Welcome to the team! Your employee profile is now active.' },
    { uid: uids.shivam, msg: 'Your budget limits have been updated for this month.' },
    { uid: uids.shyam, msg: 'New transaction categories are now available.' },
    { uid: uids.sneha, msg: 'You have been assigned HR Manager role.' },
  ];
  for (const n of notifTargets) {
    if (!n.uid) continue;
    await addDoc(collection(db, 'notifications'), {
      targetUid: n.uid,
      type: 'system',
      title: 'System Update',
      body: n.msg,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
  console.log(`  → ${notifTargets.length} notifications`);

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   ✓  Setup complete!                             ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('┌─ Credentials ────────────────────────────────────┐');
  console.log('│                                                   │');
  console.log('│  AUTHORITY / ADMIN (Web + Mobile)                 │');
  console.log('│  admin@finmanager.com  /  Admin@123               │');
  console.log('│                                                   │');
  console.log('│  HR (Web + Mobile)                                │');
  console.log('│  sneha@company.com     /  password1234            │');
  console.log('│                                                   │');
  console.log('│  REGULAR USERS (Mobile App)                       │');
  console.log('│  pinjareshivam@gmail.com / password1234           │');
  console.log('│  shyampawar@gmail.com    / password1234           │');
  console.log('│                                                   │');
  console.log('│  EMPLOYEE (Mobile App)                            │');
  console.log('│  yashsh6055@gmail.com    / password1234           │');
  console.log('└───────────────────────────────────────────────────┘\n');

  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌ Setup failed:', e.message ?? e);
  process.exit(1);
});
