/**
 * Add seed data to existing regular user accounts.
 * Run this once (or multiple times) after the users already exist in Firebase Auth.
 *
 * Usage:  cd firebase && node add-user-data.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
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

// Admin credentials used to elevate Firestore permissions
const ADMIN_EMAIL = 'admin@finmanager.com';
const ADMIN_PASSWORD = 'Admin@123';

async function signInAdmin() {
  try {
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✓ Signed in as admin');
  } catch (e) {
    console.error('❌ Failed to sign in as admin:', e.message);
    throw e;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function monthString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function tsFromDate(date) {
  return Timestamp.fromDate(date);
}

// Rolling window: last 3 calendar months (current, -1, -2)
function getLastThreeMonths() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthString(d));
  }
  return months; // [current, prev, prevPrev]
}

// ── Find user UID by email ──────────────────────────────────────────────────
async function findUserUidByEmail(email) {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id; // UID is the doc ID
    }
  } catch (e) {
    console.error(`Error looking up ${email}:`, e.message);
  }
  return null;
}

// ── Seed Transactions ───────────────────────────────────────────────────────
async function seedTransactionsForUser(userId, months, countPerMonth = 12) {
  const incomeItems = [
    { title: 'Monthly Salary',    category: 'Salary' },
    { title: 'Freelance Project',  category: 'Salary' },
    { title: 'Performance Bonus',  category: 'Salary' },
    { title: 'Interest Income',    category: 'Other' },
    { title: 'Dividend Payout',    category: 'Other' },
    { title: 'Cashback Reward',    category: 'Other' },
  ];
  const expenseItems = [
    { title: 'Grocery Shopping',    category: 'Food' },
    { title: 'Restaurant Dinner',   category: 'Food' },
    { title: 'Swiggy Order',        category: 'Food' },
    { title: 'Electricity Bill',    category: 'Bills' },
    { title: 'Internet Bill',       category: 'Bills' },
    { title: 'Phone Recharge',      category: 'Bills' },
    { title: 'Uber Ride',           category: 'Transport' },
    { title: 'Petrol',              category: 'Transport' },
    { title: 'Amazon Shopping',     category: 'Shopping' },
    { title: 'Netflix Subscription',category: 'Entertainment' },
    { title: 'Movie Tickets',       category: 'Entertainment' },
    { title: 'Gym Membership',      category: 'Health' },
    { title: 'Medical Checkup',     category: 'Health' },
    { title: 'Online Course',       category: 'Education' },
  ];

  let total = 0;
  for (const month of months) {
    const [year, m] = month.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();

    for (let i = 0; i < countPerMonth; i++) {
      const day = randInt(1, daysInMonth);
      const date = new Date(year, m - 1, day, randInt(8, 22), randInt(0, 59));
      const isIncome = Math.random() > 0.65;
      const item = isIncome ? pick(incomeItems) : pick(expenseItems);
      const amount = isIncome ? randInt(12000, 80000) : randInt(150, 6000);

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
    { category: 'Food',          limit: 12000, spent: 8400  },
    { category: 'Transport',     limit: 4000,  spent: 2800  },
    { category: 'Bills',         limit: 8000,  spent: 7600  },
    { category: 'Shopping',      limit: 10000, spent: 6200  },
    { category: 'Entertainment', limit: 3000,  spent: 2100  },
    { category: 'Health',        limit: 5000,  spent: 1800  },
  ];

  let total = 0;
  for (const month of months) {
    // Slightly vary spent amounts month-to-month
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

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   FinManager — Add Seed Data to Existing Users   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  await signInAdmin();

  const usersToSeed = [
    { email: 'shyampawar@gmail.com',   name: 'Shyam Pawar' },
    { email: 'yashsh6055@gmail.com',   name: 'Yash Sharma' },
  ];

  const months = getLastThreeMonths();
  console.log(`Target months: ${months.join(', ')}\n`);

  for (const user of usersToSeed) {
    console.log(`Looking up ${user.email}...`);
    const uid = await findUserUidByEmail(user.email);
    if (!uid) {
      console.log(`  ⚠ User not found in Firestore: ${user.email}`);
      continue;
    }
    console.log(`  ✓ Found UID: ${uid}`);
    console.log(`  Seeding transactions...`);
    await seedTransactionsForUser(uid, months, 12);
    console.log(`  Seeding budgets...`);
    await seedBudgetsForUser(uid, months);
    console.log('');
  }

  // ── Also create them as employees so they show in admin dashboard ───────────
  // (Authority can see all employees, and their payslips / tasks can be managed)
  console.log('Checking admin user...');
  const adminSnap = await getDocs(
    query(collection(db, 'users'), where('role', 'in', ['admin', 'authority']))
  );
  if (!adminSnap.empty) {
    const authorityUid = adminSnap.docs[0].id;
    console.log(`  ✓ Admin UID: ${authorityUid}`);
    console.log(`\nNote: If you want these users to appear as employees in the admin dashboard,`);
    console.log(`add them manually via the web app (“Add Employee” screen), or update`);
    console.log(`their role from “regular” to “employee” in Firestore.\n`);
  } else {
    console.log('  ⚠ No admin user found. Skipping employee tip.\n');
  }

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   ✓  Seed data added successfully!               ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌ Seed failed:', e.message ?? e);
  process.exit(1);
});
