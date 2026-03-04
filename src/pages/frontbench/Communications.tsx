import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import { useFrontBenchPatients } from '../../hooks/frontbench/useFrontBenchPatients';
import { useFrontBenchComms } from '../../hooks/frontbench/useFrontBenchComms';
import type { Complaint, MessageLog, MessageTemplate, SatisfactionRating } from '../../types/frontbench.types';

const Communications: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;
  const patients = useFrontBenchPatients(clinicId);
  const comms = useFrontBenchComms(clinicId);

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedMrn, setSelectedMrn] = useState('');
  const [to, setTo] = useState('');
  const [tplId, setTplId] = useState<string>(() => comms.templates[0]?.id ?? '');
  const [customBody, setCustomBody] = useState('');

  const [complaintCategory, setComplaintCategory] = useState<Complaint['category']>('service');
  const [complaintDesc, setComplaintDesc] = useState('');

  const [ratingScore, setRatingScore] = useState<SatisfactionRating['score']>(5);
  const [ratingComment, setRatingComment] = useState('');

  const patientResults = useMemo(() => {
    const t = patientSearch.trim();
    if (!t) return [];
    return patients.search(t).slice(0, 8);
  }, [patientSearch, patients]);

  const tpl = useMemo(() => comms.templates.find((t) => t.id === tplId) ?? comms.templates[0] ?? null, [comms.templates, tplId]);

  const selectedPatient = useMemo(() => (selectedMrn ? patients.getByMrn(selectedMrn) : null), [patients, selectedMrn]);

  const send = () => {
    if (!tpl && !customBody.trim()) return toast.error('Select a template or type a message');
    if (!to.trim()) return toast.error('Enter phone number / WhatsApp number');

    if (tpl) {
      comms.sendTemplate(tpl, {
        to: to.trim(),
        patientMrn: selectedMrn || undefined,
        vars: {
          name: selectedPatient?.name ?? 'Patient',
          mrn: selectedMrn || '',
        },
      });
    } else {
      comms.send({ to: to.trim(), channel: 'sms', body: customBody.trim(), patientMrn: selectedMrn || undefined });
    }
  };

  const logComplaint = () => {
    if (!selectedMrn) return toast.error('Select patient (MRN)');
    if (!complaintDesc.trim()) return toast.error('Enter complaint details');
    comms.createComplaint({
      clinicId,
      patientMrn: selectedMrn,
      category: complaintCategory,
      description: complaintDesc.trim(),
      status: 'open',
    });
    setComplaintDesc('');
  };

  const addRating = () => {
    if (!selectedMrn) return toast.error('Select patient (MRN)');
    comms.addRating({ clinicId, patientMrn: selectedMrn, score: ratingScore, comment: ratingComment.trim() || undefined });
    setRatingComment('');
  };

  const logColumns = useMemo(
    () => [
      { key: 'createdAt', header: 'Time' },
      { key: 'channel', header: 'Channel' },
      { key: 'to', header: 'To' },
      { key: 'status', header: 'Status' },
      { key: 'patientMrn', header: 'MRN' },
    ],
    []
  );

  const complaintColumns = useMemo(
    () => [
      { key: 'createdAt', header: 'Created' },
      { key: 'patientMrn', header: 'MRN' },
      { key: 'category', header: 'Category' },
      { key: 'status', header: 'Status' },
      {
        key: 'actions',
        header: 'Actions',
        render: (_: unknown, row: Complaint) => (
          <div className="flex gap-2">
            <button onClick={() => comms.updateComplaint(row.id, { status: 'in_progress' })} className="text-xs text-primary-700">
              In progress
            </button>
            <button onClick={() => comms.updateComplaint(row.id, { status: 'resolved', resolutionNote: 'Resolved (dev)' })} className="text-xs text-green-700">
              Resolve
            </button>
          </div>
        ),
      },
    ],
    [comms]
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">CRM Communications</h1>
        <p className="text-sm text-gray-500">SMS/WhatsApp (dev placeholder), follow-ups, reminders, complaints, satisfaction, internal notes.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4 xl:col-span-1 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Patient</h2>
            <SearchBar onSearch={setPatientSearch} debounceMs={150} placeholder="Search by name/phone/MRN/Aadhaar..." />
            {patientResults.length > 0 && (
              <div className="mt-2 border rounded-lg divide-y max-h-56 overflow-auto">
                {patientResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedMrn(p.mrn);
                      setTo(p.phone);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-600">{p.mrn} • {p.phone}</div>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">MRN</label>
                <input value={selectedMrn} onChange={(e) => setSelectedMrn(e.target.value)} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To (phone)</label>
                <input value={to} onChange={(e) => setTo(e.target.value)} className="w-full border rounded-md p-2" />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Send Message</h2>
            <label className="block text-xs text-gray-600 mb-1">Template</label>
            <select value={tplId} onChange={(e) => setTplId(e.target.value)} className="w-full border rounded-md p-2">
              {comms.templates.map((t: MessageTemplate) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.channel})
                </option>
              ))}
              <option value="">Custom</option>
            </select>

            <label className="block text-xs text-gray-600 mb-1 mt-2">Body</label>
            <textarea
              value={tplId ? tpl?.body ?? '' : customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              rows={4}
              className="w-full border rounded-md p-2"
              disabled={!!tplId}
            />

            <div className="mt-2 flex justify-end">
              <button onClick={send} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                Send
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Complaint Tracking</h2>
            <div className="grid grid-cols-2 gap-2">
              <select value={complaintCategory} onChange={(e) => setComplaintCategory(e.target.value as any)} className="border rounded-md p-2">
                <option value="billing">Billing</option>
                <option value="service">Service</option>
                <option value="wait_time">Wait time</option>
                <option value="clinical">Clinical</option>
                <option value="other">Other</option>
              </select>
              <button onClick={logComplaint} className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black">
                Log
              </button>
            </div>
            <textarea value={complaintDesc} onChange={(e) => setComplaintDesc(e.target.value)} rows={3} className="w-full border rounded-md p-2 mt-2" placeholder="Complaint details..." />
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Satisfaction Rating</h2>
            <div className="grid grid-cols-2 gap-2 items-center">
              <select value={ratingScore} onChange={(e) => setRatingScore(Number(e.target.value) as any)} className="border rounded-md p-2">
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>
                    {s} / 5
                  </option>
                ))}
              </select>
              <button onClick={addRating} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
                Save
              </button>
            </div>
            <input value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} className="w-full border rounded-md p-2 mt-2" placeholder="optional comment" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 xl:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Message Log</h2>
            <DataTable<MessageLog> columns={logColumns as any} data={comms.logs.slice(0, 30)} loading={false} />
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Complaints</h2>
            <DataTable<Complaint> columns={complaintColumns as any} data={comms.complaints.slice(0, 30)} loading={false} />
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Ratings</h2>
            <div className="space-y-2">
              {comms.ratings.slice(0, 10).map((r) => (
                <div key={r.id} className="border rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-900">{r.patientMrn} — {r.score}/5</div>
                  {r.comment && <div className="text-sm text-gray-700 mt-1">{r.comment}</div>}
                  <div className="text-xs text-gray-500 mt-1">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {comms.ratings.length === 0 && <p className="text-sm text-gray-600">No ratings yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Communications;

