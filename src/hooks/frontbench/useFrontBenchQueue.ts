import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FrontBenchStore } from '../../services/local/frontbench.store';
import type { QueueItem, QueueStatus } from '../../types/frontbench.types';

const dateKey = (d: Date) => d.toISOString().slice(0, 10);

export const useFrontBenchQueue = (clinicId: number) => {
  const [version, setVersion] = useState(0);

  const queue = useMemo(() => {
    void version;
    return FrontBenchStore.getQueue().filter((q) => q.clinicId === clinicId);
  }, [clinicId, version]);

  const addWalkIn = useCallback(
    (doctorId: string, patientMrn: string, opts?: { priority?: number; room?: string }) => {
      const dayIso = dateKey(new Date());
      const created = FrontBenchStore.createQueueItem({
        clinicId,
        doctorId,
        patientMrn,
        status: 'waiting',
        priority: opts?.priority ?? 50,
        room: opts?.room,
        dayIso,
      });
      setVersion((v) => v + 1);
      toast.success(`Token generated: ${created.token}`);
      return created;
    },
    [clinicId]
  );

  const updateStatus = useCallback((id: string, status: QueueStatus) => {
    const updated = FrontBenchStore.updateQueueItem(id, { status });
    if (!updated) return;
    setVersion((v) => v + 1);
  }, []);

  const overridePriority = useCallback((id: string, priority: number) => {
    const updated = FrontBenchStore.updateQueueItem(id, { priority });
    if (!updated) return;
    setVersion((v) => v + 1);
    toast.success('Priority updated');
  }, []);

  const assignRoom = useCallback((id: string, room: string) => {
    const updated = FrontBenchStore.updateQueueItem(id, { room });
    if (!updated) return;
    setVersion((v) => v + 1);
    toast.success('Room updated');
  }, []);

  const sendMessage = useCallback((token: string, channel: 'sms' | 'whatsapp') => {
    toast.success(`${channel.toUpperCase()} queued for token ${token}`);
  }, []);

  const getLiveQueue = useCallback(
    (doctorId?: string) => {
      const items = queue.filter((q) => q.status !== 'done' && q.status !== 'skipped');
      const filtered = doctorId ? items.filter((q) => q.doctorId === doctorId) : items;
      return [...filtered].sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt));
    },
    [queue]
  );

  return {
    queue,
    addWalkIn,
    updateStatus,
    overridePriority,
    assignRoom,
    sendMessage,
    getLiveQueue,
    refresh: () => setVersion((v) => v + 1),
  };
};

