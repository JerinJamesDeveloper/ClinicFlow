// src/services/api/auth.service.ts
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import type { LoginRequest, LoginResponse, ClinicRegistration, User } from '../../types/api.types';
import type { Clinic } from '../../types/clinic.types';

export class AuthService {
  static async registerClinic(data: ClinicRegistration) {
    return apiClient.post<{ clinic: Clinic; admin: User; access_token: string }>(
      API_ENDPOINTS.AUTH.REGISTER_CLINIC,
      data
    );
  }


    static async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post('/auth/reset-password', { token, new_password: newPassword });
  }

  static async login(data: LoginRequest) {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );
    
    // Store tokens
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('clinic_id', String(response.user.clinic_id));
    
    return response;
  }

  static async logout() {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    localStorage.clear();
    window.location.href = '/login';
  }

  static async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await apiClient.post<{ access_token: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refresh_token: refreshToken }
    );
    localStorage.setItem('access_token', response.access_token);
    return response;
  }
}