// src/pages/pharmacy/PrescriptionManagement.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PharmacyService } from '../../services/api/pharmacy.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import StatusBadge from '../../components/common/StatusBadge';
import SearchInput from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PrinterIcon,
  EyeIcon,
  FunnelIcon,
  ArrowDownCircleIcon,
} from '@heroicons/react/24/outline';

interface Prescription {
  id: number;
  prescription_number: string;
  patient: {
    id: number;
    name: string;
    phone: string;
    age: number;
    gender: string;
  };
  doctor: {
    id: number;
    name: string;
    specialization: string;
  };
  medicines: Array<{
    id: number;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions?: string;
    substituted?: boolean;
    original_medicine?: string;
  }>;
  status: 'pending' | 'processing' | 'dispensed' | 'cancelled' | 'partial';
  priority: 'normal' | 'urgent' | 'stat';
  issued_at: string;
  dispensed_at?: string;
  dispensed_by?: string;
  notes?: string;
  insurance_covered: boolean;
  total_cost: number;
}

const PrescriptionManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch prescriptions with filters
  const { data: prescriptions, isLoading, refetch } = useQuery(
    ['prescriptions', statusFilter, priorityFilter, currentPage, searchTerm],
    () => PharmacyService.getPrescriptions({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      page: currentPage,
      search: searchTerm,
    })
  );

  // Real-time updates for new prescriptions
  useWebSocket('prescription_issued', (data) => {
    toast.custom((t) => (
      <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center">
        <DocumentTextIcon className="h-5 w-5 mr-2" />
        <div>
          <strong>New Prescription</strong>
          <p className="text-sm">Patient: {data.patient_name}</p>
        </div>
      </div>
    ), { duration: 5000 });
    queryClient.invalidateQueries('prescriptions');
  });

  // Update prescription status mutation
  const updateStatus = useMutation(
    ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      PharmacyService.updatePrescriptionStatus(id, status, notes),
    {
      onSuccess: () => {
        toast.success('Prescription updated successfully');
        queryClient.invalidateQueries('prescriptions');
        setSelectedPrescription(null);
      },
    }
  );

  // Dispense prescription mutation
  const dispensePrescription = useMutation(
    ({ id, medicines, notes }: { id: number; medicines?: any[]; notes?: string }) =>
      PharmacyService.dispensePrescription(id, medicines, notes),
    {
      onSuccess: () => {
        toast.success('Prescription dispensed successfully');
        queryClient.invalidateQueries('prescriptions');
        setSelectedPrescription(null);
      },
    }
  );

  const handleDispense = (prescription: Prescription) => {
    dispensePrescription.mutate({
      id: prescription.id,
      notes: 'Dispensed as prescribed',
    });
  };

  const handleMarkProcessing = (id: number) => {
    updateStatus.mutate({ id, status: 'processing' });
  };

  const handleCancel = (id: number, reason: string) => {
    updateStatus.mutate({ id, status: 'cancelled', notes: reason });
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'processing': return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
      case 'dispensed': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'cancelled': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      stat: 'bg-red-100 text-red-800',
      urgent: 'bg-orange-100 text-orange-800',
      normal: 'bg-green-100 text-green-800',
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prescription Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <SearchInput
          placeholder="Search by patient name, prescription #, or medicine..."
          value={searchTerm}
          onChange={setSearchTerm}
        />

        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="dispensed">Dispensed</option>
                <option value="cancelled">Cancelled</option>
                <option value="partial">Partially Dispensed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="all">All Priority</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Prescriptions Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-4'}>
        {prescriptions?.data.map((prescription: Prescription) => (
          <div
            key={prescription.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            {viewMode === 'grid' ? (
              // Grid View Card
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs text-gray-500">#{prescription.prescription_number}</span>
                    <h3 className="font-semibold">{prescription.patient.name}</h3>
                  </div>
                  {getStatusIcon(prescription.status)}
                </div>
                
                <div className="space-y-2 text-sm mb-3">
                  <p><span className="text-gray-500">Doctor:</span> Dr. {prescription.doctor.name}</p>
                  <p><span className="text-gray-500">Medicines:</span> {prescription.medicines.length} items</p>
                  <p><span className="text-gray-500">Total:</span> ${prescription.total_cost}</p>
                </div>

                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityBadge(prescription.priority)}`}>
                    {prescription.priority}
                  </span>
                  <StatusBadge status={prescription.status} />
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => setSelectedPrescription(prescription)}
                    className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                  >
                    View Details
                  </button>
                  {prescription.status === 'pending' && (
                    <button
                      onClick={() => handleDispense(prescription)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Dispense
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // List View Row
              <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4 flex-1">
                  {getStatusIcon(prescription.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{prescription.patient.name}</span>
                      <span className="text-sm text-gray-500">({prescription.patient.age}y, {prescription.patient.gender})</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      #{prescription.prescription_number} • Dr. {prescription.doctor.name} • {prescription.medicines.length} medicines
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityBadge(prescription.priority)}`}>
                    {prescription.priority}
                  </span>
                  <StatusBadge status={prescription.status} />
                  <span className="text-sm font-medium">${prescription.total_cost}</span>
                  
                  <button
                    onClick={() => setSelectedPrescription(prescription)}
                    className="p-2 text-gray-600 hover:text-primary-600"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  
                  {prescription.status === 'pending' && (
                    <button
                      onClick={() => handleDispense(prescription)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Dispense
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {prescriptions?.total_pages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={prescriptions.total_pages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Prescription Details Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Prescription Details</h2>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Prescription Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Patient Information</h3>
                  <p><span className="text-gray-600">Name:</span> {selectedPrescription.patient.name}</p>
                  <p><span className="text-gray-600">Age/Gender:</span> {selectedPrescription.patient.age}y / {selectedPrescription.patient.gender}</p>
                  <p><span className="text-gray-600">Phone:</span> {selectedPrescription.patient.phone}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Prescription Information</h3>
                  <p><span className="text-gray-600">Number:</span> #{selectedPrescription.prescription_number}</p>
                  <p><span className="text-gray-600">Doctor:</span> Dr. {selectedPrescription.doctor.name}</p>
                  <p><span className="text-gray-600">Specialization:</span> {selectedPrescription.doctor.specialization}</p>
                  <p><span className="text-gray-600">Issued:</span> {new Date(selectedPrescription.issued_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Medicines List */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Prescribed Medicines</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Medicine</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Dosage</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Frequency</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Duration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedPrescription.medicines.map((medicine, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm">
                          {medicine.name}
                          {medicine.substituted && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Substituted
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm">{medicine.dosage}</td>
                        <td className="px-4 py-2 text-sm">{medicine.frequency}</td>
                        <td className="px-4 py-2 text-sm">{medicine.duration}</td>
                        <td className="px-4 py-2 text-sm">{medicine.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{medicine.instructions || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                {selectedPrescription.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleMarkProcessing(selectedPrescription.id);
                        setSelectedPrescription(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Start Processing
                    </button>
                    <button
                      onClick={() => handleDispense(selectedPrescription)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Dispense All
                    </button>
                  </>
                )}
                {selectedPrescription.status === 'processing' && (
                  <button
                    onClick={() => handleDispense(selectedPrescription)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Complete Dispense
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <PrinterIcon className="h-5 w-5 mr-2" />
                  Print
                </button>
                <button
                  onClick={() => {
                    // Download as PDF
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <ArrowDownCircleIcon className="h-5 w-5 mr-2" />
                  Download
                </button>
                {(selectedPrescription.status === 'pending' || selectedPrescription.status === 'processing') && (
                  <button
                    onClick={() => {
                      const reason = prompt('Please enter cancellation reason:');
                      if (reason) {
                        handleCancel(selectedPrescription.id, reason);
                        setSelectedPrescription(null);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ml-auto"
                  >
                    Cancel Prescription
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionManagement;