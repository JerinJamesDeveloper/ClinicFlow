import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useFrontBenchPatients } from '../../hooks/frontbench/useFrontBenchPatients';
import { useFrontBenchQueue } from '../../hooks/frontbench/useFrontBenchQueue';
import { useFrontBenchScheduling } from '../../hooks/frontbench/useFrontBenchScheduling';
import SearchBar from '../../components/common/SearchBar';

const estimateWaitMinutes = (position: number, avgPerPatient = 7) => Math.max(0, position) * avgPerPatient;

const QueueManagement: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;
  const { doctors } = useFrontBenchScheduling(clinicId);
  const patients = useFrontBenchPatients(clinicId);
  const queue = useFrontBenchQueue(clinicId);

  const [doctorId, setDoctorId] = useState<string>(() => doctors[0]?.id ?? 'doc_1');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMrn, setSelectedMrn] = useState('');
  const [priority, setPriority] = useState(50);
  const [room, setRoom] = useState('');

  const live = useMemo(() => queue.getLiveQueue(doctorId), [doctorId, queue]);

  const patientResults = useMemo(() => {
    const t = searchTerm.trim();
    if (!t) return [];
    return patients.search(t).slice(0, 8);
  }, [patients, searchTerm]);

  const add = () => {
    const mrn = selectedMrn.trim();
    if (!mrn) return;
    if (!patients.getByMrn(mrn)) {
      toast.error('Patient MRN not found in Front Bench CRM');
      return;
    }
    queue.addWalkIn(doctorId, mrn, { priority, room: room || undefined });
    setSelectedMrn('');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Walk-in & Queue Management</h1>
        <p className="text-sm text-gray-500">Token generation, live queue, status tracking, priority override, room assignment.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4 xl:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Register Walk-in</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Doctor</label>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full border rounded-md p-2">
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.room ? `(${d.room})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Find patient</label>
              <SearchBar onSearch={setSearchTerm} debounceMs={150} placeholder="Name / phone / MRN / Aadhaar" />
              {patientResults.length > 0 && (
                <div className="mt-2 border rounded-lg divide-y max-h-56 overflow-auto">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedMrn(p.mrn)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    >
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-600">{p.mrn} • {p.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Selected MRN</label>
              <input value={selectedMrn} onChange={(e) => setSelectedMrn(e.target.value)} className="w-full border rounded-md p-2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Priority</label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full border rounded-md p-2"
                />
                <p className="text-xs text-gray-500 mt-1">Smaller = sooner</p>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Room</label>
                <input value={room} onChange={(e) => setRoom(e.target.value)} className="w-full border rounded-md p-2" placeholder="optional" />
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={add} className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black">
                Generate Token
              </button>
            </div>

            <div className="text-xs text-gray-500">
              SMS/WhatsApp actions are placeholders (toast notifications).
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Live Queue</h2>
            <div className="text-xs text-gray-500">Estimated wait assumes ~7 min per patient</div>
          </div>

          {live.length === 0 ? (
            <p className="text-sm text-gray-600">No patients in queue.</p>
          ) : (
            <div className="space-y-2">
              {live.map((q, idx) => (
                <div key={q.id} className="border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Token {q.token} • {q.patientMrn}
                    </div>
                    <div className="text-xs text-gray-600">
                      Status: {q.status} • Priority: {q.priority}
                      {q.room ? ` • Room: ${q.room}` : ''} • ETA: ~{estimateWaitMinutes(idx)} min
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button onClick={() => queue.updateStatus(q.id, 'with_doctor')} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">
                      With doctor
                    </button>
                    <button onClick={() => queue.updateStatus(q.id, 'done')} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">
                      Done
                    </button>
                    <button onClick={() => queue.updateStatus(q.id, 'skipped')} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">
                      Skip
                    </button>
                    <button onClick={() => queue.sendMessage(q.token, 'sms')} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">
                      SMS
                    </button>
                    <button onClick={() => queue.sendMessage(q.token, 'whatsapp')} className="px-2 py-1 text-xs rounded border hover:bg-gray-50">
                      WhatsApp
                    </button>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={q.priority}
                        className="w-20 border rounded px-2 py-1 text-xs"
                        onBlur={(e) => queue.overridePriority(q.id, Number(e.target.value))}
                        title="Override priority"
                      />
                      <input
                        defaultValue={q.room ?? ''}
                        className="w-24 border rounded px-2 py-1 text-xs"
                        onBlur={(e) => queue.assignRoom(q.id, e.target.value)}
                        placeholder="Room"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueManagement;
