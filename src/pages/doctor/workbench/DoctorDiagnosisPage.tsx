import React from 'react';
import { useWorkbench } from './DoctorWorkbenchLayout';

const DoctorDiagnosisPage: React.FC = () => {
  const { draft, setDraft, saveDraft } = useWorkbench();
  const d = draft.diagnosis;

  const set = <K extends keyof typeof d>(key: K, value: (typeof d)[K]) => {
    setDraft((prev) => ({ ...prev, diagnosis: { ...prev.diagnosis, [key]: value } }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Primary Diagnosis</label>
          <input value={d.primaryName} onChange={(e) => set('primaryName', e.target.value)} className="w-full border rounded-md p-2" placeholder="Migraine" />
        </div>
        <div>
          <label className="block text-sm mb-1">Primary ICD-10 Code</label>
          <input value={d.primaryCode} onChange={(e) => set('primaryCode', e.target.value)} className="w-full border rounded-md p-2" placeholder="G43" />
        </div>
        <div>
          <label className="block text-sm mb-1">Secondary Diagnosis</label>
          <input value={d.secondaryName} onChange={(e) => set('secondaryName', e.target.value)} className="w-full border rounded-md p-2" placeholder="Hypertension" />
        </div>
        <div>
          <label className="block text-sm mb-1">Secondary ICD-10 Code</label>
          <input value={d.secondaryCode} onChange={(e) => set('secondaryCode', e.target.value)} className="w-full border rounded-md p-2" placeholder="I10" />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Severity</label>
        <select value={d.severity} onChange={(e) => set('severity', e.target.value as any)} className="w-full md:w-64 border rounded-md p-2">
          <option>Mild</option>
          <option>Moderate</option>
          <option>Severe</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button onClick={saveDraft} className="px-4 py-2 rounded-md border hover:bg-gray-50">Save Draft</button>
      </div>
    </div>
  );
};

export default DoctorDiagnosisPage;

