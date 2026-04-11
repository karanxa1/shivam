# FinManager — Financial Management System

A cross-platform financial management system with role-based access control, built with Flutter (mobile), React (web portal), and Firebase.

---

## Architecture Overview

```
finmanager/
├── flutter_app/     # Flutter mobile app (iOS & Android)
├── webapp/          # React web portal (Authority dashboard)
└── firebase/        # Firestore rules, setup & seed scripts
```

### User Roles

| Role | Platform | Access |
|------|----------|--------|
| **Authority** | Web + Mobile | Full admin — employees, projects, tasks, payslips, reports |
| **Regular** | Mobile only | Personal finance — transactions & budgets |
| **Employee** | Mobile only | Own tasks, payslips, and project assignments |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18+ |
| Flutter | 3.10+ (Dart SDK ^3.10.0) |
| Firebase CLI | Latest (`npm install -g firebase-tools`) |
| Android Studio / Xcode | For mobile builds |

---

## 1. Firebase Setup

### 1.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable these services:
   - **Authentication** → Email/Password + Google Sign-In
   - **Firestore Database** → Start in production mode

### 1.2 Get Firebase Config

Go to **Project Settings → Your apps → Web app** and copy the config object. You'll need it for the webapp and the setup scripts.

### 1.3 Deploy Firestore Security Rules

```bash
# Login to Firebase CLI
firebase login

# From the project root, deploy rules
firebase deploy --only firestore:rules
```

Or manually paste `firebase/firestore.rules` into the Firestore Rules editor in the console.

### 1.4 Install Firebase Script Dependencies

```bash
cd firebase
npm install
```

### 1.5 Create the First Authority User

Run this once to create your admin account:

```bash
npm run create-admin
```

You'll be prompted for your Firebase config values and the admin credentials (name, email, password).

### 1.6 Seed Test Data (Optional)

Populates the database with demo users, employees, projects, tasks, and payslips:

```bash
npm run seed-data
```

**Seeded credentials:**

| Role | Email | Password |
|------|-------|----------|
| Authority | admin@finmanager.com | Admin@123 |
| Regular | rajesh@personal.com | User@123 |
| Regular | anjali@personal.com | User@123 |
| Employee | rahul@company.com | Emp@123 |
| Employee | priya@company.com | Emp@123 |
| Employee | amit@company.com | Emp@123 |
| Employee | sneha@company.com | Emp@123 |
| Employee | vikram@company.com | Emp@123 |

---

## 2. Web App Setup

The web portal is for **Authority users only**.

### 2.1 Configure Firebase

Create `webapp/src/lib/firebase/config.ts` with your Firebase project values:

```ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 2.2 Install Dependencies & Run

```bash
cd webapp
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

### 2.3 Build for Production

```bash
npm run build
```

Output goes to `webapp/dist/`.

### Web App Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4 + shadcn/ui
- React Router v7
- Recharts (analytics)
- Firebase SDK v12
- Sonner (toasts)

### Web App Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — stats, recent projects & employees |
| `/employees` | Employee list & profiles |
| `/projects` | Project management with KPI tracking |
| `/tasks` | Task board |
| `/payslips` | Payslip generation & management |
| `/reports` | Analytics charts (payroll, tasks, departments) |
| `/notifications` | Notification center |
| `/settings` | Account settings |
| `/personal` | Personal finance (regular users only) |

---

## 3. Flutter App Setup

The mobile app serves all three user roles — it routes to the correct portal based on the user's Firestore role.

### 3.1 Configure Firebase for Flutter

#### Option A — FlutterFire CLI (recommended)

```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# From the flutter_app directory
cd flutter_app
flutterfire configure
```

Select your Firebase project when prompted. This auto-generates `lib/firebase_options.dart` and places `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) in the correct locations.

#### Option B — Manual

1. Download `google-services.json` from Firebase Console → Project Settings → Android app
2. Place it at `flutter_app/android/app/google-services.json`
3. Download `GoogleService-Info.plist` for iOS
4. Place it at `flutter_app/ios/Runner/GoogleService-Info.plist`
5. Update `flutter_app/lib/firebase_options.dart` with your config values

### 3.2 Install Dependencies

```bash
cd flutter_app
flutter pub get
```

### 3.3 Run the App

```bash
# List available devices
flutter devices

