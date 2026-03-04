import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import { useFrontBenchPatients } from '../../hooks/frontbench/useFrontBenchPatients';
import { useFrontBenchInsurance } from '../../hooks/frontbench/useFrontBenchInsurance';
import type { Claim, PolicyVerification, PreAuthRequest } from '../../types/frontbench.types';

const InsuranceTPA: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;
  const patients = useFrontBenchPatients(clinicId);
  const insurance = useFrontBenchInsurance(clinicId);

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedMrn, setSelectedMrn] = useState('');
  const [insurerId, setInsurerId] = useState<string>(() => insurance.insurers[0]?.id ?? 'ins_1');
  const [policyNo, setPolicyNo] = useState('');

  const [preAuthFor, setPreAuthFor] = useState('');
  const [preAuthNote, setPreAuthNote] = useState('');

  const [claimNote, setClaimNote] = useState('');

  const patientResults = useMemo(() => {
    const t = patientSearch.trim();
    if (!t) return [];
    return patients.search(t).slice(0, 8);
  }, [patientSearch, patients]);

  const createVerification = () => {
    if (!selectedMrn) return toast.error('Select patient (MRN)');
    if (!policyNo.trim()) return toast.error('Enter policy number');
    insurance.addVerification({
      clinicId,
      patientMrn: selectedMrn,
      insurerId,
      policyNumber: policyNo.trim(),
      status: 'pending',
    });
    setPolicyNo('');
  };

  const createPreAuth = () => {
    if (!selectedMrn) return toast.error('Select patient (MRN)');
    if (!preAuthFor.trim()) return toast.error('Enter requested for');
    insurance.addPreAuth({
      clinicId,
      patientMrn: selectedMrn,
      insurerId,
      requestedFor: preAuthFor.trim(),
      status: 'draft',
      documents: [],
      note: preAuthNote.trim() || undefined,
    });
    setPreAuthFor('');
    setPreAuthNote('');
  };

  const createClaim = () => {
    if (!selectedMrn) return toast.error('Select patient (MRN)');
    insurance.addClaim({
      clinicId,
      patientMrn: selectedMrn,
      insurerId,
      status: 'draft',
      documents: [],
      note: claimNote.trim() || undefined,
    });
    setClaimNote('');
  };

  const verificationColumns = useMemo(
    () => [
      { key: 'patientMrn', header: 'MRN' },
      { key: 'policyNumber', header: 'Policy' },
      { key: 'status', header: 'Status' },
      {
        key: 'actions',
        header: 'Actions',
        render: (_: unknown, row: PolicyVerification) => (
          <div className="flex gap-2">
            <button onClick={() => insurance.updateVerification(row.id, { status: 'verified', verifiedAt: new Date().toISOString() })} className="text-xs text-green-700">
              Verify
            </button>
            <button onClick={() => insurance.updateVerification(row.id, { status: 'rejected', note: 'Rejected (dev)' })} className="text-xs text-red-700">
              Reject
            </button>
          </div>
        ),
      },
    ],
    [insurance]
  );

  const preauthColumns = useMemo(
    () => [
      { key: 'patientMrn', header: 'MRN' },
      { key: 'requestedFor', header: 'Requested For' },
      { key: 'status', header: 'Status' },
      {
        key: 'actions',
        header: 'Actions',
        render: (_: unknown, row: PreAuthRequest) => (
          <div className="flex gap-2">
            <button onClick={() => insurance.updatePreAuth(row.id, { status: 'submitted', submittedAt: new Date().toISOString() })} className="text-xs text-primary-700">
              Submit
            </button>
            <button onClick={() => insurance.updatePreAuth(row.id, { status: 'approved' })} className="text-xs text-green-700">
              Approve
            </button>
            <button onClick={() => insurance.updatePreAuth(row.id, { status: 'rejected' })} className="text-xs text-red-700">
              Reject
            </button>
          </div>
        ),
      },
    ],
    [insurance]
  );

  const claimColumns = useMemo(
    () => [
      { key: 'patientMrn', header: 'MRN' },
      { key: 'status', header: 'Status' },
      { key: 'invoiceId', header: 'Invoice' },
      {
        key: 'actions',
        header: 'Actions',
        render: (_: unknown, row: Claim) => (
          <div className="flex gap-2">
            <button onClick={() => insurance.updateClaim(row.id, { status: 'submitted' })} className="text-xs text-primary-700">
              Submit
            </button>
            <button onClick={() => insurance.updateClaim(row.id, { status: 'approved' })} className="text-xs text-green-700">
              Approve
            </button>
            <button onClick={() => insurance.updateClaim(row.id, { status: 'rejected' })} className="text-xs text-red-700">
              Reject
            </button>
          </div>
        ),
      },
    ],
    [insurance]
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Insurance & TPA Coordination</h1>
        <p className="text-sm text-gray-500">Insurer master, policy verification tracker, pre-auth log, claim status, pending approvals dashboard.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4 xl:col-span-1 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Patient</h2>
            <SearchBar onSearch={setPatientSearch} debounceMs={150} placeholder="Search patient..." />
            {patientResults.length > 0 && (
              <div className="mt-2 border rounded-lg divide-y max-h-56 overflow-auto">
                {patientResults.map((p) => (
                  <button key={p.id} onClick={() => setSelectedMrn(p.mrn)} className="w-full text-left px-3 py-2 hover:bg-gray-50">
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-600">{p.mrn} • {p.phone}</div>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3">
              <label className="block text-xs text-gray-600 mb-1">MRN</label>
              <input value={selectedMrn} onChange={(e) => setSelectedMrn(e.target.value)} className="w-full border rounded-md p-2" />
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-600 mb-1">Insurer</label>
              <select value={insurerId} onChange={(e) => setInsurerId(e.target.value)} className="w-full border rounded-md p-2">
                {insurance.insurers.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Policy Verification</h2>
            <input value={policyNo} onChange={(e) => setPolicyNo(e.target.value)} className="w-full border rounded-md p-2" placeholder="Policy number" />
            <div className="mt-2 flex justify-end">
              <button onClick={createVerification} className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black">
                Add
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Pre-Authorization</h2>
            <input value={preAuthFor} onChange={(e) => setPreAuthFor(e.target.value)} className="w-full border rounded-md p-2" placeholder="Requested for (procedure/service)" />
            <input value={preAuthNote} onChange={(e) => setPreAuthNote(e.target.value)} className="w-full border rounded-md p-2 mt-2" placeholder="Note (optional)" />
            <div className="mt-2 flex justify-end">
              <button onClick={createPreAuth} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                Create
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Claim Tracker</h2>
            <input value={claimNote} onChange={(e) => setClaimNote(e.target.value)} className="w-full border rounded-md p-2" placeholder="Note (optional)" />
            <div className="mt-2 flex justify-end">
              <button onClick={createClaim} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
                Create Claim
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Pending Approvals</h2>
            {insurance.pendingApprovals.length === 0 ? (
              <p className="text-sm text-gray-600">No pending pre-auth approvals.</p>
            ) : (
              <ul className="text-sm text-gray-800 list-disc list-inside">
                {insurance.pendingApprovals.slice(0, 8).map((p) => (
                  <li key={p.id}>{p.patientMrn} — {p.requestedFor} ({p.status})</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 xl:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Policy Verification Tracker</h2>
            <DataTable<PolicyVerification> columns={verificationColumns as any} data={insurance.verifications.slice(0, 30)} loading={false} />
          </div>
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Pre-auth Log</h2>
            <DataTable<PreAuthRequest> columns={preauthColumns as any} data={insurance.preauth.slice(0, 30)} loading={false} />
          </div>
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Claim Status Tracker</h2>
            <DataTable<Claim> columns={claimColumns as any} data={insurance.claims.slice(0, 30)} loading={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceTPA;
