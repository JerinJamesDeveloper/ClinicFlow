// src/pages/patients/PatientBooking.tsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePatients } from '../../hooks/usePatients';
import { useAppointments } from '../../hooks/useAppointments';
import { useQuery } from 'react-query';
import { DoctorService } from '../../services/api/doctor.service';
import toast from 'react-hot-toast';

const patientSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  age: z.number().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']).optional(),
});

const appointmentSchema = z.object({
  doctor_id: z.number().min(1, 'Select a doctor'),
  appointment_date: z.string().min(1, 'Select date and time'),
  type: z.enum(['in_person', 'online']),
  notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;
type AppointmentFormData = z.infer<typeof appointmentSchema>;

const PatientBooking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  
  const [step, setStep] = useState(patientId ? 2 : 1);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    patientId ? Number(patientId) : null
  );

  const { createPatient } = usePatients();
  const { createAppointment, availableSlots, isLoadingSlots } = useAppointments();

  const { data: doctors } = useQuery('doctors', () => DoctorService.getMyPatients());

  const patientForm = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const appointmentForm = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  const onPatientSubmit = async (data: PatientFormData) => {
    try {
      const patient = await createPatient(data);
      setSelectedPatientId(patient.id);
      setStep(2);
      toast.success('Patient created successfully');
    } catch (error) {
      toast.error('Failed to create patient');
    }
  };

  const onAppointmentSubmit = async (data: AppointmentFormData) => {
    if (!selectedPatientId) return;

    try {
      await createAppointment({
        ...data,
        patient_id: selectedPatientId,
      });
      toast.success('Appointment booked successfully');
      navigate('/appointments');
    } catch (error) {
      toast.error('Failed to book appointment');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {patientId ? 'Book Appointment' : 'New Patient Registration'}
      </h1>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex-1 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className="text-center">
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <p className="mt-2 text-sm">Patient Details</p>
            </div>
          </div>
          <div className={`flex-1 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className="text-center">
              <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <p className="mt-2 text-sm">Appointment</p>
            </div>
          </div>
        </div>
      </div>

      {step === 1 && !patientId && (
        <form onSubmit={patientForm.handleSubmit(onPatientSubmit)} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  {...patientForm.register('name')}
                  className="w-full border rounded-md p-2"
                />
                {patientForm.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {patientForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  {...patientForm.register('age', { valueAsNumber: true })}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  {...patientForm.register('gender')}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  {...patientForm.register('phone')}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...patientForm.register('email')}
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Group
                </label>
                <select
                  {...patientForm.register('blood_group')}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  {...patientForm.register('address')}
                  rows={3}
                  className="w-full border rounded-md p-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Continue to Appointment
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={appointmentForm.handleSubmit(onAppointmentSubmit)} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Doctor *
                </label>
                <select
                  {...appointmentForm.register('doctor_id', { valueAsNumber: true })}
                  onChange={(e) => {
                    appointmentForm.setValue('doctor_id', Number(e.target.value));
                    // Fetch available slots when doctor changes
                  }}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Choose a doctor</option>
                  {doctors?.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.name} - {doc.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      {...appointmentForm.register('type')}
                      value="in_person"
                      className="mr-2"
                    />
                    In Person
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      {...appointmentForm.register('type')}
                      value="online"
                      className="mr-2"
                    />
                    Online
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Slots
                </label>
                {isLoadingSlots ? (
                  <div className="text-center py-4">Loading slots...</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => appointmentForm.setValue('appointment_date', slot)}
                        className={`p-2 border rounded-md text-sm ${
                          appointmentForm.watch('appointment_date') === slot
                            ? 'bg-primary-600 text-white'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {new Date(slot).toLocaleTimeString()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  {...appointmentForm.register('notes')}
                  rows={3}
                  className="w-full border rounded-md p-2"
                  placeholder="Any specific concerns..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Book Appointment
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PatientBooking;