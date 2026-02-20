// src/hooks/usePatients.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PatientsService } from '../services/api/patients.service';
import type { PatientCreate } from '../types/api.types';
import toast from 'react-hot-toast';

export const usePatients = (page = 1, search?: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery(
    ['patients', page, search],
    () => PatientsService.getPatients(page, 20, search),
    {
      keepPreviousData: true,
    }
  );

  const createPatient = useMutation(
    (data: PatientCreate) => PatientsService.createPatient(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patients');
        toast.success('Patient created successfully');
      },
      onError: () => {
        toast.error('Failed to create patient');
      },
    }
  );

  const updatePatient = useMutation(
    ({ id, data }: { id: number; data: Partial<PatientCreate> }) =>
      PatientsService.updatePatient(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patients');
        toast.success('Patient updated successfully');
      },
    }
  );

  const deletePatient = useMutation(
    (id: number) => PatientsService.deletePatient(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patients');
        toast.success('Patient deleted successfully');
      },
    }
  );

  return {
    patients: data?.items || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    createPatient: createPatient.mutateAsync,
    updatePatient: updatePatient.mutateAsync,
    deletePatient: deletePatient.mutateAsync,
  };
};
