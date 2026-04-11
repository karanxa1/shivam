import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCACLPAwmqTHtzmMQ05K1JA1BkL9VMngqg",
  authDomain: "nessbid-1.firebaseapp.com",
  projectId: "nessbid-1",
  storageBucket: "nessbid-1.firebasestorage.app",
  messagingSenderId: "763480870514",
  appId: "1:763480870514:web:dc0e4b17886f4d0ab1bceb",
  measurementId: "G-NS14KP5KYV"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Persist auth across page refreshes (stored in localStorage)
setPersistence(auth, browserLocalPersistence).catch(console.error);

/**
 * Creates a Firebase Auth account for a new employee using the REST API
 * directly, so the admin's session is not affected.
 * Returns the new user's UID.
 */
export async function createEmployeeAccount(
  name: string,
  email: string,
  password: string
): Promise<string> {
  // Step 1: Create the auth account via REST API (doesn't touch the current SDK session)
  const signUpRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        displayName: name,
        returnSecureToken: true,
      }),
    }
  );

  if (!signUpRes.ok) {
    const err = await signUpRes.json();
    const code = err?.error?.message || 'UNKNOWN_ERROR';
    if (code === 'EMAIL_EXISTS') {
      throw new Error('An account with this email already exists');
    }
    if (code === 'WEAK_PASSWORD : Password should be at least 6 characters') {
      throw new Error('Password must be at least 6 characters');
    }
    throw new Error(code);
  }

  const data = await signUpRes.json();
  const uid = data.localId as string;

  // Step 2: Set the display name via REST API
  await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: data.idToken,
        displayName: name,
        returnSecureToken: false,
      }),
    }
  );

  // Step 3: Create the Firestore user document
  await setDoc(doc(db, 'users', uid), {
    email,
    name,
    role: 'employee',
    createdAt: Timestamp.now(),
  });

  return uid;
}

export default app;
