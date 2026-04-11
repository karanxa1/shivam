import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  type User
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { AppUser } from '@/types';

import type { UserRole } from '@/types';

interface AuthContextType {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isHR: boolean;
  isEmployee: boolean;
  isRegular: boolean;
  /** Admin or HR - has access to management portal */
  isManagement: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to Firebase auth state + handle redirect result
  useEffect(() => {
    // Handle redirect result (from signInWithRedirect)
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const uid = result.user.uid;
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (!userDoc.exists()) {
            await firebaseSignOut(auth);
            setError('User profile not found.');
          }
          // All roles allowed — no further check needed
        }
      } catch (err) {
        console.error('Redirect result error:', err);
        if (err instanceof Error && !err.message.includes('cancelled')) {
          setError(err.message);
        }
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (!user) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      // Fetch user document from Firestore
      try {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Set up real-time listener for user document
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as Omit<AppUser, 'id' | 'uid'>;
            setAppUser({
              id: docSnap.id,
              uid: docSnap.id,
              ...userData,
            });
          } else {
            setError('User profile not found');
            setAppUser(null);
          }
          setLoading(false);
        }, (err) => {
          console.error('Error fetching user:', err);
          setError('Failed to load user profile');
          setLoading(false);
        });

        return () => unsubscribeUser();
      } catch (err) {
        console.error('Error setting up user listener:', err);
        setError('Failed to load user profile');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (!userDoc.exists()) {
        await firebaseSignOut(auth);
        throw new Error('User profile not found');
      }
      // All roles allowed — admin, hr, regular, employee
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      let userCredential;
      try {
        userCredential = await signInWithPopup(auth, provider);
      } catch (popupErr: unknown) {
        const code = (popupErr as { code?: string })?.code;
        if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }

      const uid = userCredential.user.uid;
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (!userDoc.exists()) {
        // Brand-new Google user — create as regular by default
        await setDoc(doc(db, 'users', uid), {
          email: userCredential.user.email,
          name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
          role: 'regular',
          createdAt: Timestamp.now(),
        });
        // Regular users are allowed — let onAuthStateChanged handle the rest
        return;
      }

      // All roles allowed — let onAuthStateChanged handle the rest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setError(null);
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        name,
        role,
        createdAt: Timestamp.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(errorMessage);
      throw err;
    }
  };

  const updateDisplayName = async (name: string) => {
    if (!auth.currentUser || !appUser) throw new Error('Not authenticated');
    await updateProfile(auth.currentUser, { displayName: name });
    await updateDoc(doc(db, 'users', appUser.uid), { name });
  };

  const updatePassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    await firebaseUpdatePassword(auth.currentUser, newPassword);
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setAppUser(null);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      throw err;
    }
  };

  const isAdmin = appUser?.role === 'admin' || appUser?.role === ('authority' as UserRole);
  const isHR = appUser?.role === 'hr';
  const isEmployee = appUser?.role === 'employee';
  const isRegular = appUser?.role === 'regular';
  const isManagement = isAdmin || isHR;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        loading,
        error,
        signIn,
        signInWithGoogle,
        register,
        resetPassword,
        updateDisplayName,
        updatePassword,
        signOut,
        isAdmin,
        isHR,
        isEmployee,
        isRegular,
        isManagement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
