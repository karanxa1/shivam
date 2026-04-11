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
import { db } from '@/lib/firebase/config';
import { isManagementRole } from '@/lib/utils';
import type { Project, CreateProject, ProjectStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useProjects(status?: ProjectStatus) {
  const { appUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const isManagement = isManagementRole(appUser.role);
    const constraints: QueryConstraint[] = isManagement
      ? [orderBy('createdAt', 'desc')]
      : [where('createdBy', '==', appUser.uid), orderBy('createdAt', 'desc')];

    if (status) {
      constraints.unshift(where('status', '==', status));
    }

    const q = query(collection(db, 'projects'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const projectList: Project[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Project));
        setProjects(projectList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser, status]);

  const addProject = async (data: Omit<CreateProject, 'createdBy'>) => {
    if (!appUser) throw new Error('Not authenticated');

    const projectData = {
      ...data,
      createdBy: appUser.uid,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'projects'), projectData);
    return docRef.id;
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    const projectRef = doc(db, 'projects', id);
    await updateDoc(projectRef, data);
  };

  const deleteProject = async (id: string) => {
    const projectRef = doc(db, 'projects', id);
    await deleteDoc(projectRef);
  };

  return {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
  };
}

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    const projectRef = doc(db, 'projects', projectId);

    const unsubscribe = onSnapshot(
      projectRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProject({
            id: docSnap.id,
            ...docSnap.data(),
          } as Project);
        } else {
          setProject(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  return { project, loading, error };
}
