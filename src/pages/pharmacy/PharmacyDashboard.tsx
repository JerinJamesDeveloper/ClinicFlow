// src/pages/pharmacy/PharmacyDashboard.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { PharmacyService } from '../../services/api/pharmacy.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

const PharmacyDashboard: React.FC = () => {
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);

  // Fetch pending prescriptions
  const { data: pendingPrescriptions, refetch } = useQuery(
    'pendingPrescriptions',
    () => PharmacyService.getPendingPrescriptions()
  );

  // Fetch dispense history
  const { data: dispenseHistory } = useQuery(
    'dispenseHistory',
    () => PharmacyService.getDispenseHistory()
  );

  // Real-time updates for new prescriptions
  useWebSocket('prescription_issued', () => {
    toast('New prescription ready for dispensing');
    refetch();
  });

  // Dispense prescription mutation
  const dispensePrescription = useMutation(
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
      dispensePrescription.mutate({ id: selectedPrescription.id });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pharmacy Dashboard</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Pending Prescriptions */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Pending Prescriptions</h2>
          <div className="space-y-3">
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
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">
                      Patient: {prescription.patient?.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Doctor: Dr. {prescription.doctor?.name}
                    </div>
                  </div>
                  <StatusBadge status={prescription.status} />
                </div>
                <div className="mt-2 text-sm">
                  <strong>Medicines:</strong>
                  <ul className="list-disc list-inside">
                    {prescription.medicines?.map((med: any, idx: number) => (
                      <li key={idx}>
                        {med.name} - {med.dosage}, {med.frequency} for {med.duration}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dispense History */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Dispenses</h2>
          <div className="space-y-3">
            {dispenseHistory?.slice(0, 5).map((prescription: any) => (
              <div key={prescription.id} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">
                      {prescription.patient?.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Dispensed: {new Date(prescription.dispensed_at).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status="dispensed" variant="success" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dispense Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">Dispense Prescription</h3>
            
            <div className="space-y-4">
              <div>
                <p><strong>Patient:</strong> {selectedPrescription.patient?.name}</p>
                <p><strong>Doctor:</strong> Dr. {selectedPrescription.doctor?.name}</p>
                <p><strong>Date:</strong> {new Date(selectedPrescription.issued_at).toLocaleDateString()}</p>
              </div>

              <div>
                <strong>Medicines:</strong>
                <ul className="list-disc list-inside mt-2">
                  {selectedPrescription.medicines?.map((med: any, idx: number) => (
                    <li key={idx} className="text-sm">
                      {med.name} - {med.dosage} - {med.quantity || 'As directed'} units
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dispensing Notes (optional)
                </label>
                <textarea
                  className="mt-1 block w-full border rounded-md shadow-sm p-2"
                  rows={3}
                  placeholder="Add any notes..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleDispense}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Confirm Dispense
                </button>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyDashboard;