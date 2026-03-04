// src/pages/doctor/DoctorWorkbench.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { DoctorService } from '../../services/api/doctor.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDoctorStore } from '../../hooks/doctor/useDoctorStore';
import { useFrontBenchQueue } from '../../hooks/frontbench/useFrontBenchQueue';
import { useFrontBenchScheduling } from '../../hooks/frontbench/useFrontBenchScheduling';
import { useAuth } from '../../hooks/useAuth';
import { FrontBenchStore } from '../../services/local/frontbench.store';

const DoctorWorkbench: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const store = useDoctorStore();
  const clinicId = user?.clinic_id ?? 1;

  // Use FrontBench scheduling data - this connects Frontbench appointments to Doctor workbench
  const { appointments: frontbenchAppointments, doctors } = useFrontBenchScheduling(clinicId);
  
  // Get patient data from FrontBench
  const frontbenchPatients = useMemo(() => {
    const patients = FrontBenchStore.getPatients();
    return patients;
  }, []);

  // Get today's appointments from FrontBenchStore - filtered by logged-in doctor
  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    // Get doctor's ID from user - try to match with FrontBench doctor IDs
    const userDoctorId = user?.id ? String(user.id) : null;
    const userRole = user?.role || '';
    
    // For admin/super_admin roles, show all appointments
    const isAdmin = userRole === 'clinic_admin' || userRole === 'super_admin' || userRole === 'admin';
    
    // Filter appointments for today
    return frontbenchAppointments.filter(apt => {
      const isToday = apt.start.slice(0, 10) === today;
      const isNotCancelled = apt.status !== 'cancelled';
      
      if (isAdmin) {
        // Admins see all appointments
        return isToday && isNotCancelled;
      }
      
      // For doctors, filter by their doctor ID
      const isMyAppointment = !userDoctorId || 
        apt.doctorId === userDoctorId || 
        apt.doctorId === `doc_${userDoctorId}` ||
        // Also check against the FrontBench doctors list
        apt.doctorId.startsWith('doc_');
        
      // In demo mode, show appointments if we can't match exactly
      return isToday && isNotCancelled && (isMyAppointment || !userDoctorId);
    }).map(apt => {
      // Find patient details from FrontBench patients
      const patient = frontbenchPatients.find(p => p.mrn === apt.patientMrn);
      // Find doctor details from FrontBench doctors
      const doctor = doctors.find(d => d.id === apt.doctorId);
      return {
        id: apt.id,
        patient_id: patient?.id || parseInt(apt.patientMrn.replace(/\D/g, '')) || apt.patientMrn,
        appointment_date: apt.start,
        status: apt.status,
        priority: apt.priority,
        notes: apt.notes,
        type: apt.type,
        doctor_name: doctor?.name || apt.doctorId,
        patient: {
          id: patient?.id || parseInt(apt.patientMrn.replace(/\D/g, '')) || apt.patientMrn,
          name: patient?.name || apt.patientMrn,
          age: patient?.age || 0,
          gender: patient?.gender || 'unknown',
          phone: patient?.phone || '',
        }
      };
    });
  }, [frontbenchAppointments, frontbenchPatients, doctors]);

  // Also try to fetch from API as fallback
  const { data: apiAppointments, refetch, isLoading } = useQuery(
    'todayAppointments',
    () => DoctorService.getTodayAppointments(),
    {
      // Use FrontBench data as primary, only use API if FrontBench is empty
      enabled: todayAppointments.length === 0
    }
  );

  // Combine both data sources - prefer FrontBench data
  const appointments = todayAppointments.length > 0 ? todayAppointments : (apiAppointments || []);

  const queue = useFrontBenchQueue(user?.clinic_id ?? 1);
  const liveQueue = useMemo(() => queue.getLiveQueue(), [queue]);

  useEffect(() => {
    if (!selectedAppointment && Array.isArray(appointments) && appointments.length > 0) {
      setSelectedAppointment(appointments[0]);
    }
  }, [appointments, selectedAppointment]);

  // Real-time updates for new lab results
  useWebSocket('lab_result_ready', () => {
    toast.success(`Lab results ready for patient`);
    refetch();
  });

  const selectedPatientId = selectedAppointment?.patient?.id ?? selectedAppointment?.patient_id ?? null;
  const selectedPatientProfile = selectedPatientId ? store.getProfile(Number(selectedPatientId)) : null;
  const selectedVisitMeta = selectedAppointment?.id ? store.getVisitMeta(Number(selectedAppointment.id)) : null;

  const getVisitTypeLabel = (apt: any): string => {
    const meta = apt?.id ? store.getVisitMeta(Number(apt.id)) : null;
    if (meta?.visitType === 'emergency') return 'Emergency';
    if (meta?.visitType === 'follow_up') return 'Follow-up';
    if (meta?.visitType === 'new') return 'New';
    const pid = apt?.patient?.id ?? apt?.patient_id;
    if (!pid) return '—';
    return store.hasAnyVisit(Number(pid)) ? 'Follow-up' : 'New';
  };

  const formatWait = (createdAtIso?: string) => {
    if (!createdAtIso) return '—';
    const mins = Math.max(0, Math.round((Date.now() - Date.parse(createdAtIso)) / 60000));
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const formatAppointmentTiming = (appointmentIso?: string) => {
    if (!appointmentIso) return '—';
    const deltaMins = Math.round((Date.parse(appointmentIso) - Date.now()) / 60000);
    if (Number.isNaN(deltaMins)) return '—';
    const abs = Math.abs(deltaMins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    const pretty = h > 0 ? `${h}h ${m}m` : `${m}m`;
    if (deltaMins >= 0) return `In ${pretty}`;
    return `Late ${pretty}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Doctor Workbench</h1>
          <p className="text-sm text-gray-500">
            Today at-a-glance: appointments, walk-ins, critical alerts, and one-click consultation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Today's Appointments</h2>
          {isLoading && (
            <div className="text-sm text-gray-600">Loading...</div>
          )}
          <div className="space-y-3">
            {appointments?.map((apt: any) => (
              <div
                key={apt.id}
                onClick={() => setSelectedAppointment(apt)}
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedAppointment?.id === apt.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{apt.patient?.name}</div>
                <div className="text-sm text-gray-600">
                  {new Date(apt.appointment_date).toLocaleTimeString()} • {apt.doctor_name}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {apt.patient?.age ?? '—'} / {apt.patient?.gender ?? '—'} • {apt.type || 'In-person'} • {getVisitTypeLabel(apt)} • {formatAppointmentTiming(apt.appointment_date)}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {/* Priority badge from FrontBench */}
                  {apt.priority && apt.priority !== 'normal' && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      apt.priority === 'emergency' ? 'bg-red-100 text-red-800' :
                      apt.priority === 'priority' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {apt.priority.charAt(0).toUpperCase() + apt.priority.slice(1)}
                    </span>
                  )}
                  {(() => {
                    const pid = apt?.patient?.id ?? apt?.patient_id;
                    if (!pid) return null;
                    const isFirstTime = !store.hasAnyVisit(Number(pid));
                    return isFirstTime ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        First-time
                      </span>
                    ) : null;
                  })()}
                  {(() => {
                    const pid = apt?.patient?.id ?? apt?.patient_id;
                    if (!pid) return null;
                    const p = store.getProfile(Number(pid));
                    return p.highRisk ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        High-risk
                      </span>
                    ) : null;
                  })()}
                </div>
                <StatusBadge status={apt.status} />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/doctor/visit/${apt.id}`);
                    }}
                    className="text-xs px-2 py-1 rounded bg-primary-600 text-white hover:bg-primary-700"
                  >
                    Start
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const pid = apt.patient?.id ?? apt.patient_id;
                      if (pid) navigate(`/doctor/patient/${pid}`);
                    }}
                    className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                  >
                    Summary
                  </button>
                </div>
              </div>
            ))}
            {appointments?.length === 0 && (
              <div className="text-sm text-gray-600">No appointments found.</div>
            )}
          </div>
        </div>

        {/* Today Dashboard */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Now</h2>
                {selectedAppointment ? (
                  <p className="text-sm text-gray-600">
                    {selectedAppointment.patient?.name} • {selectedAppointment.patient?.age ?? '—'} / {selectedAppointment.patient?.gender ?? '—'} •{' '}
                    {getVisitTypeLabel(selectedAppointment)}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">Select an appointment to view quick details.</p>
                )}
              </div>
              {selectedAppointment && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/doctor/visit/${selectedAppointment.id}`)}
                    className="px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                  >
                    Open Consultation
                  </button>
                  <button
                    onClick={() => {
                      const pid = selectedAppointment.patient?.id ?? selectedAppointment.patient_id;
                      if (pid) navigate(`/doctor/patient/${pid}`);
                    }}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
                  >
                    Patient Summary
                  </button>
                </div>
              )}
            </div>

            {selectedAppointment && selectedPatientProfile && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Critical Alerts</div>
                  <div className="mt-1 text-sm">
                    {selectedPatientProfile.allergies.length > 0 ? (
                      <div className="text-red-700 font-medium">Allergies: {selectedPatientProfile.allergies.join(', ')}</div>
                    ) : (
                      <div className="text-gray-600">No allergies recorded</div>
                    )}
                    {selectedPatientProfile.chronicConditions.length > 0 && (
                      <div className="mt-1 text-amber-800">Chronic: {selectedPatientProfile.chronicConditions.join(', ')}</div>
                    )}
                    {selectedPatientProfile.highRisk && (
                      <div className="mt-1 text-red-700 font-medium">High-risk flagged</div>
                    )}
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Current Medications</div>
                  <div className="mt-1 text-sm text-gray-800">
                    {selectedPatientProfile.currentMedications.length > 0 ? selectedPatientProfile.currentMedications.join(', ') : '—'}
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Payment Status (optional)</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    {selectedVisitMeta?.paymentStatus ?? 'na'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Walk-in Queue</h2>
              <button onClick={() => queue.refresh()} className="text-sm text-primary-700 hover:text-primary-900">
                Refresh
              </button>
            </div>
            {liveQueue.length === 0 ? (
              <p className="text-sm text-gray-600">No walk-ins in queue.</p>
            ) : (
              <div className="space-y-2">
                {liveQueue.slice(0, 10).map((q) => (
                  <div key={q.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Token {q.token} • {q.patientMrn}
                      </div>
                      <div className="text-xs text-gray-600">
                        Doctor: {q.doctorId} • Status: {q.status} • Waiting: {formatWait(q.createdAt)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => queue.sendMessage(q.token, 'whatsapp')} className="text-xs px-2 py-1 rounded border hover:bg-gray-50">
                        WhatsApp
                      </button>
                      <button onClick={() => queue.sendMessage(q.token, 'sms')} className="text-xs px-2 py-1 rounded border hover:bg-gray-50">
                        SMS
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

export default DoctorWorkbench;
