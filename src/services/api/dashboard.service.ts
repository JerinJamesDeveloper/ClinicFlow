// src/services/api/dashboard.service.ts
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

// Types for dashboard data
export interface DashboardMetrics {
  total_patients: number;
  appointments_today: number;
  appointments_completed: number;
  pending_lab_tests: number;
  pending_prescriptions: number;
  revenue_today?: number;
  revenue_month?: number;
  popular_tests?: Array<{
    test_name: string;
    count: number;
  }>;
  appointments_timeline?: Array<{
    date: string;
    scheduled: number;
    completed: number;
    cancelled: number;
  }>;
}

export interface LabPerformance {
  avg_turnaround_hours: number;
  tests_by_category: Record<string, number>;
  pending_by_priority: Record<string, number>;
}

export interface RevenueData {
  daily: Array<{ date: string; amount: number }>;
  monthly: Array<{ month: string; amount: number }>;
  yearly: Array<{ year: string; amount: number }>;
}

export class DashboardService {
  /**
   * Get dashboard metrics
   * @param period - 'today' | 'week' | 'month' (default: 'today')
   */
  static async getMetrics(period: 'today' | 'week' | 'month' = 'today'): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>(API_ENDPOINTS.DASHBOARD.METRICS, { period });
  }

  /**
   * Get appointments timeline
   * @param days - Number of days to include (default: 7)
   */
  static async getAppointmentsTimeline(days: number = 7): Promise<Array<{
    date: string;
    scheduled: number;
    completed: number;
    cancelled: number;
  }>> {
    return apiClient.get(API_ENDPOINTS.DASHBOARD.APPOINTMENTS_TIMELINE, { days });
  }

  /**
   * Get lab performance metrics
   */
  static async getLabPerformance(): Promise<LabPerformance> {
    return apiClient.get(API_ENDPOINTS.DASHBOARD.LAB_PERFORMANCE);
  }

  /**
   * Get revenue data
   * @param period - 'daily' | 'monthly' | 'yearly'
   */
  static async getRevenueData(period: 'daily' | 'monthly' | 'yearly' = 'monthly'): Promise<RevenueData> {
    return apiClient.get(API_ENDPOINTS.DASHBOARD.REVENUE, { period });
  }

  /**
   * Get recent activity
   * @param limit - Number of activities to return (default: 10)
   */
  static async getRecentActivity(limit: number = 10): Promise<Array<{
    id: number;
    type: 'appointment' | 'lab' | 'prescription' | 'patient';
    description: string;
    patient_name?: string;
    timestamp: string;
    status?: string;
  }>> {
    return apiClient.get('/dashboard/recent-activity', { limit });
  }
}