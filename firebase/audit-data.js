/**
 * Deep audit of employee data and task/payslip linkage
 * Usage: cd firebase && node audit-data.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyCACLPAwmqTHtzmMQ05K1JA1BkL9VMngqg',
  authDomain: 'nessbid-1.firebaseapp.com',
  projectId: 'nessbid-1',
});
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  await signInWithEmailAndPassword(auth, 'admin@finmanager.com', 'Admin@123');
  console.log('Signed in as admin.\n');

  // All employees
  console.log('═══ EMPLOYEES ═══');
  const empSnap = await getDocs(collection(db, 'employees'));
  const employees = [];
  empSnap.forEach(d => employees.push({ id: d.id, ...d.data() }));
  employees.forEach(e => {
    console.log(`  ${e.id}: ${e.name} (${e.email}) | dept=${e.department} | uid="${e.uid}" | salary=₹${e.salary}`);
  });

  // All payslips
  console.log('\n═══ PAYSLIPS ═══');
  const paySnap = await getDocs(collection(db, 'payslips'));
  const payslips = [];
  paySnap.forEach(d => payslips.push({ id: d.id, ...d.data() }));
  payslips.forEach(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    console.log(`  ${p.id}: month=${p.month} | empId=${p.employeeId} (${emp?.name || '???'}) | net=₹${p.netPay}`);
  });

  // All tasks
  console.log('\n═══ TASKS ═══');
  const taskSnap = await getDocs(collection(db, 'tasks'));
  const tasks = [];
  taskSnap.forEach(d => tasks.push({ id: d.id, ...d.data() }));
  tasks.forEach(t => {
    const emp = employees.find(e => e.id === t.employeeId);
    console.log(`  ${t.id}: "${t.title}" | empId=${t.employeeId} (${emp?.name || '???'}) | status=${t.status}`);
  });

  // Count per employee
  console.log('\n═══ SUMMARY PER EMPLOYEE ═══');
  employees.forEach(e => {
    const pCount = payslips.filter(p => p.employeeId === e.id).length;
    const tCount = tasks.filter(t => t.employeeId === e.id).length;
    console.log(`  ${e.name}: ${pCount} payslip(s), ${tCount} task(s)  ${!e.uid ? '⚠️ NO UID!' : ''}`);
  });

  console.log('\n═══ USERS (Auth) ═══');
  const userSnap = await getDocs(collection(db, 'users'));
  userSnap.forEach(d => {
    console.log(`  ${d.id}: ${d.data().email} | role=${d.data().role} | name=${d.data().name}`);
  });

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
