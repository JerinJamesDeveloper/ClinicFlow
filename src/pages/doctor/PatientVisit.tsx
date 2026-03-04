import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { AppointmentsService } from '../../services/api/appointments.service';
import { DoctorService } from '../../services/api/doctor.service';
import { PatientsService } from '../../services/api/patients.service';
import { useDoctorStore } from '../../hooks/doctor/useDoctorStore';
import { DoctorStore } from '../../services/local/doctor.store';
import { FrontBenchStore } from '../../services/local/frontbench.store';
import { useFrontBenchScheduling } from '../../hooks/frontbench/useFrontBenchScheduling';
import { useAuth } from '../../hooks/useAuth';
import type { RxDrug } from '../../types/doctor.types';

const idFrom = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const frequencyPresets = ['OD', 'BD', 'TID', 'QID', 'HS', 'SOS'];
const durationPresets = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month'];

const labPanels: Record<string, string[]> = {
  'Fever Panel': ['CBC', 'CRP', 'Dengue NS1/IgM', 'Malaria Rapid Test'],
  'Diabetes Panel': ['FBS', 'PPBS', 'HbA1c', 'Creatinine', 'Urine Microalbumin'],
  'Cardiac Panel': ['ECG', 'Troponin', 'Lipid Profile'],
};

const labCatalog = Array.from(
  new Set([
    ...Object.values(labPanels).flat(),
    'LFT',
    'KFT',
    'TSH',
    'Urine Routine',
    'X-Ray Chest',
    'USG Abdomen',
  ])
).sort();

