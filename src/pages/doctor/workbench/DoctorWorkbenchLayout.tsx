import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { DoctorService } from '../../../services/api/doctor.service';
import { useAuth } from '../../../hooks/useAuth';
import { useDoctorStore } from '../../../hooks/doctor/useDoctorStore';
import { useFrontBenchScheduling } from '../../../hooks/frontbench/useFrontBenchScheduling';
import { FrontBenchStore } from '../../../services/local/frontbench.store';
import { WorkbenchStore, idFrom } from './store';
import type { VisitSnapshot, WorkbenchDraft, NurseRecord } from './types';
import { createEmptyDraft } from './types';
import DoctorSummaryPage from './DoctorSummaryPage';
import DoctorAssessmentPage from './DoctorAssessmentPage';
import DoctorDiagnosisPage from './DoctorDiagnosisPage';
import DoctorPrescriptionsPage from './DoctorPrescriptionsPage';
import DoctorLabImagingPage from './DoctorLabImagingPage';
import DoctorNotesFollowupPage from './DoctorNotesFollowupPage';

type AppointmentView = {
  id: string;
  patientMrn: string;
  appointment_date: string;
  doctor_name: string;
  visit_type: string;
  patient: { id: number; name: string; age?: number; gender?: string; phone?: string };
};

type Ctx = {
  selectedAppointment: AppointmentView | null;
  setSelectedAppointment: (a: AppointmentView) => void;
  appointments: AppointmentView[];
  draft: WorkbenchDraft;
  setDraft: React.Dispatch<React.SetStateAction<WorkbenchDraft>>;
  latestNurseRecord: NurseRecord | null;
  history: VisitSnapshot[];
  allergyText: string;
  saveDraft: () => void;
  saveVisit: () => void;
  storeDrugs: ReturnType<typeof useDoctorStore>['drugs'];
};

const WorkbenchContext = createContext<Ctx | undefined>(undefined);
export const useWorkbench = () => {
  const ctx = useContext(WorkbenchContext);
  if (!ctx) throw new Error('useWorkbench must be used within DoctorWorkbenchLayout');
  return ctx;
};

const tabs = [
  { name: 'Patient Summary', to: '/doctor/summary' },
  { name: 'Clinical Assessment', to: '/doctor/assessment' },
  { name: 'Diagnosis', to: '/doctor/diagnosis' },
  { name: 'Prescriptions', to: '/doctor/prescriptions' },
  { name: 'Lab / Imaging', to: '/doctor/lab-imaging' },
  { name: 'Notes & Follow-up', to: '/doctor/notes-followup' },
];

