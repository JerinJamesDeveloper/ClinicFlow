// src/pages/appointments/AppointmentDetails.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { AppointmentsService } from '../../services/api/appointments.service';
import StatusBadge from '../../components/common/StatusBadge';
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  VideoCameraIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AppointmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: appointment, isLoading, refetch } = useQuery(
    ['appointment', id],
    () => AppointmentsService.getAppointmentById(Number(id))
  );

  const updateStatus = useMutation(
    (status: string) => AppointmentsService.updateStatus(Number(id), status),
    {
      onSuccess: () => {
        toast.success('Appointment status updated');
        refetch();
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Appointment not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Appointment Details</h1>
          <p className="text-sm text-gray-500">ID: {appointment.id}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-3">
            <UserIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="font-medium">Patient</h3>
          </div>
          <p className="text-lg">{appointment.patient?.name}</p>
          <p className="text-sm text-gray-600">Age: {appointment.patient?.age}</p>
          <p className="text-sm text-gray-600">Phone: {appointment.patient?.phone}</p>
          <button
            onClick={() => navigate(`/patients/${appointment.patient_id}`)}
            className="mt-2 text-primary-600 text-sm hover:underline"
          >
            View Full Profile →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-3">
            <UserIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="font-medium">Doctor</h3>
          </div>
          <p className="text-lg">Dr. {appointment.doctor?.name}</p>
          <p className="text-sm text-gray-600">{appointment.doctor?.specialization}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-3">
            <CalendarIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="font-medium">Date & Time</h3>
          </div>
          <p className="text-lg">
            {new Date(appointment.appointment_date).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            {new Date(appointment.appointment_date).toLocaleTimeString()}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Type: {appointment.type === 'online' ? 'Online' : 'In Person'}
          </p>
        </div>
      </div>

      {/* Status Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-medium mb-4">Update Status</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => updateStatus.mutate('in_progress')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Visit
          </button>
          <button
            onClick={() => updateStatus.mutate('completed')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Complete
          </button>
          <button
            onClick={() => updateStatus.mutate('cancelled')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Online Meeting */}
      {appointment.type === 'online' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <VideoCameraIcon className="h-6 w-6 text-primary-600 mr-2" />
              <div>
                <h3 className="font-medium">Online Consultation</h3>
                <p className="text-sm text-gray-600">Join the video meeting</p>
              </div>
            </div>
            <button className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
              Join Meeting
            </button>
          </div>
        </div>
      )}

      {/* Notes */}
      {appointment.notes && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-3">
            <DocumentTextIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="font-medium">Notes</h3>
          </div>
          <p className="text-gray-700">{appointment.notes}</p>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetails;