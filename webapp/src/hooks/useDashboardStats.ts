import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { isManagementRole } from '@/lib/utils';
import { db } from '@/lib/firebase/config';
import type { DashboardStats } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useDashboardStats() {
  const { appUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeProjects: 0,
    pendingTasks: 0,
    totalPayroll: 0,
    totalPayslips: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    const isManagement = isManagementRole(appUser.role);

    // Count employees
    const employeesQuery = isManagement
      ? query(collection(db, 'employees'))
      : query(collection(db, 'employees'), where('createdBy', '==', appUser.uid));

    unsubscribes.push(
      onSnapshot(employeesQuery, (snapshot) => {
        const totalSalary = snapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.salary || 0);
        }, 0);

        setStats((prev) => ({
          ...prev,
          totalEmployees: snapshot.size,
          totalPayroll: totalSalary,
        }));
      }, (err) => {
        console.error('Error fetching employees stats:', err);
        setError('Failed to load employee stats');
      })
    );

    // Count active projects
    const projectsQuery = isManagement
      ? query(collection(db, 'projects'), where('status', '==', 'active'))
      : query(collection(db, 'projects'), where('createdBy', '==', appUser.uid), where('status', '==', 'active'));
    
    unsubscribes.push(
      onSnapshot(projectsQuery, (snapshot) => {
        setStats((prev) => ({
          ...prev,
          activeProjects: snapshot.size,
        }));
      }, (err) => {
        console.error('Error fetching projects stats:', err);
      })
    );

    // Count pending tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('status', '==', 'pending')
    );
    
    unsubscribes.push(
      onSnapshot(tasksQuery, (snapshot) => {
        setStats((prev) => ({
          ...prev,
          pendingTasks: snapshot.size,
        }));
        setLoading(false);
      }, (err) => {
        console.error('Error fetching tasks stats:', err);
        setLoading(false);
      })
    );

    // Count payslips (for HR dashboard)
    const payslipsQuery = query(collection(db, 'payslips'));
    unsubscribes.push(
      onSnapshot(payslipsQuery, (snapshot) => {
        setStats((prev) => ({
          ...prev,
          totalPayslips: snapshot.size,
        }));
      }, (err) => {
        console.error('Error fetching payslips stats:', err);
      })
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [appUser]);

  return { stats, loading, error };
}
