export type VisitType = 'new' | 'follow_up' | 'emergency';

export type PaymentStatus = 'na' | 'unpaid' | 'paid';

export type PatientClinicalProfile = {
  patientId: number;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  highRisk: boolean;
  updatedAt: string;
};

export type SoapNote = {
  id: string;
  appointmentId: number;
  patientId: number;
  doctorId?: number;
  status: 'draft' | 'final';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10: Array<{ code: string; label: string }>;
  createdAt: string;
  updatedAt: string;
};

export type SoapTemplate = {
  id: string;
  name: string;
  specialty?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  isDefault?: boolean;
};

export type RxDrug = {
  id: string;
  generic: string;
  brand?: string;
  form?: string; // tablet, syrup...
  strength?: string; // 500mg...
  allergens?: string[]; // e.g., penicillin
  interactionsWith?: string[]; // generic names
  doseMgPerKg?: number; // optional simple calculator
  maxMgPerDay?: number;
};

export type RxItem = {
  id: string;
  drugId?: string;
  generic: string;
  brand?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
};

export type PrescriptionDraft = {
  id: string;
  appointmentId: number;
  patientId: number;
  createdAt: string;
  updatedAt: string;
  items: RxItem[];
  notes?: string;
};

export type LabUrgency = 'routine' | 'urgent' | 'emergency';
export type LabStatus = 'ordered' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';

export type LabOrderItem = {
  id: string;
  name: string;
  panel?: string;
  urgency: LabUrgency;
  notes?: string;
  status: LabStatus;
  resultValue?: string;
  unit?: string;
  refRange?: string; // e.g., 70-110
  isAbnormal?: boolean;
};

export type LabOrder = {
  id: string;
  appointmentId: number;
  patientId: number;
  createdAt: string;
  updatedAt: string;
  items: LabOrderItem[];
};

export type VisitMeta = {
  appointmentId: number;
  visitType: VisitType;
  paymentStatus: PaymentStatus;
  updatedAt: string;
};

