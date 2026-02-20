
// // src/hooks/useAppointments.ts
// import { useQuery, useMutation, useQueryClient } from 'react-query';
// import { AppointmentsService } from '../services/api/appointments.service';
// import type {Appointment,  AppointmentCreate } from '../types/api.types';
// import toast from 'react-hot-toast';

// export const useAppointments = (filters?: undefined) => {
//   const queryClient = useQueryClient();

//   const { data, isLoading } = useQuery(
//     ['appointments', filters],
//     () => AppointmentsService.getAppointments(filters)
//   );

//   const createAppointment = useMutation(
//     (data: AppointmentCreate) => AppointmentsService.createAppointment(data),
//     {
//       onSuccess: () => {
//         queryClient.invalidateQueries('appointments');
//         toast.success('Appointment booked successfully');
//       },
//     }
//   );

//   const updateStatus = useMutation(
//     ({ id, status }: { id: number; status: string }) =>
//       AppointmentsService.updateStatus(id, status),
//     {
//       onSuccess: () => {
//         queryClient.invalidateQueries('appointments');
//       },
//     }
//   );

//   const getAvailableSlots = useQuery(
//     ['availableSlots', filters, filters?.date],
//     () => AppointmentsService.getAvailableSlots(filters?.doctorId, filters?.date),
//     {
//       enabled: !!filters?.doctorId && !!filters?.date,
//     }
//   );

//   return {
//     appointments: data?.items || [],
//     total: data?.total || 0,
//     isLoading,
//     createAppointment: createAppointment.mutateAsync,
//     updateStatus: updateStatus.mutateAsync,
//     availableSlots: getAvailableSlots.data || [],
//     isLoadingSlots: getAvailableSlots.isLoading,
//   };
// };


// src/hooks/useAppointments.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AppointmentsService } from '../services/api/appointments.service';
import type { Appointment, AppointmentCreate, AppointmentFilters, AvailableSlotsParams } from '../types/api.types';
import type { DatabaseError } from '../types/error.types';
import toast from 'react-hot-toast';

interface UseAppointmentsReturn {
  appointments: Appointment[];
  total: number;
  isLoading: boolean;
  createAppointment: (data: AppointmentCreate) => Promise<Appointment>;
  updateStatus: (params: { id: number; status: string }) => Promise<Appointment>;
  availableSlots: string[];
  isLoadingSlots: boolean;
  refetchAppointments: () => void;
}

export const useAppointments = (filters?: AppointmentFilters): UseAppointmentsReturn => {
  const queryClient = useQueryClient();

  // Query for fetching appointments with filters
  const { 
    data, 
    isLoading, 
    refetch: refetchAppointments 
  } = useQuery(
    ['appointments', filters],
    () => AppointmentsService.getAppointments(filters),
    {
      keepPreviousData: true,
    }
  );

  // Mutation for creating appointment
  const createAppointment = useMutation(
    (data: AppointmentCreate) => AppointmentsService.createAppointment(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['appointments']);
        toast.success('Appointment booked successfully');
      },
      onError: (error: DatabaseError) => {
        toast.error(error?.message || 'Failed to book appointment');
      },
    }
  );

  // Mutation for updating status
  const updateStatus = useMutation(
    ({ id, status }: { id: number; status: string }) =>
      AppointmentsService.updateStatus(id, status),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['appointments']);
        toast.success(`Appointment status updated to ${variables.status}`);
      },
      onError: (error: DatabaseError) => {
        toast.error(error?.message || 'Failed to update status');
      },
    }
  );

  // Query for available slots - separate from main filters
  const availableSlotsQuery = useQuery(
    ['availableSlots', filters?.doctorId, filters?.date],
    () => {
      if (!filters?.doctorId || !filters?.date) {
        return Promise.resolve([]);
      }
      return AppointmentsService.getAvailableSlots(filters.doctorId, filters.date);
    },
    {
      enabled: !!(filters?.doctorId && filters?.date),
    }
  );

  return {
    appointments: data?.items || [],
    total: data?.total || 0,
    isLoading,
    createAppointment: createAppointment.mutateAsync,
    updateStatus: updateStatus.mutateAsync,
    availableSlots: availableSlotsQuery.data || [],
    isLoadingSlots: availableSlotsQuery.isLoading,
    refetchAppointments,
  };
};

// Optional: Create a separate hook for available slots if needed
export const useAvailableSlots = (params: AvailableSlotsParams) => {
  const { data, isLoading } = useQuery(
    ['availableSlots', params.doctorId, params.date],
    () => AppointmentsService.getAvailableSlots(params.doctorId, params.date),
    {
      enabled: !!(params.doctorId && params.date),
    }
  );

  return {
    slots: data || [],
    isLoading,
  };
};