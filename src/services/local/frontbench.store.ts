import type {
  AppointmentCRM,
  BlockedSlot,
  Claim,
  Complaint,
  CorporateAccount,
  DailyClosingReport,
  DailyCashReport,
  Department,
  DoctorCRM,
  InsuranceClaimTag,
  InsuranceCompany,
  Invoice,
  MessageLog,
  MessageTemplate,
  PatientCRM,
  PolicyVerification,
  PreAuthRequest,
  QueueItem,
  Refund,
  SatisfactionRating,
  ServiceCatalogItem,
  WaitlistEntry,
} from '../../types/frontbench.types';

const KEY_PATIENTS = 'frontbench_patients_v1';
const KEY_APPOINTMENTS = 'frontbench_appointments_v1';
const KEY_BLOCKS = 'frontbench_blocks_v1';
const KEY_WAITLIST = 'frontbench_waitlist_v1';
const KEY_QUEUE = 'frontbench_queue_v1';
const KEY_DOCTORS = 'frontbench_doctors_v1';
const KEY_COUNTERS = 'frontbench_counters_v1';
const KEY_DEPARTMENTS = 'frontbench_departments_v1';
const KEY_SERVICES = 'frontbench_services_v1';
const KEY_INVOICES = 'frontbench_invoices_v1';
const KEY_CORPORATES = 'frontbench_corporates_v1';
const KEY_INSURANCE_TAGS = 'frontbench_insurance_tags_v1';
const KEY_TEMPLATES = 'frontbench_templates_v1';
const KEY_MESSAGES = 'frontbench_messages_v1';
const KEY_COMPLAINTS = 'frontbench_complaints_v1';
const KEY_RATINGS = 'frontbench_ratings_v1';
const KEY_INSURERS = 'frontbench_insurers_v1';
const KEY_POLICY_VERIFICATIONS = 'frontbench_policy_verifications_v1';
const KEY_PREAUTH = 'frontbench_preauth_v1';
const KEY_CLAIMS = 'frontbench_claims_v1';
const KEY_DAILY_CASH = 'frontbench_daily_cash_v1';
const KEY_DAILY_CLOSING = 'frontbench_daily_closing_v1';

type Counters = {
  patientId: number;
  mrnByClinic: Record<string, number>;
  tokenByClinicDayDoctor: Record<string, number>;
  invoiceByClinicYear: Record<string, number>;
  receiptByClinicYear: Record<string, number>;
};

const nowIso = () => new Date().toISOString();
const dayIso = (d = new Date()) => d.toISOString().slice(0, 10);

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

const normalizeDigits = (value: string) => value.replace(/\D/g, '');
const normalizeText = (value: string) => value.trim().toLowerCase();

