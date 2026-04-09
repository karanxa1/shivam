# Firebase Setup Guide

This directory contains Firebase configuration and setup scripts for the Financial Management System.

## 📁 Files

- `firestore.rules` - Security rules for Firestore database
- `create-admin.js` - Script to create the first authority user
- `seed-data.js` - Script to populate database with test data
- `package.json` - Node.js dependencies for scripts

## 🔥 Firebase Project Setup

### Step 1: Create Firebase Project (if not already done)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select your existing project
3. Follow the setup wizard

### Step 2: Enable Required Services

1. **Authentication**
   - Go to "Authentication" in Firebase Console
   - Click "Get Started"
   - Enable "Email/Password" sign-in method

2. **Firestore Database**
   - Go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in production mode" (we'll deploy custom rules)
   - Select your preferred region

3. **Get Firebase Config**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click "Add app" → Web (</>) icon
   - Register your app with a nickname
   - Copy the Firebase configuration object

### Step 3: Deploy Firestore Security Rules

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (run from project root)
firebase init firestore

# When prompted:
# - Select your Firebase project
# - For Firestore rules file, enter: firebase/firestore.rules
# - For Firestore indexes file, press Enter (use default)

# Deploy the security rules
firebase deploy --only firestore:rules
```

**Alternative (Manual Deployment):**
1. Go to Firestore Database → Rules in Firebase Console
2. Copy the contents of `firestore.rules`
3. Paste into the rules editor
4. Click "Publish"

## 🚀 Running Setup Scripts

### Prerequisites

Install dependencies first:

```bash
cd firebase
npm install
```

### Create Authority User

Run this script **once** to create your first authority user:

```bash
npm run create-admin
```

You'll be prompted to enter:
- Firebase configuration (API key, project ID, etc.)
- Admin email
- Admin password (minimum 6 characters)
- Admin name

The script will:
- Create a user in Firebase Authentication
- Add a user document in Firestore with `role: "authority"`

**Example:**
```
Email: admin@company.com
Password: admin123
Name: Company Admin
```

### Seed Test Data

Run this script to populate your database with dummy data for testing:

```bash
npm run seed-data
```

This will create:
- **2 Regular users** with transactions and budgets
  - `user1@test.com` / `password123`
  - `user2@test.com` / `password123`

- **5 Employees** with tasks and payslips
  - `employee1@company.com` / `password123`
  - `employee2@company.com` / `password123`
  - `employee3@company.com` / `password123`
  - `employee4@company.com` / `password123`
  - `employee5@company.com` / `password123`

- **Projects** with KPI tracking
- **Tasks** assigned to employees
- **Payslips** for current and previous month

## 🔐 Security Rules Overview

The Firestore security rules enforce role-based access:

| Collection | Regular User | Employee | Authority |
|------------|--------------|----------|-----------|
| `users` | Own document only | Own document only | Read all |
| `transactions` | Own transactions | ❌ | Read all |
| `budgets` | Own budgets | ❌ | Read all |
| `employees` | ❌ | Read own record | Full access |
| `projects` | ❌ | Read only | Full access |
| `tasks` | ❌ | Read/update own tasks | Full access |
| `payslips` | ❌ | Read own payslips | Full access |

## 📱 Connecting Apps to Firebase

### Flutter App

You'll need to:
1. Add Firebase to your Flutter project using FlutterFire CLI:
   ```bash
   firebase login
   flutterfire configure
   ```

2. Or manually add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

### React Web App

Create a `firebase.js` file in your React app:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## 🛠️ Troubleshooting

### "Permission denied" errors
- Ensure you've deployed the security rules
- Check that the user's `role` field in Firestore is correct
- Verify the user is authenticated

### "User already exists" when creating admin
- If you get this error, manually update the user's role in Firestore:
  1. Go to Firestore Database in Firebase Console
  2. Find the user in the `users` collection
  3. Edit the document and change `role` to `"authority"`

### Scripts not running
- Ensure you're using Node.js v16 or higher
- Run `npm install` in the `firebase` directory
- Check that you've entered the correct Firebase configuration

## 📊 Database Structure

```
Firestore
├── users/{uid}
│   ├── name: string
│   ├── email: string
│   ├── role: "regular" | "authority" | "employee"
│   ├── createdAt: timestamp
│   └── avatarUrl: string
│
├── transactions/{txnId}
│   ├── userId: string
│   ├── title: string
│   ├── amount: number
│   ├── type: "income" | "expense"
│   ├── category: string
│   ├── date: timestamp
│   └── note: string
│
├── budgets/{budgetId}
│   ├── userId: string
│   ├── category: string
│   ├── limit: number
│   ├── spent: number
│   └── month: string
│
├── employees/{empId}
│   ├── uid: string
│   ├── name: string
│   ├── email: string
│   ├── department: string
│   ├── salary: number
│   └── overtimeHours: number
│
├── projects/{projectId}
│   ├── title: string
│   ├── status: "active" | "completed" | "pending"
│   ├── kpiPercent: number
│   ├── assignedEmployeeIds: array
│   ├── deadline: timestamp
│   └── createdBy: uid
│
├── tasks/{taskId}
│   ├── employeeId: string
│   ├── title: string
│   ├── status: "pending" | "in-progress" | "done"
│   ├── dueDate: timestamp
│   └── projectId: string
│
└── payslips/{payslipId}
    ├── employeeId: string
    ├── month: string
    ├── basicSalary: number
    ├── overtimePay: number
    ├── deductions: number
    ├── netPay: number
    └── generatedAt: timestamp
```

## 🎯 Next Steps

1. ✅ Deploy Firestore security rules
2. ✅ Run `create-admin.js` to create authority user
3. ✅ Run `seed-data.js` to populate test data
4. 📱 Configure Firebase in Flutter app
5. 🌐 Configure Firebase in React app
6. 🚀 Start developing!

## 📞 Support

If you encounter any issues:
1. Check the Firebase Console for errors
2. Verify authentication is enabled
3. Ensure Firestore is created and rules are deployed
4. Check that you're using the correct Firebase config in both apps
