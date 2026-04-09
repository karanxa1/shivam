/**
 * Create First Authority User Script
 * 
 * This script creates the first "authority" role user in your Firebase project.
 * Run this once after setting up your Firebase project.
 * 
 * Usage:
 *   node create-admin.js
 * 
 * You will be prompted to enter:
 *   - Firebase config (API key, project ID, etc.)
 *   - Admin email
 *   - Admin password (min 6 characters)
 *   - Admin name
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt user
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Helper function to prompt for password (hidden input would be better, but this is simple)
function questionPassword(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    let password = '';
    process.stdin.on('data', function onData(char) {
      char = char.toString();
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // Backspace
          password = password.slice(0, -1);
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(prompt + '*'.repeat(password.length));
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   Firebase Authority User Creation Script');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Get Firebase config
    console.log('Please enter your Firebase configuration:');
    console.log('(You can find this in Firebase Console > Project Settings > Your apps)\n');

    const apiKey = await question('API Key: ');
    const authDomain = await question('Auth Domain: ');
    const projectId = await question('Project ID: ');
    const storageBucket = await question('Storage Bucket: ');
    const messagingSenderId = await question('Messaging Sender ID: ');
    const appId = await question('App ID: ');

    // Firebase configuration
    const firebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    // Initialize Firebase
    console.log('\nInitializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('✓ Firebase initialized successfully\n');

    // Get admin credentials
    console.log('Now, let\'s create the authority user:\n');
    
    const name = await question('Admin Name: ');
    const email = await question('Admin Email: ');
    const password = await questionPassword('Admin Password (min 6 chars): ');

    console.log('\nCreating authority user...');

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    console.log('✓ Auth user created with UID:', user.uid);

    // Create user document in Firestore with "authority" role
    await setDoc(doc(db, 'users', user.uid), {
      name: name.trim(),
      email: email.trim(),
      role: 'authority',
      createdAt: serverTimestamp(),
      avatarUrl: ''
    });

    console.log('✓ User document created in Firestore with "authority" role');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   ✓ SUCCESS!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nAuthority user created successfully!');
    console.log('\nCredentials:');
    console.log('  Email:', email.trim());
    console.log('  Role: authority');
    console.log('  UID:', user.uid);
    console.log('\nYou can now use these credentials to log in to the app.');
    console.log('═══════════════════════════════════════════════════════\n');

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating authority user:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\nThis email is already registered.');
      console.log('To make them an authority, manually update their role in Firestore:');
      console.log('  1. Go to Firebase Console > Firestore Database');
      console.log('  2. Find the user document in the "users" collection');
      console.log('  3. Change the "role" field to "authority"');
    } else if (error.code === 'auth/weak-password') {
      console.log('\nPassword is too weak. Please use at least 6 characters.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('\nInvalid email format. Please use a valid email address.');
    }
    
    rl.close();
    process.exit(1);
  }
}

main();
