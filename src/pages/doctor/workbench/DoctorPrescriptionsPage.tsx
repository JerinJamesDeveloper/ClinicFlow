import React, { useMemo, useState } from 'react';
import { useWorkbench } from './DoctorWorkbenchLayout';
import { idFrom } from './store';

const templates = {
  'Fever Pack': [{ medicationName: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', route: 'Oral', duration: '5 days', instructions: 'After food' }],
  'Cold Pack': [
    { medicationName: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', route: 'Oral', duration: '3 days', instructions: 'After food' },
    { medicationName: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', route: 'Oral', duration: '5 days', instructions: 'At night' },
    { medicationName: 'ORS', dosage: '200ml', frequency: 'Three times daily', route: 'Oral', duration: '3 days', instructions: 'Sip slowly' },
  ],
  'Pain Relief Pack': [{ medicationName: 'Ibuprofen', dosage: '400mg', frequency: 'Twice daily', route: 'Oral', duration: '5 days', instructions: 'After food' }],
};

const DoctorPrescriptionsPage: React.FC = () => {
  const { draft, setDraft, saveDraft, allergyText, storeDrugs } = useWorkbench();
  const [search, setSearch] = useState('');

  const suggestions = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return storeDrugs.slice(0, 8);
    return storeDrugs.filter((d) => `${d.generic} ${d.brand ?? ''}`.toLowerCase().includes(t)).slice(0, 10);
  }, [search, storeDrugs]);

  const allergySet = useMemo(() => new Set(allergyText.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)), [allergyText]);

  const warnings = useMemo(() => {
    const w: string[] = [];
    draft.prescriptions.forEach((p) => {
      const db = storeDrugs.find((d) => d.generic.toLowerCase() === p.medicationName.toLowerCase());
      db?.allergens?.forEach((a) => {
        if (allergySet.has(a.toLowerCase())) w.push(`Patient allergic to ${a} (check ${db.generic})`);
      });
    });
    return Array.from(new Set(w));
  }, [draft.prescriptions, storeDrugs, allergySet]);

  const addItem = (item?: any) => {
    setDraft((prev) => ({
      ...prev,
      prescriptions: [
        {
          id: idFrom('rx'),
          medicationName: item?.medicationName ?? '',
          dosage: item?.dosage ?? '500mg',
          frequency: item?.frequency ?? 'Twice daily',
          route: item?.route ?? 'Oral',
          duration: item?.duration ?? '5 days',
          instructions: item?.instructions ?? 'After food',
        },
        ...prev.prescriptions,
      ],
    }));
  };

  const update = (id: string, patch: any) => {
    setDraft((prev) => ({ ...prev, prescriptions: prev.prescriptions.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  };

  const remove = (id: string) => setDraft((prev) => ({ ...prev, prescriptions: prev.prescriptions.filter((p) => p.id !== id) }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.keys(templates).map((k) => (
          <button key={k} onClick={() => templates[k as keyof typeof templates].forEach((item) => addItem(item))} className="px-3 py-2 rounded-md border hover:bg-gray-50 text-sm">
            {k}
          </button>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-md p-3 text-sm text-red-800">
          {warnings.map((w) => (
            <div key={w}>? {w}</div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm mb-1">Medication Name (searchable)</label>
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border rounded-md p-2" placeholder="Paracetamol / Amoxicillin / Ibuprofen" />
        {search.trim() && (
          <div className="mt-2 border rounded-md divide-y max-h-52 overflow-auto">
            {suggestions.map((s) => (
              <button key={s.id} onClick={() => addItem({ medicationName: s.generic, dosage: s.strength || '500mg' })} className="w-full text-left px-3 py-2 hover:bg-gray-50">
                <div className="text-sm font-medium">{s.generic}</div>
                <div className="text-xs text-gray-600">{s.brand || '-'} • {s.strength || '-'}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => addItem()} className="px-3 py-2 rounded-md border hover:bg-gray-50 text-sm">+ Add Manual Medication</button>

      <div className="space-y-2">
        {draft.prescriptions.map((p) => (
          <div key={p.id} className="border rounded-md p-3 grid grid-cols-1 md:grid-cols-7 gap-2">
            <input value={p.medicationName} onChange={(e) => update(p.id, { medicationName: e.target.value })} className="border rounded-md p-2 md:col-span-2" placeholder="Medication" />
            <input value={p.dosage} onChange={(e) => update(p.id, { dosage: e.target.value })} className="border rounded-md p-2" placeholder="Dosage" />
            <select value={p.frequency} onChange={(e) => update(p.id, { frequency: e.target.value })} className="border rounded-md p-2">
              <option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>Every 6 hours</option>
            </select>
            <select value={p.route} onChange={(e) => update(p.id, { route: e.target.value })} className="border rounded-md p-2">
              <option>Oral</option><option>IV</option><option>Injection</option><option>Topical</option>
            </select>
            <input value={p.duration} onChange={(e) => update(p.id, { duration: e.target.value })} className="border rounded-md p-2" placeholder="Duration" />
            <button onClick={() => remove(p.id)} className="text-sm text-red-700 hover:text-red-900">Remove</button>
            <input value={p.instructions} onChange={(e) => update(p.id, { instructions: e.target.value })} className="border rounded-md p-2 md:col-span-6" placeholder="Instructions" />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={saveDraft} className="px-4 py-2 rounded-md border hover:bg-gray-50">Save Draft</button>
      </div>
    </div>
  );
};

export default DoctorPrescriptionsPage;

