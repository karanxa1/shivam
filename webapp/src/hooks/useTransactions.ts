import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Transaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export type CreateTransactionData = Omit<Transaction, 'id' | 'userId' | 'createdAt'>;

export function useTransactions() {
  const { appUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', appUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Transaction[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Transaction));
        setTransactions(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser]);

  const addTransaction = async (data: CreateTransactionData) => {
    if (!appUser) throw new Error('Not authenticated');
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...data,
      userId: appUser.uid,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    await updateDoc(doc(db, 'transactions', id), data as Record<string, unknown>);
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  return { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction };
}
