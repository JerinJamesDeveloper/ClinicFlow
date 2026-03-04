import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FrontBenchStore } from '../../services/local/frontbench.store';
import type { AppointmentCRM, BlockedSlot, DoctorCRM, WaitlistEntry } from '../../types/frontbench.types';

export type SlotConfig = {
  dayStartHour: number;
  dayEndHour: number;
  slotMinutes: number;
  maxPerSlot: number;
};

const toDateKey = (isoDate: string) => isoDate.slice(0, 10);

export const useFrontBenchScheduling = (clinicId: number) => {
  const [version, setVersion] = useState(0);

  const doctors = useMemo(() => {
    void version;
    return FrontBenchStore.getDoctors().filter((d) => d.isActive);
  }, [version]);

  const appointments = useMemo(() => {
    void version;
    return FrontBenchStore.getAppointments().filter((a) => a.clinicId === clinicId);
  }, [clinicId, version]);

  const blocks = useMemo(() => {
    void version;
    return FrontBenchStore.getBlockedSlots();
  }, [version]);

  const waitlist = useMemo(() => {
    void version;
    return FrontBenchStore.getWaitlist();
  }, [version]);

  const getDoctor = useCallback((doctorId: string): DoctorCRM | undefined => doctors.find((d) => d.id === doctorId), [doctors]);

  const getDayData = useCallback(
    (dateIso: string, doctorId: string) => {
      const day = toDateKey(dateIso);
      const dayAppointments = appointments.filter((a) => toDateKey(a.start) === day && a.doctorId === doctorId && a.status !== 'cancelled');
      const dayBlocks = blocks.filter((b) => toDateKey(b.start) === day && b.doctorId === doctorId);
      return { dayAppointments, dayBlocks };
    },
    [appointments, blocks]
  );

  const isBlocked = useCallback((slotStart: Date, slotEnd: Date, dayBlocks: BlockedSlot[]) => {
    const s = slotStart.getTime();
    const e = slotEnd.getTime();
    return dayBlocks.some((b) => {
      const bs = Date.parse(b.start);
      const be = Date.parse(b.end);
      return s < be && e > bs;
    });
  }, []);

  const countInSlot = useCallback((slotStart: Date, slotEnd: Date, dayAppointments: AppointmentCRM[]) => {
    const s = slotStart.getTime();
    const e = slotEnd.getTime();
    return dayAppointments.filter((a) => {
      const as = Date.parse(a.start);
      const ae = Date.parse(a.end);
      return s < ae && e > as;
    }).length;
  }, []);

  const createAppointment = useCallback(
    (data: Omit<AppointmentCRM, 'id' | 'createdAt' | 'updatedAt'>, config: SlotConfig) => {
      const { dayAppointments, dayBlocks } = getDayData(data.start, data.doctorId);
      const start = new Date(data.start);
      const end = new Date(data.end);

      if (isBlocked(start, end, dayBlocks)) {
        toast.error('Slot is blocked');
        throw new Error('Slot is blocked');
      }

      const existingCount = countInSlot(start, end, dayAppointments);
      if (existingCount >= config.maxPerSlot) {
        toast.error('Slot is full. Added to waitlist.');
        FrontBenchStore.createWaitlist({
          clinicId,
          patientMrn: data.patientMrn,
          doctorId: data.doctorId,
          preferredDate: data.start.slice(0, 10),
          preferredTimeRange: `${data.start.slice(11, 16)}-${data.end.slice(11, 16)}`,
          priority: data.priority,
          note: 'Auto waitlist (slot full)',
        });
        setVersion((v) => v + 1);
        throw new Error('Slot is full');
      }

      const created = FrontBenchStore.createAppointment(data);
      setVersion((v) => v + 1);
      toast.success('Appointment booked');
      return created;
    },
    [clinicId, countInSlot, getDayData, isBlocked]
  );

  const updateAppointment = useCallback((patch: AppointmentCRM) => {
    FrontBenchStore.upsertAppointment(patch);
    setVersion((v) => v + 1);
  }, []);

  const cancelAppointment = useCallback((appointmentId: string) => {
    const all = FrontBenchStore.getAppointments();
    const existing = all.find((a) => a.id === appointmentId);
    if (!existing) return;
    FrontBenchStore.upsertAppointment({ ...existing, status: 'cancelled' });
    setVersion((v) => v + 1);
    toast.success('Appointment cancelled');
  }, []);

  const createBlock = useCallback((block: Omit<BlockedSlot, 'id'>) => {
    FrontBenchStore.createBlockedSlot(block);
    setVersion((v) => v + 1);
    toast.success('Slot blocked');
  }, []);

  const removeWaitlist = useCallback((id: string) => {
    const entries = FrontBenchStore.getWaitlist().filter((w) => w.id !== id);
    FrontBenchStore.saveWaitlist(entries);
    setVersion((v) => v + 1);
  }, []);

  return {
    doctors,
    appointments,
    blocks,
    waitlist,
    getDoctor,
    getDayData,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    createBlock,
    removeWaitlist,
    refresh: () => setVersion((v) => v + 1),
  };
};

