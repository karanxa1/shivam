import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  Timestamp,
  type QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { isManagementRole } from '@/lib/utils';
import type { Payslip, Employee } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from './useNotifications';

const OVERTIME_RATE = 250; // ₹250 per overtime hour

export function usePayslips(employeeId?: string, month?: string) {
  const { appUser } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setPayslips([]);
      setLoading(false);
      return;
    }

    const isManagement = isManagementRole(appUser.role);
    const constraints: QueryConstraint[] = isManagement
      ? [orderBy('generatedAt', 'desc')]
      : [where('generatedBy', '==', appUser.uid), orderBy('generatedAt', 'desc')];

    if (employeeId) {
      constraints.unshift(where('employeeId', '==', employeeId));
    }

    if (month) {
      constraints.unshift(where('month', '==', month));
    }

    const q = query(collection(db, 'payslips'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const payslipList: Payslip[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Payslip));
        setPayslips(payslipList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching payslips:', err);
        setError('Failed to load payslips');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser, employeeId, month]);

  const generatePayslip = async (employee: Employee, month: string, deductions: number = 0) => {
    if (!appUser) throw new Error('Not authenticated');

    const overtimePay = employee.overtimeHours * OVERTIME_RATE;
    const totalEarnings = employee.salary + overtimePay;
    const netPay = totalEarnings - deductions;

    const payslipData: Omit<Payslip, 'id'> = {
      employeeId: employee.id,
      month,
      basicSalary: employee.salary,
      overtimePay,
      deductions,
      netPay,
      generatedAt: Timestamp.now(),
      generatedBy: appUser.uid,
    };

    const docRef = await addDoc(collection(db, 'payslips'), payslipData);

    // Create notification for employee if they have a uid
    if (employee.uid) {
      await createNotification(
        db,
        employee.uid,
        'payslip_generated',
        'Payslip Generated',
        `Your payslip for ${month} has been generated. Net pay: ₹${netPay.toLocaleString('en-IN')}`
      );
    }

    return docRef.id;
  };

  return {
    payslips,
    loading,
    error,
    generatePayslip,
  };
}

export function useEmployeePayslips(employeeId: string | null) {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setPayslips([]);
      setLoading(false);
      return;
    }

    const constraints: QueryConstraint[] = [
      where('employeeId', '==', employeeId),
      orderBy('generatedAt', 'desc')
    ];

    const q = query(collection(db, 'payslips'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const payslipList: Payslip[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Payslip));
        setPayslips(payslipList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching employee payslips:', err);
        setError('Failed to load payslips');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [employeeId]);

  return { payslips, loading, error };
}
