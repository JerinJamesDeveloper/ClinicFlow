// src/services/api/admin.service.ts
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { User, ClinicRegistration, PaginatedResponse } from '../../types/api.types';
import type { ClinicSettings, ClinicUsage, InviteUserData, AuditLog, ClinicSettingsType } from '../../types/clinic.types';


export class AdminService {
  // ========== CLINIC MANAGEMENT ==========

  /**
   * Get clinic settings
   */
  static async getClinicSettings(clinicId: number): Promise<ClinicSettings> {
    return apiClient.get<ClinicSettings>(API_ENDPOINTS.CLINICS.BY_ID(clinicId));
  }

  /**
   * Update clinic settings
   */
  static async updateClinic(clinicId: number, data: Partial<ClinicSettings>): Promise<ClinicSettings> {
    return apiClient.patch<ClinicSettings>(API_ENDPOINTS.CLINICS.BY_ID(clinicId), data);
  }

  /**
   * Get clinic usage statistics
   */
  static async getClinicUsage(clinicId: number): Promise<ClinicUsage> {
    return apiClient.get<ClinicUsage>(`${API_ENDPOINTS.CLINICS.BY_ID(clinicId)}/usage`);
  }

  /**
   * Get all clinics (super admin only)
   */
  static async getAllClinics(params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: 'active' | 'inactive' | 'expired';
  }): Promise<PaginatedResponse<ClinicRegistration>> {
    return apiClient.get<PaginatedResponse<ClinicRegistration>>(API_ENDPOINTS.CLINICS.BASE, params);
  }

  /**
   * Create new clinic (super admin only)
   */
  static async createClinic(data: {
    name: string;
    address?: string;
    subscription_tier: string;
  }): Promise<ClinicRegistration> {
    return apiClient.post<ClinicRegistration>(API_ENDPOINTS.CLINICS.BASE, data);
  }

  /**
   * Deactivate clinic (super admin only)
   */
  static async deactivateClinic(clinicId: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.CLINICS.BY_ID(clinicId));
  }

  /**
   * Activate clinic (super admin only)
   */
  static async activateClinic(clinicId: number): Promise<ClinicRegistration> {
    return apiClient.patch(API_ENDPOINTS.CLINICS.BY_ID(clinicId), { is_active: true });
  }

  // ========== USER MANAGEMENT ==========

  /**
   * Get all users in clinic
   */
  static async getUsers(params?: {
    page?: number;
    size?: number;
    search?: string;
    role?: string;
    status?: 'active' | 'inactive';
  }): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>(API_ENDPOINTS.USERS.BASE, params);
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: number): Promise<User> {
    return apiClient.get<User>(API_ENDPOINTS.USERS.BY_ID(userId));
  }

  /**
   * Create new user
   */
  static async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    specialization?: string;
  }): Promise<User> {
    return apiClient.post<User>(API_ENDPOINTS.USERS.BASE, data);
  }

  /**
   * Update user
   */
  static async updateUser(userId: number, data: Partial<User>): Promise<User> {
    return apiClient.patch<User>(API_ENDPOINTS.USERS.BY_ID(userId), data);
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(userId: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.USERS.BY_ID(userId));
  }

  /**
   * Invite user via email
   */
  static async inviteUser(data: InviteUserData): Promise<{ message: string; invitation_id: string }> {
    return apiClient.post('/admin/invitations', data);
  }

  /**
   * Resend invitation
   */
  static async resendInvitation(invitationId: string): Promise<{ message: string }> {
    return apiClient.post(`/admin/invitations/${invitationId}/resend`);
  }

  /**
   * Get pending invitations
   */
  static async getPendingInvitations(): Promise<unknown[]> {
    return apiClient.get('/admin/invitations/pending');
  }

  /**
   * Cancel invitation
   */
  static async cancelInvitation(invitationId: string): Promise<void> {
    return apiClient.delete(`/admin/invitations/${invitationId}`);
  }

  // ========== ROLE & PERMISSION MANAGEMENT ==========

  /**
   * Get all roles
   */
  static async getRoles(): Promise<Array<{ id: string; name: string; permissions: string[] }>> {
    return apiClient.get('/admin/roles');
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: number, role: string): Promise<User> {
    return apiClient.patch(API_ENDPOINTS.USERS.BY_ID(userId), { role });
  }

  /**
   * Get permissions for a role
   */
  static async getRolePermissions(role: string): Promise<string[]> {
    return apiClient.get(`/admin/roles/${role}/permissions`);
  }

  /**
   * Update role permissions
   */
  static async updateRolePermissions(role: string, permissions: string[]): Promise<void> {
    return apiClient.put(`/admin/roles/${role}/permissions`, { permissions });
  }

  // ========== AUDIT LOGS ==========

  /**
   * Get audit logs
   */
  static async getAuditLogs(params?: {
    page?: number;
    size?: number;
    user_id?: number;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<PaginatedResponse<AuditLog>> {
    return apiClient.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', params);
  }

  /**
   * Export audit logs
   */

  // static async exportAuditLogs(format: 'csv' | 'json', params?: ExportParams): Promise<Blob> {
  //   const response = await apiClient.get('/admin/audit-logs/export', {
  //     ...params,
  //     format,
  //   }, {
  //     responseType: 'blob',
  //   });
  //   return response as unknown as Blob;
  // }


  static async exportAuditLogs(format: 'csv' | 'json', params?: unknown): Promise<Blob> {
  const queryParams = {
    ...(typeof params === 'object' && params !== null ? params : {}),
    format,
  };
  
  const response = await apiClient.get('/admin/audit-logs/export', queryParams);
  return response as unknown as Blob;
}
  // ========== SUBSCRIPTION & BILLING ==========

  /**
   * Get subscription details
   */
  static async getSubscription(clinicId: number): Promise<{
    tier: string;
    status: string;
    expiry_date: string;
    auto_renew: boolean;
    payment_method: string;
    invoices: [];
  }> {
    return apiClient.get(`/admin/subscription/${clinicId}`);
  }

  /**
   * Update subscription tier
   */
  static async updateSubscription(clinicId: number, tier: string): Promise<unknown> {
    return apiClient.put(`/admin/subscription/${clinicId}`, { tier });
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(clinicId: number): Promise<void> {
    return apiClient.post(`/admin/subscription/${clinicId}/cancel`);
  }

  /**
   * Get billing history
   */
  static async getBillingHistory(clinicId: number): Promise<unknown[]> {
    return apiClient.get(`/admin/billing/${clinicId}/history`);
  }

  /**
   * Download invoice
   */
  static async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await apiClient.get(`/admin/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  // ========== SYSTEM SETTINGS ==========

  /**
   * Get system settings (super admin only)
   */
  static async getSystemSettings(): Promise<unknown> {
    return apiClient.get('/admin/system/settings');
  }

  /**
   * Update system settings (super admin only)
   */
  static async updateSystemSettings(settings: unknown): Promise<unknown> {
    return apiClient.put('/admin/system/settings', settings);
  }

  /**
   * Get system health status
   */
  static async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    services: Record<string, 'up' | 'down'>;
    last_check: string;
  }> {
    return apiClient.get('/admin/system/health');
  }

  /**
   * Get system metrics
   */
  static async getSystemMetrics(): Promise<{
    total_clinics: number;
    total_users: number;
    total_patients: number;
    total_appointments: number;
    active_sessions: number;
    api_requests: number;
    storage_used: number;
  }> {
    return apiClient.get('/admin/system/metrics');
  }

  // ========== REPORTS ==========

  /**
   * Generate clinic report
   */
  static async generateReport(type: 'clinic' | 'financial' | 'patient' | 'appointment',
    clinicId: number,
    params: { date_from: string; date_to: string }): Promise<Blob> {
    const response = await apiClient.get(`/admin/reports/${type}`, {
      clinic_id: clinicId,
      ...params,
    });
    return response as unknown as Blob;
  }

  /**
   * Get scheduled reports
   */
  static async getScheduledReports(): Promise<unknown[]> {
    return apiClient.get('/admin/reports/scheduled');
  }

  /**
   * Schedule automatic report
   */
  static async scheduleReport(data: {
    type: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'pdf' | 'csv' | 'excel';
  }): Promise<unknown> {
    return apiClient.post('/admin/reports/schedule', data);
  }
}

// Example usage in a component:
/*
import { AdminService } from '../services/api/admin.service';

// Get all users
const users = await AdminService.getUsers({ page: 1, role: 'doctor' });

// Invite new user
await AdminService.inviteUser({
  name: 'Dr. Smith',
  email: 'dr.smith@example.com',
  role: 'doctor',
  specialization: 'Cardiology',
});

// Get audit logs
const logs = await AdminService.getAuditLogs({ 
  date_from: '2024-01-01',
  action: 'user_login' 
});

// Update clinic subscription
await AdminService.updateSubscription(clinicId, 'professional');
*/