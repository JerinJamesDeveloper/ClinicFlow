export type BiologicalSex = 'male' | 'female' | 'other' | 'any';
export type PregnancyApplicability = 'yes' | 'no' | 'any';

export type LabRequestStatus =
  | 'pending_collection'
  | 'collected'
  | 'rejected'
  | 'in_progress'
  | 'result_entered'
  | 'verified'
  | 'released'
  | 'outsourced';

export type BillingClearance = 'pending' | 'cleared';

export type LabUnit = {
  id: string;
  symbol: string;
  label: string;
};

export type TestComponent = {
  id: string;
  code: string;
  name: string;
  unitSymbol: string;
};

export type TestPanel = {
  id: string;
  code: string;
  name: string;
  fastingRequired: boolean;
  highValue: boolean;
  price: number;
  components: TestComponent[];
};

export type ReferenceRange = {
  id: string;
  testCode: string;
  componentCode: string;
  sex: BiologicalSex;
  minAge: number;
  maxAge: number;
  pregnancy: PregnancyApplicability;
  low: number;
  high: number;
  panicLow?: number;
  panicHigh?: number;
  unitSymbol: string;
};

export type OutsourcedLabPartner = {
  id: string;
  name: string;
  contact?: string;
  slaHours: number;
};

export type LabPackageDeal = {
  id: string;
  name: string;
  panelIds: string[];
  discountPercent: number;
};

export type ChainOfCustodyEvent = {
  id: string;
  at: string;
  by: string;
  action: string;
  note?: string;
};

export type LabResultValue = {
  componentCode: string;
  componentName: string;
  value: number | null;
  unitSymbol: string;
  refLow?: number;
  refHigh?: number;
  panicLow?: number;
  panicHigh?: number;
  abnormal: boolean;
  panic: boolean;
};

export type OutsourcedTracking = {
  partnerId: string;
  partnerName: string;
  sentAt: string;
  expectedAt: string;
  receivedAt?: string;
};

export type LabRequest = {
  id: string;
  clinicId: number;
  patientMrn: string;
  patientName: string;
  patientSex: BiologicalSex;
  patientAgeYears: number;
  isPregnant: boolean;
  doctorName: string;
  requestedByRole: 'doctor' | 'front_desk';
  source: 'doctor_workbench' | 'front_desk';
  panelId: string;
  panelCode: string;
  panelName: string;
  priority: 'routine' | 'urgent' | 'emergency';
  status: LabRequestStatus;
  billingClearance: BillingClearance;
  billingInvoiceId?: string;
  createdAt: string;
  specimenBarcode: string;
  collectedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  enteredAt?: string;
  verifiedAt?: string;
  releasedAt?: string;
  enteredBy?: string;
  verifiedBy?: string;
  instructions: string[];
  highValue: boolean;
  chainOfCustody: ChainOfCustodyEvent[];
  results: LabResultValue[];
  panicAcknowledgedAt?: string;
  panicAcknowledgedBy?: string;
  outsourced?: OutsourcedTracking;
};

export type QcLog = {
  id: string;
  panelCode: string;
  level: 'L1' | 'L2' | 'L3';
  observed: number;
  expected: number;
  passed: boolean;
  recordedBy: string;
  at: string;
};

export type ReagentItem = {
  id: string;
  name: string;
  panelCode: string;
  stockUnits: number;
  reorderLevel: number;
  unitLabel: string;
  updatedAt: string;
};

export type LabMasterData = {
  units: LabUnit[];
  panels: TestPanel[];
  ranges: ReferenceRange[];
  packageDeals: LabPackageDeal[];
  outsourcedLabs: OutsourcedLabPartner[];
};
