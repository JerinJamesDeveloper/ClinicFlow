import { useCallback, useMemo, useState } from 'react';
import { DoctorStore } from '../../services/local/doctor.store';
import type { LabOrder, PatientClinicalProfile, PrescriptionDraft, SoapNote, SoapTemplate, VisitMeta } from '../../types/doctor.types';

export const useDoctorStore = () => {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const templates = useMemo(() => {
    void version;
    return DoctorStore.getSoapTemplates();
  }, [version]);

  const icd10 = useMemo(() => DoctorStore.getIcd10List(), []);
  const drugs = useMemo(() => DoctorStore.getDrugDatabase(), []);

  const getProfile = useCallback((patientId: number): PatientClinicalProfile => DoctorStore.getPatientProfile(patientId), []);
  const saveProfile = useCallback((profile: Omit<PatientClinicalProfile, 'updatedAt'>) => {
    const next = DoctorStore.upsertPatientProfile(profile);
    refresh();
    return next;
  }, [refresh]);

  const getNotes = useCallback((patientId: number): SoapNote[] => DoctorStore.getSoapNotesForPatient(patientId), []);
  const upsertNote = useCallback((note: Omit<SoapNote, 'createdAt' | 'updatedAt'> & { createdAt?: string }) => {
    const next = DoctorStore.upsertSoapNote(note);
    refresh();
    return next;
  }, [refresh]);

  const hasAnyVisit = useCallback((patientId: number) => DoctorStore.hasAnyVisit(patientId), []);

  const getVisitMeta = useCallback((appointmentId: number): VisitMeta | null => DoctorStore.getVisitMeta(appointmentId), []);
  const setVisitMeta = useCallback((appointmentId: number, visitType: VisitMeta['visitType'], paymentStatus: VisitMeta['paymentStatus']) => {
    const next = DoctorStore.setVisitMeta(appointmentId, visitType, paymentStatus);
    refresh();
    return next;
  }, [refresh]);

  const getLastRx = useCallback((patientId: number): PrescriptionDraft | null => DoctorStore.getLastPrescriptionForPatient(patientId), []);
  const upsertRx = useCallback((draft: Omit<PrescriptionDraft, 'createdAt' | 'updatedAt'> & { createdAt?: string }) => {
    const next = DoctorStore.upsertPrescriptionDraft(draft);
    refresh();
    return next;
  }, [refresh]);

  const getLabForAppointment = useCallback((appointmentId: number): LabOrder | null => DoctorStore.getLabOrderForAppointment(appointmentId), []);
  const upsertLab = useCallback((order: Omit<LabOrder, 'createdAt' | 'updatedAt'> & { createdAt?: string }) => {
    const next = DoctorStore.upsertLabOrder(order);
    refresh();
    return next;
  }, [refresh]);

  const saveTemplates = useCallback((next: SoapTemplate[]) => {
    DoctorStore.saveSoapTemplates(next);
    refresh();
  }, [refresh]);

  return {
    templates,
    icd10,
    drugs,
    getProfile,
    saveProfile,
    getNotes,
    upsertNote,
    hasAnyVisit,
    getVisitMeta,
    setVisitMeta,
    getLastRx,
    upsertRx,
    getLabForAppointment,
    upsertLab,
    saveTemplates,
    refresh,
  };
};

