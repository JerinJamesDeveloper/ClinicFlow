// src/pages/pharmacy/DispenseMedicine.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { PharmacyService } from '../../services/api/pharmacy.service';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import toast from 'react-hot-toast';

const DispenseMedicine: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [dispenseNotes, setDispenseNotes] = useState('');

  const { data: pendingPrescriptions, refetch } = useQuery(
    ['pendingPrescriptions', search],
    () => PharmacyService.getPendingPrescriptions()
  );

  const dispenseMutation = useMutation(
    ({ id, notes }: { id: number; notes?: string }) =>
      PharmacyService.dispensePrescription(id, notes),
    {
      onSuccess: () => {
        toast.success('Prescription dispensed successfully');
        setSelectedPrescription(null);
        refetch();
      },
    }
  );

  const handleDispense = () => {
    if (selectedPrescription) {
      dispenseMutation.mutate({
        id: selectedPrescription.id,
        notes: dispenseNotes,
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dispense Medicine</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Prescriptions List */}
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-4">Pending Prescriptions</h2>
          <SearchBar onSearch={setSearch} placeholder="Search patient..." className="mb-4" />
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {pendingPrescriptions?.map((prescription: any) => (
              <div
                key={prescription.id}
                onClick={() => setSelectedPrescription(prescription)}
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedPrescription?.id === prescription.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{prescription.patient?.name}</p>
                    <p className="text-sm text-gray-600">Dr. {prescription.doctor?.name}</p>
                  </div>
                  <StatusBadge status={prescription.status} />
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(prescription.issued_at).toLocaleDateString()}
                </p>
                <div className="mt-2">
                  <p className="text-sm font-medium">Medicines:</p>
                  <p className="text-sm text-gray-600">
                    {prescription.medicines?.length} items
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dispense Form */}
        <div className="col-span-2 bg-white rounded-lg shadow p-6">
          {selectedPrescription ? (
            <>
              <h2 className="text-lg font-medium mb-4">Dispense Prescription</h2>
              
              {/* Patient Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Patient</p>
                    <p className="font-medium">{selectedPrescription.patient?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Doctor</p>
                    <p className="font-medium">Dr. {selectedPrescription.doctor?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {new Date(selectedPrescription.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Medicines List */}
              <h3 className="font-medium mb-2">Medicines to Dispense</h3>
              <div className="space-y-3 mb-6">
                {selectedPrescription.medicines?.map((med: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-600">
                          {med.dosage} - {med.frequency} - {med.duration}
                        </p>
                        {med.instructions && (
                          <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Quantity</p>
                        <input
                          type="number"
                          defaultValue={med.quantity || 1}
                          min={1}
                          className="w-20 border rounded p-1 text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dispense Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispensing Notes (Optional)
                </label>
                <textarea
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  rows={3}
                  className="w-full border rounded-md p-2"
                  placeholder="Add any instructions or notes..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispense}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Confirm Dispense
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Select a prescription to start dispensing
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispenseMedicine;