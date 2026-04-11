import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
  getDocs,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Notification, NotificationType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useNotifications() {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('targetUid', '==', appUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Notification[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Notification));
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notifications:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [appUser]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!appUser) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('targetUid', '==', appUser.uid),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead };
}

export async function createNotification(
  database: Firestore,
  targetUid: string,
  type: NotificationType,
  title: string,
  body: string
): Promise<void> {
  try {
    await addDoc(collection(database, 'notifications'), {
      targetUid,
      type,
      title,
      body,
      read: false,
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}
