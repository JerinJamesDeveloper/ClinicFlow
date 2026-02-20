// src/services/api/appointments.service.ts
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { Appointment, AppointmentCreate, PaginatedResponse } from '../../types/api.types';

export class AppointmentsService {
  static async getAppointments(filters?: {
    page?: number;
    size?: number;
    status?: string;
    doctor_id?: number;
    patient_id?: number;
    date_from?: string;
    date_to?: string;
  }) {
    return apiClient.get<PaginatedResponse<Appointment>>(
      API_ENDPOINTS.APPOINTMENTS.BASE,
      filters
    );
  }

  static async getAppointmentById(id: number) {
    return apiClient.get<Appointment>(API_ENDPOINTS.APPOINTMENTS.BY_ID(id));
  }

  static async createAppointment(data: AppointmentCreate) {
    return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.BASE, data);
  }

  static async updateStatus(id: number, status: string) {
    return apiClient.patch<Appointment>(API_ENDPOINTS.APPOINTMENTS.STATUS(id), { status });
  }

  static async getAvailableSlots(doctorId: number, date: string) {
    return apiClient.get<string[]>(API_ENDPOINTS.APPOINTMENTS.AVAILABLE_SLOTS, {
      doctor_id: doctorId,
      date,
    });
  }

  static async getTodayAppointments() {
    return apiClient.get<Appointment[]>(API_ENDPOINTS.APPOINTMENTS.TODAY);
  }

  static async cancelAppointment(id: number) {
    return apiClient.delete(API_ENDPOINTS.APPOINTMENTS.BY_ID(id));
  }
  // Add these to your existing AppointmentsService class

  static async updateAppointment(id: number, data: Partial<AppointmentCreate>) {
    return apiClient.patch<Appointment>(API_ENDPOINTS.APPOINTMENTS.BY_ID(id), data);
  }

  static async bulkUpdateStatus(ids: number[], status: string) {
    return apiClient.post<{ success: boolean; processed: number; failed: number }>(
      API_ENDPOINTS.APPOINTMENTS.BULK_STATUS,
      { ids, status }
    );
  }

  static async bulkDelete(ids: number[]) {
    return apiClient.post<{ success: boolean; processed: number; failed: number }>(
      API_ENDPOINTS.APPOINTMENTS.BULK_DELETE,
      { ids }
    );
  }

  static async checkInPatient(id: number) {
    return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.CHECK_IN(id));
  }

  static async checkOutPatient(id: number) {
    return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.CHECK_OUT(id));
  }

  static async getUpcomingAppointments(doctorId?: number, days: number = 7) {
    return apiClient.get<Appointment[]>(API_ENDPOINTS.APPOINTMENTS.UPCOMING, {
      doctor_id: doctorId,
      days,
    });
  }

  static async rescheduleAppointment(id: number, newDate: string, newTime: string, reason?: string) {
    return apiClient.patch<Appointment>(API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id), {
      date: newDate,
      time: newTime,
      reason,
    });
  }

  static async sendReminders(ids: number[]) {
    return apiClient.post<{ success: boolean; sent: number }>(
      API_ENDPOINTS.APPOINTMENTS.SEND_REMINDERS,
      { ids }
    );
  }

  static async getAppointmentHistory(patientId: number) {
    return apiClient.get<Appointment[]>(API_ENDPOINTS.APPOINTMENTS.PATIENT_HISTORY(patientId));
  }

  static async getStats(dateFrom: string, dateTo: string) {
    return apiClient.get<{
      total: number;
      completed: number;
      cancelled: number;
      noShow: number;
      averageDuration: number;
    }>(API_ENDPOINTS.APPOINTMENTS.STATS, {
      date_from: dateFrom,
      date_to: dateTo,
    });
  }

}