const DoctorWorkbenchLayout: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;
  const doctorStore = useDoctorStore();
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentView | null>(null);
  const [draft, setDraft] = useState<WorkbenchDraft>(createEmptyDraft());

  const { appointments: fbAppointments, doctors } = useFrontBenchScheduling(clinicId);
  const fbPatients = useMemo(() => FrontBenchStore.getPatients(), []);

  const appointmentsFromFrontBench = useMemo<AppointmentView[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return fbAppointments
      .filter((a) => a.start.slice(0, 10) === today && a.status !== 'cancelled')
      .map((a) => {
        const patient = fbPatients.find((p) => p.mrn === a.patientMrn);
        const doctor = doctors.find((d) => d.id === a.doctorId);
        return {
          id: a.id,
          patientMrn: a.patientMrn,
          appointment_date: a.start,
          doctor_name: doctor?.name || a.doctorId,
          visit_type: a.type,
          patient: {
            id: patient?.id || Number(a.patientMrn.replace(/\D/g, '')) || 0,
            name: patient?.name || a.patientMrn,
            age: patient?.age,
            gender: patient?.gender,
            phone: patient?.phone,
          },
        };
      });
  }, [fbAppointments, fbPatients, doctors]);

  const { data: apiAppointments = [] } = useQuery('todayAppointments', () => DoctorService.getTodayAppointments(), {
    enabled: appointmentsFromFrontBench.length === 0,
  });

  const appointments = appointmentsFromFrontBench.length > 0 ? appointmentsFromFrontBench : (apiAppointments as any[]).map((a) => ({
    id: String(a.id),
    patientMrn: `MRN-${a.patient?.clinic_id ?? clinicId}-${a.patient?.id ?? a.patient_id}`,
    appointment_date: a.appointment_date,
    doctor_name: a.doctor?.name || 'Doctor',
    visit_type: a.type || 'in_person',
    patient: {
      id: a.patient?.id ?? a.patient_id,
      name: a.patient?.name || `Patient ${a.patient_id}`,
      age: a.patient?.age,
      gender: a.patient?.gender,
      phone: a.patient?.phone,
    },
  }));

  useEffect(() => {
    if (!selectedAppointment && appointments.length > 0) setSelectedAppointment(appointments[0]);
  }, [appointments, selectedAppointment]);

  const latestNurseRecord = useMemo(() => {
    if (!selectedAppointment) return null;
    return WorkbenchStore.getNurseRecords()
      .filter((r) => r.patientMrn === selectedAppointment.patientMrn)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }, [selectedAppointment]);

  const history = useMemo(() => {
    if (!selectedAppointment) return [];
    return WorkbenchStore.getVisitSummaries()
      .filter((v) => v.patientMrn === selectedAppointment.patientMrn)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [selectedAppointment]);

  useEffect(() => {
    if (!selectedAppointment) return;
    const existingDraft = WorkbenchStore.getDraft(selectedAppointment.id);
    if (existingDraft) {
      setDraft(existingDraft);
      return;
    }

    const next = createEmptyDraft();
    next.soap.subjective = latestNurseRecord?.chiefComplaint || '';
    next.soap.objective = latestNurseRecord?.symptoms?.join(', ') || '';
    setDraft(next);
  }, [selectedAppointment?.id]);

  const allergyText = useMemo(() => {
    const nurseAllergies = latestNurseRecord
      ? [latestNurseRecord.allergies.drug, latestNurseRecord.allergies.food, latestNurseRecord.allergies.other].filter(Boolean).join(', ')
      : '';
    const profile = selectedAppointment?.patient?.id ? doctorStore.getProfile(selectedAppointment.patient.id) : null;
    const profileAllergies = profile?.allergies.join(', ') ?? '';
    return [nurseAllergies, profileAllergies].filter(Boolean).join(', ');
  }, [latestNurseRecord, selectedAppointment?.patient?.id, doctorStore]);

  const saveDraft = () => {
    if (!selectedAppointment) return;
    WorkbenchStore.saveDraft(selectedAppointment.id, draft);
    toast.success('Draft saved');
  };

  const saveVisit = () => {
    if (!selectedAppointment) return;
    const snapshot: VisitSnapshot = {
      id: idFrom('visit'),
      createdAt: new Date().toISOString(),
      appointmentId: selectedAppointment.id,
      patientMrn: selectedAppointment.patientMrn,
      patientName: selectedAppointment.patient.name,
      diagnosisPrimary: draft.diagnosis.primaryName,
      diagnosisSecondary: draft.diagnosis.secondaryName || undefined,
      diagnosisCode: draft.diagnosis.primaryCode || undefined,
      medications: draft.prescriptions.map((p) => ({
        medicationName: p.medicationName,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration,
      })),
      vitals: latestNurseRecord?.vitals,
      followUpNeeded: draft.followUp.needed,
      followUpDate: draft.followUp.date || undefined,
      doctorName: user?.name || 'Doctor',
    };

    WorkbenchStore.addVisitSummary(snapshot);
    WorkbenchStore.saveDraft(selectedAppointment.id, draft);
    toast.success('Visit summary generated');
  };

  return (
    <WorkbenchContext.Provider
      value={{
        selectedAppointment,
        setSelectedAppointment,
        appointments,
        draft,
        setDraft,
        latestNurseRecord,
        history,
        allergyText,
        saveDraft,
        saveVisit,
        storeDrugs: doctorStore.drugs,
      }}
    >
      <div className="h-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Doctor Workbench</h1>
          <p className="text-sm text-gray-500">Modular workflow with routed pages for consultation.</p>
        </div>

        <div className="bg-white border-b rounded-t-lg">
          <nav className="px-6 flex gap-2 overflow-x-auto">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  `px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    isActive ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                {t.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 bg-white rounded-b-lg p-4">
          <div className="xl:col-span-1 border rounded-lg p-3 h-fit">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Today's Patients</h2>
            <div className="space-y-2 max-h-[70vh] overflow-auto">
              {appointments.map((apt) => (
                <button
                  key={apt.id}
                  onClick={() => setSelectedAppointment(apt)}
                  className={`w-full text-left border rounded-md p-2 ${selectedAppointment?.id === apt.id ? 'border-primary-500 bg-primary-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="text-sm font-medium">{apt.patient.name}</div>
                  <div className="text-xs text-gray-600">{new Date(apt.appointment_date).toLocaleTimeString()} • {apt.patientMrn}</div>
                </button>
              ))}
              {appointments.length === 0 && <p className="text-sm text-gray-600">No appointments.</p>}
            </div>
          </div>

          <div className="xl:col-span-3 border rounded-lg p-4">
            {selectedAppointment ? (
              <Routes>
                <Route path="/" element={<Navigate to="/doctor/summary" replace />} />
                <Route path="/summary" element={<DoctorSummaryPage />} />
                <Route path="/assessment" element={<DoctorAssessmentPage />} />
                <Route path="/diagnosis" element={<DoctorDiagnosisPage />} />
                <Route path="/prescriptions" element={<DoctorPrescriptionsPage />} />
                <Route path="/lab-imaging" element={<DoctorLabImagingPage />} />
                <Route path="/notes-followup" element={<DoctorNotesFollowupPage />} />
                <Route path="*" element={<Navigate to="/doctor/summary" replace />} />
              </Routes>
            ) : (
              <p className="text-sm text-gray-600">Select a patient to continue.</p>
            )}
          </div>
        </div>
      </div>
    </WorkbenchContext.Provider>
  );
};

export default DoctorWorkbenchLayout;