# Run on a specific device
flutter run -d <device-id>

# Run in debug mode (default)
flutter run
```

### 3.4 Build for Release

```bash
# Android APK
flutter build apk --release

# Android App Bundle (for Play Store)
flutter build appbundle --release

# iOS (requires macOS + Xcode)
flutter build ios --release
```

### Flutter App Tech Stack

| Package | Purpose |
|---------|---------|
| firebase_core / firebase_auth / cloud_firestore | Firebase integration |
| provider | State management |
| go_router | Navigation |
| fl_chart | Charts & graphs |
| hive + hive_flutter | Local storage / offline support |
| google_sign_in | Google authentication |
| flutter_local_notifications | Push notifications |
| share_plus + csv | Export payslips as CSV |
| intl | Date/currency formatting |

### Flutter App Screens by Role

**Authority**
- Dashboard with org stats
- Employee management
- Project & task management
- Payslip generation
- Reports & analytics

**Regular User**
- Personal finance dashboard
- Transaction tracking (income/expense)
- Budget management by category

**Employee**
- Personal dashboard
- Assigned tasks (with status updates)
- Own payslip history

---

## 4. Database Structure

```
Firestore
├── users/{uid}
│   ├── name, email, role, createdAt, avatarUrl
│
├── transactions/{id}
│   ├── userId, title, amount, type (income|expense)
│   ├── category, date, note
│
├── budgets/{id}
│   ├── userId, category, limit, spent, month
│
├── employees/{id}
│   ├── uid, name, email, department, salary, overtimeHours
│
├── projects/{id}
│   ├── title, status, kpiPercent, assignedEmployeeIds
│   ├── deadline, createdBy
│
├── tasks/{id}
│   ├── projectId, employeeId, title, status, dueDate
│
├── payslips/{id}
│   ├── employeeId, month, basicSalary, overtimePay
│   ├── deductions, netPay, generatedAt
│
└── notifications/{id}
    ├── targetUid, title, body, type, read, createdAt
```

---

## 5. Security Rules Summary

| Collection | Regular | Employee | Authority |
|------------|---------|----------|-----------|
| users | Own doc | Own doc | Read all |
| transactions | Own only | ❌ | Read all |
| budgets | Own only | ❌ | Read all |
| employees | ❌ | Read own | Full access |
| projects | ❌ | Read only | Full access |
| tasks | ❌ | Read/update own | Full access |
| payslips | ❌ | Read own | Full access |
| notifications | Own only | Own only | Read all |

---

## 6. Firebase Scripts Reference

All scripts live in `firebase/` and require `npm install` first.

| Script | Command | Description |
|--------|---------|-------------|
| Create admin | `npm run create-admin` | Interactive — creates first authority user |
| Seed data | `npm run seed-data` | Populates DB with demo data |
| Add users | `npm run add-users` | Batch user creation |
| Fix users | `npm run fix-users` | Repair user role documents |

---

## 7. Troubleshooting

**"Permission denied" in Firestore**
- Ensure rules are deployed: `firebase deploy --only firestore:rules`
- Verify the user's `role` field in Firestore matches `authority`, `regular`, or `employee`

**Google Sign-In not working on Android**
- Add your SHA-1 fingerprint to Firebase Console → Project Settings → Android app
- Run `cd android && ./gradlew signingReport` to get the debug SHA-1

**Flutter build fails after Firebase config change**
- Run `flutter clean && flutter pub get`

**Seed script fails with "email already in use"**
- The user already exists in Auth. Either delete them in Firebase Console or skip — the script handles this gracefully

**Web app shows blank page after login**
- Check that `webapp/src/lib/firebase/config.ts` has the correct project credentials
- Verify the user document exists in Firestore with a valid `role` field
