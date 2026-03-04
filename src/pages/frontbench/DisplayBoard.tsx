import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFrontBenchQueue } from '../../hooks/frontbench/useFrontBenchQueue';
import { useFrontBenchScheduling } from '../../hooks/frontbench/useFrontBenchScheduling';

const DisplayBoard: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;
  const { doctors } = useFrontBenchScheduling(clinicId);
  const queue = useFrontBenchQueue(clinicId);

  const [doctorId, setDoctorId] = useState<string>('all');
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const live = useMemo(() => {
    const doc = doctorId === 'all' ? undefined : doctorId;
    return queue.getLiveQueue(doc).slice(0, 20);
  }, [doctorId, queue]);

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Queue Display</h1>
          <p className="text-sm text-gray-500">TV-friendly display (auto-refresh).</p>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Doctor</label>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="border rounded-md p-2">
            <option value="all">All</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-semibold">
          <div className="col-span-2">Token</div>
          <div className="col-span-4">MRN</div>
          <div className="col-span-3">Doctor</div>
          <div className="col-span-3">Status</div>
        </div>
        <div className="divide-y">
          {live.length === 0 ? (
            <div className="p-6 text-gray-600">No live queue items.</div>
          ) : (
            live.map((q) => {
              const doc = doctors.find((d) => d.id === q.doctorId);
              return (
                <div key={q.id} className="grid grid-cols-12 gap-2 px-4 py-4 text-lg">
                  <div className="col-span-2 font-bold text-primary-700">{q.token}</div>
                  <div className="col-span-4">{q.patientMrn}</div>
                  <div className="col-span-3">{doc?.name ?? q.doctorId}</div>
                  <div className="col-span-3">{q.status}{q.room ? ` (${q.room})` : ''}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DisplayBoard;