export const FrontBenchStore = {
  calcLineTotals(line: { qty: number; unitPrice: number; gstRate: number; discount: { type: 'flat' | 'percent'; value: number } }) {
    const qty = Math.max(0, line.qty);
    const price = Math.max(0, line.unitPrice);
    const base = qty * price;
    const discount =
      line.discount.type === 'percent'
        ? (base * Math.max(0, Math.min(100, line.discount.value))) / 100
        : Math.max(0, line.discount.value);
    const taxable = Math.max(0, base - discount);
    const gst = (taxable * Math.max(0, line.gstRate)) / 100;
    const total = taxable + gst;
    return { base, discount, taxable, gst, total };
  },

  calcInvoiceTotals(invoice: Pick<Invoice, 'lines' | 'payments' | 'refunds'>) {
    const lines = invoice.lines.map((l) => this.calcLineTotals(l));
    const subtotal = lines.reduce((s, x) => s + x.taxable, 0);
    const gst = lines.reduce((s, x) => s + x.gst, 0);
    const total = subtotal + gst;
    const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    const refunded = invoice.refunds.reduce((s, r) => s + r.amount, 0);
    const balance = Math.max(0, total - paid + refunded);
    return { subtotal, gst, total, paid, refunded, balance };
  },

  getDoctors(): DoctorCRM[] {
    const existing = readJson<DoctorCRM[]>(KEY_DOCTORS, []);
    if (existing.length > 0) return existing;
    const seeded: DoctorCRM[] = [
      { id: 'doc_1', name: 'Dr. Ananya Rao', specialization: 'General Physician', room: 'Room 101', isActive: true },
      { id: 'doc_2', name: 'Dr. Vikram Singh', specialization: 'Cardiology', room: 'Room 102', isActive: true },
      { id: 'doc_3', name: 'Dr. Meera Iyer', specialization: 'Pediatrics', room: 'Room 103', isActive: true },
    ];
    writeJson(KEY_DOCTORS, seeded);
    return seeded;
  },

  saveDoctors(doctors: DoctorCRM[]) {
    writeJson(KEY_DOCTORS, doctors);
  },

  getDepartments(): Department[] {
    const existing = readJson<Department[]>(KEY_DEPARTMENTS, []);
    if (existing.length > 0) return existing;
    const seeded: Department[] = [
      { id: 'dep_gp', name: 'General', color: '#2563eb', isActive: true },
      { id: 'dep_cardio', name: 'Cardiology', color: '#dc2626', isActive: true },
      { id: 'dep_peds', name: 'Pediatrics', color: '#16a34a', isActive: true },
    ];
    writeJson(KEY_DEPARTMENTS, seeded);
    return seeded;
  },

  saveDepartments(deps: Department[]) {
    writeJson(KEY_DEPARTMENTS, deps);
  },

  getPatients(): PatientCRM[] {
    return readJson<PatientCRM[]>(KEY_PATIENTS, []);
  },

  savePatients(patients: PatientCRM[]) {
    writeJson(KEY_PATIENTS, patients);
  },

  getAppointments(): AppointmentCRM[] {
    return readJson<AppointmentCRM[]>(KEY_APPOINTMENTS, []);
  },

  saveAppointments(appointments: AppointmentCRM[]) {
    writeJson(KEY_APPOINTMENTS, appointments);
  },

  getBlockedSlots(): BlockedSlot[] {
    return readJson<BlockedSlot[]>(KEY_BLOCKS, []);
  },

  saveBlockedSlots(blocks: BlockedSlot[]) {
    writeJson(KEY_BLOCKS, blocks);
  },

  getWaitlist(): WaitlistEntry[] {
    return readJson<WaitlistEntry[]>(KEY_WAITLIST, []);
  },

  saveWaitlist(entries: WaitlistEntry[]) {
    writeJson(KEY_WAITLIST, entries);
  },

  getQueue(): QueueItem[] {
    return readJson<QueueItem[]>(KEY_QUEUE, []);
  },

  saveQueue(queue: QueueItem[]) {
    writeJson(KEY_QUEUE, queue);
  },

  getCounters(): Counters {
    return readJson<Counters>(KEY_COUNTERS, {
      patientId: 1000,
      mrnByClinic: {},
      tokenByClinicDayDoctor: {},
      invoiceByClinicYear: {},
      receiptByClinicYear: {},
    });
  },

  saveCounters(counters: Counters) {
    writeJson(KEY_COUNTERS, counters);
  },

  buildPatientSearchKey(patient: Omit<PatientCRM, 'searchKey'>): string {
    const parts = [
      patient.mrn,
      patient.name,
      patient.phone,
      patient.email ?? '',
      patient.aadhaar ?? '',
      patient.insurance?.provider ?? '',
      patient.insurance?.policyNumber ?? '',
      patient.insurance?.memberId ?? '',
    ];
    return normalizeText(parts.join(' '));
  },

  generateMrn(clinicId: number): string {
    const counters = this.getCounters();
    const key = String(clinicId);
    const next = (counters.mrnByClinic[key] ?? 0) + 1;
    counters.mrnByClinic[key] = next;
    this.saveCounters(counters);

    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const seq = String(next).padStart(4, '0');
    return `MRN-${clinicId}-${y}${m}${d}-${seq}`;
  },

  generateInvoiceNo(clinicId: number, d = new Date()): string {
    const counters = this.getCounters();
    const y = d.getFullYear();
    const key = `${clinicId}_${y}`;
    const next = (counters.invoiceByClinicYear[key] ?? 0) + 1;
    counters.invoiceByClinicYear[key] = next;
    this.saveCounters(counters);
    return `INV-${clinicId}-${y}-${String(next).padStart(5, '0')}`;
  },

  generateReceiptNo(clinicId: number, d = new Date()): string {
    const counters = this.getCounters();
    const y = d.getFullYear();
    const key = `${clinicId}_${y}`;
    const next = (counters.receiptByClinicYear[key] ?? 0) + 1;
    counters.receiptByClinicYear[key] = next;
    this.saveCounters(counters);
    return `RCPT-${clinicId}-${y}-${String(next).padStart(5, '0')}`;
  },

  validateAadhaar(aadhaar?: string): { ok: boolean; reason?: string } {
    if (!aadhaar) return { ok: true };
    const digits = normalizeDigits(aadhaar);
    if (digits.length !== 12) return { ok: false, reason: 'Aadhaar must be 12 digits' };
    if (/^(\d)\1{11}$/.test(digits)) return { ok: false, reason: 'Aadhaar looks invalid' };
    return { ok: true };
  },

  validateInsurance(insurance?: { policyNumber?: string; validTo?: string }): { ok: boolean; reason?: string } {
    if (!insurance?.policyNumber && !insurance?.validTo) return { ok: true };
    if (insurance.policyNumber && insurance.policyNumber.trim().length < 5) {
      return { ok: false, reason: 'Policy number looks too short' };
    }
    if (insurance.validTo) {
      const t = Date.parse(insurance.validTo);
      if (Number.isNaN(t)) return { ok: false, reason: 'Policy valid-to date is invalid' };
    }
    return { ok: true };
  },

  findDuplicates(input: { phone?: string; aadhaar?: string; name?: string }, patients: PatientCRM[]): PatientCRM[] {
    const phoneDigits = input.phone ? normalizeDigits(input.phone) : '';
    const aadhaarDigits = input.aadhaar ? normalizeDigits(input.aadhaar) : '';
    const nameNorm = input.name ? normalizeText(input.name) : '';

    return patients.filter((p) => {
      const pPhone = normalizeDigits(p.phone);
      const pAadhaar = p.aadhaar ? normalizeDigits(p.aadhaar) : '';
      const pName = normalizeText(p.name);

      if (phoneDigits && pPhone && pPhone === phoneDigits) return true;
      if (aadhaarDigits && pAadhaar && pAadhaar === aadhaarDigits) return true;

      if (nameNorm && pName) {
        const nameMatch = pName.includes(nameNorm) || nameNorm.includes(pName);
        const last4PhoneMatch =
          phoneDigits.length >= 4 && pPhone.length >= 4 && pPhone.slice(-4) === phoneDigits.slice(-4);
        if (nameMatch && last4PhoneMatch) return true;
      }

      return false;
    });
  },

  createPatient(clinicId: number, data: Omit<PatientCRM, 'id' | 'clinicId' | 'mrn' | 'createdAt' | 'updatedAt' | 'searchKey'>): PatientCRM {
    const patients = this.getPatients();
    const counters = this.getCounters();
    counters.patientId += 1;
    this.saveCounters(counters);

    const mrn = this.generateMrn(clinicId);
    const base = {
      id: counters.patientId,
      clinicId,
      mrn,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...data,
    };
    const searchKey = this.buildPatientSearchKey(base);
    const patient: PatientCRM = { ...base, searchKey };

    this.savePatients([patient, ...patients]);
    return patient;
  },

  updatePatient(patientId: number, patch: Partial<PatientCRM>): PatientCRM | null {
    const patients = this.getPatients();
    const idx = patients.findIndex((p) => p.id === patientId);
    if (idx === -1) return null;

    const next: PatientCRM = {
      ...patients[idx],
      ...patch,
      updatedAt: nowIso(),
    };
    next.searchKey = this.buildPatientSearchKey(next);
    const updated = [...patients];
    updated[idx] = next;
    this.savePatients(updated);
    return next;
  },

  getPatientByMrn(mrn: string): PatientCRM | null {
    const key = normalizeText(mrn);
    const p = this.getPatients().find((x) => normalizeText(x.mrn) === key);
    return p ?? null;
  },

  upsertAppointment(appointment: AppointmentCRM) {
    const all = this.getAppointments();
    const idx = all.findIndex((a) => a.id === appointment.id);
    const next = {
      ...appointment,
      updatedAt: nowIso(),
    };
    if (idx === -1) this.saveAppointments([next, ...all]);
    else {
      const copy = [...all];
      copy[idx] = next;
      this.saveAppointments(copy);
    }
  },

  createAppointment(appointment: Omit<AppointmentCRM, 'id' | 'createdAt' | 'updatedAt'>): AppointmentCRM {
    const created: AppointmentCRM = {
      ...appointment,
      id: `apt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.saveAppointments([created, ...this.getAppointments()]);
    return created;
  },

  createBlockedSlot(block: Omit<BlockedSlot, 'id'>): BlockedSlot {
    const created: BlockedSlot = {
      ...block,
      id: `blk_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    };
    this.saveBlockedSlots([created, ...this.getBlockedSlots()]);
    return created;
  },

  createWaitlist(entry: Omit<WaitlistEntry, 'id' | 'createdAt'>): WaitlistEntry {
    const created: WaitlistEntry = {
      ...entry,
      id: `w_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: nowIso(),
    };
    this.saveWaitlist([created, ...this.getWaitlist()]);
    return created;
  },

  generateToken(clinicId: number, doctorId: string, dayIso: string): string {
    const counters = this.getCounters();
    const dayKey = `${clinicId}_${dayIso}_${doctorId}`;
    const next = (counters.tokenByClinicDayDoctor[dayKey] ?? 0) + 1;
    counters.tokenByClinicDayDoctor[dayKey] = next;
    this.saveCounters(counters);

    const prefix = doctorId.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase() || 'T';
    return `${prefix}${String(next).padStart(3, '0')}`;
  },

  createQueueItem(item: Omit<QueueItem, 'id' | 'createdAt' | 'updatedAt' | 'token'> & { dayIso: string }): QueueItem {
    const token = this.generateToken(item.clinicId, item.doctorId, item.dayIso);
    const created: QueueItem = {
      id: `q_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      clinicId: item.clinicId,
      doctorId: item.doctorId,
      patientMrn: item.patientMrn,
      token,
      status: item.status,
      priority: item.priority,
      room: item.room,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.saveQueue([created, ...this.getQueue()]);
    return created;
  },

  updateQueueItem(queueId: string, patch: Partial<QueueItem>): QueueItem | null {
    const all = this.getQueue();
    const idx = all.findIndex((q) => q.id === queueId);
    if (idx === -1) return null;
    const updated: QueueItem = {
      ...all[idx],
      ...patch,
      updatedAt: nowIso(),
    };
    const copy = [...all];
    copy[idx] = updated;
    this.saveQueue(copy);
    return updated;
  },

  getServiceCatalog(): ServiceCatalogItem[] {
    const existing = readJson<ServiceCatalogItem[]>(KEY_SERVICES, []);
    if (existing.length > 0) return existing;
    const seeded: ServiceCatalogItem[] = [
      { id: 'svc_consult_gp', name: 'Consultation - General', category: 'consultation', price: 500, gstRate: 0, isActive: true },
      { id: 'svc_consult_specialist', name: 'Consultation - Specialist', category: 'consultation', price: 800, gstRate: 0, isActive: true },
      { id: 'svc_cbc', name: 'Lab - CBC', category: 'lab', price: 350, gstRate: 0, isActive: true },
      { id: 'svc_ecg', name: 'Procedure - ECG', category: 'procedure', price: 600, gstRate: 0, isActive: true },
    ];
    writeJson(KEY_SERVICES, seeded);
    return seeded;
  },

  saveServiceCatalog(items: ServiceCatalogItem[]) {
    writeJson(KEY_SERVICES, items);
  },

  getCorporateAccounts(): CorporateAccount[] {
    const existing = readJson<CorporateAccount[]>(KEY_CORPORATES, []);
    if (existing.length > 0) return existing;
    const seeded: CorporateAccount[] = [{ id: 'corp_1', name: 'Acme Corp', creditLimit: 100000, isActive: true }];
    writeJson(KEY_CORPORATES, seeded);
    return seeded;
  },

  saveCorporateAccounts(items: CorporateAccount[]) {
    writeJson(KEY_CORPORATES, items);
  },

  getInsuranceTags(): InsuranceClaimTag[] {
    const existing = readJson<InsuranceClaimTag[]>(KEY_INSURANCE_TAGS, []);
    if (existing.length > 0) return existing;
    const seeded: InsuranceClaimTag[] = [
      { id: 'tag_cashless', name: 'Cashless', insurer: 'Star Health', tpa: 'MediAssist', isActive: true },
    ];
    writeJson(KEY_INSURANCE_TAGS, seeded);
    return seeded;
  },

  saveInsuranceTags(items: InsuranceClaimTag[]) {
    writeJson(KEY_INSURANCE_TAGS, items);
  },

  getInvoices(): Invoice[] {
    return readJson<Invoice[]>(KEY_INVOICES, []);
  },

  saveInvoices(items: Invoice[]) {
    writeJson(KEY_INVOICES, items);
  },

  createInvoice(clinicId: number, data: Omit<Invoice, 'id' | 'clinicId' | 'invoiceNo' | 'createdAt' | 'updatedAt'>): Invoice {
    const created: Invoice = {
      ...data,
      id: `inv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      clinicId,
      invoiceNo: this.generateInvoiceNo(clinicId),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.saveInvoices([created, ...this.getInvoices()]);
    return created;
  },

  upsertInvoice(invoice: Invoice) {
    const all = this.getInvoices();
    const idx = all.findIndex((i) => i.id === invoice.id);
    const next: Invoice = { ...invoice, updatedAt: nowIso() };
    if (idx === -1) this.saveInvoices([next, ...all]);
    else {
      const copy = [...all];
      copy[idx] = next;
      this.saveInvoices(copy);
    }
  },

  addPayment(invoiceId: string, payment: Omit<Invoice['payments'][number], 'id'>) {
    const all = this.getInvoices();
    const inv = all.find((i) => i.id === invoiceId);
    if (!inv) return null;
    const nextPayment = { ...payment, id: `pay_${Date.now()}_${Math.random().toString(16).slice(2)}` };
    const next: Invoice = { ...inv, payments: [nextPayment, ...inv.payments] };
    const totals = this.calcInvoiceTotals(next);
    next.status = totals.balance === 0 ? 'paid' : next.payments.length > 0 ? 'partially_paid' : next.status;
    if (!next.receiptNo) next.receiptNo = this.generateReceiptNo(inv.clinicId);
    this.upsertInvoice(next);
    return next;
  },

  addRefund(invoiceId: string, refund: Omit<Refund, 'id'>) {
    const all = this.getInvoices();
    const inv = all.find((i) => i.id === invoiceId);
    if (!inv) return null;
    const nextRefund: Refund = { ...refund, id: `ref_${Date.now()}_${Math.random().toString(16).slice(2)}` };
    const next: Invoice = { ...inv, refunds: [nextRefund, ...inv.refunds] };
    this.upsertInvoice(next);
    return next;
  },

  getMessageTemplates(): MessageTemplate[] {
    const existing = readJson<MessageTemplate[]>(KEY_TEMPLATES, []);
    if (existing.length > 0) return existing;
    const seeded: MessageTemplate[] = [
      { id: 'tpl_appt_rem_sms', name: 'Appointment Reminder', channel: 'sms', body: 'Reminder: your appointment is scheduled. Please arrive 10 mins early.', isActive: true },
      { id: 'tpl_followup_wa', name: 'Follow-up', channel: 'whatsapp', body: 'Hi {{name}}, how are you feeling after your visit? Reply 1-5 for satisfaction.', isActive: true },
      { id: 'tpl_birthday_sms', name: 'Birthday Wish', channel: 'sms', body: 'Happy Birthday {{name}}! Wishing you good health from our clinic.', isActive: true },
    ];
    writeJson(KEY_TEMPLATES, seeded);
    return seeded;
  },

  saveMessageTemplates(items: MessageTemplate[]) {
    writeJson(KEY_TEMPLATES, items);
  },

  getMessageLogs(): MessageLog[] {
    return readJson<MessageLog[]>(KEY_MESSAGES, []);
  },

  saveMessageLogs(items: MessageLog[]) {
    writeJson(KEY_MESSAGES, items);
  },

  queueMessage(log: Omit<MessageLog, 'id' | 'createdAt' | 'status'>): MessageLog {
    const created: MessageLog = {
      ...log,
      id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: nowIso(),
      status: 'queued',
    };
    this.saveMessageLogs([created, ...this.getMessageLogs()]);
    return created;
  },

  markMessageSent(id: string) {
    const logs = this.getMessageLogs();
    const idx = logs.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const next = { ...logs[idx], status: 'sent' as const, sentAt: nowIso() };
    const copy = [...logs];
    copy[idx] = next;
    this.saveMessageLogs(copy);
  },

  getComplaints(): Complaint[] {
    return readJson<Complaint[]>(KEY_COMPLAINTS, []);
  },

  saveComplaints(items: Complaint[]) {
    writeJson(KEY_COMPLAINTS, items);
  },

  getRatings(): SatisfactionRating[] {
    return readJson<SatisfactionRating[]>(KEY_RATINGS, []);
  },

  saveRatings(items: SatisfactionRating[]) {
    writeJson(KEY_RATINGS, items);
  },

  getInsurers(): InsuranceCompany[] {
    const existing = readJson<InsuranceCompany[]>(KEY_INSURERS, []);
    if (existing.length > 0) return existing;
    const seeded: InsuranceCompany[] = [
      { id: 'ins_1', name: 'Star Health', isActive: true },
      { id: 'ins_2', name: 'HDFC ERGO', isActive: true },
      { id: 'ins_3', name: 'ICICI Lombard', isActive: true },
    ];
    writeJson(KEY_INSURERS, seeded);
    return seeded;
  },

  saveInsurers(items: InsuranceCompany[]) {
    writeJson(KEY_INSURERS, items);
  },

  getPolicyVerifications(): PolicyVerification[] {
    return readJson<PolicyVerification[]>(KEY_POLICY_VERIFICATIONS, []);
  },

  savePolicyVerifications(items: PolicyVerification[]) {
    writeJson(KEY_POLICY_VERIFICATIONS, items);
  },

  getPreAuthRequests(): PreAuthRequest[] {
    return readJson<PreAuthRequest[]>(KEY_PREAUTH, []);
  },

  savePreAuthRequests(items: PreAuthRequest[]) {
    writeJson(KEY_PREAUTH, items);
  },

  getClaims(): Claim[] {
    return readJson<Claim[]>(KEY_CLAIMS, []);
  },

  saveClaims(items: Claim[]) {
    writeJson(KEY_CLAIMS, items);
  },

  getDailyCashReports(): DailyCashReport[] {
    return readJson<DailyCashReport[]>(KEY_DAILY_CASH, []);
  },

  saveDailyCashReports(items: DailyCashReport[]) {
    writeJson(KEY_DAILY_CASH, items);
  },

  getDailyClosingReports(): DailyClosingReport[] {
    return readJson<DailyClosingReport[]>(KEY_DAILY_CLOSING, []);
  },

  saveDailyClosingReports(items: DailyClosingReport[]) {
    writeJson(KEY_DAILY_CLOSING, items);
  },

  generateDailyCashReport(clinicId: number, day = dayIso()): DailyCashReport {
    const invoices = this.getInvoices().filter((i) => i.clinicId === clinicId);
    const totalsByMode = {
      cash: 0,
      upi: 0,
      card: 0,
      bank_transfer: 0,
      insurance: 0,
      credit: 0,
    };

    let totalRefunded = 0;
    for (const inv of invoices) {
      for (const p of inv.payments) {
        if (p.receivedAt.slice(0, 10) !== day) continue;
        totalsByMode[p.mode] += p.amount;
      }
      for (const r of inv.refunds) {
        if (r.refundedAt.slice(0, 10) !== day) continue;
        totalRefunded += r.amount;
      }
    }
    const totalCollected = Object.values(totalsByMode).reduce((s, v) => s + v, 0);
    const report: DailyCashReport = {
      id: `cash_${clinicId}_${day}`,
      clinicId,
      dayIso: day,
      totalsByMode,
      totalCollected,
      totalRefunded,
      generatedAt: nowIso(),
    };

    const all = this.getDailyCashReports().filter((r) => !(r.clinicId === clinicId && r.dayIso === day));
    this.saveDailyCashReports([report, ...all]);
    return report;
  },

  createDailyClosingReport(report: Omit<DailyClosingReport, 'id' | 'expectedCash' | 'variance' | 'closedAt'>): DailyClosingReport {
    const expectedCash = report.openingCash + report.cashCollected - report.cashRefunded;
    const variance = report.countedCash - expectedCash;
    const created: DailyClosingReport = {
      ...report,
      id: `close_${report.clinicId}_${report.dayIso}`,
      expectedCash,
      variance,
      closedAt: nowIso(),
    };
    const all = this.getDailyClosingReports().filter((r) => !(r.clinicId === report.clinicId && r.dayIso === report.dayIso));
    this.saveDailyClosingReports([created, ...all]);
    return created;
  },
};
