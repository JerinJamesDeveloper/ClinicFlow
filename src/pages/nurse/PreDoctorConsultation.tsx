import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import SearchBar from '../../components/common/SearchBar';
import { useAuth } from '../../hooks/useAuth';
import { useFrontBenchPatients } from '../../hooks/frontbench/useFrontBenchPatients';
import { useFrontBenchQueue } from '../../hooks/frontbench/useFrontBenchQueue';
import { useFrontBenchScheduling } from '../../hooks/frontbench/useFrontBenchScheduling';

type Symptom =
  | 'Fever'
  | 'Cough'
  | 'Headache'
  | 'Chest Pain'
  | 'Vomiting'
  | 'Diarrhea'
  | 'Fatigue'
  | 'Shortness of Breath'
  | 'Abdominal Pain';

type Condition =
  | 'Diabetes'
  | 'Hypertension'
  | 'Asthma'
  | 'Heart Disease'
  | 'Thyroid'
  | 'Kidney Disease'
  | 'Cancer'
  | 'None';

type TriageLevel = 'critical' | 'urgent' | 'moderate' | 'normal';

type AttachmentType = 'lab_report' | 'prescription' | 'wound_image' | 'ecg_image';

type NursingRecord = {
  id: string;
  clinicId: number;
  createdAt: string;
  nurseName: string;
  patientMrn: string;
  doctorId: string;
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
  chiefComplaint: string;
  symptoms: Symptom[];
  symptomDurationValue: number | null;
  symptomDurationUnit: 'hours' | 'days' | 'weeks';
  painScale: number;
  knownConditions: Condition[];
  allergies: {
    drug: string;
    food: string;
    other: string;
  };
  currentMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  observations: {
    appearance: 'normal' | 'weak' | 'distressed';
    mentalStatus: 'alert' | 'drowsy' | 'confused';
    mobility: 'normal' | 'assisted' | 'wheelchair';
    nursingNotes: string;
  };
  triageLevel: TriageLevel;
  attachments: Array<{
    id: string;
    type: AttachmentType;
    fileName: string;
    mimeType: string;
    dataUrl: string;
  }>;
  checklist: {
    vitalsRecorded: boolean;
    symptomsEntered: boolean;
    medicalHistoryChecked: boolean;
    allergiesRecorded: boolean;
  };
  queueToken: string;
};

const STORAGE_KEY = 'nurse_pre_doctor_consults_v1';

const symptomOptions: Symptom[] = [
  'Fever',
  'Cough',
  'Headache',
  'Chest Pain',
  'Vomiting',
  'Diarrhea',
  'Fatigue',
  'Shortness of Breath',
  'Abdominal Pain',
];

const conditionOptions: Condition[] = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart Disease',
  'Thyroid',
  'Kidney Disease',
  'Cancer',
  'None',
];

const triageMeta: Record<TriageLevel, { label: string; color: string; priority: number }> = {
  critical: { label: 'Critical (Red) - Immediate doctor', color: 'bg-red-100 text-red-800 border-red-200', priority: 0 },
  urgent: { label: 'Urgent (Orange) - Within 10 minutes', color: 'bg-orange-100 text-orange-800 border-orange-200', priority: 10 },
  moderate: { label: 'Moderate (Yellow) - Within 30 minutes', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', priority: 30 },
  normal: { label: 'Normal (Green) - Standard queue', color: 'bg-green-100 text-green-800 border-green-200', priority: 60 },
};

const tabs = [
  { name: 'Patient & Doctor', id: 'patient' },
  { name: 'Vital Signs', id: 'vitals' },
  { name: 'Complaint', id: 'complaint' },
  { name: 'Medical History', id: 'history' },
  { name: 'Observations', id: 'observations' },
  { name: 'Triage', id: 'triage' },
  { name: 'Attachments', id: 'attachments' },
  { name: 'Checklist', id: 'checklist' },
  { name: 'Recent', id: 'recent' },
];

const readRecords = (): NursingRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as NursingRecord[]) : [];
  } catch {
    return [];
  }
};

