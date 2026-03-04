import React, { useMemo, useState } from 'react';
import { useWorkbench } from './DoctorWorkbenchLayout';
import { idFrom } from './store';

const labCatalog = {
  'Blood Test': ['CBC', 'Blood Sugar', 'Lipid Profile', 'HbA1c'],
  'Urine Test': ['Urine Routine'],
  Imaging: ['X-ray', 'CT Scan', 'MRI', 'Ultrasound'],
  Cardiology: ['ECG', 'Echocardiogram'],
  Others: ['LFT', 'KFT'],
};

const DoctorLabImagingPage: React.FC = () => {
  const { draft, setDraft, saveDraft } = useWorkbench();
  const [cat, setCat] = useState<'Blood Test' | 'Urine Test' | 'Imaging' | 'Cardiology' | 'Others'>('Blood Test');
  const [test, setTest] = useState('');
  const [priority, setPriority] = useState<'routine' | 'urgent'>('routine');
  const [notes, setNotes] = useState('');

  const [imagingName, setImagingName] = useState('');
  const [imagingPriority, setImagingPriority] = useState<'routine' | 'urgent'>('routine');
  const [indication, setIndication] = useState('');

  const tests = useMemo(() => labCatalog[cat], [cat]);

  const addLab = () => {
    if (!test.trim()) return;
    setDraft((prev) => ({
      ...prev,
      labOrders: [{ id: idFrom('lab'), testCategory: cat, testName: test.trim(), priority, notes: notes.trim() }, ...prev.labOrders],
    }));
    setTest('');
    setNotes('');
  };

  const addImaging = () => {
    if (!imagingName.trim()) return;
    setDraft((prev) => ({
      ...prev,
      imagingOrders: [
        { id: idFrom('img'), requestName: imagingName.trim(), clinicalIndication: indication.trim(), priority: imagingPriority },
        ...prev.imagingOrders,
      ],
    }));
    setImagingName('');
    setIndication('');
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Lab Test Orders</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select value={cat} onChange={(e) => setCat(e.target.value as any)} className="border rounded-md p-2">
            <option>Blood Test</option><option>Urine Test</option><option>Imaging</option><option>Cardiology</option><option>Others</option>
          </select>
          <select value={test} onChange={(e) => setTest(e.target.value)} className="border rounded-md p-2 md:col-span-2">
            <option value="">Select test</option>
            {tests.map((t) => (<option key={t}>{t}</option>))}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="border rounded-md p-2">
            <option value="routine">Routine</option><option value="urgent">Urgent</option>
          </select>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="border rounded-md p-2 md:col-span-3" placeholder="Notes" />
          <button onClick={addLab} className="px-3 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Add Test</button>
        </div>

        <div className="mt-3 space-y-2">
          {draft.labOrders.map((l) => (
            <div key={l.id} className="border rounded-md p-2 text-sm flex items-center justify-between">
              <span>{l.testName} ({l.testCategory}) • {l.priority}</span>
              <button onClick={() => setDraft((p) => ({ ...p, labOrders: p.labOrders.filter((x) => x.id !== l.id) }))} className="text-red-700 hover:text-red-900">Remove</button>
            </div>
          ))}
          {draft.labOrders.length === 0 && <p className="text-sm text-gray-600">No tests added.</p>}
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Imaging Requests</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select value={imagingName} onChange={(e) => setImagingName(e.target.value)} className="border rounded-md p-2 md:col-span-2">
            <option value="">Select imaging</option>
            <option>Chest X-Ray</option><option>Brain MRI</option><option>Abdominal Ultrasound</option><option>CT Scan</option>
          </select>
          <select value={imagingPriority} onChange={(e) => setImagingPriority(e.target.value as any)} className="border rounded-md p-2">
            <option value="routine">Routine</option><option value="urgent">Urgent</option>
          </select>
          <button onClick={addImaging} className="px-3 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Add Imaging</button>
          <input value={indication} onChange={(e) => setIndication(e.target.value)} className="border rounded-md p-2 md:col-span-4" placeholder="Clinical indication (e.g., Suspected pneumonia)" />
        </div>

        <div className="mt-3 space-y-2">
          {draft.imagingOrders.map((i) => (
            <div key={i.id} className="border rounded-md p-2 text-sm flex items-center justify-between">
              <span>{i.requestName} • {i.priority} • {i.clinicalIndication || '-'}</span>
              <button onClick={() => setDraft((p) => ({ ...p, imagingOrders: p.imagingOrders.filter((x) => x.id !== i.id) }))} className="text-red-700 hover:text-red-900">Remove</button>
            </div>
          ))}
          {draft.imagingOrders.length === 0 && <p className="text-sm text-gray-600">No imaging requests added.</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={saveDraft} className="px-4 py-2 rounded-md border hover:bg-gray-50">Save Draft</button>
      </div>
    </div>
  );
};

export default DoctorLabImagingPage;

