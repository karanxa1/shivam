import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Budget } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export type SaveBudgetData = Omit<Budget, 'id' | 'userId' | 'createdAt'>;

export function useBudgets(month?: string) {
  const { appUser } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    const constraints: QueryConstraint[] = [where('userId', '==', appUser.uid)];
    if (month) {
      constraints.push(where('month', '==', month));
    }

    const q = query(collection(db, 'budgets'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Budget[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Budget));
        setBudgets(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching budgets:', err);
        setError('Failed to load budgets');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser, month]);

  const saveBudget = async (data: SaveBudgetData) => {
    if (!appUser) throw new Error('Not authenticated');
    const docRef = await addDoc(collection(db, 'budgets'), {
      ...data,
      userId: appUser.uid,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  };

  const deleteBudget = async (id: string) => {
    await deleteDoc(doc(db, 'budgets', id));
  };

  return { budgets, loading, error, saveBudget, deleteBudget };
}
