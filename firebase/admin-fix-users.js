/**
 * Admin script — force-update passwords + Firestore roles
 * Uses Firebase Admin SDK (no current password needed)
 *
 * Usage: node admin-fix-users.js
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account JSON
 * OR set the serviceAccount path below directly.
 *
 * To get service account:
 *   Firebase Console → Project Settings → Service accounts → Generate new private key
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

// ── Try to load service account ───────────────────────────────────────────────
const SA_PATHS = [
  './service-account.json',
  './serviceAccount.json',
  './firebase-adminsdk.json',
];

let serviceAccount = null;
for (const p of SA_PATHS) {
  if (existsSync(p)) {
    serviceAccount = JSON.parse(readFileSync(p, 'utf8'));
    console.log(`✓ Loaded service account from ${p}`);
    break;
  }
}

if (!serviceAccount) {
  console.error(`
❌  Service account file not found.

To use this script:
  1. Go to Firebase Console → Project Settings → Service accounts
  2. Click "Generate new private key"
  3. Save the downloaded JSON as:  firebase/service-account.json
  4. Run this script again: node admin-fix-users.js

Alternatively, reset passwords manually in Firebase Console:
  Authentication → Users → find the email → ⋮ → Reset password
`);
  process.exit(1);
}

// ── Init Admin ────────────────────────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const adminAuth = getAuth();
const adminDb = getFirestore();

const NEW_PASSWORD = 'karan@1234';

const users = [
  { email: 'karanravirajput@gmail.com', name: 'Karan Ravi Rajput', role: 'authority' },
  { email: 'karanrajputxa@gmail.com',   name: 'Karan Rajput',      role: 'regular'   },
  { email: 'datemenot1234@gmail.com',   name: 'Date Me Not',       role: 'regular'   },
];

async function fixUser({ email, name, role }) {
  try {
    // Look up user by email
    const user = await adminAuth.getUserByEmail(email);

    // Force-set password
    await adminAuth.updateUser(user.uid, { password: NEW_PASSWORD });

    // Upsert Firestore doc
    await adminDb.collection('users').doc(user.uid).set({
      name,
      email,
      role,
      createdAt: new Date(),
      avatarUrl: '',
    }, { merge: true });

    console.log(`  ✓ [${role.padEnd(9)}] ${email}  →  ${user.uid}`);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      // Create fresh
      const created = await adminAuth.createUser({ email, password: NEW_PASSWORD, displayName: name });
      await adminDb.collection('users').doc(created.uid).set({
        name, email, role, createdAt: new Date(), avatarUrl: '',
      });
      console.log(`  ✓ [${role.padEnd(9)}] ${email}  →  ${created.uid}  (created)`);
    } else {
      console.error(`  ✗ ${email}: ${e.message}`);
    }
  }
}

console.log('\n Updating users via Admin SDK...\n');
for (const u of users) await fixUser(u);

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║  ✓  All users updated                            ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log('\n  karanravirajput@gmail.com  →  authority  /  karan@1234');
console.log('  karanrajputxa@gmail.com    →  regular    /  karan@1234');
console.log('  datemenot1234@gmail.com    →  regular    /  karan@1234\n');
process.exit(0);
