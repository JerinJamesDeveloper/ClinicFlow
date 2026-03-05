import { FrontBenchStore } from './frontbench.store';
import type { PatientCRM } from '../../types/frontbench.types';
import type {
  ChainOfCustodyEvent,
  LabMasterData,
  LabPackageDeal,
  LabRequest,
  LabResultValue,
  OutsourcedLabPartner,
  QcLog,
  ReagentItem,
  ReferenceRange,
  TestPanel,
} from '../../types/lab.types';

const KEY_LAB_REQUESTS = 'lab_requests_v2';
const KEY_LAB_MASTER = 'lab_master_v2';
const KEY_LAB_QC = 'lab_qc_v2';
const KEY_LAB_REAGENTS = 'lab_reagents_v2';

const nowIso = () => new Date().toISOString();
const idFrom = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const readJson = <T,>(key: string, fallback: T): T => {
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

const defaultMasterData = (): LabMasterData => ({
  units: [
    { id: 'u_mgdl', symbol: 'mg/dL', label: 'Milligrams per deciliter' },
    { id: 'u_mmoll', symbol: 'mmol/L', label: 'Millimoles per liter' },
    { id: 'u_gdl', symbol: 'g/dL', label: 'Grams per deciliter' },
    { id: 'u_pct', symbol: '%', label: 'Percent' },
  ],
  panels: [
    {
      id: 'panel_cbc',
      code: 'CBC',
      name: 'Complete Blood Count',
      fastingRequired: false,
      highValue: false,
      price: 350,
      components: [
        { id: 'c_hb', code: 'HB', name: 'Hemoglobin', unitSymbol: 'g/dL' },
        { id: 'c_wbc', code: 'WBC', name: 'WBC Count', unitSymbol: 'mg/dL' },
        { id: 'c_plt', code: 'PLT', name: 'Platelets', unitSymbol: 'mg/dL' },
      ],
    },
    {
      id: 'panel_lft',
      code: 'LFT',
      name: 'Liver Function Test',
      fastingRequired: true,
      highValue: true,
      price: 1200,
      components: [
        { id: 'c_alt', code: 'ALT', name: 'ALT', unitSymbol: 'U/L' },
        { id: 'c_ast', code: 'AST', name: 'AST', unitSymbol: 'U/L' },
        { id: 'c_bil', code: 'BIL', name: 'Bilirubin Total', unitSymbol: 'mg/dL' },
        { id: 'c_alb', code: 'ALB', name: 'Albumin', unitSymbol: 'g/dL' },
      ],
    },
    {
      id: 'panel_hba1c',
      code: 'HBA1C',
      name: 'HbA1c',
      fastingRequired: false,
      highValue: false,
      price: 800,
      components: [{ id: 'c_a1c', code: 'A1C', name: 'HbA1c', unitSymbol: '%' }],
    },
  ],
  ranges: [
    {
      id: 'r_hb_m',
      testCode: 'CBC',
      componentCode: 'HB',
      sex: 'male',
      minAge: 18,
      maxAge: 120,
      pregnancy: 'any',
      low: 13,
      high: 17,
      panicLow: 7,
      panicHigh: 21,
      unitSymbol: 'g/dL',
    },
    {
      id: 'r_hb_f',
      testCode: 'CBC',
      componentCode: 'HB',
      sex: 'female',
      minAge: 18,
      maxAge: 120,
      pregnancy: 'no',
      low: 12,
      high: 15,
      panicLow: 7,
      panicHigh: 20,
      unitSymbol: 'g/dL',
    },
    {
      id: 'r_alt',
      testCode: 'LFT',
      componentCode: 'ALT',
      sex: 'any',
      minAge: 0,
      maxAge: 120,
      pregnancy: 'any',
      low: 7,
      high: 56,
      panicHigh: 500,
      unitSymbol: 'U/L',
    },
    {
      id: 'r_a1c',
      testCode: 'HBA1C',
      componentCode: 'A1C',
      sex: 'any',
      minAge: 0,
      maxAge: 120,
      pregnancy: 'any',
      low: 4,
      high: 5.6,
      panicHigh: 12,
      unitSymbol: '%',
    },
  ],
  packageDeals: [
    { id: 'pkg_diabetes', name: 'Diabetes Check Package', panelIds: ['panel_hba1c', 'panel_cbc'], discountPercent: 12 },
  ],
  outsourcedLabs: [{ id: 'out_1', name: 'Metro Reference Labs', contact: '+91-9000000000', slaHours: 24 }],
});

const defaultReagents = (): ReagentItem[] => [
  { id: 'rgt_cbc', name: 'CBC Reagent Kit', panelCode: 'CBC', stockUnits: 40, reorderLevel: 10, unitLabel: 'kits', updatedAt: nowIso() },
  { id: 'rgt_lft', name: 'LFT Reagent Kit', panelCode: 'LFT', stockUnits: 18, reorderLevel: 6, unitLabel: 'kits', updatedAt: nowIso() },
  { id: 'rgt_a1c', name: 'HbA1c Cartridge', panelCode: 'HBA1C', stockUnits: 22, reorderLevel: 8, unitLabel: 'cartridges', updatedAt: nowIso() },
];

const patientProfile = (patientMrn: string): Pick<LabRequest, 'patientName' | 'patientSex' | 'patientAgeYears' | 'isPregnant'> => {
  const p = FrontBenchStore.getPatientByMrn(patientMrn);
  if (!p) return { patientName: patientMrn, patientSex: 'any', patientAgeYears: 30, isPregnant: false };

  const age = typeof p.age === 'number' ? p.age : 30;
  return {
    patientName: p.name,
    patientSex: p.gender ?? 'any',
    patientAgeYears: age,
    isPregnant: false,
  };
};

const matchRange = (
  ranges: ReferenceRange[],
  panelCode: string,
  componentCode: string,
  patient: Pick<LabRequest, 'patientSex' | 'patientAgeYears' | 'isPregnant'>
): ReferenceRange | undefined => {
  return ranges.find((range) => {
    if (range.testCode !== panelCode || range.componentCode !== componentCode) return false;
    if (range.sex !== 'any' && range.sex !== patient.patientSex) return false;
    if (patient.patientAgeYears < range.minAge || patient.patientAgeYears > range.maxAge) return false;
    if (range.pregnancy === 'any') return true;
    return range.pregnancy === (patient.isPregnant ? 'yes' : 'no');
  });
};

const makeResultsTemplate = (
  panel: TestPanel,
  ranges: ReferenceRange[],
  patient: Pick<LabRequest, 'patientSex' | 'patientAgeYears' | 'isPregnant'>
): LabResultValue[] => {
  return panel.components.map((component) => {
    const selected = matchRange(ranges, panel.code, component.code, patient);
    return {
      componentCode: component.code,
      componentName: component.name,
      value: null,
      unitSymbol: component.unitSymbol,
      refLow: selected?.low,
      refHigh: selected?.high,
      panicLow: selected?.panicLow,
      panicHigh: selected?.panicHigh,
      abnormal: false,
      panic: false,
    };
  });
};

const makeBarcode = (patientMrn: string, panelCode: string) => {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const seed = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${panelCode}-${patientMrn.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase()}-${ymd}-${seed}`;
};

const ensureLabService = (panel: TestPanel) => {
  const services = FrontBenchStore.getServiceCatalog();
  const existing = services.find((svc) => svc.category === 'lab' && svc.name.toLowerCase() === `lab - ${panel.code.toLowerCase()}`);
  if (existing) return existing.id;

  const newServiceId = `svc_lab_${panel.code.toLowerCase()}`;
  FrontBenchStore.saveServiceCatalog([
    {
      id: newServiceId,
      name: `Lab - ${panel.code}`,
      category: 'lab',
      price: panel.price,
      gstRate: 0,
      isActive: true,
    },
    ...services,
  ]);
  return newServiceId;
};

const invoiceBalance = (invoiceId?: string): number => {
  if (!invoiceId) return 0;
  const invoice = FrontBenchStore.getInvoices().find((inv) => inv.id === invoiceId);
  if (!invoice) return 0;
  const totals = FrontBenchStore.calcInvoiceTotals(invoice);
  return totals.balance;
};

const updateById = (requests: LabRequest[], id: string, updater: (request: LabRequest) => LabRequest): LabRequest[] => {
  return requests.map((request) => (request.id === id ? updater(request) : request));
};

export const LabStore = {
  getMasterData(): LabMasterData {
    const data = readJson<LabMasterData | null>(KEY_LAB_MASTER, null);
    if (data) return data;
    const seeded = defaultMasterData();
    writeJson(KEY_LAB_MASTER, seeded);
    return seeded;
  },

  saveMasterData(next: LabMasterData) {
    writeJson(KEY_LAB_MASTER, next);
  },

  getRequests(): LabRequest[] {
    const list = readJson<LabRequest[]>(KEY_LAB_REQUESTS, []);
    if (list.length > 0) return this.syncFinancialClearance(list);

    const patients = FrontBenchStore.getPatients();
    if (patients.length === 0) return [];

    const master = this.getMasterData();
    const p = patients[0];
    const seeded = this.createRequest({
      clinicId: p.clinicId,
      patientMrn: p.mrn,
      doctorName: 'Dr. System Seed',
      requestedByRole: 'doctor',
      source: 'doctor_workbench',
      panelCodeOrId: 'CBC',
      priority: 'routine',
    });
    return [seeded];
  },

  saveRequests(items: LabRequest[]) {
    writeJson(KEY_LAB_REQUESTS, items);
  },

  syncFinancialClearance(requests?: LabRequest[]): LabRequest[] {
    const current = requests ?? readJson<LabRequest[]>(KEY_LAB_REQUESTS, []);
    const next = current.map((request) => {
      const balance = invoiceBalance(request.billingInvoiceId);
      return { ...request, billingClearance: balance > 0 ? 'pending' : 'cleared' };
    });
    writeJson(KEY_LAB_REQUESTS, next);
    return next;
  },

  createRequest(input: {
    clinicId: number;
    patientMrn: string;
    doctorName: string;
    requestedByRole: 'doctor' | 'front_desk';
    source: 'doctor_workbench' | 'front_desk';
    panelCodeOrId: string;
    priority: 'routine' | 'urgent' | 'emergency';
  }): LabRequest {
    const master = this.getMasterData();
    const panel =
      master.panels.find((item) => item.id === input.panelCodeOrId) ??
      master.panels.find((item) => item.code.toLowerCase() === input.panelCodeOrId.toLowerCase()) ??
      master.panels.find((item) => item.name.toLowerCase() === input.panelCodeOrId.toLowerCase()) ??
      master.panels[0];

    const serviceId = ensureLabService(panel);
    const patient = patientProfile(input.patientMrn);
    const line = {
      id: idFrom('line'),
      serviceId,
      description: `Lab - ${panel.code}`,
      qty: 1,
      unitPrice: panel.price,
      gstRate: 0,
      discount: { type: 'flat' as const, value: 0 },
      tags: [],
    };
    const invoice = FrontBenchStore.createInvoice(input.clinicId, {
      patientMrn: input.patientMrn,
      patientNameSnapshot: patient.patientName,
      issuedAt: nowIso(),
      status: 'issued',
      lines: [line],
      payments: [],
      refunds: [],
      billingType: 'self',
      notes: `Auto-created for lab request ${panel.code}`,
    });

    const created: LabRequest = {
      id: idFrom('lab'),
      clinicId: input.clinicId,
      patientMrn: input.patientMrn,
      patientName: patient.patientName,
      patientSex: patient.patientSex,
      patientAgeYears: patient.patientAgeYears,
      isPregnant: patient.isPregnant,
      doctorName: input.doctorName,
      requestedByRole: input.requestedByRole,
      source: input.source,
      panelId: panel.id,
      panelCode: panel.code,
      panelName: panel.name,
      priority: input.priority,
      status: 'pending_collection',
      billingClearance: 'pending',
      billingInvoiceId: invoice.id,
      createdAt: nowIso(),
      specimenBarcode: makeBarcode(input.patientMrn, panel.code),
      instructions: panel.fastingRequired ? ['Fasting required (8-10 hours)', 'Collect before morning medication'] : ['No fasting required'],
      highValue: panel.highValue,
      chainOfCustody: panel.highValue
        ? [{ id: idFrom('coc'), at: nowIso(), by: input.doctorName, action: 'Requested', note: 'High-value panel: custody tracking enabled' }]
        : [],
      results: makeResultsTemplate(panel, master.ranges, patient),
    };

    const all = this.syncFinancialClearance([created, ...readJson<LabRequest[]>(KEY_LAB_REQUESTS, [])]);
    writeJson(KEY_LAB_REQUESTS, all);
    return all[0];
  },

  createPackageRequests(input: {
    clinicId: number;
    patientMrn: string;
    doctorName: string;
    requestedByRole: 'doctor' | 'front_desk';
    source: 'doctor_workbench' | 'front_desk';
    packageId: string;
    priority: 'routine' | 'urgent' | 'emergency';
  }): LabRequest[] {
    const master = this.getMasterData();
    const pkg = master.packageDeals.find((item) => item.id === input.packageId);
    if (!pkg) return [];
    const created: LabRequest[] = [];
    for (const panelId of pkg.panelIds) {
      const request = this.createRequest({
        clinicId: input.clinicId,
        patientMrn: input.patientMrn,
        doctorName: input.doctorName,
        requestedByRole: input.requestedByRole,
        source: input.source,
        panelCodeOrId: panelId,
        priority: input.priority,
      });
      created.push(request);
    }
    return created;
  },

  addCustodyEvent(requestId: string, by: string, action: string, note?: string) {
    const next = updateById(this.getRequests(), requestId, (request) => ({
      ...request,
      chainOfCustody: [{ id: idFrom('coc'), at: nowIso(), by, action, note }, ...request.chainOfCustody],
    }));
    this.saveRequests(next);
  },

  collectSpecimen(requestId: string, collectedBy: string) {
    const next = updateById(this.getRequests(), requestId, (request) => {
      if (request.billingClearance !== 'cleared') return request;
      return {
        ...request,
        status: 'collected',
        collectedAt: nowIso(),
        chainOfCustody: request.highValue
          ? [{ id: idFrom('coc'), at: nowIso(), by: collectedBy, action: 'Collected', note: 'Specimen collected with barcode scan' }, ...request.chainOfCustody]
          : request.chainOfCustody,
      };
    });
    this.saveRequests(next);
  },

  rejectSpecimen(requestId: string, rejectedBy: string, reason: string) {
    const next = updateById(this.getRequests(), requestId, (request) => ({
      ...request,
      status: 'rejected',
      rejectedAt: nowIso(),
      rejectedReason: reason || 'Specimen quality issue',
      chainOfCustody: request.highValue
        ? [{ id: idFrom('coc'), at: nowIso(), by: rejectedBy, action: 'Rejected', note: reason || 'Specimen quality issue' }, ...request.chainOfCustody]
        : request.chainOfCustody,
    }));
    this.saveRequests(next);
  },

  enterResults(requestId: string, enteredBy: string, values: Array<{ componentCode: string; value: number | null }>) {
    const next = updateById(this.getRequests(), requestId, (request) => {
      const merged = request.results.map((result) => {
        const incoming = values.find((entry) => entry.componentCode === result.componentCode);
        const value = incoming ? incoming.value : result.value;
        const abnormal = value != null && ((result.refLow != null && value < result.refLow) || (result.refHigh != null && value > result.refHigh));
        const panic =
          value != null && ((result.panicLow != null && value < result.panicLow) || (result.panicHigh != null && value > result.panicHigh));
        return { ...result, value, abnormal, panic };
      });
      const shouldBeInProgress = request.status === 'collected' || request.status === 'outsourced';
      return {
        ...request,
        status: shouldBeInProgress ? 'in_progress' : request.status,
        results: merged,
        enteredBy,
        enteredAt: nowIso(),
        status: 'result_entered',
      };
    });
    this.saveRequests(next);
  },

  verifyResults(requestId: string, verifiedBy: string, releaseToDoctor: boolean) {
    const next = updateById(this.getRequests(), requestId, (request) => {
      const base = {
        ...request,
        verifiedBy,
        verifiedAt: nowIso(),
      };
      if (!releaseToDoctor) return { ...base, status: 'verified' as const };
      return { ...base, status: 'released' as const, releasedAt: nowIso() };
    });
    this.saveRequests(next);
  },

  acknowledgePanic(requestId: string, by: string) {
    const next = updateById(this.getRequests(), requestId, (request) => ({
      ...request,
      panicAcknowledgedAt: nowIso(),
      panicAcknowledgedBy: by,
    }));
    this.saveRequests(next);
  },

  sendToOutsourcedLab(requestId: string, partnerId: string) {
    const master = this.getMasterData();
    const partner = master.outsourcedLabs.find((item) => item.id === partnerId);
    if (!partner) return;
    const expectedAt = new Date(Date.now() + partner.slaHours * 60 * 60 * 1000).toISOString();
    const next = updateById(this.getRequests(), requestId, (request) => ({
      ...request,
      status: 'outsourced',
      outsourced: {
        partnerId,
        partnerName: partner.name,
        sentAt: nowIso(),
        expectedAt,
      },
    }));
    this.saveRequests(next);
  },

  receiveOutsourcedResult(requestId: string, by: string) {
    const next = updateById(this.getRequests(), requestId, (request) => ({
      ...request,
      outsourced: request.outsourced ? { ...request.outsourced, receivedAt: nowIso() } : undefined,
      enteredBy: by,
      enteredAt: nowIso(),
      status: 'result_entered',
    }));
    this.saveRequests(next);
  },

  getQcLogs(): QcLog[] {
    return readJson<QcLog[]>(KEY_LAB_QC, []);
  },

  addQcLog(entry: Omit<QcLog, 'id' | 'at' | 'passed'>) {
    const passed = Math.abs(entry.expected - entry.observed) <= Math.max(0.2, entry.expected * 0.1);
    const next: QcLog = {
      ...entry,
      id: idFrom('qc'),
      at: nowIso(),
      passed,
    };
    writeJson(KEY_LAB_QC, [next, ...this.getQcLogs()]);
    return next;
  },

  getReagents(): ReagentItem[] {
    const existing = readJson<ReagentItem[]>(KEY_LAB_REAGENTS, []);
    if (existing.length > 0) return existing;
    const seeded = defaultReagents();
    writeJson(KEY_LAB_REAGENTS, seeded);
    return seeded;
  },

  saveReagents(next: ReagentItem[]) {
    writeJson(KEY_LAB_REAGENTS, next);
  },

  updateReagentStock(reagentId: string, nextStock: number) {
    const updated = this.getReagents().map((reagent) =>
      reagent.id === reagentId ? { ...reagent, stockUnits: Math.max(0, nextStock), updatedAt: nowIso() } : reagent
    );
    this.saveReagents(updated);
  },

  addReagent(entry: Omit<ReagentItem, 'id' | 'updatedAt'>) {
    const next: ReagentItem = { ...entry, id: idFrom('reagent'), updatedAt: nowIso() };
    this.saveReagents([next, ...this.getReagents()]);
  },

  addPanel(panel: Omit<TestPanel, 'id' | 'components'> & { components: Array<{ code: string; name: string; unitSymbol: string }> }) {
    const master = this.getMasterData();
    const nextPanel: TestPanel = {
      ...panel,
      id: idFrom('panel'),
      components: panel.components.map((component) => ({ ...component, id: idFrom('cmp') })),
    };
    this.saveMasterData({ ...master, panels: [nextPanel, ...master.panels] });
  },

  addRange(range: Omit<ReferenceRange, 'id'>) {
    const master = this.getMasterData();
    const next = { ...range, id: idFrom('range') };
    this.saveMasterData({ ...master, ranges: [next, ...master.ranges] });
  },

  addUnit(unit: { symbol: string; label: string }) {
    const master = this.getMasterData();
    const next = { id: idFrom('unit'), symbol: unit.symbol, label: unit.label };
    this.saveMasterData({ ...master, units: [next, ...master.units] });
  },

  addPackageDeal(pkg: Omit<LabPackageDeal, 'id'>) {
    const master = this.getMasterData();
    const next = { ...pkg, id: idFrom('pkg') };
    this.saveMasterData({ ...master, packageDeals: [next, ...master.packageDeals] });
  },

  addOutsourcedLabPartner(lab: Omit<OutsourcedLabPartner, 'id'>) {
    const master = this.getMasterData();
    const next = { ...lab, id: idFrom('out') };
    this.saveMasterData({ ...master, outsourcedLabs: [next, ...master.outsourcedLabs] });
  },

  cumulativeTrend(patientMrn: string, componentCode: string): Array<{ at: string; value: number }> {
    return this.getRequests()
      .filter((request) => request.patientMrn === patientMrn && (request.status === 'verified' || request.status === 'released'))
      .flatMap((request) =>
        request.results
          .filter((result) => result.componentCode === componentCode && typeof result.value === 'number')
          .map((result) => ({ at: request.verifiedAt || request.releasedAt || request.createdAt, value: result.value as number }))
      )
      .sort((a, b) => a.at.localeCompare(b.at));
  },

  workloadStats(): Array<{ technician: string; entries: number; avgTatMinutes: number }> {
    const grouped = new Map<string, { entries: number; tatMinutes: number }>();
    for (const request of this.getRequests()) {
      if (!request.enteredBy || !request.collectedAt || !request.verifiedAt) continue;
      const key = request.enteredBy;
      const current = grouped.get(key) ?? { entries: 0, tatMinutes: 0 };
      const tat = Math.max(0, (Date.parse(request.verifiedAt) - Date.parse(request.collectedAt)) / 60000);
      current.entries += 1;
      current.tatMinutes += tat;
      grouped.set(key, current);
    }
    return [...grouped.entries()].map(([technician, stat]) => ({
      technician,
      entries: stat.entries,
      avgTatMinutes: stat.entries ? Math.round(stat.tatMinutes / stat.entries) : 0,
    }));
  },

  getPatientByMrn(mrn: string): PatientCRM | null {
    return FrontBenchStore.getPatientByMrn(mrn);
  },
};
