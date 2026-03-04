import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useWorkbench } from './DoctorWorkbenchLayout';
import { idFrom, toDataUrl } from './store';

const downloadText = (filename: string, text: string) => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const DoctorNotesFollowupPage: React.FC = () => {
  const { selectedAppointment, draft, setDraft, saveDraft, saveVisit } = useWorkbench();
  const [attachmentType, setAttachmentType] = useState<'ecg_report' | 'lab_result' | 'radiology_image' | 'referral_letter'>('ecg_report');

  const summaryText = useMemo(() => {
    if (!selectedAppointment) return '';
    return [
      'Patient Visit Summary',
      `Date: ${new Date().toLocaleString()}`,
      `Patient: ${selectedAppointment.patient.name}`,
      `Patient ID: ${selectedAppointment.patient.id}`,
      `Phone: ${selectedAppointment.patient.phone || '-'}`,
      `Diagnosis: ${draft.diagnosis.primaryName || '-'} (${draft.diagnosis.primaryCode || '-'})`,
      `Secondary Diagnosis: ${draft.diagnosis.secondaryName || '-'}`,
      'Prescription:',
      ...draft.prescriptions.map((p) => `- ${p.medicationName} ${p.dosage}, ${p.frequency}, ${p.duration}, ${p.instructions}`),
      'Lab Tests:',
      ...draft.labOrders.map((l) => `- ${l.testName} (${l.priority})`),
      'Follow-up:',
      `Needed: ${draft.followUp.needed ? 'Yes' : 'No'}`,
      `Date: ${draft.followUp.date || '-'}`,
      `Instructions: ${draft.followUp.instructions || '-'}`,
      `Doctor: ${localStorage.getItem('user') ? (JSON.parse(localStorage.getItem('user') || '{}').name || 'Doctor') : 'Doctor'}`,
    ].join('\n');
  }, [selectedAppointment, draft]);

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const mapped = await Promise.all(
      Array.from(files).map(async (f) => ({ id: idFrom('att'), type: attachmentType, fileName: f.name, mimeType: f.type, dataUrl: await toDataUrl(f) }))
    );
    setDraft((prev) => ({ ...prev, attachments: [...prev.attachments, ...mapped] }));
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold">SOAP Notes</h2>
        <div>
          <label className="block text-sm mb-1">S - Subjective</label>
          <textarea value={draft.soap.subjective} onChange={(e) => setDraft((p) => ({ ...p, soap: { ...p.soap, subjective: e.target.value } }))} rows={3} className="w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">O - Objective</label>
          <textarea value={draft.soap.objective} onChange={(e) => setDraft((p) => ({ ...p, soap: { ...p.soap, objective: e.target.value } }))} rows={3} className="w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">A - Assessment</label>
          <textarea value={draft.soap.assessment} onChange={(e) => setDraft((p) => ({ ...p, soap: { ...p.soap, assessment: e.target.value } }))} rows={3} className="w-full border rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">P - Plan</label>
          <textarea value={draft.soap.plan} onChange={(e) => setDraft((p) => ({ ...p, soap: { ...p.soap, plan: e.target.value } }))} rows={3} className="w-full border rounded-md p-2" />
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold">Follow-up Plan</h2>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.followUp.needed} onChange={(e) => setDraft((p) => ({ ...p, followUp: { ...p.followUp, needed: e.target.checked } }))} /> Follow-up needed</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input type="date" value={draft.followUp.date} onChange={(e) => setDraft((p) => ({ ...p, followUp: { ...p.followUp, date: e.target.value } }))} className="border rounded-md p-2" disabled={!draft.followUp.needed} />
          <input value={draft.followUp.instructions} onChange={(e) => setDraft((p) => ({ ...p, followUp: { ...p.followUp, instructions: e.target.value } }))} className="border rounded-md p-2" placeholder="Check blood pressure daily" disabled={!draft.followUp.needed} />
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold">Referral (Optional)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select value={draft.referral.specialist} onChange={(e) => setDraft((p) => ({ ...p, referral: { ...p.referral, specialist: e.target.value } }))} className="border rounded-md p-2">
            <option value="">Select specialist</option>
            <option>Cardiologist</option><option>Neurologist</option><option>Orthopedic</option>
          </select>
          <input value={draft.referral.notes} onChange={(e) => setDraft((p) => ({ ...p, referral: { ...p.referral, notes: e.target.value } }))} className="border rounded-md p-2" placeholder="Referral notes" />
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold">Attachments</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select value={attachmentType} onChange={(e) => setAttachmentType(e.target.value as any)} className="border rounded-md p-2">
            <option value="ecg_report">ECG report</option><option value="lab_result">Lab result</option><option value="radiology_image">Radiology image</option><option value="referral_letter">Referral letter</option>
          </select>
          <input type="file" multiple onChange={onUpload} className="border rounded-md p-2 md:col-span-2" />
        </div>
        <div className="space-y-1">
          {draft.attachments.map((a) => (
            <div key={a.id} className="border rounded-md p-2 text-sm flex items-center justify-between">
              <span>{a.fileName} ({a.type})</span>
              <button onClick={() => setDraft((p) => ({ ...p, attachments: p.attachments.filter((x) => x.id !== a.id) }))} className="text-red-700 hover:text-red-900">Remove</button>
            </div>
          ))}
          {draft.attachments.length === 0 && <p className="text-sm text-gray-600">No attachments added.</p>}
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold">Generate Visit Summary</h2>
        <pre className="text-xs bg-gray-50 border rounded-md p-3 overflow-auto max-h-40 whitespace-pre-wrap">{summaryText || 'No summary data yet.'}</pre>
        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={saveDraft} className="px-3 py-2 rounded-md border hover:bg-gray-50">Save Draft</button>
          <button onClick={saveVisit} className="px-3 py-2 rounded-md border hover:bg-gray-50">Save Visit</button>
          <button onClick={() => window.print()} className="px-3 py-2 rounded-md border hover:bg-gray-50">Print / PDF</button>
          <button onClick={() => downloadText(`visit-summary-${selectedAppointment?.patient.id ?? 'patient'}.txt`, summaryText)} className="px-3 py-2 rounded-md border hover:bg-gray-50">Download</button>
          <button
            onClick={async () => {
              try {
                if (navigator.share) await navigator.share({ title: 'Visit Summary', text: summaryText });
                else {
                  await navigator.clipboard.writeText(summaryText);
                  toast.success('Summary copied to clipboard');
                  return;
                }
                toast.success('Summary shared');
              } catch {
                toast.error('Unable to share summary');
              }
            }}
            className="px-3 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorNotesFollowupPage;

