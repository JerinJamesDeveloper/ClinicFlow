// src/pages/doctor/DoctorWorkbench.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { DoctorService } from '../../services/api/doctor.service';
import { AppointmentsService } from '../../services/api/appointments.service';
import { LabService } from '../../services/api/lab.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

const DoctorWorkbench: React.FC = () => {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [labRequests, setLabRequests] = useState<any[]>([]);

  // Fetch today's appointments
  const { data: appointments, refetch } = useQuery(
    'todayAppointments',
    () => DoctorService.getTodayAppointments()
  );

  // Real-time updates for new lab results
  useWebSocket('lab_result_ready', (data) => {
    toast.success(`Lab results ready for patient`);
    refetch();
  });

  // Complete visit mutation
  const completeVisit = useMutation(
    (data: any) => DoctorService.completeVisit(selectedAppointment.id, data),
    {
      onSuccess: () => {
        toast.success('Visit completed successfully');
        setSelectedAppointment(null);
        refetch();
      },
    }
  );

  const handleCompleteVisit = () => {
    completeVisit.mutate({
      diagnosis,
      symptoms,
      lab_requests: labRequests,
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Doctor Workbench</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Today's Appointments</h2>
          <div className="space-y-3">
            {appointments?.map((apt: any) => (
              <div
                key={apt.id}
                onClick={() => setSelectedAppointment(apt)}
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedAppointment?.id === apt.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{apt.patient?.name}</div>
                <div className="text-sm text-gray-600">
                  {new Date(apt.appointment_date).toLocaleTimeString()}
                </div>
                <StatusBadge status={apt.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Patient Consultation Area */}
        <div className="col-span-2 bg-white rounded-lg shadow p-4">
          {selectedAppointment ? (
            <>
              <h2 className="text-lg font-semibold mb-4">
                Consulting: {selectedAppointment.patient?.name}
              </h2>

              <div className="space-y-4">
                {/* Diagnosis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Diagnosis
                  </label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border rounded-md shadow-sm p-2"
                    placeholder="Enter diagnosis..."
                  />
                </div>

                {/* Symptoms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Symptoms
                  </label>
                  <input
                    type="text"
                    placeholder="Add symptom and press Enter"
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter' && e.target.value) {
                        setSymptoms([...symptoms, e.target.value]);
                        e.target.value = '';
                      }
                    }}
                    className="mt-1 block w-full border rounded-md shadow-sm p-2"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {symptoms.map((symptom, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 px-2 py-1 rounded-full text-sm"
                      >
                        {symptom}
                        <button
                          onClick={() => setSymptoms(symptoms.filter((_, i) => i !== index))}
                          className="ml-2 text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Lab Requests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Request Lab Tests
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setLabRequests([
                          ...labRequests,
                          { test_name: e.target.value },
                        ]);
                      }
                    }}
                    className="mt-1 block w-full border rounded-md shadow-sm p-2"
                  >
                    <option value="">Select test...</option>
                    <option value="Complete Blood Count">Complete Blood Count</option>
                    <option value="Blood Sugar">Blood Sugar</option>
                    <option value="Urine Analysis">Urine Analysis</option>
                    <option value="Lipid Profile">Lipid Profile</option>
                  </select>
                  <div className="mt-2">
                    {labRequests.map((req, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {req.test_name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleCompleteVisit}
                    disabled={!diagnosis}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Complete Visit
                  </button>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                    Write Prescription
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Select an appointment to start consultation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorWorkbench;