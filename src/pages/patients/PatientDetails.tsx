// src/pages/patients/PatientDetails.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { PatientsService } from '../../services/api/patients.service';
import { AppointmentsService } from '../../services/api/appointments.service';
import StatusBadge from '../../components/common/StatusBadge';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

const PatientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch patient details
  const { data: patient, isLoading } = useQuery(
    ['patient', id],
    () => PatientsService.getPatientById(Number(id))
  );

  // Fetch patient history
  const { data: history } = useQuery(
    ['patientHistory', id],
    () => PatientsService.getPatientHistory(Number(id))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
          <p className="text-sm text-gray-500">Patient ID: {patient.id}</p>
        </div>
        <div className="space-x-3">
          <button
            onClick={() => navigate(`/appointments/book?patientId=${patient.id}`)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Book Appointment
          </button>
          <button
            onClick={() => navigate(`/patients/edit/${patient.id}`)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Patient Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Age/Gender</p>
              <p className="font-medium">{patient.age} yrs / {patient.gender}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{patient.phone}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{patient.email || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Blood Group</p>
              <p className="font-medium">{patient.blood_group || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'appointments', 'medical-records', 'lab-tests', 'prescriptions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'overview' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Patient Overview</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p>{patient.address || 'No address provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Emergency Contact</p>
                <p>{patient.emergency_contact || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Medical History</p>
                <p>{patient.medical_history || 'No significant history'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Appointment History</h3>
            <div className="space-y-4">
              {history?.appointments?.map((apt: any) => (
                <div key={apt.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {new Date(apt.appointment_date).toLocaleDateString()} at{' '}
                        {new Date(apt.appointment_date).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dr. {apt.doctor?.name} • {apt.type}
                      </p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'medical-records' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Medical Records</h3>
            <div className="space-y-4">
              {history?.medical_records?.map((record: any) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <p className="font-medium">Diagnosis: {record.diagnosis}</p>
                  <p className="text-sm text-gray-600 mt-2">{record.notes}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Dr. {record.doctor?.name} • {new Date(record.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'lab-tests' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Lab Tests</h3>
            <div className="space-y-4">
              {history?.lab_tests?.map((test: any) => (
                <div key={test.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{test.test_name}</p>
                      <p className="text-sm text-gray-600">
                        Requested: {new Date(test.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={test.status} />
                  </div>
                  {test.result_text && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <p className="text-sm">{test.result_text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Prescriptions</h3>
            <div className="space-y-4">
              {history?.prescriptions?.map((prescription: any) => (
                <div key={prescription.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        Issued: {new Date(prescription.issued_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dr. {prescription.doctor?.name}
                      </p>
                    </div>
                    <StatusBadge status={prescription.status} />
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium">Medicines:</p>
                    <ul className="list-disc list-inside">
                      {prescription.medicines?.map((med: any, idx: number) => (
                        <li key={idx} className="text-sm">
                          {med.name} - {med.dosage} - {med.frequency} for {med.duration}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;