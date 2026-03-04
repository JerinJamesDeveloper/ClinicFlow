import React from 'react';
import { useWorkbench } from './DoctorWorkbenchLayout';

const DoctorAssessmentPage: React.FC = () => {
  const { draft, setDraft, saveDraft } = useWorkbench();
  const a = draft.assessment;

  const set = <K extends keyof typeof a>(key: K, value: (typeof a)[K]) => {
    setDraft((prev) => ({ ...prev, assessment: { ...prev.assessment, [key]: value } }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">General appearance</label>
          <select value={a.generalAppearance} onChange={(e) => set('generalAppearance', e.target.value as any)} className="w-full border rounded-md p-2">
            <option>Normal</option><option>Distressed</option><option>Weak</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Consciousness</label>
          <select value={a.consciousness} onChange={(e) => set('consciousness', e.target.value as any)} className="w-full border rounded-md p-2">
            <option>Alert</option><option>Drowsy</option><option>Unconscious</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Cardiovascular</label>
          <select value={a.cardiovascular} onChange={(e) => set('cardiovascular', e.target.value as any)} className="w-full border rounded-md p-2">
            <option>Normal</option><option>Murmur</option><option>Tachycardia</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Respiratory</label>
          <select value={a.respiratory} onChange={(e) => set('respiratory', e.target.value as any)} className="w-full border rounded-md p-2">
            <option>Normal</option><option>Wheezing</option><option>Crackles</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Abdomen</label>
          <select value={a.abdomen} onChange={(e) => set('abdomen', e.target.value as any)} className="w-full border rounded-md p-2">
            <option>Normal</option><option>Tenderness</option><option>Distention</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Neurological</label>
          <select value={a.neurological} onChange={(e) => set('neurological', e.target.value as any)} className="w-full border rounded-md p-2">
            <option>Normal</option><option>Weakness</option><option>Seizure signs</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Clinical notes</label>
        <textarea value={a.notes} onChange={(e) => set('notes', e.target.value)} rows={4} className="w-full border rounded-md p-2" placeholder="Patient shows mild neck stiffness." />
      </div>

      <div className="flex justify-end">
        <button onClick={saveDraft} className="px-4 py-2 rounded-md border hover:bg-gray-50">Save Draft</button>
      </div>
    </div>
  );
};

export default DoctorAssessmentPage;

