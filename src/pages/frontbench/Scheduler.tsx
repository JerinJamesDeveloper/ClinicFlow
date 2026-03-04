import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useFrontBenchPatients } from '../../hooks/frontbench/useFrontBenchPatients';
import { useFrontBenchQueue } from '../../hooks/frontbench/useFrontBenchQueue';
import { useFrontBenchScheduling, type SlotConfig } from '../../hooks/frontbench/useFrontBenchScheduling';
import SearchBar from '../../components/common/SearchBar';
import type { AppointmentCRM } from '../../types/frontbench.types';

const toDayKey = (d: Date) => d.toISOString().slice(0, 10);
const withTime = (dayIso: string, hh: number, mm: number) => new Date(`${dayIso}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

type Reminder = {
  id: string;
  dueAt: string; // ISO datetime
  channel: 'sms' | 'whatsapp';
  message: string;
};

const REMINDERS_KEY = 'frontbench_reminders_v1';

const readReminders = (): Reminder[] => {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Reminder[]) : [];
  } catch {
    return [];
  }
};

const writeReminders = (reminders: Reminder[]) => {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
};

const Scheduler: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;

  const { doctors, getDayData, createAppointment, updateAppointment, cancelAppointment, createBlock, waitlist, removeWaitlist } =
    useFrontBenchScheduling(clinicId);
  const { search: searchPatients, getByMrn } = useFrontBenchPatients(clinicId);
  const queue = useFrontBenchQueue(clinicId);

  const [day, setDay] = useState<string>(toDayKey(new Date()));
  const [doctorId, setDoctorId] = useState<string>(() => doctors[0]?.id ?? 'doc_1');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientMrn, setSelectedPatientMrn] = useState<string>('');
  const [priority, setPriority] = useState<'normal' | 'priority' | 'emergency'>('normal');
  const [type, setType] = useState<'in_person' | 'online'>('in_person');
  const [notes, setNotes] = useState('');
  const [maxPerSlot, setMaxPerSlot] = useState(1);
  const [slotMinutes, setSlotMinutes] = useState(15);
  const [view, setView] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    if (!doctorId && doctors.length > 0) setDoctorId(doctors[0].id);
  }, [doctorId, doctors]);

  useEffect(() => {
    const timer = setInterval(() => {
      const all = readReminders();
      if (all.length === 0) return;
      const now = Date.now();
      const due = all.filter((r) => Date.parse(r.dueAt) <= now);
      if (due.length === 0) return;
      due.forEach((r) => toast.success(`${r.channel.toUpperCase()} reminder: ${r.message}`));
      writeReminders(all.filter((r) => Date.parse(r.dueAt) > now));
    }, 10_000);
    return () => clearInterval(timer);
  }, []);

  const config: SlotConfig = useMemo(
    () => ({
      dayStartHour: 9,
      dayEndHour: 17,
      slotMinutes: clamp(slotMinutes, 5, 60),
      maxPerSlot: clamp(maxPerSlot, 1, 5),
    }),
    [maxPerSlot, slotMinutes]
  );

  const { dayAppointments, dayBlocks } = useMemo(() => getDayData(`${day}T00:00:00`, doctorId), [day, doctorId, getDayData]);

  const patientResults = useMemo(() => {
    const term = patientSearch.trim();
    if (!term) return [];
    return searchPatients(term).slice(0, 8);
  }, [patientSearch, searchPatients]);

  const slots = useMemo(() => {
    const list: { start: Date; end: Date }[] = [];
    const startHour = config.dayStartHour;
    const endHour = config.dayEndHour;
    const start = withTime(day, startHour, 0);
    const end = withTime(day, endHour, 0);
    for (let t = start.getTime(); t < end.getTime(); t += config.slotMinutes * 60_000) {
      list.push({ start: new Date(t), end: new Date(t + config.slotMinutes * 60_000) });
    }
    return list;
  }, [config.dayEndHour, config.dayStartHour, config.slotMinutes, day]);

  const isBlocked = (slotStart: Date, slotEnd: Date) => {
    const s = slotStart.getTime();
    const e = slotEnd.getTime();
    return dayBlocks.some((b) => {
      const bs = Date.parse(b.start);
      const be = Date.parse(b.end);
      return s < be && e > bs;
    });
  };

  const apptsInSlot = (slotStart: Date, slotEnd: Date) => {
    const s = slotStart.getTime();
    const e = slotEnd.getTime();
    return dayAppointments.filter((a) => {
      const as = Date.parse(a.start);
      const ae = Date.parse(a.end);
      return s < ae && e > as && a.status !== 'cancelled';
    });
  };

  function scheduleReminder(apt: AppointmentCRM, minutesBefore: number, channel: 'sms' | 'whatsapp') {
    const dueAt = new Date(Date.parse(apt.start) - minutesBefore * 60_000).toISOString();
    const message = `Token reminder for ${apt.patientMrn} at ${new Date(apt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const next: Reminder = {
      id: `r_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      dueAt,
      channel,
      message,
    };
    writeReminders([next, ...readReminders()].slice(0, 200));
    toast.success(`Reminder scheduled (${minutesBefore}m before)`);
  }

  const bookSlot = (slotStart: Date, slotEnd: Date) => {
    const mrn = selectedPatientMrn.trim();
    if (!mrn) {
      toast.error('Select a patient (MRN) first');
      return;
    }
    if (!getByMrn(mrn)) {
      toast.error('Patient MRN not found in Front Bench CRM');
      return;
    }
    const data = {
      clinicId,
      patientMrn: mrn,
      doctorId,
      start: slotStart.toISOString(),
      end: slotEnd.toISOString(),
      type,
      status: 'scheduled' as const,
      priority,
      notes: notes || undefined,
    };
    try {
      const created = createAppointment(data, config);
      toast.success('Confirmation queued (SMS/WhatsApp placeholder)');
      scheduleReminder(created, 60, 'sms');
    } catch {
      // handled in hook
    }
  };

  const onDragStart = (e: React.DragEvent, apt: AppointmentCRM) => {
    e.dataTransfer.setData('text/plain', apt.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e: React.DragEvent, slotStart: Date, slotEnd: Date) => {
    e.preventDefault();
    const aptId = e.dataTransfer.getData('text/plain');
    const apt = dayAppointments.find((a) => a.id === aptId);
    if (!apt) return;
    if (isBlocked(slotStart, slotEnd)) {
      toast.error('Slot is blocked');
      return;
    }
    const count = apptsInSlot(slotStart, slotEnd).filter((a) => a.id !== apt.id).length;
    if (count >= config.maxPerSlot) {
      toast.error('Slot is full');
      return;
    }
    updateAppointment({ ...apt, start: slotStart.toISOString(), end: slotEnd.toISOString() });
    toast.success('Rescheduled');
  };

  const checkIn = (apt: AppointmentCRM) => {
    updateAppointment({ ...apt, status: 'checked_in' });
    const prio = apt.priority === 'emergency' ? 1 : apt.priority === 'priority' ? 10 : 50;
    queue.addWalkIn(apt.doctorId, apt.patientMrn, { priority: prio });
  };

  const blockRange = (startTime: string, endTime: string, reason: 'leave' | 'surgery' | 'maintenance' | 'other') => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (Number.isNaN(sh) || Number.isNaN(sm) || Number.isNaN(eh) || Number.isNaN(em)) {
      toast.error('Invalid time');
      return;
    }
    const s = withTime(day, sh, sm);
    const e = withTime(day, eh, em);
    if (e <= s) {
      toast.error('End time must be after start time');
      return;
    }
    createBlock({ doctorId, start: s.toISOString(), end: e.toISOString(), reason });
  };

  const doctorWaitlist = useMemo(() => waitlist.filter((w) => w.doctorId === doctorId), [doctorId, waitlist]);

  const bookFromWaitlist = (waitId: string) => {
    const w = doctorWaitlist.find((x) => x.id === waitId);
    if (!w) return;
    const mrn = w.patientMrn;
    const startIndex = slots.findIndex((s) => apptsInSlot(s.start, s.end).length < config.maxPerSlot && !isBlocked(s.start, s.end));
    if (startIndex === -1) {
      toast.error('No free slots today');
      return;
    }
    bookSlot(slots[startIndex].start, slots[startIndex].end);
    removeWaitlist(waitId);
    setSelectedPatientMrn(mrn);
  };

  const [blockStart, setBlockStart] = useState('13:00');
  const [blockEnd, setBlockEnd] = useState('14:00');
  const [blockReason, setBlockReason] = useState<'leave' | 'surgery' | 'maintenance' | 'other'>('leave');

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointment Scheduling</h1>
          <p className="text-sm text-gray-500">Slot-based booking, blocks, overbooking, waitlist, drag-and-drop reschedule.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-3 items-end justify-between">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date</label>
                  <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Doctor</label>
                  <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="border rounded-md p-2">
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.room ? `(${d.room})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">View</label>
                  <select value={view} onChange={(e) => setView(e.target.value as any)} className="border rounded-md p-2">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Slot (mins)</label>
                  <input
                    type="number"
                    value={slotMinutes}
                    onChange={(e) => setSlotMinutes(Number(e.target.value))}
                    className="border rounded-md p-2 w-24"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max/slot</label>
                  <input
                    type="number"
                    value={maxPerSlot}
                    onChange={(e) => setMaxPerSlot(Number(e.target.value))}
                    className="border rounded-md p-2 w-24"
                  />
                </div>
              </div>

              <div className="flex gap-2 items-end">
                <button
                  onClick={() => toast.success('Reminders automation enabled (dev): due reminders show as toast notifications')}
                  className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
                >
                  Reminder Automation
                </button>
              </div>
            </div>
          </div>

          {view === 'weekly' ? (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Weekly View</h2>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const base = new Date(`${day}T00:00:00`);
                  const dow = base.getDay(); // 0=Sun
                  const mondayOffset = (dow + 6) % 7;
                  const monday = new Date(base.getTime() - mondayOffset * 86_400_000);
                  const date = new Date(monday.getTime() + i * 86_400_000);
                  const k = toDayKey(date);
                  const { dayAppointments: a, dayBlocks: b } = getDayData(`${k}T00:00:00`, doctorId);
                  return (
                    <button
                      key={k}
                      onClick={() => {
                        setDay(k);
                        setView('daily');
                      }}
                      className={`border rounded-lg p-3 text-left hover:bg-gray-50 ${k === day ? 'border-primary-600' : 'border-gray-200'}`}
                    >
                      <div className="text-sm font-semibold text-gray-900">{date.toLocaleDateString([], { weekday: 'short' })}</div>
                      <div className="text-xs text-gray-600">{k}</div>
                      <div className="mt-2 text-xs text-gray-700">
                        Appointments: <span className="font-medium">{a.length}</span>
                      </div>
                      <div className="text-xs text-gray-700">
                        Blocks: <span className="font-medium">{b.length}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Daily Calendar</h2>
              <div className="text-xs text-gray-500">Drag appointment cards to reschedule</div>
            </div>
            <div className="divide-y">
              {slots.map((s) => {
                const blocked = isBlocked(s.start, s.end);
                const list = apptsInSlot(s.start, s.end);
                const timeLabel = `${s.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                return (
                  <div
                    key={s.start.toISOString()}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 ${blocked ? 'bg-red-50' : 'bg-white'}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDrop(e, s.start, s.end)}
                  >
                    <div className="col-span-2 text-sm text-gray-600">{timeLabel}</div>
                    <div className="col-span-10">
                      {blocked ? (
                        <div className="text-sm text-red-700">Blocked</div>
                      ) : list.length === 0 ? (
                        <button
                          onClick={() => bookSlot(s.start, s.end)}
                          className="text-sm text-primary-700 hover:text-primary-900"
                        >
                          + Book slot
                        </button>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {list.map((apt) => (
                            <div
                              key={apt.id}
                              draggable
                              onDragStart={(e) => onDragStart(e, apt)}
                              className="border rounded-lg px-3 py-2 bg-gray-50 cursor-move"
                              title={apt.notes}
                            >
                              <div className="text-sm font-medium">{apt.patientMrn}</div>
                              <div className="text-xs text-gray-600">
                                {apt.type} • {apt.priority} • {apt.status}
                              </div>
                              <div className="mt-2 flex gap-2">
                                {apt.status === 'scheduled' && (
                                  <button onClick={() => checkIn(apt)} className="text-xs text-green-700 hover:text-green-900">
                                    Check-in
                                  </button>
                                )}
                                <button
                                  onClick={() => scheduleReminder(apt, 60, 'sms')}
                                  className="text-xs text-primary-700 hover:text-primary-900"
                                >
                                  Reminder
                                </button>
                                <button onClick={() => cancelAppointment(apt.id)} className="text-xs text-red-700 hover:text-red-900">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {list.length >= config.maxPerSlot && !blocked && (
                        <div className="mt-1 text-xs text-amber-700">Slot full (overbooking control)</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Booking Panel</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Find patient (name/phone/MRN/Aadhaar)</label>
                <SearchBar onSearch={setPatientSearch} debounceMs={150} placeholder="Start typing..." />
                {patientResults.length > 0 && (
                  <div className="mt-2 border rounded-lg divide-y max-h-56 overflow-auto">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPatientMrn(p.mrn)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      >
                        <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-600">{p.mrn} • {p.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Selected MRN</label>
                <input
                  value={selectedPatientMrn}
                  onChange={(e) => setSelectedPatientMrn(e.target.value)}
                  className="w-full border rounded-md p-2"
                  placeholder="MRN-..."
                />
                {!!selectedPatientMrn && !getByMrn(selectedPatientMrn) && (
                  <p className="text-xs text-amber-700 mt-1">Not found in Front Bench CRM yet.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full border rounded-md p-2">
                    <option value="normal">Normal</option>
                    <option value="priority">Priority</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full border rounded-md p-2">
                    <option value="in_person">In person</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border rounded-md p-2" />
              </div>

              <div className="text-xs text-gray-500">
                To book: pick patient, then click “+ Book slot” on the calendar.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Block Slots</h2>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start</label>
                <input value={blockStart} onChange={(e) => setBlockStart(e.target.value)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End</label>
                <input value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Reason</label>
                <select value={blockReason} onChange={(e) => setBlockReason(e.target.value as any)} className="w-full border rounded-md p-2">
                  <option value="leave">Leave</option>
                  <option value="surgery">Surgery</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => blockRange(blockStart, blockEnd, blockReason)}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black"
              >
                Block
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Waitlist</h2>
            {doctorWaitlist.length === 0 ? (
              <p className="text-sm text-gray-600">No waitlist entries.</p>
            ) : (
              <div className="space-y-2">
                {doctorWaitlist.slice(0, 8).map((w) => (
                  <div key={w.id} className="border rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-900">{w.patientMrn}</div>
                    <div className="text-xs text-gray-600">{w.priority} • {w.preferredDate ?? 'any date'} • {w.preferredTimeRange ?? 'any time'}</div>
                    <div className="mt-2 flex gap-3">
                      <button onClick={() => bookFromWaitlist(w.id)} className="text-xs text-primary-700 hover:text-primary-900">
                        Book first free today
                      </button>
                      <button onClick={() => removeWaitlist(w.id)} className="text-xs text-red-700 hover:text-red-900">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scheduler;
