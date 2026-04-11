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
  type QueryConstraint
} from 'firebase/firestore';
import { db, createEmployeeAccount } from '@/lib/firebase/config';
import { isManagementRole } from '@/lib/utils';
import type { Employee, CreateEmployee } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useEmployees() {
  const { appUser } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    // Admin and HR see all employees; others see only their own
    const isManagement = isManagementRole(appUser.role);
    const constraints: QueryConstraint[] = isManagement
      ? [orderBy('createdAt', 'desc')]
      : [where('createdBy', '==', appUser.uid), orderBy('createdAt', 'desc')];

    const q = query(collection(db, 'employees'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const employeeList: Employee[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Employee));
        setEmployees(employeeList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching employees:', err);
        setError('Failed to load employees');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser]);

  const addEmployee = async (data: Omit<CreateEmployee, 'createdBy'> & { password?: string }) => {
    if (!appUser) throw new Error('Not authenticated');

    const { password, ...rest } = data;

    // Create a Firebase Auth account for the employee so they can sign in
    let uid = rest.uid || '';
    if (password && rest.email) {
      uid = await createEmployeeAccount(rest.name, rest.email, password);
    }

    const employeeData = {
      ...rest,
      uid,
      createdBy: appUser.uid,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'employees'), employeeData);
    return docRef.id;
  };

  const updateEmployee = async (id: string, data: Partial<Employee>) => {
    const employeeRef = doc(db, 'employees', id);
    await updateDoc(employeeRef, data);
  };

  const deleteEmployee = async (id: string) => {
    const employeeRef = doc(db, 'employees', id);
    await deleteDoc(employeeRef);
  };

  return {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
}

export function useEmployee(employeeId: string | null) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setEmployee(null);
      setLoading(false);
      return;
    }

    const employeeRef = doc(db, 'employees', employeeId);

    const unsubscribe = onSnapshot(
      employeeRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setEmployee({
            id: docSnap.id,
            ...docSnap.data(),
          } as Employee);
        } else {
          setEmployee(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching employee:', err);
        setError('Failed to load employee');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [employeeId]);

  return { employee, loading, error };
}
