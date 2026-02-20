// src/services/api/doctor.service.ts
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { Appointment, MedicalRecord, LabTest, Prescription } from '../../types/api.types';

export class DoctorService {
  static async getTodayAppointments() {
    return apiClient.get<Appointment[]>(API_ENDPOINTS.DOCTOR.TODAYS_APPOINTMENTS);
  }

  static async getMyPatients() {
    return apiClient.get(API_ENDPOINTS.DOCTOR.MY_PATIENTS);
  }

  static async getPendingReviews() {
    return apiClient.get(API_ENDPOINTS.DOCTOR.PENDING_REVIEWS);
  }

  static async completeVisit(appointmentId: number, data: {
    diagnosis: string;
    symptoms?: string[];
    vital_signs?: any;
    lab_requests?: any[];
    prescription?: any;
  }) {
    return apiClient.post(API_ENDPOINTS.DOCTOR.COMPLETE_VISIT(appointmentId), data);
  }
}