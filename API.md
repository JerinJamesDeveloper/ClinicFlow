# ClinicFlow Web - API Documentation

This document provides comprehensive API documentation for developers who need to understand, integrate, or extend the ClinicFlow Web backend API layer.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Client Configuration](#api-client-configuration)
3. [Environment Configuration](#environment-configuration)
4. [API Endpoints](#api-endpoints)
5. [Data Types](#data-types)
6. [Service Classes](#service-classes)
7. [Usage Examples](#usage-examples)
8. [Error Handling](#error-handling)

---

## Architecture Overview

The API layer follows a modular service-oriented architecture:

```
src/services/
├── api/
│   ├── client.ts          # Axios instance with interceptors
│   ├── endpoints.ts       # Endpoint URL definitions
│   ├── auth.service.ts    # Authentication service
│   ├── patients.service.ts
│   ├── appointments.service.ts
│   ├── doctor.service.ts
│   ├── lab.service.ts
│   ├── pharmacy.service.ts
│   ├── admin.service.ts
│   └── dashboard.service.ts
├── config/
│   └── environment.ts     # Environment configuration
└── local/
    ├── doctor.store.ts    # Local storage for doctor data
    └── frontbench.store.ts
```

### Key Patterns

1. **Singleton API Client**: Uses a singleton pattern for the Axios instance
2. **Service Classes**: Each domain has a dedicated service class
3. **Endpoint Functions**: Dynamic endpoints use factory functions
4. **Type Safety**: Full TypeScript support with defined interfaces

---

## API Client Configuration

### Base URL

The API client is configured in `src/services/api/client.ts`:

```typescript
import axios from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: environment.API_URL,  // e.g., http://localhost:8000/v1
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
```

### Request Interceptor

The client automatically adds:
- **Authorization Token**: Reads from `localStorage.getItem('access_token')`
- **Clinic ID Header**: For tenant isolation via `X-Clinic-ID`

```typescript
this.client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const clinicId = localStorage.getItem('clinic_id');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (clinicId) {
    config.headers['X-Clinic-ID'] = clinicId;
  }
  return config;
});
```

### Response Interceptor

Handles:
- **Token Refresh**: Automatically refreshes expired tokens
- **Error Handling**: User-friendly error messages
- **Security Violations**: Detects tenant isolation violations

```typescript
this.client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 - Token refresh
    if (error.response?.status === 401) {
      // Refresh token logic
    }
    // Handle 403 - Tenant violations
    if (error.response?.status === 403) {
      // Security violation handling
    }
  }
);
```

---

## Environment Configuration

### File: `src/services/config/environment.ts`

```typescript
interface Environment {
  API_URL: string;
  WS_URL: string;
  ENV: 'development' | 'staging' | 'production';
  API_TIMEOUT: number;
}

const environments = {
  development: {
    API_URL: 'http://localhost:8000/v1',
    WS_URL: 'ws://localhost:8000/ws',
    ENV: 'development',
    API_TIMEOUT: 30000,
  },
  staging: {
    API_URL: 'https://staging-api.clinicflow.com/v1',
    WS_URL: 'wss://staging-api.clinicflow.com/ws',
    ENV: 'staging',
    API_TIMEOUT: 30000,
  },
  production: {
    API_URL: 'https://api.clinicflow.com/v1',
    WS_URL: 'wss://api.clinicflow.com/ws',
    ENV: 'production',
    API_TIMEOUT: 30000,
  },
};

export const environment = environments[import.meta.env.MODE || 'development'];
```

### Setting Up Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000/v1
VITE_WS_URL=ws://localhost:8000/ws
```

---

## API Endpoints

### File: `src/services/api/endpoints.ts`

All endpoints are defined as constants and use factory functions for dynamic IDs.

### Authentication Endpoints

```typescript
AUTH: {
  REGISTER_CLINIC: '/auth/register-clinic',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
}
```

### Clinic Endpoints

```typescript
CLINICS: {
  BASE: '/clinics',
  BY_ID: (id: number) => `/clinics/${id}`,
  USERS: (clinicId: number) => `/clinics/${clinicId}/users`,
  SETTINGS: (clinicId: number) => `/clinics/${clinicId}/settings`,
}
```

### Patient Endpoints

```typescript
PATIENTS: {
  BASE: '/patients',
  BY_ID: (id: number) => `/patients/${id}`,
  HISTORY: (id: number) => `/patients/${id}/history`,
  BOOK_APPOINTMENT: (id: number) => `/patients/${id}/appointments`,
  MEDICAL_RECORDS: (id: number) => `/patients/${id}/medical-records`,
}
```

### Appointment Endpoints

```typescript
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
}
```

### Lab Endpoints

```typescript
LAB: {
  BASE: '/lab-tests',
  BY_ID: (id: number) => `/lab-tests/${id}`,
  RESULTS: (id: number) => `/lab-tests/${id}/results`,
  PENDING: '/lab-tests/pending',
  BY_APPOINTMENT: (appointmentId: number) => `/appointments/${appointmentId}/lab-tests`,
}
```

### Prescription/Pharmacy Endpoints

```typescript
PRESCRIPTIONS: {
  BASE: '/prescriptions',
  BY_ID: (id: number) => `/prescriptions/${id}`,
  DISPENSE: (id: number) => `/prescriptions/${id}/dispense`,
  PENDING: '/prescriptions/pending',
  BY_PATIENT: (patientId: number) => `/patients/${patientId}/prescriptions`,
}

PHARMACY: {
  PENDING_PRESCRIPTIONS: '/pharmacy/pending',
  DISPENSE_HISTORY: '/pharmacy/dispensed',
  INVENTORY: '/pharmacy/inventory',
  UPDATE_STOCK: (medicineId: number) => `/pharmacy/stock/${medicineId}`,
}
```

### Doctor Endpoints

```typescript
DOCTOR: {
  MY_PATIENTS: '/doctor/patients',
  TODAYS_APPOINTMENTS: '/doctor/appointments/today',
  PENDING_REVIEWS: '/doctor/pending-reviews',
  COMPLETE_VISIT: (appointmentId: number) => `/appointments/${appointmentId}/complete`,
}
```

### Dashboard Endpoints

```typescript
DASHBOARD: {
  METRICS: '/dashboard/metrics',
  APPOINTMENTS_TIMELINE: '/dashboard/appointments-timeline',
  LAB_PERFORMANCE: '/dashboard/lab-performance',
  REVENUE: '/dashboard/revenue',
}
```

### User Endpoints

```typescript
USERS: {
  BASE: '/users',
  BY_ID: (id: number) => `/users/${id}`,
  PROFILE: '/users/profile',
  CHANGE_PASSWORD: '/users/change-password',
}
```

---

## Data Types

### File: `src/types/api.types.ts`

#### User

```typescript
interface User {
  id: number;
  clinic_id: number;
  name: string;
  email: string;
  role: 'admin' | 'super_admin' | 'clinic_admin' | 'front_desk' | 'doctor' | 'lab_staff' | 'pharmacist' | 'patient';
  is_active: boolean;
  created_at: string;
  last_login?: string;
  specialization?: string;
}
```

#### Patient

```typescript
interface Patient {
  id: number;
  clinic_id: number;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  blood_group?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  created_at: string;
  updated_at: string;
}

interface PatientCreate {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  blood_group?: string;
}
```

#### Appointment

```typescript
interface Appointment {
  id: number;
  clinic_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  type: 'in_person' | 'online';
  meeting_link?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  doctor?: User;
}

interface AppointmentCreate {
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  type: 'in_person' | 'online';
  notes?: string;
}

interface AppointmentFilters {
  page?: number;
  size?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  doctor_id?: number;
  patient_id?: number;
  date_from?: string;
  date_to?: string;
}
```

#### Medical Record

```typescript
interface MedicalRecord {
  id: number;
  clinic_id: number;
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  symptoms?: string[];
  vital_signs?: {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  notes?: string;
  created_at: string;
}
```

#### Lab Test

```typescript
interface LabTest {
  id: number;
  clinic_id: number;
  appointment_id: number;
  patient_id: number;
  requested_by: number;
  test_name: string;
  test_category: 'blood' | 'urine' | 'imaging' | 'pathology' | 'other';
  status: 'requested' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'emergency';
  result_text?: string;
  result_file_url?: string;
  reference_range?: string;
  is_abnormal?: boolean;
  completed_by?: number;
  completed_at?: string;
  created_at: string;
}

interface LabTestCreate {
  appointment_id: number;
  test_name: string;
  test_category?: string;
  priority?: string;
  notes?: string;
}
```

#### Prescription

```typescript
interface Prescription {
  id: number;
  clinic_id: number;
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: number;
  }>;
  status: 'issued' | 'partially_dispensed' | 'dispensed' | 'cancelled';
  notes?: string;
  issued_at: string;
  dispensed_at?: string;
  dispensed_by?: number;
}
```

#### Authentication Types

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

interface ClinicRegistration {
  clinic_name: string;
  clinic_address?: string;
  admin_email: string;
  admin_password: string;
  admin_name: string;
}
```

#### Common Types

```typescript
interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

interface DashboardMetrics {
  total_patients: number;
  appointments_today: number;
  appointments_completed: number;
  pending_lab_tests: number;
  pending_prescriptions: number;
  revenue_today?: number;
  revenue_month?: number;
}
```

### File: `src/types/doctor.types.ts`

#### SOAP Note Types

```typescript
type SoapNote = {
  id: string;
  appointmentId: number;
  patientId: number;
  doctorId?: number;
  status: 'draft' | 'final';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10: Array<{ code: string; label: string }>;
  createdAt: string;
  updatedAt: string;
};

type SoapTemplate = {
  id: string;
  name: string;
  specialty?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  isDefault?: boolean;
};
```

#### Prescription Types

```typescript
type RxDrug = {
  id: string;
  generic: string;
  brand?: string;
  form?: string;
  strength?: string;
  allergens?: string[];
  interactionsWith?: string[];
  doseMgPerKg?: number;
  maxMgPerDay?: number;
};

type RxItem = {
  id: string;
  drugId?: string;
  generic: string;
  brand?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
};

type PrescriptionDraft = {
  id: string;
  appointmentId: number;
  patientId: number;
  createdAt: string;
  updatedAt: string;
  items: RxItem[];
  notes?: string;
};
```

#### Lab Order Types

```typescript
type LabUrgency = 'routine' | 'urgent' | 'emergency';
type LabStatus = 'ordered' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';

type LabOrderItem = {
  id: string;
  name: string;
  panel?: string;
  urgency: LabUrgency;
  notes?: string;
  status: LabStatus;
  resultValue?: string;
  unit?: string;
  refRange?: string;
  isAbnormal?: boolean;
};

type LabOrder = {
  id: string;
  appointmentId: number;
  patientId: number;
  createdAt: string;
  updatedAt: string;
  items: LabOrderItem[];
};
```

### File: `src/types/clinic.types.ts`

```typescript
interface Clinic {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  registration_number: string;
  subscription_tier: 'basic' | 'professional' | 'enterprise';
  subscription_expiry: string;
  max_doctors: number;
  max_patients: number;
  max_lab_staff: number;
  max_pharmacists: number;
  is_active: boolean;
  created_at: string;
  settings: ClinicSettingsType;
}

interface ClinicSettingsType {
  appointment_duration: number;
  working_hours: {
    monday: { start: string; end: string; isOpen: boolean };
    // ... other days
  };
  notifications?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  branding?: {
    logo_url: string;
    primary_color: string;
    secondary_color: string;
  };
}

interface InviteUserData {
  name: string;
  email: string;
  role: 'doctor' | 'lab_staff' | 'pharmacist' | 'receptionist';
  specialization?: string;
}

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: number;
  details: string;
  ip_address: string;
  created_at: string;
}
```

---

## Service Classes

### AuthService

```typescript
// src/services/api/auth.service.ts
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export class AuthService {
  // Register a new clinic with admin user
  static async registerClinic(data: ClinicRegistration)
    : Promise<{ clinic: Clinic; admin: User; access_token: string }>

  // Login with email and password
  static async login(data: LoginRequest): Promise<LoginResponse>

  // Logout current user
  static async logout(): Promise<void>

  // Refresh access token
  static async refreshToken(): Promise<{ access_token: string }>

  // Request password reset
  static async forgotPassword(email: string): Promise<{ message: string }>

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<{ message: string }>
}
```

**Usage:**
```typescript
import { AuthService } from '../services/api/auth.service';

// Login
const response = await AuthService.login({
  email: 'doctor@clinic.com',
  password: 'password123'
});

// Tokens are automatically stored in localStorage
// Redirect or update app state
```

### PatientsService

```typescript
// src/services/api/patients.service.ts
export class PatientsService {
  // Get paginated list of patients
  static async getPatients(
    page?: number,
    size?: number,
    search?: string
  ): Promise<PaginatedResponse<Patient>>

  // Get single patient by ID
  static async getPatientById(id: number): Promise<Patient>

  // Create new patient
  static async createPatient(data: PatientCreate): Promise<Patient>

  // Update patient
  static async updatePatient(id: number, data: Partial<PatientCreate>): Promise<Patient>

  // Delete patient
  static async deletePatient(id: number): Promise<void>

  // Get patient history
  static async getPatientHistory(id: number): Promise<any>
}
```

### AppointmentsService

```typescript
// src/services/api/appointments.service.ts
export class AppointmentsService {
  // Get appointments with filters
  static async getAppointments(filters?: AppointmentFilters)
    : Promise<PaginatedResponse<Appointment>>

  // Get single appointment
  static async getAppointmentById(id: number): Promise<Appointment>

  // Create appointment
  static async createAppointment(data: AppointmentCreate): Promise<Appointment>

  // Update appointment status
  static async updateStatus(id: number, status: string): Promise<Appointment>

  // Get available time slots
  static async getAvailableSlots(doctorId: number, date: string): Promise<string[]>

  // Get today's appointments
  static async getTodayAppointments(): Promise<Appointment[]>

  // Cancel appointment
  static async cancelAppointment(id: number): Promise<void>

  // Update appointment
  static async updateAppointment(id: number, data: Partial<AppointmentCreate>)
    : Promise<Appointment>

  // Bulk update status
  static async bulkUpdateStatus(ids: number[], status: string)
    : Promise<{ success: boolean; processed: number; failed: number }>

  // Check in patient
  static async checkInPatient(id: number): Promise<Appointment>

  // Check out patient
  static async checkOutPatient(id: number): Promise<Appointment>

  // Reschedule appointment
  static async rescheduleAppointment(
    id: number,
    newDate: string,
    newTime: string,
    reason?: string
  ): Promise<Appointment>

  // Get appointment statistics
  static async getStats(dateFrom: string, dateTo: string): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    averageDuration: number;
  }>
}
```

### DoctorService

```typescript
// src/services/api/doctor.service.ts
export class DoctorService {
  // Get today's appointments for logged-in doctor
  static async getTodayAppointments(): Promise<Appointment[]>

  // Get doctor's patients
  static async getMyPatients(): Promise<any>

  // Get pending reviews
  static async getPendingReviews(): Promise<any>

  // Complete a patient visit
  static async completeVisit(
    appointmentId: number,
    data: {
      diagnosis: string;
      symptoms?: string[];
      vital_signs?: any;
      lab_requests?: any[];
      prescription?: any;
    }
  ): Promise<any>
}
```

### LabService

```typescript
// src/services/api/lab.service.ts
export class LabService {
  // Get lab tests with filters
  static async getLabTests(filters?: {
    page?: number;
    status?: string;
    patient_id?: number;
    appointment_id?: number;
  }): Promise<PaginatedResponse<LabTest>>

  // Get pending tests
  static async getPendingTests(): Promise<LabTest[]>

  // Request a new lab test
  static async requestTest(data: LabTestCreate): Promise<LabTest>

  // Update test results
  static async updateTestResults(testId: number, data: any): Promise<LabTest>

  // Upload result file
  static async uploadResultFile(testId: number, file: File, resultText?: string): Promise<LabTest>
}
```

### PharmacyService

```typescript
// src/services/api/pharmacy.service.ts
export class PharmacyService {
  // Get pending prescriptions
  static async getPendingPrescriptions(): Promise<Prescription[]>

  // Get dispense history
  static async getDispenseHistory(): Promise<Prescription[]>

  // Dispense a prescription
  static async dispensePrescription(id: number, notes?: string): Promise<Prescription>

  // Get pharmacy inventory
  static async getInventory(): Promise<any>
}
```

### AdminService

```typescript
// src/services/api/admin.service.ts
export class AdminService {
  // ========== CLINIC MANAGEMENT ==========
  static async getClinicSettings(clinicId: number): Promise<ClinicSettings>
  static async updateClinic(clinicId: number, data: Partial<ClinicSettings>): Promise<ClinicSettings>
  static async getClinicUsage(clinicId: number): Promise<ClinicUsage>
  static async getAllClinics(params?: {...}): Promise<PaginatedResponse<Clinic>>
  static async createClinic(data: {...}): Promise<Clinic>
  static async deactivateClinic(clinicId: number): Promise<void>
  static async activateClinic(clinicId: number): Promise<Clinic>

  // ========== USER MANAGEMENT ==========
  static async getUsers(params?: {...}): Promise<PaginatedResponse<User>>
  static async getUserById(userId: number): Promise<User>
  static async createUser(data: {...}): Promise<User>
  static async updateUser(userId: number, data: Partial<User>): Promise<User>
  static async deleteUser(userId: number): Promise<void>
  static async inviteUser(data: InviteUserData): Promise<{ message: string; invitation_id: string }>
  static async resendInvitation(invitationId: string): Promise<{ message: string }>
  static async getPendingInvitations(): Promise<any[]>
  static async cancelInvitation(invitationId: string): Promise<void>

  // ========== AUDIT LOGS ==========
  static async getAuditLogs(params?: {...}): Promise<PaginatedResponse<AuditLog>>
  static async exportAuditLogs(format: 'csv' | 'json', params?: any): Promise<Blob>

  // ========== SUBSCRIPTION ==========
  static async getSubscription(clinicId: number): Promise<{...}>
  static async updateSubscription(clinicId: number, tier: string): Promise<any>
  static async cancelSubscription(clinicId: number): Promise<void>
  static async getBillingHistory(clinicId: number): Promise<any[]>
  static async downloadInvoice(invoiceId: string): Promise<Blob>

  // ========== SYSTEM (Super Admin) ==========
  static async getSystemSettings(): Promise<any>
  static async updateSystemSettings(settings: any): Promise<any>
  static async getSystemHealth(): Promise<{...}>
  static async getSystemMetrics(): Promise<{...}>

  // ========== REPORTS ==========
  static async generateReport(
    type: 'clinic' | 'financial' | 'patient' | 'appointment',
    clinicId: number,
    params: { date_from: string; date_to: string }
  ): Promise<Blob>
}
```

---

## Usage Examples

### Example 1: Fetching Patients

```typescript
import { PatientsService } from '../services/api/patients.service';

// Using React Query (recommended)
import { useQuery } from 'react-query';

function PatientList() {
  const { data, isLoading, error } = useQuery(
    ['patients', page, search],
    () => PatientsService.getPatients(page, 20, search)
  );

  if (isLoading) return <Loading />;
  if (error) return <Error />;

  return (
    <ul>
      {data.items.map(patient => (
        <li key={patient.id}>{patient.name}</li>
      ))}
    </ul>
  );
}
```

### Example 2: Creating an Appointment

```typescript
import { AppointmentsService } from '../services/api/appointments.service';
import toast from 'react-hot-toast';

async function handleCreateAppointment() {
  try {
    const appointment = await AppointmentsService.createAppointment({
      patient_id: 123,
      doctor_id: 456,
      appointment_date: '2024-01-15T10:00:00Z',
      type: 'in_person',
      notes: 'Follow-up visit'
    });
    toast.success('Appointment created!');
  } catch (error) {
    toast.error('Failed to create appointment');
  }
}
```

### Example 3: Completing a Doctor Visit

```typescript
import { DoctorService } from '../services/api/doctor.service';

async function handleCompleteVisit(appointmentId: number) {
  const result = await DoctorService.completeVisit(appointmentId, {
    diagnosis: 'Hypertension - Stage 1',
    symptoms: ['Headache', 'Dizziness'],
    vital_signs: {
      blood_pressure: '140/90',
      heart_rate: 88,
      temperature: 98.6,
      weight: 75
    },
    lab_requests: [
      { test_name: 'CBC', priority: 'routine' },
      { test_name: 'Lipid Profile', priority: 'routine' }
    ],
    prescription: {
      medicines: [
        {
          name: 'Amlodipine',
          dosage: '5mg',
          frequency: 'OD',
          duration: '30 days',
          instructions: 'Take in the morning'
        }
      ]
    }
  });
}
```

### Example 4: Using with React Query Mutations

```typescript
import { useMutation, useQueryClient } from 'react-query';

function CreatePatientForm() {
  const queryClient = useQueryClient();

  const createPatient = useMutation(
    (data: PatientCreate) => PatientsService.createPatient(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patients');
        toast.success('Patient created successfully');
      },
      onError: () => {
        toast.error('Failed to create patient');
      }
    }
  );

  const handleSubmit = (formData: PatientCreate) => {
    createPatient.mutate(formData);
  };

  // ... render form
}
```

---

## Error Handling

### HTTP Status Codes

| Status | Meaning | Handling |
|--------|---------|----------|
| 400 | Bad Request | Show validation errors |
| 401 | Unauthorized | Refresh token or redirect to login |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Show resource not found |
| 500 | Server Error | Show generic error message |

### Custom Error Handling

The API client includes automatic error handling:

```typescript
// Errors are automatically handled by interceptors
// Toast notifications are shown for common errors

try {
  await apiClient.get('/endpoint');
} catch (error) {
  // Error is already handled with toast
  // Custom handling if needed
  if (error.response?.status === 400) {
    const errors = error.response.data.errors;
    // Handle validation errors
  }
}
```

### Tenant Isolation

The system enforces tenant isolation via:
- `X-Clinic-ID` header on requests
- Server-side validation of clinic access
- Automatic detection of cross-tenant access attempts

---

## Best Practices

1. **Use Service Classes**: Always use the service classes instead of direct API calls
2. **Use React Query**: For data fetching, use React Query for caching and state management
3. **Handle Loading States**: Always show loading states while fetching data
4. **Handle Errors**: Use try-catch blocks and show user-friendly error messages
5. **Type Safety**: Use TypeScript interfaces for all data structures
6. **Environment Variables**: Never hardcode API URLs; use environment configuration
7. **Token Management**: Never manually handle tokens; use AuthService methods

---

## Additional Resources

- [Main README](./README.md)
- [Type Definitions](./src/types/)
- [API Client Source](./src/services/api/client.ts)
- [Endpoint Definitions](./src/services/api/endpoints.ts)

---

<p align="center">Built for ClinicFlow Web - Clinic Management System</p>

