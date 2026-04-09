/**
 * Seed Data Script — Financial Management System
 * Firebase Project: nessbid-1
 *
 * Usage:  cd firebase && npm install && node seed-data.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

// ── Firebase config (hardcoded — no prompts needed) ──────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyCACLPAwmqTHtzmMQ05K1JA1BkL9VMngqg',
  authDomain: 'nessbid-1.firebaseapp.com',
  projectId: 'nessbid-1',
  storageBucket: 'nessbid-1.firebasestorage.app',
  messagingSenderId: '763480870514',
  appId: '1:763480870514:web:dc0e4b17886f4d0ab1bceb',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const daysAgo = (n) =>
  Timestamp.fromDate(new Date(Date.now() - n * 86_400_000));
const daysFromNow = (n) =>
  Timestamp.fromDate(new Date(Date.now() + n * 86_400_000));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function prevMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function createUser(auth, db, email, password, name, role) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      role,
      createdAt: serverTimestamp(),
      avatarUrl: '',
    });
    console.log(`  ✓ ${role.padEnd(10)} ${email}  (${cred.user.uid})`);
    return cred.user.uid;
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log(`  ⚠ already exists: ${email}`);
      return null;
    }
    throw e;
  }
}

// ── Transactions ──────────────────────────────────────────────────────────────
async function seedTransactions(db, userId, count = 30) {
  const incomeItems = [
    { title: 'Monthly Salary',      category: 'Salary' },
    { title: 'Freelance Project',   category: 'Salary' },
    { title: 'Performance Bonus',   category: 'Salary' },
    { title: 'Interest Income',     category: 'Other'  },
    { title: 'Rental Income',       category: 'Other'  },
    { title: 'Dividend Payout',     category: 'Other'  },
  ];
  const expenseItems = [
    { title: 'Grocery Shopping',    category: 'Food'      },
    { title: 'Restaurant Dinner',   category: 'Food'      },
    { title: 'Swiggy Order',        category: 'Food'      },
    { title: 'Electricity Bill',    category: 'Bills'     },
    { title: 'Internet Bill',       category: 'Bills'     },
    { title: 'Phone Recharge',      category: 'Bills'     },
    { title: 'Uber Ride',           category: 'Transport' },
    { title: 'Petrol',              category: 'Transport' },
    { title: 'Metro Card Recharge', category: 'Transport' },
    { title: 'Amazon Shopping',     category: 'Shopping'  },
    { title: 'Clothing Purchase',   category: 'Shopping'  },
    { title: 'Netflix Subscription',category: 'Entertainment' },
    { title: 'Movie Tickets',       category: 'Entertainment' },
    { title: 'Gym Membership',      category: 'Health'    },
    { title: 'Medical Checkup',     category: 'Health'    },
    { title: 'Online Course',       category: 'Education' },
  ];

  for (let i = 0; i < count; i++) {
    const isIncome = Math.random() > 0.65;
    const item = isIncome ? pick(incomeItems) : pick(expenseItems);
    const amount = isIncome ? rand(15000, 80000) : rand(200, 8000);

    await addDoc(collection(db, 'transactions'), {
      userId,
      title: item.title,
      amount,
      type: isIncome ? 'income' : 'expense',
      category: item.category,
      date: daysAgo(rand(0, 90)),
      note: '',
      createdAt: serverTimestamp(),
    });
  }
  console.log(`    → ${count} transactions`);
}

// ── Budgets ───────────────────────────────────────────────────────────────────
async function seedBudgets(db, userId) {
  const budgets = [
    { category: 'Food',          limit: 12000, spent: 8400  },
    { category: 'Transport',     limit: 4000,  spent: 2800  },
    { category: 'Bills',         limit: 8000,  spent: 7600  },
    { category: 'Shopping',      limit: 10000, spent: 6200  },
    { category: 'Entertainment', limit: 3000,  spent: 2100  },
    { category: 'Health',        limit: 5000,  spent: 1800  },
  ];

  for (const b of budgets) {
    await addDoc(collection(db, 'budgets'), {
      userId,
      category: b.category,
      limit: b.limit,
      spent: b.spent,
      month: currentMonth(),
      createdAt: serverTimestamp(),
    });
  }
  console.log(`    → ${budgets.length} budgets`);
}

// ── Employees ─────────────────────────────────────────────────────────────────
async function seedEmployees(db, authorityUid, employeeData) {
  const ids = [];
  for (const e of employeeData) {
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
  }
  console.log(`    → ${ids.length} employees`);
  return ids;
}

// ── Projects ──────────────────────────────────────────────────────────────────
async function seedProjects(db, authorityUid, employeeIds) {
  const projects = [
    {
      title: 'Mobile App Redesign',
      status: 'active',
      kpiPercent: 72,
      daysUntilDeadline: 28,
      assignCount: 3,
    },
    {
      title: 'Website Migration to Cloud',
      status: 'active',
      kpiPercent: 55,
      daysUntilDeadline: 45,
      assignCount: 2,
    },
    {
      title: 'Q3 Marketing Campaign',
      status: 'pending',
      kpiPercent: 15,
      daysUntilDeadline: 60,
      assignCount: 2,
    },
    {
      title: 'CRM System Integration',
      status: 'completed',
      kpiPercent: 100,
      daysUntilDeadline: -5,
      assignCount: 3,
    },
    {
      title: 'AI Chatbot Development',
      status: 'active',
      kpiPercent: 88,
      daysUntilDeadline: 12,
      assignCount: 2,
    },
    {
      title: 'HR Portal Upgrade',
      status: 'pending',
      kpiPercent: 0,
      daysUntilDeadline: 90,
      assignCount: 2,
    },
  ];

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
  console.log(`    → ${projectIds.length} projects`);
  return projectIds;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
async function seedTasks(db, projectData) {
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

  // Task status values matching the Flutter app's TaskStatus enum
  const statuses = ['pending', 'inProgress', 'done'];

  let total = 0;
  for (const project of projectData) {
    if (project.assigned.length === 0) continue;
    const numTasks = rand(3, 6);

    for (let i = 0; i < numTasks; i++) {
      await addDoc(collection(db, 'tasks'), {
        projectId: project.id,
        employeeId: pick(project.assigned),
        title: pick(taskPool),
        status: pick(statuses),
        dueDate: daysFromNow(rand(1, 30)),
        createdAt: serverTimestamp(),
      });
      total++;
    }
  }
  console.log(`    → ${total} tasks`);
}

// ── Payslips ──────────────────────────────────────────────────────────────────
async function seedPayslips(db, authorityUid, employeeIds, employeeData) {
  const months = [currentMonth(), prevMonth()];
  let total = 0;

  for (let i = 0; i < employeeIds.length; i++) {
    const empId = employeeIds[i];
    const salary = employeeData[i].salary;
    const overtimeHours = employeeData[i].overtimeHours;

    for (const month of months) {
      const overtimePay = overtimeHours * 250; // ₹250/hr as per app spec
      const deductions = rand(1000, 4000);
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
  console.log(`    → ${total} payslips`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   FinManager — Firebase Seed Script              ║');
  console.log('║   Project: nessbid-1                             ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  console.log('✓ Firebase connected\n');

  // ── 1. Create users ──────────────────────────────────────────────────────
  console.log('① Creating users...');

  const authorityUid = await createUser(
    auth, db,
    'admin@finmanager.com', 'Admin@123',
    'Arjun Sharma', 'authority'
  );

  const regularUid1 = await createUser(
    auth, db,
    'rajesh@personal.com', 'User@123',
    'Rajesh Verma', 'regular'
  );
  const regularUid2 = await createUser(
    auth, db,
    'anjali@personal.com', 'User@123',
    'Anjali Mehta', 'regular'
  );

  const empAuthUids = {
    emp1: await createUser(auth, db, 'rahul@company.com',  'Emp@123', 'Rahul Kumar',   'employee'),
    emp2: await createUser(auth, db, 'priya@company.com',  'Emp@123', 'Priya Sharma',  'employee'),
    emp3: await createUser(auth, db, 'amit@company.com',   'Emp@123', 'Amit Patel',    'employee'),
    emp4: await createUser(auth, db, 'sneha@company.com',  'Emp@123', 'Sneha Reddy',   'employee'),
    emp5: await createUser(auth, db, 'vikram@company.com', 'Emp@123', 'Vikram Singh',  'employee'),
  };

  // ── 2. Transactions & budgets for regular users ──────────────────────────
  console.log('\n② Seeding regular user data...');
  if (regularUid1) {
    console.log('  Rajesh Verma:');
    await seedTransactions(db, regularUid1, 30);
    await seedBudgets(db, regularUid1);
  }
  if (regularUid2) {
    console.log('  Anjali Mehta:');
    await seedTransactions(db, regularUid2, 20);
    await seedBudgets(db, regularUid2);
  }

  // ── 3. Employees, projects, tasks, payslips ──────────────────────────────
  if (!authorityUid) {
    console.log('\n⚠ Authority user already exists — skipping employee/project seeding.');
    console.log('  (Delete existing data in Firestore and re-run to reseed)\n');
    process.exit(0);
  }

  const employeeData = [
    { name: 'Rahul Kumar',  email: 'rahul@company.com',  department: 'Engineering', salary: 75000, overtimeHours: 12, uid: empAuthUids.emp1 ?? '' },
    { name: 'Priya Sharma', email: 'priya@company.com',  department: 'Design',      salary: 65000, overtimeHours: 8,  uid: empAuthUids.emp2 ?? '' },
    { name: 'Amit Patel',   email: 'amit@company.com',   department: 'Marketing',   salary: 55000, overtimeHours: 5,  uid: empAuthUids.emp3 ?? '' },
    { name: 'Sneha Reddy',  email: 'sneha@company.com',  department: 'HR',          salary: 50000, overtimeHours: 3,  uid: empAuthUids.emp4 ?? '' },
    { name: 'Vikram Singh', email: 'vikram@company.com', department: 'Finance',     salary: 70000, overtimeHours: 10, uid: empAuthUids.emp5 ?? '' },
  ];

  console.log('\n③ Seeding employees...');
  const employeeIds = await seedEmployees(db, authorityUid, employeeData);

  console.log('\n④ Seeding projects...');
  const projectData = await seedProjects(db, authorityUid, employeeIds);

  console.log('\n⑤ Seeding tasks...');
  await seedTasks(db, projectData);

  console.log('\n⑥ Seeding payslips...');
  await seedPayslips(db, authorityUid, employeeIds, employeeData);

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   ✓  Database seeded successfully!               ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('\n┌─ Login Credentials ──────────────────────────────┐');
  console.log('│                                                   │');
  console.log('│  AUTHORITY (Web Portal + Mobile)                  │');
  console.log('│  admin@finmanager.com  /  Admin@123               │');
  console.log('│                                                   │');
  console.log('│  REGULAR USERS (Mobile App)                       │');
  console.log('│  rajesh@personal.com   /  User@123                │');
  console.log('│  anjali@personal.com   /  User@123                │');
  console.log('│                                                   │');
  console.log('│  EMPLOYEES (Mobile App)                           │');
  console.log('│  rahul@company.com     /  Emp@123                 │');
  console.log('│  priya@company.com     /  Emp@123                 │');
  console.log('│  amit@company.com      /  Emp@123                 │');
  console.log('│  sneha@company.com     /  Emp@123                 │');
  console.log('│  vikram@company.com    /  Emp@123                 │');
  console.log('└───────────────────────────────────────────────────┘\n');

  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌ Seed failed:', e.message ?? e);
  process.exit(1);
});
