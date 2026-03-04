export type Gender = 'male' | 'female' | 'other';

export type DocumentType = 'aadhaar' | 'id' | 'insurance' | 'other';

export type FrontBenchDocument = {
  id: string;
  type: DocumentType;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
};

export type InsuranceDetails = {
  provider?: string;
  policyNumber?: string;
  validTo?: string; // ISO date
  memberId?: string;
};

export type EmergencyContact = {
  name?: string;
  phone?: string;
  relation?: string;
};

export type FamilyLink = {
  groupId: string;
  relationship: 'self' | 'parent' | 'child' | 'spouse' | 'guardian' | 'other';
  linkedPatientMrn?: string;
};

export type PatientCRM = {
  id: number;
  clinicId: number;
  mrn: string;
  name: string;
  dateOfBirth?: string; // ISO date
  age?: number;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  aadhaar?: string; // 12 digits (stored as string)
  insurance?: InsuranceDetails;
  emergencyContact?: EmergencyContact;
  family?: FamilyLink;
  documents: FrontBenchDocument[];
  createdAt: string;
  updatedAt: string;
  searchKey: string;
};

export type AppointmentStatus = 'scheduled' | 'cancelled' | 'checked_in' | 'completed' | 'no_show';

export type AppointmentCRM = {
  id: string;
  clinicId: number;
  patientMrn: string;
  doctorId: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  type: 'in_person' | 'online';
  status: AppointmentStatus;
  priority: 'normal' | 'priority' | 'emergency';
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type BlockedSlot = {
  id: string;
  doctorId: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  reason: 'leave' | 'surgery' | 'maintenance' | 'other';
  note?: string;
};

export type WaitlistEntry = {
  id: string;
  createdAt: string;
  patientMrn: string;
  doctorId: string;
  preferredDate?: string; // ISO date
  preferredTimeRange?: string;
  priority: 'normal' | 'priority' | 'emergency';
  note?: string;
};

export type DoctorCRM = {
  id: string;
  name: string;
  specialization?: string;
  room?: string;
  isActive: boolean;
  departmentId?: string;
  consultationFee?: number; // INR
  availabilityTemplate?: {
    daysOfWeek: number[]; // 0-6 (Sun-Sat)
    startHour: number;
    endHour: number;
    slotMinutes: number;
  };
};

export type QueueStatus = 'waiting' | 'with_doctor' | 'done' | 'skipped';

export type QueueItem = {
  id: string;
  clinicId: number;
  doctorId: string;
  patientMrn: string;
  token: string;
  status: QueueStatus;
  priority: number; // smaller = higher priority
  createdAt: string;
  updatedAt: string;
  room?: string;
};

export type Department = {
  id: string;
  name: string;
  color: string; // hex
  isActive: boolean;
};

export type DoctorProfile = DoctorCRM & {
  leaveBlocks?: BlockedSlot[];
};

export type ServiceCategory = 'consultation' | 'lab' | 'procedure' | 'pharmacy' | 'other';

export type ServiceCatalogItem = {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number; // base price (INR)
  gstRate: number; // e.g. 0, 5, 12, 18
  isActive: boolean;
};

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partially_paid' | 'refunded' | 'cancelled';

export type InvoiceLine = {
  id: string;
  serviceId?: string;
  description: string;
  qty: number;
  unitPrice: number;
  gstRate: number;
  discount: {
    type: 'flat' | 'percent';
    value: number;
  };
  tags?: string[]; // e.g. insurance claim tag
};

export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'insurance' | 'credit';

export type Payment = {
  id: string;
  invoiceId: string;
  mode: PaymentMode;
  amount: number;
  reference?: string; // UPI txn id, card auth code, etc.
  receivedAt: string;
  receivedBy?: string;
};

export type Refund = {
  id: string;
  invoiceId: string;
  amount: number;
  mode: PaymentMode;
  reference?: string;
  refundedAt: string;
  reason?: string;
};

export type CorporateAccount = {
  id: string;
  name: string;
  creditLimit: number;
  isActive: boolean;
};

export type InsuranceClaimTag = {
  id: string;
  name: string;
  insurer?: string;
  tpa?: string;
  isActive: boolean;
};

export type Invoice = {
  id: string;
  clinicId: number;
  invoiceNo: string;
  receiptNo?: string;
  patientMrn: string;
  patientNameSnapshot: string;
  issuedAt: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  payments: Payment[];
  refunds: Refund[];
  notes?: string;
  billingType: 'self' | 'corporate_credit' | 'insurance';
  corporateAccountId?: string;
  insuranceTagId?: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyCashReport = {
  id: string;
  clinicId: number;
  dayIso: string; // YYYY-MM-DD
  totalsByMode: Record<PaymentMode, number>;
  totalCollected: number;
  totalRefunded: number;
  generatedAt: string;
};

export type DailyClosingReport = {
  id: string;
  clinicId: number;
  dayIso: string; // YYYY-MM-DD
  supervisorName: string;
  openingCash: number;
  cashCollected: number;
  cashRefunded: number;
  expectedCash: number;
  countedCash: number;
  variance: number;
  notes?: string;
  closedAt: string;
};

export type MessageChannel = 'sms' | 'whatsapp';
export type MessageStatus = 'queued' | 'sent' | 'failed';

export type MessageTemplate = {
  id: string;
  name: string;
  channel: MessageChannel;
  body: string;
  isActive: boolean;
};

export type MessageLog = {
  id: string;
  clinicId: number;
  channel: MessageChannel;
  to: string;
  patientMrn?: string;
  templateId?: string;
  body: string;
  status: MessageStatus;
  createdAt: string;
  sentAt?: string;
  error?: string;
};

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type Complaint = {
  id: string;
  clinicId: number;
  patientMrn: string;
  category: 'billing' | 'service' | 'wait_time' | 'clinical' | 'other';
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  resolutionNote?: string;
};

export type SatisfactionRating = {
  id: string;
  clinicId: number;
  patientMrn: string;
  score: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string;
};

export type InsuranceCompany = {
  id: string;
  name: string;
  isActive: boolean;
};

export type PolicyVerification = {
  id: string;
  clinicId: number;
  patientMrn: string;
  insurerId: string;
  policyNumber: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: string;
  note?: string;
  createdAt: string;
};

export type PreAuthRequest = {
  id: string;
  clinicId: number;
  patientMrn: string;
  insurerId: string;
  requestedFor: string; // procedure/service
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending';
  submittedAt?: string;
  updatedAt: string;
  documents: FrontBenchDocument[];
  note?: string;
};

export type Claim = {
  id: string;
  clinicId: number;
  patientMrn: string;
  insurerId: string;
  invoiceId?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending' | 'paid';
  updatedAt: string;
  documents: FrontBenchDocument[];
  note?: string;
};
