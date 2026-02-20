// src/services/api/pharmacy.service.ts
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { Prescription } from '../../types/api.types';

export class PharmacyService {
  static async getPendingPrescriptions() {
    return apiClient.get<Prescription[]>(API_ENDPOINTS.PHARMACY.PENDING_PRESCRIPTIONS);
  }

  static async getDispenseHistory() {
    return apiClient.get<Prescription[]>(API_ENDPOINTS.PHARMACY.DISPENSE_HISTORY);
  }

  static async dispensePrescription(id: number, notes?: string) {
    return apiClient.patch<Prescription>(API_ENDPOINTS.PRESCRIPTIONS.DISPENSE(id), { notes });
  }

  static async getInventory() {
    return apiClient.get(API_ENDPOINTS.PHARMACY.INVENTORY);
  }
}