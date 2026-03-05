import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { LabStore } from '../../services/local/lab.store';
import type { LabRequestStatus } from '../../types/lab.types';

type TabKey = 'requests' | 'results' | 'masters' | 'qc' | 'reports';

const statusClasses: Record<LabRequestStatus, string> = {
  pending_collection: 'bg-amber-100 text-amber-800',
  collected: 'bg-sky-100 text-sky-800',
  rejected: 'bg-rose-100 text-rose-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  result_entered: 'bg-violet-100 text-violet-800',
  verified: 'bg-cyan-100 text-cyan-800',
  released: 'bg-emerald-100 text-emerald-800',
  outsourced: 'bg-orange-100 text-orange-800',
};

const LabDashboard: React.FC = () => {
  const { user } = useAuth();
  const currentUser = user?.name || 'Staff';
  const canVerify = user?.role === 'clinic_admin' || user?.role === 'lab_staff';
  const [tab, setTab] = useState<TabKey>('requests');
  const [version, setVersion] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | LabRequestStatus>('all');
  const [resultDraft, setResultDraft] = useState<Record<string, string>>({});
  const [reportMrn, setReportMrn] = useState('');
  const [componentCode, setComponentCode] = useState('A1C');

  const refresh = () => setVersion((v) => v + 1);
  const master = useMemo(() => (version, LabStore.getMasterData()), [version]);
  const requests = useMemo(() => (version, LabStore.getRequests()), [version]);
  const qcLogs = useMemo(() => (version, LabStore.getQcLogs()), [version]);
  const reagents = useMemo(() => (version, LabStore.getReagents()), [version]);
  const workload = useMemo(() => LabStore.workloadStats(), [version]);
  const trend = useMemo(() => (reportMrn.trim() ? LabStore.cumulativeTrend(reportMrn.trim(), componentCode) : []), [reportMrn, componentCode, version]);

  const filtered = requests.filter((request) => {
    if (status !== 'all' && request.status !== status) return false;
    if (!search.trim()) return true;
    const t = search.toLowerCase();
    return `${request.patientName} ${request.patientMrn} ${request.panelCode}`.toLowerCase().includes(t);
  });
  const active = filtered.find((request) => request.id === selectedId) ?? filtered[0];
  const panicCount = requests.filter((request) => request.results.some((result) => result.panic) && !request.panicAcknowledgedAt).length;

  const updateResultDraft = () => {
    if (!active) return;
    const next: Record<string, string> = {};
    active.results.forEach((result) => {
      next[result.componentCode] = result.value == null ? '' : String(result.value);
    });
    setResultDraft(next);
  };

  const submitResults = () => {
    if (!active) return;
    const values = active.results.map((result) => ({
      componentCode: result.componentCode,
      value: resultDraft[result.componentCode] === '' ? null : Number(resultDraft[result.componentCode]),
    }));
    LabStore.enterResults(active.id, currentUser, values);
    refresh();
    toast.success('Result entered by technician');
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Lab Operations Hub</h1>
          <p className="text-sm text-gray-600">Request dashboard, specimen flow, two-step validation, QC, and reports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['requests', 'results', 'masters', 'qc', 'reports'] as TabKey[]).map((key) => (
            <button key={key} onClick={() => setTab(key)} className={`px-3 py-2 rounded text-sm ${tab === key ? 'bg-primary-600 text-white' : 'bg-white border'}`}>
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white border rounded p-3"><p className="text-xs text-gray-500">Pending</p><p className="font-bold">{requests.filter((request) => request.status === 'pending_collection').length}</p></div>
        <div className="bg-white border rounded p-3"><p className="text-xs text-gray-500">Collected</p><p className="font-bold">{requests.filter((request) => request.status === 'collected').length}</p></div>
        <div className="bg-white border rounded p-3"><p className="text-xs text-gray-500">Verified/Released</p><p className="font-bold">{requests.filter((request) => request.status === 'verified' || request.status === 'released').length}</p></div>
        <div className="bg-white border rounded p-3"><p className="text-xs text-gray-500">Panic Alerts</p><p className="font-bold text-rose-700">{panicCount}</p></div>
      </div>

      {tab === 'requests' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-white border rounded p-3 space-y-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Search patient/MRN/test" />
            <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | LabRequestStatus)} className="w-full border rounded p-2 text-sm">
              <option value="all">All statuses</option>
              <option value="pending_collection">Pending collection</option>
              <option value="collected">Collected</option>
              <option value="result_entered">Result entered</option>
              <option value="verified">Verified</option>
              <option value="released">Released</option>
              <option value="rejected">Rejected</option>
              <option value="outsourced">Outsourced</option>
            </select>
            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {filtered.map((request) => (
                <button key={request.id} onClick={() => { setSelectedId(request.id); setResultDraft({}); }} className={`w-full border rounded p-2 text-left ${active?.id === request.id ? 'bg-primary-50 border-primary-400' : ''}`}>
                  <div className="text-sm font-semibold">{request.patientName}</div>
                  <div className="text-xs text-gray-600">{request.patientMrn} • {request.panelCode}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusClasses[request.status]}`}>{request.status.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${request.billingClearance === 'cleared' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{request.billingClearance}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="xl:col-span-2 bg-white border rounded p-4 space-y-3">
            {!active && <p className="text-sm text-gray-500">No lab requests.</p>}
            {active && (
              <>
                <h2 className="font-semibold">{active.panelName} ({active.panelCode})</h2>
                <p className="text-sm text-gray-600">{active.patientName} • {active.patientMrn} • Ordered by {active.doctorName}</p>
                <p className="text-xs">Barcode: <span className="font-mono">{active.specimenBarcode}</span></p>
                <p className="text-xs">Billing invoice: {active.billingInvoiceId || 'NA'} ({active.billingClearance})</p>
                <div className="text-sm">
                  <p className="font-medium">Nurse instructions</p>
                  <ul className="list-disc pl-5 text-xs">{active.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ul>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <button className="px-3 py-2 border rounded" onClick={() => { navigator.clipboard.writeText(active.specimenBarcode).catch(() => undefined); toast.success('Barcode copied for label printing'); }}>Print Label</button>
                  <button className="px-3 py-2 border rounded" onClick={() => { LabStore.syncFinancialClearance(); refresh(); }}>Refresh Clearance</button>
                  <button className="px-3 py-2 bg-emerald-600 text-white rounded disabled:opacity-50" disabled={active.status !== 'pending_collection' || active.billingClearance !== 'cleared'} onClick={() => { LabStore.collectSpecimen(active.id, currentUser); refresh(); }}>Collect</button>
                  <button className="px-3 py-2 bg-rose-600 text-white rounded" onClick={() => { LabStore.rejectSpecimen(active.id, currentUser, 'Specimen quality issue'); refresh(); }}>Reject</button>
                  <select className="px-2 py-2 border rounded" onChange={(e) => setStatus(status)} value={status}>
                    <option value={status}>Use master tab to manage outsource labs</option>
                  </select>
                  <button className="px-3 py-2 border rounded" onClick={() => { if (master.outsourcedLabs[0]) { LabStore.sendToOutsourcedLab(active.id, master.outsourcedLabs[0].id); refresh(); } }}>Send Outsourced</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'results' && active && (
        <div className="bg-white border rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Result Entry & Validation</h2>
            <span className={`px-2 py-1 rounded-full text-xs ${statusClasses[active.status]}`}>{active.status.replace(/_/g, ' ')}</span>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th className="py-2">Component</th><th>Value</th><th>Reference</th><th>Flag</th></tr></thead>
              <tbody>
                {active.results.map((result) => {
                  const input = resultDraft[result.componentCode] ?? (result.value == null ? '' : String(result.value));
                  const numeric = input === '' ? null : Number(input);
                  const abnormal = numeric != null && ((result.refLow != null && numeric < result.refLow) || (result.refHigh != null && numeric > result.refHigh));
                  return (
                    <tr key={result.componentCode} className={abnormal ? 'bg-amber-50' : ''}>
                      <td className="py-2">{result.componentName}</td>
                      <td><input value={input} onChange={(e) => setResultDraft((prev) => ({ ...prev, [result.componentCode]: e.target.value }))} className="w-24 border rounded p-1" /> {result.unitSymbol}</td>
                      <td>{result.refLow ?? '-'} - {result.refHigh ?? '-'}</td>
                      <td>{abnormal ? 'Abnormal' : 'Normal'}{result.panic ? ' / Panic' : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button className="px-3 py-2 bg-primary-600 text-white rounded" onClick={submitResults}>Technician Submit</button>
            <button className="px-3 py-2 bg-emerald-600 text-white rounded disabled:opacity-50" disabled={!canVerify || active.status !== 'result_entered'} onClick={() => { if (active.enteredBy === currentUser) return toast.error('Verifier must be different from technician'); LabStore.verifyResults(active.id, currentUser, true); refresh(); }}>Verify + Release</button>
            <button className="px-3 py-2 border rounded" onClick={updateResultDraft}>Load Existing Values</button>
            <button className="px-3 py-2 border rounded" onClick={() => { if (active.results.some((result) => result.panic)) { LabStore.acknowledgePanic(active.id, currentUser); refresh(); } }}>Acknowledge Panic</button>
          </div>
          <div className="text-xs text-gray-600">
            Doctor visibility: verified and released reports are available with abnormal/panic flags in this shared queue.
          </div>
        </div>
      )}

      {tab === 'masters' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="font-semibold">Master Data</h2>
            <div className="text-sm">Panels: {master.panels.length} • Ranges: {master.ranges.length} • Units: {master.units.length}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <input placeholder="Unit symbol" className="border rounded p-2" onChange={(e) => setSearch(e.target.value)} value={search} />
              <input placeholder="Unit label" className="border rounded p-2" onChange={(e) => setSelectedId(e.target.value)} value={selectedId} />
              <button className="px-3 py-2 border rounded col-span-2" onClick={() => { if (search.trim() && selectedId.trim()) { LabStore.addUnit({ symbol: search.trim(), label: selectedId.trim() }); refresh(); } }}>Add Unit</button>
            </div>
            <div className="text-xs max-h-44 overflow-auto space-y-1">
              {master.panels.map((panel) => <div key={panel.id} className="border rounded p-2">{panel.code} - {panel.name} ({panel.components.length} components)</div>)}
            </div>
          </div>
          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="font-semibold">Packages / Outsourced</h2>
            <button className="px-3 py-2 border rounded text-sm" onClick={() => { if (master.panels.length >= 2) { LabStore.addPackageDeal({ name: 'Health Check Package', panelIds: master.panels.slice(0, 2).map((panel) => panel.id), discountPercent: 15 }); refresh(); } }}>Create sample package deal</button>
            <button className="px-3 py-2 border rounded text-sm ml-2" onClick={() => { LabStore.addOutsourcedLabPartner({ name: 'External Partner', contact: '+91-9000000000', slaHours: 24 }); refresh(); }}>Add outsourced lab</button>
            <div className="text-xs space-y-1">
              {master.packageDeals.map((pkg) => <div key={pkg.id} className="border rounded p-2">{pkg.name} ({pkg.discountPercent}% off)</div>)}
              {master.outsourcedLabs.map((partner) => <div key={partner.id} className="border rounded p-2">{partner.name} • SLA {partner.slaHours}h</div>)}
            </div>
          </div>
        </div>
      )}

      {tab === 'qc' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white border rounded p-4 space-y-2">
            <h2 className="font-semibold">QC Logs</h2>
            <button className="px-3 py-2 border rounded text-sm" onClick={() => { LabStore.addQcLog({ panelCode: 'CBC', level: 'L1', expected: 10, observed: 10.2, recordedBy: currentUser }); refresh(); }}>Add sample QC log</button>
            <div className="max-h-52 overflow-auto text-xs space-y-1">
              {qcLogs.map((log) => <div key={log.id} className={`border rounded p-2 ${log.passed ? 'bg-emerald-50' : 'bg-rose-50'}`}>{log.panelCode} {log.level} {log.observed}/{log.expected} {log.passed ? 'PASS' : 'FAIL'}</div>)}
            </div>
          </div>
          <div className="bg-white border rounded p-4 space-y-2">
            <h2 className="font-semibold">Reagent Inventory & Analyzer Import</h2>
            <button className="px-3 py-2 border rounded text-sm" onClick={() => { LabStore.addReagent({ name: 'General Reagent', panelCode: 'CBC', stockUnits: 10, reorderLevel: 5, unitLabel: 'kits' }); refresh(); }}>Add reagent</button>
            <button className="px-3 py-2 border rounded text-sm ml-2" onClick={() => { if (active) { const values = active.results.map((result) => ({ componentCode: result.componentCode, value: result.refLow != null && result.refHigh != null ? Number(((result.refLow + result.refHigh) / 2).toFixed(2)) : 1 })); LabStore.enterResults(active.id, `${currentUser} (Analyzer)`, values); refresh(); } }}>Import analyzer sample</button>
            <div className="max-h-52 overflow-auto text-xs space-y-1">
              {reagents.map((reagent) => (
                <div key={reagent.id} className={`border rounded p-2 ${reagent.stockUnits <= reagent.reorderLevel ? 'bg-rose-50' : ''}`}>
                  {reagent.name} ({reagent.panelCode}) - {reagent.stockUnits} {reagent.unitLabel}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="font-semibold">Patient Report (Print)</h2>
            {active ? (
              <div className="border rounded p-3 text-sm">
                <p className="font-semibold">ClinicFlow Lab Report</p>
                <p>{active.patientName} ({active.patientMrn}) • {active.panelCode}</p>
                <div className="mt-2 space-y-1 text-xs">
                  {active.results.map((result) => <div key={result.componentCode}>{result.componentName}: {result.value ?? '-'} {result.unitSymbol} ({result.abnormal ? 'Abnormal' : 'Normal'})</div>)}
                </div>
              </div>
            ) : <p className="text-sm text-gray-500">Select a request to print.</p>}
            <button className="px-3 py-2 bg-primary-600 text-white rounded text-sm" onClick={() => window.print()}>Print Final Report</button>
          </div>
          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="font-semibold">Cumulative Trends & Workload</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <input value={reportMrn} onChange={(e) => setReportMrn(e.target.value)} className="border rounded p-2" placeholder="Patient MRN" />
              <input value={componentCode} onChange={(e) => setComponentCode(e.target.value)} className="border rounded p-2" placeholder="Component code" />
            </div>
            <div className="border rounded p-2 max-h-28 overflow-auto text-xs">
              {trend.map((point, idx) => <div key={`${point.at}_${idx}`}>{new Date(point.at).toLocaleDateString()}: {point.value}</div>)}
              {trend.length === 0 && <p>No trend data yet.</p>}
            </div>
            <div className="border rounded p-2 max-h-32 overflow-auto text-xs">
              {workload.map((entry) => <div key={entry.technician}>{entry.technician}: {entry.entries} tests, avg TAT {entry.avgTatMinutes}m</div>)}
              {workload.length === 0 && <p>No workload stats yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabDashboard;
