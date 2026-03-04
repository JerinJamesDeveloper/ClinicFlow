import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { FrontBenchStore } from '../../services/local/frontbench.store';
import { useFrontBenchBilling } from '../../hooks/frontbench/useFrontBenchBilling';
import type { DailyClosingReport } from '../../types/frontbench.types';

const round2 = (n: number) => Math.round(n * 100) / 100;

const Reports: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;
  const billing = useFrontBenchBilling(clinicId);

  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [supervisorName, setSupervisorName] = useState(user?.name ?? '');
  const [openingCash, setOpeningCash] = useState(0);
  const [countedCash, setCountedCash] = useState(0);
  const [notes, setNotes] = useState('');

  const cashReport = useMemo(() => FrontBenchStore.generateDailyCashReport(clinicId, day), [clinicId, day]);
  const existingClosing = useMemo(
    () => FrontBenchStore.getDailyClosingReports().find((r) => r.clinicId === clinicId && r.dayIso === day) ?? null,
    [clinicId, day]
  );

  const submitClosing = () => {
    const cashCollected = cashReport.totalsByMode.cash;
    const cashRefunded = cashReport.totalRefunded; // simplistic: treat all refunds as cash impact
    const report = FrontBenchStore.createDailyClosingReport({
      clinicId,
      dayIso: day,
      supervisorName: supervisorName || 'Supervisor',
      openingCash: round2(openingCash),
      cashCollected: round2(cashCollected),
      cashRefunded: round2(cashRefunded),
      countedCash: round2(countedCash),
      notes: notes || undefined,
    });
    toast.success(`Closing saved (${report.dayIso})`);
  };

  const closing = existingClosing as DailyClosingReport | null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Daily cash report + daily closing report for front desk supervisor.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Daily Cash Report</h2>
          <div className="flex gap-3 items-end mb-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Day</label>
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="border rounded-md p-2" />
            </div>
            <button
              onClick={() => {
                const report = billing.dailyCashReport(day);
                toast.success(`Generated cash report for ${report.dayIso}`);
              }}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-2 text-sm">
            {Object.entries(cashReport.totalsByMode).map(([mode, amt]) => (
              <div key={mode} className="flex justify-between">
                <span className="text-gray-700">{mode}</span>
                <span className="font-semibold">₹{round2(amt)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between">
              <span className="text-gray-900 font-semibold">Total Collected</span>
              <span className="font-semibold">₹{round2(cashReport.totalCollected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total Refunded</span>
              <span className="font-semibold">₹{round2(cashReport.totalRefunded)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Daily Closing (Supervisor)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Supervisor</label>
              <input value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} className="w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Opening Cash</label>
              <input type="number" value={openingCash} onChange={(e) => setOpeningCash(Number(e.target.value))} className="w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Counted Cash</label>
              <input type="number" value={countedCash} onChange={(e) => setCountedCash(Number(e.target.value))} className="w-full border rounded-md p-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border rounded-md p-2" />
            </div>
          </div>

          <div className="mt-3 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span>Cash collected</span>
              <span className="font-semibold">₹{round2(cashReport.totalsByMode.cash)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cash refunded (approx)</span>
              <span className="font-semibold">₹{round2(cashReport.totalRefunded)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Expected cash</span>
              <span className="font-semibold">₹{round2(openingCash + cashReport.totalsByMode.cash - cashReport.totalRefunded)}</span>
            </div>
            <div className="flex justify-between">
              <span>Variance</span>
              <span className={`font-semibold ${(countedCash - (openingCash + cashReport.totalsByMode.cash - cashReport.totalRefunded)) === 0 ? 'text-green-700' : 'text-amber-700'}`}>
                ₹{round2(countedCash - (openingCash + cashReport.totalsByMode.cash - cashReport.totalRefunded))}
              </span>
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button onClick={submitClosing} className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black">
              Save Closing
            </button>
          </div>

          {closing && (
            <div className="mt-4 border-t pt-3 text-sm">
              <div className="font-semibold text-gray-900 mb-1">Saved closing</div>
              <div>Closed at: {new Date(closing.closedAt).toLocaleString()}</div>
              <div>Expected: ₹{round2(closing.expectedCash)} • Counted: ₹{round2(closing.countedCash)} • Variance: ₹{round2(closing.variance)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;

