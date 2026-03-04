// src/pages/pharmacy/PrescriptionManagement.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  FunnelIcon,
  PrinterIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import StatusBadge from '../../components/common/StatusBadge';
import { useWebSocket } from '../../hooks/useWebSocket';
import { PharmacyService } from '../../services/api/pharmacy.service';
import type { Patient, Prescription as ApiPrescription, User } from '../../types/api.types';

type PharmacyPrescription = ApiPrescription & {
  patient?: Patient;
  doctor?: User;
};

type StatusFilter = 'all' | 'pending' | 'dispensed';

const PAGE_SIZE = 10;

function statusVariant(status: string) {
  switch (status) {
    case 'issued':
      return 'warning';
    case 'partially_dispensed':
      return 'info';
    case 'dispensed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

function statusIcon(status: string) {
  switch (status) {
    case 'issued':
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    case 'partially_dispensed':
      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
    case 'dispensed':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'cancelled':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    default:
      return null;
  }
}

function toLowerSafe(value: unknown) {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

const PrescriptionManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PharmacyPrescription | null>(null);
  const [dispenseNotes, setDispenseNotes] = useState('');

  const handleWebSocketIssued = useCallback(
    (data: unknown) => {
      const patientName = (data as any)?.patient_name;
      toast.custom(
        () => (
          <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            <div>
              <strong>New Prescription</strong>
              {patientName ? <p className="text-sm">Patient: {patientName}</p> : null}
            </div>
          </div>
        ),
        { duration: 5000 }
      );

      queryClient.invalidateQueries(['pharmacy-prescriptions']);
    },
    [queryClient]
  );

  useWebSocket('prescription_issued', handleWebSocketIssued);

  const { data, isLoading, isError } = useQuery(
    ['pharmacy-prescriptions', statusFilter],
    async (): Promise<PharmacyPrescription[]> => {
      if (statusFilter === 'pending') {
        return (await PharmacyService.getPendingPrescriptions()) as unknown as PharmacyPrescription[];
      }
      if (statusFilter === 'dispensed') {
        return (await PharmacyService.getDispenseHistory()) as unknown as PharmacyPrescription[];
      }

      const [pending, dispensed] = await Promise.all([
        PharmacyService.getPendingPrescriptions(),
        PharmacyService.getDispenseHistory(),
      ]);

      const byId = new Map<number, PharmacyPrescription>();
      (pending as unknown as PharmacyPrescription[]).forEach((p) => byId.set(p.id, p));
      (dispensed as unknown as PharmacyPrescription[]).forEach((p) => byId.set(p.id, p));
      return Array.from(byId.values());
    },
    { staleTime: 10_000 }
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;

    return list.filter((p) => {
      const haystacks = [
        toLowerSafe(p.patient?.name),
        toLowerSafe(p.doctor?.name),
        String(p.id),
        String(p.patient_id),
        String(p.doctor_id),
        ...p.medicines.map((m) => toLowerSafe(m.name)),
      ];

      return haystacks.some((h) => h.includes(q));
    });
  }, [data, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const page = Math.min(Math.max(1, currentPage), totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [currentPage, filtered, totalPages]);

  const dispensePrescription = useMutation(
    async ({ id, notes }: { id: number; notes?: string }) => PharmacyService.dispensePrescription(id, notes),
    {
      onSuccess: async () => {
        toast.success('Prescription dispensed successfully');
        setSelectedPrescription(null);
        setDispenseNotes('');
        await queryClient.invalidateQueries(['pharmacy-prescriptions']);
      },
      onError: () => {
        toast.error('Failed to dispense prescription');
      },
    }
  );

  const openDetails = useCallback((p: PharmacyPrescription) => {
    setSelectedPrescription(p);
    setDispenseNotes('');
  }, []);

  const canDispense =
    selectedPrescription?.status !== 'dispensed' && selectedPrescription?.status !== 'cancelled';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6 text-sm text-red-700">
          Failed to load prescriptions. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prescription Management</h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <SearchInput
          placeholder="Search by patient, doctor, ID, or medicine..."
          value={searchTerm}
          onChange={setSearchTerm}
        />

        {showFilters ? (
          <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full border rounded-md p-2"
              >
                <option value="pending">Pending</option>
                <option value="dispensed">Dispensed</option>
                <option value="all">All</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end justify-between text-sm text-gray-600">
              <div>
                Showing {paged.length} of {filtered.length} result(s)
              </div>
              <div>
                Page {Math.min(Math.max(1, currentPage), totalPages)} of {totalPages}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {paged.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {statusIcon(p.status)}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">
                      {p.patient?.name ?? `Patient #${p.patient_id}`}
                    </span>
                    <StatusBadge status={p.status} variant={statusVariant(p.status)} />
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    #{p.id} - Dr. {p.doctor?.name ?? `#${p.doctor_id}`} - {p.medicines.length} medicine(s)
                  </div>
                  <div className="text-xs text-gray-500">
                    Issued: {new Date(p.issued_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDetails(p)}
                  className="p-2 text-gray-600 hover:text-primary-600"
                  aria-label="View details"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>

                {p.status !== 'dispensed' && p.status !== 'cancelled' ? (
                  <button
                    type="button"
                    onClick={() => dispensePrescription.mutate({ id: p.id, notes: 'Dispensed' })}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                    disabled={dispensePrescription.isLoading}
                  >
                    Dispense
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}

        {paged.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-600">No prescriptions found.</div>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      ) : null}

      {selectedPrescription ? (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Prescription Details</h2>
                <button
                  type="button"
                  onClick={() => setSelectedPrescription(null)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Patient</h3>
                  <p className="text-sm">
                    <span className="text-gray-600">Name:</span>{' '}
                    {selectedPrescription.patient?.name ?? `Patient #${selectedPrescription.patient_id}`}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Prescription</h3>
                  <p className="text-sm">
                    <span className="text-gray-600">ID:</span> #{selectedPrescription.id}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Doctor:</span> Dr.{' '}
                    {selectedPrescription.doctor?.name ?? `#${selectedPrescription.doctor_id}`}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Issued:</span>{' '}
                    {new Date(selectedPrescription.issued_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Medicines</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Medicine</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Dosage</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Frequency</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Duration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedPrescription.medicines.map((m, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">{m.name}</td>
                        <td className="px-4 py-2 text-sm">{m.dosage}</td>
                        <td className="px-4 py-2 text-sm">{m.frequency}</td>
                        <td className="px-4 py-2 text-sm">{m.duration}</td>
                        <td className="px-4 py-2 text-sm">{m.quantity ?? '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{m.instructions ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Dispensing notes (optional)</label>
                <textarea
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  rows={3}
                  className="block w-full border rounded-md p-2"
                  placeholder="Add any notes for this dispense..."
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                {canDispense ? (
                  <button
                    type="button"
                    onClick={() =>
                      dispensePrescription.mutate({ id: selectedPrescription.id, notes: dispenseNotes || undefined })
                    }
                    disabled={dispensePrescription.isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Dispense
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <PrinterIcon className="h-5 w-5 mr-2" />
                  Print
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPrescription(null)}
                  className="ml-auto px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PrescriptionManagement;

