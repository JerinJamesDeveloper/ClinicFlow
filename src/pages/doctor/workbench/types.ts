export type NurseRecord = {
  id: string;
  createdAt: string;
  patientMrn: string;
  chiefComplaint: string;
  symptoms: string[];
  knownConditions: string[];
  allergies: { drug: string; food: string; other: string };
  vitals: {
    systolic: number | null;
    diastolic: number | null;
    pulseRate: number | null;
    temperature: number | null;
    temperatureUnit: 'C' | 'F';
    respiratoryRate: number | null;
    spo2: number | null;
    heightCm: number | null;
    weightKg: number | null;
    bmi: number | null;
  };
};

export type PrescriptionItem = {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: 'Once daily' | 'Twice daily' | 'Three times daily' | 'Every 6 hours';
  route: 'Oral' | 'IV' | 'Injection' | 'Topical';
  duration: string;
  instructions: string;
};

export type LabOrder = {
  id: string;
  testCategory: 'Blood Test' | 'Urine Test' | 'Imaging' | 'Cardiology' | 'Others';
  testName: string;
  priority: 'routine' | 'urgent';
  notes: string;
};

export type ImagingOrder = {
  id: string;
  requestName: string;
  clinicalIndication: string;
  priority: 'routine' | 'urgent';
};

export type DoctorAttachment = {
  id: string;
  type: 'ecg_report' | 'lab_result' | 'radiology_image' | 'referral_letter';
  fileName: string;
  mimeType: string;
  dataUrl: string;
};

export type WorkbenchDraft = {
  assessment: {
    generalAppearance: 'Normal' | 'Distressed' | 'Weak';
    consciousness: 'Alert' | 'Drowsy' | 'Unconscious';
    cardiovascular: 'Normal' | 'Murmur' | 'Tachycardia';
    respiratory: 'Normal' | 'Wheezing' | 'Crackles';
    abdomen: 'Normal' | 'Tenderness' | 'Distention';
    neurological: 'Normal' | 'Weakness' | 'Seizure signs';
    notes: string;
  };
  diagnosis: {
    primaryName: string;
    primaryCode: string;
    secondaryName: string;
    secondaryCode: string;
    severity: 'Mild' | 'Moderate' | 'Severe';
  };
  prescriptions: PrescriptionItem[];
  labOrders: LabOrder[];
  imagingOrders: ImagingOrder[];
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  followUp: {
    needed: boolean;
    date: string;
    instructions: string;
  };
  referral: {
    specialist: string;
    notes: string;
  };
  attachments: DoctorAttachment[];
};

export type VisitSnapshot = {
  id: string;
  createdAt: string;
  appointmentId: string;
  patientMrn: string;
  patientName: string;
  diagnosisPrimary: string;
  diagnosisSecondary?: string;
  diagnosisCode?: string;
  medications: Array<{ medicationName: string; dosage: string; frequency: string; duration: string }>;
  vitals?: NurseRecord['vitals'];
  followUpNeeded: boolean;
  followUpDate?: string;
  doctorName: string;
};

export const createEmptyDraft = (): WorkbenchDraft => ({
  assessment: {
    generalAppearance: 'Normal',
    consciousness: 'Alert',
    cardiovascular: 'Normal',
    respiratory: 'Normal',
    abdomen: 'Normal',
    neurological: 'Normal',
    notes: '',
  },
  diagnosis: {
    primaryName: '',
    primaryCode: '',
    secondaryName: '',
    secondaryCode: '',
    severity: 'Moderate',
  },
  prescriptions: [],
  labOrders: [],
  imagingOrders: [],
  soap: { subjective: '', objective: '', assessment: '', plan: '' },
  followUp: { needed: false, date: '', instructions: '' },
  referral: { specialist: '', notes: '' },
  attachments: [],
});

