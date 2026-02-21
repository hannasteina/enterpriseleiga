'use client';

import { useState, useCallback } from 'react';
import {
  verkefni as initialVerkefni,
  type Verkefni,
  type Forgangur,
  type ChecklistItem,
  type Athugasemd,
  type VerkefniNotification,
  getNotandiByNafn,
} from '@/lib/enterprise-demo-data';

let globalIdCounter = 100;
function nextId(prefix: string) {
  globalIdCounter++;
  return `${prefix}${globalIdCounter}`;
}

export function useVerkefniStore() {
  const [verkefniList, setVerkefniList] = useState<Verkefni[]>(initialVerkefni);
  const [notifications, setNotifications] = useState<VerkefniNotification[]>([]);

  const getVerkefniById = useCallback(
    (id: string) => verkefniList.find((v) => v.id === id),
    [verkefniList]
  );

  const updateVerkefniStatus = useCallback(
    (id: string, status: Verkefni['status']) => {
      setVerkefniList((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status } : v))
      );
    },
    []
  );

  const updateVerkefniForgangur = useCallback(
    (id: string, forgangur: Forgangur) => {
      setVerkefniList((prev) =>
        prev.map((v) => (v.id === id ? { ...v, forgangur } : v))
      );
    },
    []
  );

  const addChecklistItem = useCallback((verkefniId: string, texti: string) => {
    const newItem: ChecklistItem = {
      id: nextId('cl'),
      texti,
      lokid: false,
    };
    setVerkefniList((prev) =>
      prev.map((v) =>
        v.id === verkefniId
          ? { ...v, checklist: [...v.checklist, newItem] }
          : v
      )
    );
  }, []);

  const toggleChecklistItem = useCallback(
    (verkefniId: string, itemId: string, userName: string) => {
      setVerkefniList((prev) =>
        prev.map((v) =>
          v.id === verkefniId
            ? {
                ...v,
                checklist: v.checklist.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        lokid: !item.lokid,
                        lokadAf: !item.lokid ? userName : undefined,
                      }
                    : item
                ),
              }
            : v
        )
      );
    },
    []
  );

  const removeChecklistItem = useCallback(
    (verkefniId: string, itemId: string) => {
      setVerkefniList((prev) =>
        prev.map((v) =>
          v.id === verkefniId
            ? { ...v, checklist: v.checklist.filter((item) => item.id !== itemId) }
            : v
        )
      );
    },
    []
  );

  const addVerkefni = useCallback(
    (data: Omit<Verkefni, 'id' | 'checklist'>) => {
      const newV: Verkefni = {
        ...data,
        id: nextId('v'),
        checklist: [],
      };
      setVerkefniList((prev) => [newV, ...prev]);
      return newV;
    },
    []
  );

  const updateChecklistDeadline = useCallback(
    (verkefniId: string, itemId: string, deadline: string | undefined) => {
      setVerkefniList((prev) =>
        prev.map((v) =>
          v.id === verkefniId
            ? {
                ...v,
                checklist: v.checklist.map((item) =>
                  item.id === itemId ? { ...item, deadline } : item
                ),
              }
            : v
        )
      );
    },
    []
  );

  const assignChecklistItem = useCallback(
    (verkefniId: string, itemId: string, uthlutadA: string | undefined, skilabod?: string) => {
      setVerkefniList((prev) =>
        prev.map((v) =>
          v.id === verkefniId
            ? {
                ...v,
                checklist: v.checklist.map((item) =>
                  item.id === itemId ? { ...item, uthlutadA, skilabod } : item
                ),
              }
            : v
        )
      );
    },
    []
  );

  const addAthugasemd = useCallback(
    (verkefniId: string, texti: string, hofundur: string) => {
      const newComment: Athugasemd = {
        id: nextId('ath'),
        texti,
        hofundur,
        dagsetning: new Date().toISOString(),
      };
      setVerkefniList((prev) =>
        prev.map((v) =>
          v.id === verkefniId
            ? { ...v, athugasemdir: [...(v.athugasemdir || []), newComment] }
            : v
        )
      );
    },
    []
  );

  const removeAthugasemd = useCallback(
    (verkefniId: string, athugasemdId: string) => {
      setVerkefniList((prev) =>
        prev.map((v) =>
          v.id === verkefniId
            ? { ...v, athugasemdir: (v.athugasemdir || []).filter((a) => a.id !== athugasemdId) }
            : v
        )
      );
    },
    []
  );

  const assignVerkefni = useCallback(
    (verkefniId: string, nafn: string) => {
      setVerkefniList((prev) =>
        prev.map((v) =>
          v.id === verkefniId ? { ...v, abyrgdaradili: nafn } : v
        )
      );
    },
    []
  );

  const addNotification = useCallback(
    (notification: Omit<VerkefniNotification, 'id' | 'dagsetning' | 'lesid'>) => {
      const newNotif: VerkefniNotification = {
        ...notification,
        id: nextId('notif'),
        dagsetning: new Date().toISOString(),
        lesid: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      return newNotif;
    },
    []
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lesid: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lesid: true })));
  }, []);

  const getUnreadCount = useCallback(
    () => notifications.filter((n) => !n.lesid).length,
    [notifications]
  );

  return {
    verkefniList,
    notifications,
    getVerkefniById,
    updateVerkefniStatus,
    updateVerkefniForgangur,
    addVerkefni,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    updateChecklistDeadline,
    assignChecklistItem,
    addAthugasemd,
    removeAthugasemd,
    assignVerkefni,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
    getNotandiByNafn,
  };
}

export type VerkefniStore = ReturnType<typeof useVerkefniStore>;
