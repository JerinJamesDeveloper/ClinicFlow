// src/services/api/lab.service.ts
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { LabTest, LabTestCreate, LabTestUpdate, PaginatedResponse } from '../../types/api.types';

export class LabService {
  static async getLabTests(filters?: {
    page?: number;
    status?: string;
    patient_id?: number;
    appointment_id?: number;
  }) {
    return apiClient.get<PaginatedResponse<LabTest>>(API_ENDPOINTS.LAB.BASE, filters);
  }

  static async getPendingTests() {
    return apiClient.get<LabTest[]>(API_ENDPOINTS.LAB.PENDING);
  }

  static async requestTest(data: LabTestCreate) {
    return apiClient.post<LabTest>(API_ENDPOINTS.LAB.BASE, data);
  }

  static async updateTestResults(testId: number, data: LabTestUpdate) {
    return apiClient.patch<LabTest>(API_ENDPOINTS.LAB.BY_ID(testId), data);
  }

  static async uploadResultFile(testId: number, file: File, resultText?: string) {
    const formData = new FormData();
    formData.append('result_file', file);
    if (resultText) formData.append('result_text', resultText);
    
    return apiClient.post<LabTest>(API_ENDPOINTS.LAB.RESULTS(testId), formData);
  }
}