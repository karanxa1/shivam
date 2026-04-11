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
  getDoc,
  Timestamp,
  type QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Task, CreateTask, TaskStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from './useNotifications';

export function useTasks(projectId?: string, employeeId?: string, status?: TaskStatus) {
  const { appUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const constraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc')
    ];

    if (projectId) {
      constraints.unshift(where('projectId', '==', projectId));
    }

    if (employeeId) {
      constraints.unshift(where('employeeId', '==', employeeId));
    }

    if (status) {
      constraints.unshift(where('status', '==', status));
    }

    const q = query(collection(db, 'tasks'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const taskList: Task[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Task));
        setTasks(taskList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser, projectId, employeeId, status]);

  const addTask = async (data: CreateTask) => {
    const taskData = {
      ...data,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'tasks'), taskData);

    // Notify the assigned employee
    if (data.employeeId) {
      try {
        const empDoc = await getDoc(doc(db, 'employees', data.employeeId));
        if (empDoc.exists()) {
          const empData = empDoc.data();
          const targetUid = empData?.uid as string | undefined;
          if (targetUid) {
            await createNotification(
              db,
              targetUid,
              'task_assigned',
              'New Task Assigned',
              `You have been assigned a new task: "${data.title}"`
            );
          }
        }
      } catch (err) {
        console.error('Error sending task notification:', err);
      }
    }

    return docRef.id;
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, data);
  };

  const deleteTask = async (id: string) => {
    const taskRef = doc(db, 'tasks', id);
    await deleteDoc(taskRef);
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
  };
}

export function useProjectTasks(projectId: string | null) {
  return useTasks(projectId || undefined);
}
