import type {
  LabOrder,
  PatientClinicalProfile,
  PaymentStatus,
  PrescriptionDraft,
  RxDrug,
  SoapNote,
  SoapTemplate,
  VisitMeta,
  VisitType,
} from '../../types/doctor.types';

const KEY_PROFILE = 'doctor_patient_profile_v1';
const KEY_SOAP = 'doctor_soap_notes_v1';
const KEY_TEMPLATES = 'doctor_soap_templates_v1';
const KEY_RX = 'doctor_rx_v1';
const KEY_LAB = 'doctor_lab_orders_v1';
const KEY_VISIT_META = 'doctor_visit_meta_v1';

const nowIso = () => new Date().toISOString();

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeList = (value: string): string[] => {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
};

export const DoctorStore = {
  normalizeList,

  getPatientProfiles(): PatientClinicalProfile[] {
    return readJson<PatientClinicalProfile[]>(KEY_PROFILE, []);
  },

  upsertPatientProfile(profile: Omit<PatientClinicalProfile, 'updatedAt'>): PatientClinicalProfile {
    const all = this.getPatientProfiles();
    const idx = all.findIndex((p) => p.patientId === profile.patientId);
    const next: PatientClinicalProfile = { ...profile, updatedAt: nowIso() };
    if (idx === -1) writeJson(KEY_PROFILE, [next, ...all]);
    else {
      const copy = [...all];
      copy[idx] = next;
      writeJson(KEY_PROFILE, copy);
    }
    return next;
  },

  getPatientProfile(patientId: number): PatientClinicalProfile {
    const existing = this.getPatientProfiles().find((p) => p.patientId === patientId);
    return (
      existing ?? {
        patientId,
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        highRisk: false,
        updatedAt: nowIso(),
      }
    );
  },

  getSoapTemplates(): SoapTemplate[] {
    const existing = readJson<SoapTemplate[]>(KEY_TEMPLATES, []);
    if (existing.length > 0) return existing;
    const seeded: SoapTemplate[] = [
      {
        id: 'tpl_fever',
        name: 'Fever / Viral',
        specialty: 'General',
        subjective: 'Fever since __ days. Associated symptoms: __.',
        objective: 'Vitals: __. Exam: __.',
        assessment: 'Likely viral fever. Consider dehydration.',
        plan: 'Paracetamol as needed, hydration, rest. Review if persistent/worsening.',
        isDefault: true,
      },
      {
        id: 'tpl_dm_followup',
        name: 'Diabetes Follow-up',
        specialty: 'General',
        subjective: 'Follow-up for diabetes. Adherence: __. Symptoms: __.',
        objective: 'BP __. Weight __. Foot exam __. Recent sugars/HbA1c __.',
        assessment: 'T2DM control: __. Complications: __.',
        plan: 'Continue/adjust meds. Lifestyle counseling. Labs: HbA1c, lipid, creatinine.',
      },
      {
        id: 'tpl_htn_followup',
        name: 'Hypertension Follow-up',
        specialty: 'General',
        subjective: 'Follow-up for HTN. Compliance: __. Symptoms: __.',
        objective: 'BP __. HR __. Exam: __.',
        assessment: 'HTN: __ controlled/uncontrolled.',
        plan: 'Medication adjustment as needed. Salt restriction. Home BP log.',
      },
    ];
    writeJson(KEY_TEMPLATES, seeded);
    return seeded;
  },

  saveSoapTemplates(templates: SoapTemplate[]) {
    writeJson(KEY_TEMPLATES, templates);
  },

  getSoapNotes(): SoapNote[] {
    return readJson<SoapNote[]>(KEY_SOAP, []);
  },

  upsertSoapNote(note: Omit<SoapNote, 'createdAt' | 'updatedAt'> & { createdAt?: string }): SoapNote {
    const all = this.getSoapNotes();
    const existingIdx = all.findIndex((n) => n.id === note.id);
    const createdAt = note.createdAt ?? (existingIdx !== -1 ? all[existingIdx].createdAt : nowIso());
    const next: SoapNote = { ...note, createdAt, updatedAt: nowIso() };
    if (existingIdx === -1) writeJson(KEY_SOAP, [next, ...all]);
    else {
      const copy = [...all];
      copy[existingIdx] = next;
      writeJson(KEY_SOAP, copy);
    }
    return next;
  },

  getSoapNotesForPatient(patientId: number): SoapNote[] {
    return this.getSoapNotes().filter((n) => n.patientId === patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  hasAnyVisit(patientId: number): boolean {
    return this.getSoapNotes().some((n) => n.patientId === patientId);
  },

  getPrescriptionDrafts(): PrescriptionDraft[] {
    return readJson<PrescriptionDraft[]>(KEY_RX, []);
  },

  upsertPrescriptionDraft(draft: Omit<PrescriptionDraft, 'createdAt' | 'updatedAt'> & { createdAt?: string }): PrescriptionDraft {
    const all = this.getPrescriptionDrafts();
    const idx = all.findIndex((d) => d.id === draft.id);
    const createdAt = draft.createdAt ?? (idx !== -1 ? all[idx].createdAt : nowIso());
    const next: PrescriptionDraft = { ...draft, createdAt, updatedAt: nowIso() };
    if (idx === -1) writeJson(KEY_RX, [next, ...all]);
    else {
      const copy = [...all];
      copy[idx] = next;
      writeJson(KEY_RX, copy);
    }
    return next;
  },

  getLastPrescriptionForPatient(patientId: number): PrescriptionDraft | null {
    const drafts = this.getPrescriptionDrafts()
      .filter((d) => d.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return drafts[0] ?? null;
  },

  getLabOrders(): LabOrder[] {
    return readJson<LabOrder[]>(KEY_LAB, []);
  },

  upsertLabOrder(order: Omit<LabOrder, 'createdAt' | 'updatedAt'> & { createdAt?: string }): LabOrder {
    const all = this.getLabOrders();
    const idx = all.findIndex((o) => o.id === order.id);
    const createdAt = order.createdAt ?? (idx !== -1 ? all[idx].createdAt : nowIso());
    const next: LabOrder = { ...order, createdAt, updatedAt: nowIso() };
    if (idx === -1) writeJson(KEY_LAB, [next, ...all]);
    else {
      const copy = [...all];
      copy[idx] = next;
      writeJson(KEY_LAB, copy);
    }
    return next;
  },

  getLabOrderForAppointment(appointmentId: number): LabOrder | null {
    return this.getLabOrders().find((o) => o.appointmentId === appointmentId) ?? null;
  },

  getVisitMetaAll(): VisitMeta[] {
    return readJson<VisitMeta[]>(KEY_VISIT_META, []);
  },

  setVisitMeta(appointmentId: number, visitType: VisitType, paymentStatus: PaymentStatus): VisitMeta {
    const all = this.getVisitMetaAll();
    const idx = all.findIndex((m) => m.appointmentId === appointmentId);
    const next: VisitMeta = { appointmentId, visitType, paymentStatus, updatedAt: nowIso() };
    if (idx === -1) writeJson(KEY_VISIT_META, [next, ...all]);
    else {
      const copy = [...all];
      copy[idx] = next;
      writeJson(KEY_VISIT_META, copy);
    }
    return next;
  },

  getVisitMeta(appointmentId: number): VisitMeta | null {
    return this.getVisitMetaAll().find((m) => m.appointmentId === appointmentId) ?? null;
  },

  getDrugDatabase(): RxDrug[] {
    return [
      { id: 'drug_paracetamol', generic: 'Paracetamol', brand: 'Dolo 650', form: 'Tablet', strength: '650mg', doseMgPerKg: 15, maxMgPerDay: 4000 },
      { id: 'drug_amoxicillin', generic: 'Amoxicillin', brand: 'Mox', form: 'Capsule', strength: '500mg', allergens: ['penicillin'] },
      { id: 'drug_cetirizine', generic: 'Cetirizine', brand: 'Cetzine', form: 'Tablet', strength: '10mg' },
      { id: 'drug_ibuprofen', generic: 'Ibuprofen', brand: 'Brufen', form: 'Tablet', strength: '400mg', interactionsWith: ['Warfarin'] },
      { id: 'drug_omeprazole', generic: 'Omeprazole', brand: 'Omez', form: 'Capsule', strength: '20mg' },
      { id: 'drug_metformin', generic: 'Metformin', brand: 'Glycomet', form: 'Tablet', strength: '500mg' },
      { id: 'drug_amlodipine', generic: 'Amlodipine', brand: 'Amlong', form: 'Tablet', strength: '5mg' },
      { id: 'drug_warfarin', generic: 'Warfarin', form: 'Tablet', strength: '2mg', interactionsWith: ['Ibuprofen'] },
    ];
  },

  getIcd10List(): Array<{ code: string; label: string }> {
    return [
      { code: 'J06.9', label: 'Acute upper respiratory infection, unspecified' },
      { code: 'R50.9', label: 'Fever, unspecified' },
      { code: 'E11.9', label: 'Type 2 diabetes mellitus without complications' },
      { code: 'I10', label: 'Essential (primary) hypertension' },
      { code: 'K21.9', label: 'Gastro-esophageal reflux disease without esophagitis' },
      { code: 'J45.909', label: 'Unspecified asthma, uncomplicated' },
    ];
  },

  parseRefRange(refRange?: string): { low?: number; high?: number } {
    if (!refRange) return {};
    const m = refRange.replace(/\s/g, '').match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/);
    if (!m) return {};
    return { low: Number(m[1]), high: Number(m[3]) };
  },

  isAbnormalNumeric(value?: string, refRange?: string): boolean | undefined {
    if (!value) return undefined;
    const numeric = Number(String(value).replace(/[^0-9.\-]/g, ''));
    if (Number.isNaN(numeric)) return undefined;
    const { low, high } = this.parseRefRange(refRange);
    if (low === undefined || high === undefined) return undefined;
    return numeric < low || numeric > high;
  },
};

