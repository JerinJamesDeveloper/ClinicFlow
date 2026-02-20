// src/services/api/endpoints.ts
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER_CLINIC: '/auth/register-clinic',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },

  CLINICS: {
    BASE: '/clinics',
    BY_ID: (id: number) => `/clinics/${id}`,
    USERS: (clinicId: number) => `/clinics/${clinicId}/users`,
    SETTINGS: (clinicId: number) => `/clinics/${clinicId}/settings`,
  },

  PATIENTS: {
    BASE: '/patients',
    BY_ID: (id: number) => `/patients/${id}`,
    HISTORY: (id: number) => `/patients/${id}/history`,
    BOOK_APPOINTMENT: (id: number) => `/patients/${id}/appointments`,
    MEDICAL_RECORDS: (id: number) => `/patients/${id}/medical-records`,
  },



  APPOINTMENTS: {
    BASE: '/appointments',
    BY_ID: (id: number) => `/appointments/${id}`,
    STATUS: (id: number) => `/appointments/${id}/status`,
    AVAILABLE_SLOTS: '/appointments/available-slots',
    TODAY: '/appointments/today',
    UPCOMING: '/appointments/upcoming',
    CHECK_IN: (id: number) => `/appointments/${id}/check-in`,
    CHECK_OUT: (id: number) => `/appointments/${id}/check-out`,
    RESCHEDULE: (id: number) => `/appointments/${id}/reschedule`,
    SEND_REMINDERS: '/appointments/send-reminders',
    PATIENT_HISTORY: (patientId: number) => `/patients/${patientId}/appointments`,
    STATS: '/appointments/stats',
    BULK_STATUS: '/appointments/bulk/status',
    BULK_DELETE: '/appointments/bulk/delete',
  },

  MEDICAL: {
    BASE: '/medical-records',
    BY_ID: (id: number) => `/medical-records/${id}`,
    BY_APPOINTMENT: (appointmentId: number) => `/appointments/${appointmentId}/medical-record`,
  },

  LAB: {
    BASE: '/lab-tests',
    BY_ID: (id: number) => `/lab-tests/${id}`,
    RESULTS: (id: number) => `/lab-tests/${id}/results`,
    PENDING: '/lab-tests/pending',
    BY_APPOINTMENT: (appointmentId: number) => `/appointments/${appointmentId}/lab-tests`,
  },

  PRESCRIPTIONS: {
    BASE: '/prescriptions',
    BY_ID: (id: number) => `/prescriptions/${id}`,
    DISPENSE: (id: number) => `/prescriptions/${id}/dispense`,
    PENDING: '/prescriptions/pending',
    BY_PATIENT: (patientId: number) => `/patients/${patientId}/prescriptions`,
  },

  DASHBOARD: {
    METRICS: '/dashboard/metrics',
    APPOINTMENTS_TIMELINE: '/dashboard/appointments-timeline',
    LAB_PERFORMANCE: '/dashboard/lab-performance',
    REVENUE: '/dashboard/revenue',
  },

  USERS: {
    BASE: '/users',
    BY_ID: (id: number) => `/users/${id}`,
    PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },

  DOCTOR: {
    MY_PATIENTS: '/doctor/patients',
    TODAYS_APPOINTMENTS: '/doctor/appointments/today',
    PENDING_REVIEWS: '/doctor/pending-reviews',
    COMPLETE_VISIT: (appointmentId: number) => `/appointments/${appointmentId}/complete`,
  },

  PHARMACY: {
    PENDING_PRESCRIPTIONS: '/pharmacy/pending',
    DISPENSE_HISTORY: '/pharmacy/dispensed',
    INVENTORY: '/pharmacy/inventory',
    UPDATE_STOCK: (medicineId: number) => `/pharmacy/stock/${medicineId}`,
  },

  LAB_STAFF: {
    PENDING_TESTS: '/lab/pending',
    IN_PROGRESS: '/lab/in-progress',
    COMPLETED_TODAY: '/lab/completed/today',
    UPDATE_RESULT: (testId: number) => `/lab-tests/${testId}/results`,
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;