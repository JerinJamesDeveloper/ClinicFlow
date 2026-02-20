// src/pages/doctor/PatientVisit.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { DoctorService } from '../../services/api/doctor.service';
import { AppointmentsService } from '../../services/api/appointments.service';
import { LabService } from '../../services/api/lab.service';
import toast from 'react-hot-toast';

const PatientVisit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [vitalSigns, setVitalSigns] = useState({
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    weight: '',
  });
  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [prescription, setPrescription] = useState<any[]>([{
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  }]);

  const { data: appointment } = useQuery(
    ['appointment', id],
    () => AppointmentsService.getAppointmentById(Number(id))
  );

  const completeVisit = useMutation(
    () => DoctorService.completeVisit(Number(id), {
      diagnosis,
      symptoms,
      vital_signs: vitalSigns,
      lab_requests: labRequests,
      prescription: { medicines: prescription },
    }),
    {
      onSuccess: () => {
        toast.success('Visit completed successfully');
        navigate('/doctor');
      },
    }
  );

  const addMedicine = () => {
    setPrescription([
      ...prescription,
      {
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      },
    ]);
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const updated = [...prescription];
    updated[index] = { ...updated[index], [field]: value };
    setPrescription(updated);
  };

  const removeMedicine = (index: number) => {
    setPrescription(prescription.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Patient Visit</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Patient Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{appointment?.patient?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Age/Gender</p>
            <p className="font-medium">
              {appointment?.patient?.age} / {appointment?.patient?.gender}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Vital Signs</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Blood Pressure</label>
            <input
              type="text"
              value={vitalSigns.blood_pressure}
              onChange={(e) => setVitalSigns({ ...vitalSigns, blood_pressure: e.target.value })}
              placeholder="120/80"
              className="w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Heart Rate</label>
            <input
              type="text"
              value={vitalSigns.heart_rate}
              onChange={(e) => setVitalSigns({ ...vitalSigns, heart_rate: e.target.value })}
              placeholder="72 bpm"
              className="w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Temperature</label>
            <input
              type="text"
              value={vitalSigns.temperature}
              onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
              placeholder="98.6°F"
              className="w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Weight</label>
            <input
              type="text"
              value={vitalSigns.weight}
              onChange={(e) => setVitalSigns({ ...vitalSigns, weight: e.target.value })}
              placeholder="70 kg"
              className="w-full border rounded-md p-2"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Symptoms</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          {symptoms.map((symptom, index) => (
            <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
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
        <input
          type="text"
          placeholder="Add symptom and press Enter"
          onKeyDown={(e: any) => {
            if (e.key === 'Enter' && e.target.value) {
              setSymptoms([...symptoms, e.target.value]);
              e.target.value = '';
            }
          }}
          className="w-full border rounded-md p-2"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Diagnosis</h2>
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          rows={4}
          className="w-full border rounded-md p-2"
          placeholder="Enter diagnosis..."
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Lab Tests</h2>
        <select
          onChange={(e) => {
            if (e.target.value) {
              setLabRequests([
                ...labRequests,
                { test_name: e.target.value, status: 'requested' },
              ]);
            }
          }}
          className="w-full border rounded-md p-2 mb-4"
        >
          <option value="">Select test to request...</option>
          <option value="Complete Blood Count">Complete Blood Count</option>
          <option value="Blood Sugar">Blood Sugar</option>
          <option value="Urine Analysis">Urine Analysis</option>
          <option value="Lipid Profile">Lipid Profile</option>
          <option value="Liver Function">Liver Function</option>
          <option value="Thyroid Profile">Thyroid Profile</option>
        </select>
        <div className="space-y-2">
          {labRequests.map((test, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span>{test.test_name}</span>
              <button
                onClick={() => setLabRequests(labRequests.filter((_, i) => i !== index))}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Prescription</h2>
          <button
            onClick={addMedicine}
            className="text-primary-600 text-sm hover:underline"
          >
            + Add Medicine
          </button>
        </div>
        <div className="space-y-4">
          {prescription.map((med, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <h3 className="font-medium">Medicine #{index + 1}</h3>
                {prescription.length > 1 && (
                  <button
                    onClick={() => removeMedicine(index)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Medicine name"
                  value={med.name}
                  onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                  className="border rounded-md p-2"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g., 500mg)"
                  value={med.dosage}
                  onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                  className="border rounded-md p-2"
                />
                <input
                  type="text"
                  placeholder="Frequency"
                  value={med.frequency}
                  onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                  className="border rounded-md p-2"
                />
                <input
                  type="text"
                  placeholder="Duration"
                  value={med.duration}
                  onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                  className="border rounded-md p-2"
                />
                <input
                  type="text"
                  placeholder="Instructions"
                  value={med.instructions}
                  onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                  className="border rounded-md p-2 col-span-2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={() => navigate('/doctor')}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => completeVisit.mutate()}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Complete Visit
        </button>
      </div>
    </div>
  );
};

export default PatientVisit;