const saveRecords = (records: NursingRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const PreDoctorConsultation: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;

  const patients = useFrontBenchPatients(clinicId);
  const scheduling = useFrontBenchScheduling(clinicId);
  const queue = useFrontBenchQueue(clinicId);

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientMrn, setSelectedPatientMrn] = useState('');
  const [doctorId, setDoctorId] = useState('');

  const [systolic, setSystolic] = useState<number | null>(null);
  const [diastolic, setDiastolic] = useState<number | null>(null);
  const [pulseRate, setPulseRate] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [respiratoryRate, setRespiratoryRate] = useState<number | null>(null);
  const [spo2, setSpo2] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [durationValue, setDurationValue] = useState<number | null>(null);
  const [durationUnit, setDurationUnit] = useState<'hours' | 'days' | 'weeks'>('days');
  const [painScale, setPainScale] = useState(1);

  const [knownConditions, setKnownConditions] = useState<Condition[]>([]);
  const [drugAllergies, setDrugAllergies] = useState('');
  const [foodAllergies, setFoodAllergies] = useState('');
  const [otherAllergies, setOtherAllergies] = useState('');
  const [medications, setMedications] = useState<Array<{ name: string; dosage: string; frequency: string }>>([{ name: '', dosage: '', frequency: '' }]);

  const [appearance, setAppearance] = useState<'normal' | 'weak' | 'distressed'>('normal');
  const [mentalStatus, setMentalStatus] = useState<'alert' | 'drowsy' | 'confused'>('alert');
  const [mobility, setMobility] = useState<'normal' | 'assisted' | 'wheelchair'>('normal');
  const [nursingNotes, setNursingNotes] = useState('');

  const [triageLevel, setTriageLevel] = useState<TriageLevel>('normal');
  const [attachmentType, setAttachmentType] = useState<AttachmentType>('lab_report');
  const [attachments, setAttachments] = useState<NursingRecord['attachments']>([]);

  const [checkVitalsRecorded, setCheckVitalsRecorded] = useState(false);
  const [checkSymptomsEntered, setCheckSymptomsEntered] = useState(false);
  const [checkHistoryChecked, setCheckHistoryChecked] = useState(false);
  const [checkAllergiesRecorded, setCheckAllergiesRecorded] = useState(false);

  const [recordsVersion, setRecordsVersion] = useState(0);
  const [activeTab, setActiveTab] = useState('patient');

  const bmi = useMemo(() => {
    if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
    const meters = heightCm / 100;
    return Number((weightKg / (meters * meters)).toFixed(2));
  }, [heightCm, weightKg]);

  const patientResults = useMemo(() => {
    const term = patientSearch.trim();
    if (!term) return patients.patients.slice(0, 8);
    return patients.search(term).slice(0, 8);
  }, [patientSearch, patients]);

  const selectedPatient = useMemo(() => patients.getByMrn(selectedPatientMrn), [patients, selectedPatientMrn]);

  const recentRecords = useMemo(() => {
    void recordsVersion;
    return readRecords()
      .filter((r) => r.clinicId === clinicId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [clinicId, recordsVersion]);

  const toggleSymptom = (symptom: Symptom) => {
    setSymptoms((prev) => (prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]));
  };

  const toggleCondition = (condition: Condition) => {
    setKnownConditions((prev) => {
      if (condition === 'None') {
        return prev.includes('None') ? [] : ['None'];
      }
      const withoutNone = prev.filter((c) => c !== 'None');
      if (withoutNone.includes(condition)) {
        return withoutNone.filter((c) => c !== condition);
      }
      return [...withoutNone, condition];
    });
  };

  const updateMedication = (index: number, key: 'name' | 'dosage' | 'frequency', value: string) => {
    setMedications((prev) => prev.map((m, i) => (i === index ? { ...m, [key]: value } : m)));
  };

  const addMedicationRow = () => {
    setMedications((prev) => [...prev, { name: '', dosage: '', frequency: '' }]);
  };

  const removeMedicationRow = (index: number) => {
    setMedications((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const onUploadAttachments: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const next = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: `att_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          type: attachmentType,
          fileName: file.name,
          mimeType: file.type,
          dataUrl: await toDataUrl(file),
        }))
      );
      setAttachments((prev) => [...prev, ...next]);
      toast.success(`${next.length} attachment(s) added`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload attachment');
    } finally {
      e.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const resetForm = () => {
    setSystolic(null);
    setDiastolic(null);
    setPulseRate(null);
    setTemperature(null);
    setTemperatureUnit('C');
    setRespiratoryRate(null);
    setSpo2(null);
    setHeightCm(null);
    setWeightKg(null);
    setChiefComplaint('');
    setSymptoms([]);
    setDurationValue(null);
    setDurationUnit('days');
    setPainScale(1);
    setKnownConditions([]);
    setDrugAllergies('');
    setFoodAllergies('');
    setOtherAllergies('');
    setMedications([{ name: '', dosage: '', frequency: '' }]);
    setAppearance('normal');
    setMentalStatus('alert');
    setMobility('normal');
    setNursingNotes('');
    setTriageLevel('normal');
    setAttachmentType('lab_report');
    setAttachments([]);
    setCheckVitalsRecorded(false);
    setCheckSymptomsEntered(false);
    setCheckHistoryChecked(false);
    setCheckAllergiesRecorded(false);
  };

  const onSendToDoctorQueue = () => {
    if (!selectedPatientMrn || !selectedPatient) {
      toast.error('Select patient first');
      return;
    }
    if (!doctorId) {
      toast.error('Select doctor first');
      return;
    }
    if (!chiefComplaint.trim()) {
      toast.error('Chief complaint is required');
      return;
    }

    const checklistOk = checkVitalsRecorded && checkSymptomsEntered && checkHistoryChecked && checkAllergiesRecorded;
    if (!checklistOk) {
      toast.error('Complete pre-doctor checklist before sending');
      return;
    }

    const queueItem = queue.addWalkIn(doctorId, selectedPatientMrn, { priority: triageMeta[triageLevel].priority });

    const newRecord: NursingRecord = {
      id: `nurse_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      clinicId,
      createdAt: new Date().toISOString(),
      nurseName: user?.name || 'Nurse',
      patientMrn: selectedPatientMrn,
      doctorId,
      vitals: {
        systolic,
        diastolic,
        pulseRate,
        temperature,
        temperatureUnit,
        respiratoryRate,
        spo2,
        heightCm,
        weightKg,
        bmi,
      },
      chiefComplaint: chiefComplaint.trim(),
      symptoms,
      symptomDurationValue: durationValue,
      symptomDurationUnit: durationUnit,
      painScale,
      knownConditions,
      allergies: {
        drug: drugAllergies.trim(),
        food: foodAllergies.trim(),
        other: otherAllergies.trim(),
      },
      currentMedications: medications
        .map((m) => ({ name: m.name.trim(), dosage: m.dosage.trim(), frequency: m.frequency.trim() }))
        .filter((m) => m.name || m.dosage || m.frequency),
      observations: {
        appearance,
        mentalStatus,
        mobility,
        nursingNotes: nursingNotes.trim(),
      },
      triageLevel,
      attachments,
      checklist: {
        vitalsRecorded: checkVitalsRecorded,
        symptomsEntered: checkSymptomsEntered,
        medicalHistoryChecked: checkHistoryChecked,
        allergiesRecorded: checkAllergiesRecorded,
      },
      queueToken: queueItem.token,
    };

    const all = readRecords();
    saveRecords([newRecord, ...all]);
    setRecordsVersion((v) => v + 1);
    toast.success(`Sent to doctor queue (Token ${queueItem.token})`);

    resetForm();
  };

  return (
    <div className="h-full">
      <div className="bg-white border-b px-6">
        <nav className="flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Patient & Doctor Tab */}
        {activeTab === 'patient' && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Patient & Doctor</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Find patient</label>
              <SearchBar onSearch={setPatientSearch} debounceMs={150} placeholder="Search name/phone/MRN" />
              {patientResults.length > 0 && (
                <div className="mt-2 border rounded-md divide-y max-h-48 overflow-auto">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPatientMrn(p.mrn)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedPatientMrn === p.mrn ? 'bg-primary-50' : ''}`}
                    >
                      <span className="font-medium">{p.name}</span> <span className="text-gray-500">({p.mrn})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selected MRN</label>
                <input
                  value={selectedPatientMrn}
                  onChange={(e) => setSelectedPatientMrn(e.target.value)}
                  className="w-full border rounded-md p-2"
                  placeholder="MRN-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full border rounded-md p-2">
                  <option value="">Select doctor</option>
                  {scheduling.doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization || 'General'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Vital Signs Tab */}
        {activeTab === 'vitals' && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Vital Signs</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Systolic</label>
                <input type="number" value={systolic ?? ''} onChange={(e) => setSystolic(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Diastolic</label>
                <input type="number" value={diastolic ?? ''} onChange={(e) => setDiastolic(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Pulse Rate (bpm)</label>
                <input type="number" value={pulseRate ?? ''} onChange={(e) => setPulseRate(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Respiratory Rate</label>
                <input type="number" value={respiratoryRate ?? ''} onChange={(e) => setRespiratoryRate(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Temperature</label>
                <div className="flex gap-2">
                  <input type="number" step="0.1" value={temperature ?? ''} onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-md p-2" />
                  <select value={temperatureUnit} onChange={(e) => setTemperatureUnit(e.target.value as 'C' | 'F')} className="border rounded-md p-2">
                    <option value="C">C</option>
                    <option value="F">F</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">SpO2 (%)</label>
                <input type="number" value={spo2 ?? ''} onChange={(e) => setSpo2(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Height (cm)</label>
                <input type="number" step="0.1" value={heightCm ?? ''} onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Weight (kg)</label>
                <input type="number" step="0.1" value={weightKg ?? ''} onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-md p-2" />
              </div>
            </div>
            <div className="rounded-md border p-3 bg-gray-50 text-sm">
              <span className="font-medium">Blood Pressure:</span> {systolic ?? '-'} / {diastolic ?? '-'} | <span className="font-medium">BMI:</span> {bmi ?? '-'}
            </div>
          </div>
        )}

        {/* Complaint Tab */}
        {activeTab === 'complaint' && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Chief Complaint & Symptoms</h2>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Chief Complaint</label>
              <textarea value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} rows={3} className="w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Symptoms</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {symptomOptions.map((s) => (
                  <label key={s} className="text-sm flex items-center gap-2 border rounded-md p-2">
                    <input type="checkbox" checked={symptoms.includes(s)} onChange={() => toggleSymptom(s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Duration</label>
                <input type="number" value={durationValue ?? ''} onChange={(e) => setDurationValue(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Unit</label>
                <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as 'hours' | 'days' | 'weeks')} className="w-full border rounded-md p-2">
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Pain Scale (1-10): {painScale}</label>
                <input type="range" min={1} max={10} value={painScale} onChange={(e) => setPainScale(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Medical History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Medical History</h2>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Known Conditions</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {conditionOptions.map((c) => (
                  <label key={c} className="text-sm flex items-center gap-2 border rounded-md p-2">
                    <input type="checkbox" checked={knownConditions.includes(c)} onChange={() => toggleCondition(c)} />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Drug Allergies</label>
                <input value={drugAllergies} onChange={(e) => setDrugAllergies(e.target.value)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Food Allergies</label>
                <input value={foodAllergies} onChange={(e) => setFoodAllergies(e.target.value)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Other Allergies</label>
                <input value={otherAllergies} onChange={(e) => setOtherAllergies(e.target.value)} className="w-full border rounded-md p-2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm text-gray-700">Current Medications</label>
                <button type="button" onClick={addMedicationRow} className="text-sm px-3 py-1 rounded border hover:bg-gray-50">
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {medications.map((m, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input value={m.name} onChange={(e) => updateMedication(i, 'name', e.target.value)} className="border rounded-md p-2" placeholder="Medication Name" />
                    <input value={m.dosage} onChange={(e) => updateMedication(i, 'dosage', e.target.value)} className="border rounded-md p-2" placeholder="Dosage" />
                    <input value={m.frequency} onChange={(e) => updateMedication(i, 'frequency', e.target.value)} className="border rounded-md p-2" placeholder="Frequency" />
                    <button type="button" onClick={() => removeMedicationRow(i)} className="px-3 py-2 rounded border hover:bg-gray-50">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Observations Tab */}
        {activeTab === 'observations' && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Nursing Notes / Observations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Patient Appearance</label>
                <select value={appearance} onChange={(e) => setAppearance(e.target.value as 'normal' | 'weak' | 'distressed')} className="w-full border rounded-md p-2">
                  <option value="normal">Normal</option>
                  <option value="weak">Weak</option>
                  <option value="distressed">Distressed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Mental Status</label>
                <select value={mentalStatus} onChange={(e) => setMentalStatus(e.target.value as 'alert' | 'drowsy' | 'confused')} className="w-full border rounded-md p-2">
                  <option value="alert">Alert</option>
                  <option value="drowsy">Drowsy</option>
                  <option value="confused">Confused</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Mobility</label>
                <select value={mobility} onChange={(e) => setMobility(e.target.value as 'normal' | 'assisted' | 'wheelchair')} className="w-full border rounded-md p-2">
                  <option value="normal">Normal</option>
                  <option value="assisted">Assisted</option>
                  <option value="wheelchair">Wheelchair</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Nursing Notes</label>
              <textarea value={nursingNotes} onChange={(e) => setNursingNotes(e.target.value)} rows={4} className="w-full border rounded-md p-2" placeholder="Patient complaining of severe headache for 2 days..." />
            </div>
          </div>
        )}

        {/* Triage Tab */}
        {activeTab === 'triage' && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Triage Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(Object.keys(triageMeta) as TriageLevel[]).map((level) => (
                <label key={level} className={`border rounded-md p-3 cursor-pointer ${triageMeta[level].color}`}>
                  <input
                    type="radio"
                    name="triage"
                    checked={triageLevel === level}
                    onChange={() => setTriageLevel(level)}
                    className="mr-2"
                  />
                  {triageMeta[level].label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Attachments Tab */}
        {activeTab === 'attachments' && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Attachment Type</label>
                <select value={attachmentType} onChange={(e) => setAttachmentType(e.target.value as AttachmentType)} className="w-full border rounded-md p-2">
                  <option value="lab_report">Lab Reports</option>
                  <option value="prescription">Previous Prescriptions</option>
                  <option value="wound_image">Wound Images</option>
                  <option value="ecg_image">ECG Images</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Upload Files</label>
                <input type="file" multiple onChange={onUploadAttachments} className="w-full border rounded-md p-2" />
              </div>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                    <span>
                      {a.fileName} <span className="text-gray-500">({a.type})</span>
                    </span>
                    <button type="button" onClick={() => removeAttachment(a.id)} className="text-red-600 hover:text-red-800">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Checklist Tab */}
        {activeTab === 'checklist' && (
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Pre-Doctor Checklist</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 border rounded-md p-2 text-sm"><input type="checkbox" checked={checkVitalsRecorded} onChange={(e) => setCheckVitalsRecorded(e.target.checked)} /> Vitals Recorded</label>
              <label className="flex items-center gap-2 border rounded-md p-2 text-sm"><input type="checkbox" checked={checkSymptomsEntered} onChange={(e) => setCheckSymptomsEntered(e.target.checked)} /> Symptoms Entered</label>
              <label className="flex items-center gap-2 border rounded-md p-2 text-sm"><input type="checkbox" checked={checkHistoryChecked} onChange={(e) => setCheckHistoryChecked(e.target.checked)} /> Medical History Checked</label>
              <label className="flex items-center gap-2 border rounded-md p-2 text-sm"><input type="checkbox" checked={checkAllergiesRecorded} onChange={(e) => setCheckAllergiesRecorded(e.target.checked)} /> Allergies Recorded</label>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
                Reset Form
              </button>
              <button type="button" onClick={onSendToDoctorQueue} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                Send to Doctor Queue
              </button>
            </div>
          </div>
        )}

        {/* Recent Tab */}
        {activeTab === 'recent' && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Pre-Doctor Consultations</h2>
            {recentRecords.length === 0 ? (
              <p className="text-sm text-gray-600">No records yet.</p>
            ) : (
              <div className="space-y-2">
                {recentRecords.map((r) => (
                  <div key={r.id} className="border rounded-md p-3 text-sm">
                    <div className="font-medium text-gray-900">
                      {r.patientMrn} - Token {r.queueToken}
                    </div>
                    <div className="text-gray-600">
                      {new Date(r.createdAt).toLocaleString()} - {r.nurseName} - {triageMeta[r.triageLevel].label}
                    </div>
                    <div className="text-gray-700 mt-1">Chief Complaint: {r.chiefComplaint}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreDoctorConsultation;
