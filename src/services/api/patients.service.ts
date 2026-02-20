// src/services/api/patients.service.ts
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { Patient, PatientCreate, PaginatedResponse } from '../../types/api.types';

export class PatientsService {
  static async getPatients(page = 1, size = 20, search?: string) {
    return apiClient.get<PaginatedResponse<Patient>>(API_ENDPOINTS.PATIENTS.BASE, {
      page,
      size,
      search,
    });
  }

  static async getPatientById(id: number) {
    return apiClient.get<Patient>(API_ENDPOINTS.PATIENTS.BY_ID(id));
  }

  static async createPatient(data: PatientCreate) {
    return apiClient.post<Patient>(API_ENDPOINTS.PATIENTS.BASE, data);
  }

  static async updatePatient(id: number, data: Partial<PatientCreate>) {
    return apiClient.patch<Patient>(API_ENDPOINTS.PATIENTS.BY_ID(id), data);
  }

  static async deletePatient(id: number) {
    return apiClient.delete(API_ENDPOINTS.PATIENTS.BY_ID(id));
  }

  static async getPatientHistory(id: number) {
    return apiClient.get(API_ENDPOINTS.PATIENTS.HISTORY(id));
  }
}