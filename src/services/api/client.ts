// src/services/api/client.ts
import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { environment } from '../config/environment';
import toast from 'react-hot-toast';

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: environment.API_URL,
      timeout: environment.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors() {
    // Request interceptor - adds token and tenant context
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        const clinicId = localStorage.getItem('clinic_id');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add clinic_id header for tenant isolation
        if (clinicId) {
          config.headers['X-Clinic-ID'] = clinicId;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handles errors and tenant violations
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        // Handle tenant isolation violations
        if (error.response?.status === 403) {
          const errorData = error.response.data as any;
          if (errorData.code === 'TENANT_VIOLATION') {
            toast.error('Access denied: Cross-tenant access attempt detected');
            // Log security event
            console.error('Security violation:', errorData);
          }
        }
        
        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            const response = await this.client.post('/auth/refresh', {
              refresh_token: refreshToken,
            });
            localStorage.setItem('access_token', response.data.access_token);
            return this.client(originalRequest);
          } catch (refreshError) {
            // Redirect to login
            localStorage.clear();
            window.location.href = '/login';
            toast.error('Session expired. Please login again.');
          }
        }
        
        // Show user-friendly error messages
        if (error.response?.status === 400) {
          toast.error('Invalid data provided');
        } else if (error.response?.status === 404) {
          toast.error('Resource not found');
        } else if (error.response?.status === 500) {
          toast.error('Server error. Please try again later.');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiClient = ApiClient.getInstance();