function getSpeechRecognition(): any | null {
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const PatientVisit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const appointmentId = Number(id);
  const navigate = useNavigate();
  const store = useDoctorStore();
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;

  // Check if this is a FrontBench appointment (string ID)
  const isFrontBenchAppointment = id && !Number.isFinite(Number(id));

  // Get FrontBench data if it's a FrontBench appointment
  const { appointments: frontbenchAppointments } = useFrontBenchScheduling(clinicId);
  const frontbenchPatients = useMemo(() => FrontBenchStore.getPatients(), []);

  const frontbenchAppointment = useMemo(() => {
    if (!isFrontBenchAppointment || !id) return null;
    return frontbenchAppointments.find(apt => apt.id === id) || null;
  }, [isFrontBenchAppointment, id, frontbenchAppointments]);

  const frontbenchPatient = useMemo(() => {
    if (!frontbenchAppointment) return null;
    return frontbenchPatients.find(p => p.mrn === frontbenchAppointment.patientMrn) || null;
  }, [frontbenchAppointment, frontbenchPatients]);

  // Fetch from API for numeric IDs
  const { data: apiAppointment, isLoading: isApiLoading } = useQuery(['appointment', appointmentId], () => AppointmentsService.getAppointmentById(appointmentId), {
    enabled: Number.isFinite(appointmentId) && !isFrontBenchAppointment,
  });

  // Use FrontBench data if available, otherwise API
  const appointment = isFrontBenchAppointment ? frontbenchAppointment : apiAppointment;
  const isLoading = isFrontBenchAppointment ? false : isApiLoading;

  // Build patient info from either source
  const patientId = useMemo(() => {
    if (isFrontBenchAppointment) {
      return frontbenchPatient?.id || (frontbenchAppointment ? parseInt(frontbenchAppointment.patientMrn.replace(/\D/g, '')) || frontbenchAppointment.patientMrn : null);
    }
    return (appointment as any)?.patient_id ?? (appointment as any)?.patient?.id ?? null;
  }, [isFrontBenchAppointment, frontbenchPatient, frontbenchAppointment, appointment]);

  const patient = useMemo(() => {
    if (isFrontBenchAppointment) {
      return frontbenchPatient ? {
        id: frontbenchPatient.id,
        name: frontbenchPatient.name,
        age: frontbenchPatient.age,
        gender: frontbenchPatient.gender,
        phone: frontbenchPatient.phone,
        clinic_id: frontbenchPatient.clinicId,
      } : {
        id: frontbenchAppointment?.patientMrn,
        name: frontbenchAppointment?.patientMrn,
        age: 0,
        gender: 'unknown',
        phone: '',
        clinic_id: clinicId,
      };
    }
    return (appointment as any)?.patient ?? null;
  }, [isFrontBenchAppointment, frontbenchPatient, frontbenchAppointment, appointment, clinicId]);

  const mrn = useMemo(() => {
    if (isFrontBenchAppointment && frontbenchPatient) {
      return frontbenchPatient.mrn;
    }
    const clinicIdVal = (patient as any)?.clinic_id ?? 1;
    const pid = (patient as any)?.id ?? patientId ?? 0;
    return `MRN-${clinicIdVal}-${pid}`;
  }, [patient, patientId, isFrontBenchAppointment, frontbenchPatient]);

  const profile = useMemo(() => (patientId ? store.getProfile(patientId) : null), [patientId, store]);
  const historyNotes = useMemo(() => (patientId ? store.getNotes(patientId) : []), [patientId, store]);

  const { data: patientHistory } = useQuery(['patientHistory', patientId], () => PatientsService.getPatientHistory(Number(patientId)), {
    enabled: Number.isFinite(Number(patientId)),
  });

  const [visitType, setVisitType] = useState<'new' | 'follow_up' | 'emergency'>(() => {
    const meta = Number.isFinite(appointmentId) ? store.getVisitMeta(appointmentId) : null;
    return (meta?.visitType as any) ?? 'follow_up';
  });
  const [paymentStatus, setPaymentStatus] = useState<'na' | 'unpaid' | 'paid'>(() => {
    const meta = Number.isFinite(appointmentId) ? store.getVisitMeta(appointmentId) : null;
    return (meta?.paymentStatus as any) ?? 'na';
  });

  const [allergiesInput, setAllergiesInput] = useState(() => profile?.allergies?.join(', ') ?? '');
  const [chronicInput, setChronicInput] = useState(() => profile?.chronicConditions?.join(', ') ?? '');
  const [medsInput, setMedsInput] = useState(() => profile?.currentMedications?.join(', ') ?? '');
  const [highRisk, setHighRisk] = useState(() => profile?.highRisk ?? false);

  const noteId = useMemo(() => `soap_${appointmentId}`, [appointmentId]);
  const existingNote = useMemo(() => historyNotes.find((n) => n.id === noteId) ?? null, [historyNotes, noteId]);

  const [subjective, setSubjective] = useState(existingNote?.subjective ?? '');
  const [objective, setObjective] = useState(existingNote?.objective ?? '');
  const [assessment, setAssessment] = useState(existingNote?.assessment ?? '');
  const [plan, setPlan] = useState(existingNote?.plan ?? '');
  const [icdTerm, setIcdTerm] = useState('');
  const [icd10, setIcd10] = useState<Array<{ code: string; label: string }>>(existingNote?.icd10 ?? []);
  const [templateId, setTemplateId] = useState(store.templates[0]?.id ?? '');

  const [symptoms, setSymptoms] = useState<string[]>([]);
  const symptomInputRef = useRef<HTMLInputElement | null>(null);

  const [vitals, setVitals] = useState({
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    weight: '',
    spo2: '',
  });

  const rxId = useMemo(() => `rx_${appointmentId}`, [appointmentId]);
  const lastRx = useMemo(() => (patientId ? store.getLastRx(patientId) : null), [patientId, store]);
  const existingRx = useMemo(() => (patientId ? store.getLastRx(patientId) : null), [patientId, store]);

  const [rxItems, setRxItems] = useState(() => existingRx?.items ?? [{
    id: idFrom('rx_item'),
    generic: '',
    brand: '',
    dosage: '',
    frequency: 'BD',
    duration: '5 days',
    instructions: '',
    quantity: undefined,
  }]);
  const [rxNotes, setRxNotes] = useState(existingRx?.notes ?? '');
  const [drugSearch, setDrugSearch] = useState('');

  const labId = useMemo(() => `lab_${appointmentId}`, [appointmentId]);
  const existingLab = useMemo(() => store.getLabForAppointment(appointmentId), [appointmentId, store]);
  const [labItems, setLabItems] = useState(() => existingLab?.items ?? []);
  const [labPanel, setLabPanel] = useState('');
  const [labTest, setLabTest] = useState('');
  const [labUrgency, setLabUrgency] = useState<'routine' | 'urgent' | 'emergency'>('routine');
  const [labNote, setLabNote] = useState('');

  const icdSuggestions = useMemo(() => {
    const t = icdTerm.trim().toLowerCase();
    if (!t) return [];
    return store.icd10.filter((x) => `${x.code} ${x.label}`.toLowerCase().includes(t)).slice(0, 8);
  }, [icdTerm, store.icd10]);

  const applyTemplate = () => {
    const tpl = store.templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setSubjective((v) => (v.trim() ? v : tpl.subjective));
    setObjective((v) => (v.trim() ? v : tpl.objective));
    setAssessment((v) => (v.trim() ? v : tpl.assessment));
    setPlan((v) => (v.trim() ? v : tpl.plan));
    toast.success('Template applied');
  };

  const addIcd = (code: string, label: string) => {
    if (icd10.some((x) => x.code === code)) return;
    setIcd10((prev) => [...prev, { code, label }]);
    setIcdTerm('');
  };
  const removeIcd = (code: string) => setIcd10((prev) => prev.filter((x) => x.code !== code));

  const addSymptom = (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (symptoms.includes(t)) return;
    setSymptoms((s) => [...s, t]);
  };

  const filteredDrugs = useMemo(() => {
    const t = drugSearch.trim().toLowerCase();
    if (!t) return store.drugs;
    return store.drugs
      .filter((d) => `${d.generic} ${d.brand ?? ''} ${d.strength ?? ''}`.toLowerCase().includes(t))
      .slice(0, 10);
  }, [drugSearch, store.drugs]);

  const addDrugToRx = (drug: RxDrug) => {
    setRxItems((items) => [
      {
        id: idFrom('rx_item'),
        drugId: drug.id,
        generic: drug.generic,
        brand: drug.brand,
        dosage: drug.strength ?? '',
        frequency: 'BD',
        duration: '5 days',
        instructions: '',
        quantity: undefined,
      },
      ...items,
    ]);
    setDrugSearch('');
  };

  const updateRxItem = (id: string, patch: any) => setRxItems((items) => items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const removeRxItem = (id: string) => setRxItems((items) => items.filter((i) => i.id !== id));

  const repeatLastPrescription = () => {
    if (!lastRx) return toast.error('No previous prescription found');
    setRxItems(lastRx.items.map((i) => ({ ...i, id: idFrom('rx_item') })));
    setRxNotes(lastRx.notes ?? '');
    toast.success('Loaded last prescription');
  };

  const allergySet = useMemo(() => new Set(DoctorStore.normalizeList(allergiesInput).map((x) => x.toLowerCase())), [allergiesInput]);
  const rxWarnings = useMemo(() => {
    const warnings: string[] = [];
    const drugsByGeneric = new Map<string, RxDrug>();
    store.drugs.forEach((d) => drugsByGeneric.set(d.generic.toLowerCase(), d));

    const generics = rxItems.map((i) => i.generic?.toLowerCase()).filter(Boolean) as string[];
    for (const g of generics) {
      const db = drugsByGeneric.get(g);
      if (!db) continue;
      if (db.allergens?.some((a) => allergySet.has(a.toLowerCase()))) warnings.push(`Allergy alert: ${db.generic} (allergen match)`);
    }
    for (const g of generics) {
      const db = drugsByGeneric.get(g);
      if (!db?.interactionsWith) continue;
      for (const other of db.interactionsWith) {
        if (generics.includes(other.toLowerCase())) warnings.push(`Interaction warning: ${db.generic} + ${other}`);
      }
    }
    return Array.from(new Set(warnings));
  }, [allergySet, rxItems, store.drugs]);

  const calcDose = (drug: RxDrug) => {
    const wt = Number(String(vitals.weight).replace(/[^0-9.]/g, ''));
    if (!drug.doseMgPerKg || Number.isNaN(wt) || wt <= 0) return null;
    const mg = Math.round(drug.doseMgPerKg * wt);
    return `${mg} mg`;
  };

  const addLabItem = (name: string, panel?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (labItems.some((x) => x.name.toLowerCase() === trimmed.toLowerCase() && (x.panel ?? '') === (panel ?? ''))) return;
    setLabItems((items) => [
      { id: idFrom('lab'), name: trimmed, panel, urgency: labUrgency, notes: labNote.trim() || undefined, status: 'ordered' },
      ...items,
    ]);
    setLabTest('');
    setLabNote('');
  };

  const updateLab = (id: string, patch: any) => {
    setLabItems((items) =>
      items.map((i) => {
        if (i.id !== id) return i;
        const next = { ...i, ...patch };
        const abnormal = DoctorStore.isAbnormalNumeric(next.resultValue, next.refRange);
        if (abnormal !== undefined) next.isAbnormal = abnormal;
        return next;
      })
    );
  };
  const removeLab = (id: string) => setLabItems((items) => items.filter((i) => i.id !== id));

  const saveDraft = () => {
    if (!patientId) return;
    store.saveProfile({
      patientId,
      allergies: DoctorStore.normalizeList(allergiesInput),
      chronicConditions: DoctorStore.normalizeList(chronicInput),
      currentMedications: DoctorStore.normalizeList(medsInput),
      highRisk,
    });
    store.upsertNote({
      id: noteId,
      appointmentId,
      patientId,
      status: 'draft',
      subjective,
      objective,
      assessment,
      plan,
      icd10,
      doctorId: (appointment as any)?.doctor_id,
    });
    store.upsertRx({ id: rxId, appointmentId, patientId, items: rxItems, notes: rxNotes || undefined });
    store.upsertLab({ id: labId, appointmentId, patientId, items: labItems });
    store.setVisitMeta(appointmentId, visitType, paymentStatus);
    toast.success('Draft saved');
  };

  const completeVisitMutation = useMutation(
    () =>
      DoctorService.completeVisit(appointmentId, {
        diagnosis: assessment || '—',
        symptoms,
        vital_signs: vitals,
        lab_requests: labItems.map((t) => ({ test_name: t.name, priority: t.urgency, notes: t.notes })),
        prescription: {
          medicines: rxItems
            .filter((x) => x.generic.trim())
            .map((m) => ({
              name: m.brand?.trim() ? `${m.generic} (${m.brand})` : m.generic,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
              instructions: m.instructions,
              quantity: m.quantity,
            })),
        },
      }),
    {
      onSuccess: () => {
        if (patientId) {
          store.upsertNote({
            id: noteId,
            appointmentId,
            patientId,
            status: 'final',
            subjective,
            objective,
            assessment,
            plan,
            icd10,
            doctorId: (appointment as any)?.doctor_id,
          });
        }
        store.setVisitMeta(appointmentId, visitType, paymentStatus);
        toast.success('Visit completed');
        navigate('/doctor');
      },
      onError: () => toast.error('Failed to complete visit'),
    }
  );

  const startVoice = (setter: (v: string) => void, current: string) => {
    const SR = getSpeechRecognition();
    if (!SR) return toast.error('Voice input not supported in this browser');
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = true;
    rec.onresult = (event: any) => {
      const text = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      setter(`${current}${current ? '\n' : ''}${text}`);
    };
    rec.onerror = () => toast.error('Voice input failed');
    rec.start();
    toast.success('Listening...');
    setTimeout(() => {
      try { rec.stop(); } catch { /* ignore */ }
    }, 7000);
  };

  const systemTimeline = useMemo(() => {
    const appts = (patientHistory as any)?.appointments ?? [];
    return appts.slice(0, 10);
  }, [patientHistory]);

  // Check for invalid appointment ID (but allow FrontBench appointments)
  if (!Number.isFinite(appointmentId) && !isFrontBenchAppointment) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Invalid appointment id.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!appointment && !frontbenchAppointment) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Appointment not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultation</h1>
          <p className="text-sm text-gray-500">
            {(patient as any)?.name} • {mrn} • {(patient as any)?.age ?? '—'} / {(patient as any)?.gender ?? '—'} •{' '}
            {isFrontBenchAppointment 
              ? new Date(frontbenchAppointment?.start || Date.now()).toLocaleString()
              : new Date((appointment as any)?.appointment_date).toLocaleString()
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {patientId && (
            <button onClick={() => navigate(`/doctor/patient/${patientId}`)} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
              Patient Summary
            </button>
          )}
          <button onClick={saveDraft} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
            Save Draft
          </button>
          <button
            onClick={() => completeVisitMutation.mutate()}
            disabled={completeVisitMutation.isLoading}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            Complete Visit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Today Dashboard</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-500">Visit Type</div>
                <select value={visitType} onChange={(e) => setVisitType(e.target.value as any)} className="border rounded-md p-2 w-full">
                  <option value="new">New</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-gray-500">Payment</div>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)} className="border rounded-md p-2 w-full">
                  <option value="na">N/A</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="mt-4 border-t pt-3 space-y-3">
              <div>
                <div className="text-xs text-gray-500">Critical alerts</div>
                <input value={allergiesInput} onChange={(e) => setAllergiesInput(e.target.value)} className="border rounded-md p-2 w-full" placeholder="Allergies (comma separated)" />
                <input value={chronicInput} onChange={(e) => setChronicInput(e.target.value)} className="border rounded-md p-2 w-full mt-2" placeholder="Chronic conditions (comma separated)" />
                <label className="flex items-center gap-2 text-sm text-gray-800 mt-2">
                  <input type="checkbox" checked={highRisk} onChange={(e) => setHighRisk(e.target.checked)} />
                  High-risk case
                </label>
              </div>
              <div>
                <div className="text-xs text-gray-500">Current medications</div>
                <input value={medsInput} onChange={(e) => setMedsInput(e.target.value)} className="border rounded-md p-2 w-full" placeholder="comma separated" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Vitals</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">BP</label>
                <input value={vitals.blood_pressure} onChange={(e) => setVitals({ ...vitals, blood_pressure: e.target.value })} className="border rounded-md p-2 w-full" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">HR</label>
                <input value={vitals.heart_rate} onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })} className="border rounded-md p-2 w-full" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Temp</label>
                <input value={vitals.temperature} onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })} className="border rounded-md p-2 w-full" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Weight (kg)</label>
                <input value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} className="border rounded-md p-2 w-full" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">SpO₂</label>
                <input value={vitals.spo2} onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })} className="border rounded-md p-2 w-full" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">History (Quick)</h2>
            <div className="space-y-2">
              {historyNotes.slice(0, 5).map((n) => (
                <div key={n.id} className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()} • {n.status}</div>
                  <div className="text-sm font-medium text-gray-900">{n.assessment || '—'}</div>
                </div>
              ))}
              {historyNotes.length === 0 && <p className="text-sm text-gray-600">No local notes yet.</p>}
              {systemTimeline.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500 mb-2">System appointments</div>
                  {systemTimeline.map((a: any, idx: number) => (
                    <div key={idx} className="text-sm text-gray-800">
                      {new Date(a.appointment_date).toLocaleDateString()} • {a.status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Clinical Notes (SOAP)</h2>
                <p className="text-xs text-gray-500">Templates + ICD-10 + voice-to-text.</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="border rounded-md p-2 text-sm">
                  {store.templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button onClick={applyTemplate} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">Apply</button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">S — Subjective</label>
                  <button onClick={() => startVoice(setSubjective, subjective)} className="text-sm text-primary-700 hover:text-primary-900">Voice</button>
                </div>
                <textarea value={subjective} onChange={(e) => setSubjective(e.target.value)} rows={4} className="w-full border rounded-md p-2 mt-1" />
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {symptoms.map((s) => (
                      <span key={s} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                        {s}
                        <button onClick={() => setSymptoms(symptoms.filter((x) => x !== s))} className="ml-2 text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                  <input
                    ref={symptomInputRef}
                    className="w-full border rounded-md p-2"
                    placeholder="Add symptom and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSymptom((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">O — Objective</label>
                  <button onClick={() => startVoice(setObjective, objective)} className="text-sm text-primary-700 hover:text-primary-900">Voice</button>
                </div>
                <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={4} className="w-full border rounded-md p-2 mt-1" />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">A — Assessment</label>
                  <button onClick={() => startVoice(setAssessment, assessment)} className="text-sm text-primary-700 hover:text-primary-900">Voice</button>
                </div>
                <textarea value={assessment} onChange={(e) => setAssessment(e.target.value)} rows={3} className="w-full border rounded-md p-2 mt-1" />

                <div className="mt-3">
                  <label className="block text-xs text-gray-600 mb-1">ICD-10</label>
                  <input value={icdTerm} onChange={(e) => setIcdTerm(e.target.value)} className="border rounded-md p-2 w-full" placeholder="Search ICD-10..." />
                  {icdSuggestions.length > 0 && (
                    <div className="border rounded-lg mt-2 divide-y">
                      {icdSuggestions.map((s) => (
                        <button key={s.code} onClick={() => addIcd(s.code, s.label)} className="w-full text-left px-3 py-2 hover:bg-gray-50">
                          <div className="text-sm font-medium">{s.code}</div>
                          <div className="text-xs text-gray-600">{s.label}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {icd10.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {icd10.map((c) => (
                        <span key={c.code} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                          {c.code}
                          <button onClick={() => removeIcd(c.code)} className="ml-2 text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">P — Plan</label>
                  <button onClick={() => startVoice(setPlan, plan)} className="text-sm text-primary-700 hover:text-primary-900">Voice</button>
                </div>
                <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={4} className="w-full border rounded-md p-2 mt-1" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">E-Prescription</h2>
                <p className="text-xs text-gray-500">Drug database, presets, interactions + allergy alerts, repeat last.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={repeatLastPrescription} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">Repeat Last</button>
                <button onClick={() => window.print()} className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black text-sm">Print</button>
              </div>
            </div>

            {rxWarnings.length > 0 && (
              <div className="mb-3 border border-red-200 bg-red-50 rounded-lg p-3">
                <div className="text-sm font-semibold text-red-800">Alerts</div>
                <ul className="mt-1 text-sm text-red-800 list-disc list-inside">
                  {rxWarnings.map((w) => <li key={w}>{w}</li>)}
                </ul>
              </div>
            )}

            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Drug search</label>
              <input value={drugSearch} onChange={(e) => setDrugSearch(e.target.value)} className="border rounded-md p-2 w-full" placeholder="Search generic / brand / strength..." />
              {filteredDrugs.length > 0 && drugSearch.trim() && (
                <div className="border rounded-lg mt-2 divide-y">
                  {filteredDrugs.map((d: RxDrug) => (
                    <button key={d.id} onClick={() => addDrugToRx(d)} className="w-full text-left px-3 py-2 hover:bg-gray-50">
                      <div className="text-sm font-medium text-gray-900">{d.generic}{d.brand ? ` (${d.brand})` : ''}</div>
                      <div className="text-xs text-gray-600">
                        {d.form ?? '—'} • {d.strength ?? '—'} {d.doseMgPerKg ? `• ${d.doseMgPerKg} mg/kg (${calcDose(d) ?? 'enter weight'})` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {rxItems.map((m) => (
                <div key={m.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input value={m.generic} onChange={(e) => updateRxItem(m.id, { generic: e.target.value })} className="border rounded-md p-2" placeholder="Generic" />
                      <input value={m.brand ?? ''} onChange={(e) => updateRxItem(m.id, { brand: e.target.value })} className="border rounded-md p-2" placeholder="Brand (optional)" />
                      <input value={m.dosage} onChange={(e) => updateRxItem(m.id, { dosage: e.target.value })} className="border rounded-md p-2" placeholder="Dosage" />
                      <select value={m.frequency} onChange={(e) => updateRxItem(m.id, { frequency: e.target.value })} className="border rounded-md p-2">
                        {frequencyPresets.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <select value={m.duration} onChange={(e) => updateRxItem(m.id, { duration: e.target.value })} className="border rounded-md p-2">
                        {durationPresets.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input value={m.instructions ?? ''} onChange={(e) => updateRxItem(m.id, { instructions: e.target.value })} className="border rounded-md p-2" placeholder="Instructions" />
                    </div>
                    <button onClick={() => removeRxItem(m.id)} className="text-sm text-red-700 hover:text-red-900">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <label className="block text-xs text-gray-600 mb-1">Prescription notes</label>
              <textarea value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} rows={2} className="border rounded-md p-2 w-full" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Lab & Diagnostic Orders</h2>
              <p className="text-xs text-gray-500">Panels, urgency, result tracking, abnormal highlights.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Panel</label>
                <select value={labPanel} onChange={(e) => setLabPanel(e.target.value)} className="border rounded-md p-2 w-full">
                  <option value="">—</option>
                  {Object.keys(labPanels).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Test</label>
                <select value={labTest} onChange={(e) => setLabTest(e.target.value)} className="border rounded-md p-2 w-full">
                  <option value="">Select test...</option>
                  {(labPanel ? labPanels[labPanel] : labCatalog).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Urgency</label>
                <select value={labUrgency} onChange={(e) => setLabUrgency(e.target.value as any)} className="border rounded-md p-2 w-full">
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                <input value={labNote} onChange={(e) => setLabNote(e.target.value)} className="border rounded-md p-2 w-full" placeholder="optional" />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    if (!labTest && labPanel) return labPanels[labPanel].forEach((t) => addLabItem(t, labPanel));
                    addLabItem(labTest, labPanel || undefined);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 w-full"
                >
                  Order
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {labItems.length === 0 ? (
                <p className="text-sm text-gray-600">No tests ordered.</p>
              ) : (
                labItems.map((t) => (
                  <div key={t.id} className={`border rounded-lg p-3 ${t.isAbnormal ? 'border-red-300 bg-red-50' : ''}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {t.name} {t.panel ? <span className="text-xs text-gray-500">({t.panel})</span> : null}
                        </div>
                        <div className="text-xs text-gray-600">Urgency: {t.urgency} • Status: {t.status} {t.isAbnormal ? '• Abnormal' : ''}</div>
                        {t.notes && <div className="text-xs text-gray-600 mt-1">Note: {t.notes}</div>}
                      </div>
                      <button onClick={() => removeLab(t.id)} className="text-sm text-red-700 hover:text-red-900">Remove</button>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
                      <select value={t.status} onChange={(e) => updateLab(t.id, { status: e.target.value })} className="border rounded-md p-2">
                        <option value="ordered">Ordered</option>
                        <option value="sample_collected">Sample collected</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <input value={t.resultValue ?? ''} onChange={(e) => updateLab(t.id, { resultValue: e.target.value })} className="border rounded-md p-2" placeholder="Result" />
                      <input value={t.unit ?? ''} onChange={(e) => updateLab(t.id, { unit: e.target.value })} className="border rounded-md p-2" placeholder="Unit" />
                      <input value={t.refRange ?? ''} onChange={(e) => updateLab(t.id, { refRange: e.target.value })} className="border rounded-md p-2" placeholder="Ref (70-110)" />
                      <div className="text-xs text-gray-600 flex items-center">{t.isAbnormal ? <span className="text-red-700 font-semibold">Abnormal</span> : '—'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientVisit;
