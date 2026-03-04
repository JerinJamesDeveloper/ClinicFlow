import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { PatientsService } from '../../services/api/patients.service';
import { useDoctorStore } from '../../hooks/doctor/useDoctorStore';

const PatientSummary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useDoctorStore();
  const patientId = Number(id);

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const { data: patient, isLoading } = useQuery(['doctorPatient', patientId], () => PatientsService.getPatientById(patientId), {
    enabled: Number.isFinite(patientId),
  });

  const { data: history } = useQuery(['doctorPatientHistory', patientId], () => PatientsService.getPatientHistory(patientId), {
    enabled: Number.isFinite(patientId),
  });

  const profile = useMemo(() => (Number.isFinite(patientId) ? store.getProfile(patientId) : null), [patientId, store]);
  const notes = useMemo(() => (Number.isFinite(patientId) ? store.getNotes(patientId) : []), [patientId, store]);

  const mrn = useMemo(() => {
    const clinicId = (patient as any)?.clinic_id ?? 1;
    const pid = (patient as any)?.id ?? patientId;
    return `MRN-${clinicId}-${pid}`;
  }, [patient, patientId]);

  const timeline = useMemo(() => {
    const sysAppointments = (history as any)?.appointments ?? [];
    const local = notes.map((n) => ({
      when: n.createdAt,
      title: n.assessment || 'Visit note',
      detail: n.plan || '',
      source: 'local' as const,
    }));
    const system = sysAppointments.map((a: any) => ({
      when: a.appointment_date ?? a.created_at ?? new Date().toISOString(),
      title: a.status ? `Appointment (${a.status})` : 'Appointment',
      detail: a.notes ?? '',
      source: 'system' as const,
    }));
    const combined = [...local, ...system].filter((x) => x.when);
    combined.sort((a, b) => (sortOrder === 'newest' ? b.when.localeCompare(a.when) : a.when.localeCompare(b.when)));
    return combined;
  }, [history, notes, sortOrder]);

  if (!Number.isFinite(patientId)) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Invalid patient id.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Patient not found.</p>
      </div>
    );
  }

  const lastNote = notes[0] ?? null;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{(patient as any)?.name}</h1>
          <p className="text-sm text-gray-500">
            {mrn} • {(patient as any)?.age ?? '—'} / {(patient as any)?.gender ?? '—'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
            Back
          </button>
          <button onClick={() => navigate('/front-bench/patients')} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
            Open In Front Bench
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4 xl:col-span-1 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Clinical Snapshot</h2>
            <p className="text-xs text-gray-500">5-second summary for doctors.</p>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-500">Allergies</div>
            <div className="mt-1 text-sm text-gray-900">
              {profile?.allergies?.length ? (
                <span className="text-red-700 font-semibold">{profile.allergies.join(', ')}</span>
              ) : (
                '—'
              )}
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-500">Chronic Conditions</div>
            <div className="mt-1 text-sm text-gray-900">{profile?.chronicConditions?.length ? profile.chronicConditions.join(', ') : '—'}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-500">Current Medications</div>
            <div className="mt-1 text-sm text-gray-900">{profile?.currentMedications?.length ? profile.currentMedications.join(', ') : '—'}</div>
          </div>

          <div className="border rounded-lg p-3">
            <div className="text-xs text-gray-500">Last Visit Summary</div>
            <div className="mt-1 text-sm text-gray-900">{lastNote?.assessment ? lastNote.assessment : '—'}</div>
            {lastNote?.plan && <div className="mt-1 text-xs text-gray-600">Plan: {lastNote.plan}</div>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 xl:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
              <p className="text-xs text-gray-500">Visit history (local notes + system appointments)</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Sort</label>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="border rounded-md p-2 text-sm">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {timeline.length === 0 ? (
            <p className="text-sm text-gray-600">No history yet.</p>
          ) : (
            <div className="space-y-3">
              {timeline.slice(0, 30).map((t, idx) => (
                <div key={`${t.when}_${idx}`} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                    <div className="text-xs text-gray-500">{new Date(t.when).toLocaleString()} • {t.source}</div>
                  </div>
                  {t.detail && <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{t.detail}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientSummary;
