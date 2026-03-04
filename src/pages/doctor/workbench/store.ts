import type { NurseRecord, VisitSnapshot, WorkbenchDraft } from './types';

const NURSE_KEY = 'nurse_pre_doctor_consults_v1';
const DRAFTS_KEY = 'doctor_workbench_drafts_v1';
const SUMMARY_KEY = 'doctor_visit_summaries_v1';

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

export const WorkbenchStore = {
  getNurseRecords(): NurseRecord[] {
    return readJson<NurseRecord[]>(NURSE_KEY, []);
  },

  getDrafts(): Record<string, WorkbenchDraft> {
    return readJson<Record<string, WorkbenchDraft>>(DRAFTS_KEY, {});
  },

  getDraft(appointmentId: string): WorkbenchDraft | null {
    const drafts = this.getDrafts();
    return drafts[appointmentId] ?? null;
  },

  saveDraft(appointmentId: string, draft: WorkbenchDraft) {
    const drafts = this.getDrafts();
    drafts[appointmentId] = draft;
    writeJson(DRAFTS_KEY, drafts);
  },

  getVisitSummaries(): VisitSnapshot[] {
    return readJson<VisitSnapshot[]>(SUMMARY_KEY, []);
  },

  addVisitSummary(snapshot: VisitSnapshot) {
    const all = this.getVisitSummaries();
    writeJson(SUMMARY_KEY, [snapshot, ...all]);
  },
};

export const idFrom = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

