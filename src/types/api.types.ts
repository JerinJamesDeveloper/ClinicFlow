// src/types/api.types.ts
export interface User {
  id: number;
  clinic_id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'clinic_admin' | 'doctor' | 'lab_staff' | 'pharmacist' | 'patient';
  is_active: boolean;
  created_at: string;
  last_login?: string;
  specialization?: string;
}

export interface Patient {
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

export interface PatientCreate {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  blood_group?: string;
}
export interface AppointmentFilters {
  page?: number;
  size?: number;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  doctor_id?: number;
  patient_id?: number;
  date_from?: string;
  date_to?: string;
  doctorId?: number;  // For available slots (camelCase version)
  date?: string;       // For available slots
}

// Available slots params
export interface AvailableSlotsParams {
  doctorId: number;
  date: string;
}

export interface Appointment {
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

export interface AppointmentCreate {
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  type: 'in_person' | 'online';
  notes?: string;
}

export interface MedicalRecord {
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

export interface LabTest {
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

export interface LabTestCreate {
  appointment_id: number;
  test_name: string;
  test_category?: string;
  priority?: string;
  notes?: string;
}

export interface Prescription {
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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface ClinicRegistration {
  clinic_name: string;
  clinic_address?: string;
  admin_email: string;
  admin_password: string;
  admin_name: string;
}

export interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

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
}

