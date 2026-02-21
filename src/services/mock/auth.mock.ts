// src/services/api/mock/auth.mock.ts
import type { LoginRequest, LoginResponse, User } from "../../types/api.types";

// Mock users data
export const mockUsers: User[] = [
  {
    id: 1,
    clinic_id: 1,
    name: 'Admin User',
    email: 'admin@clinic.com',
    role: 'clinic_admin',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-03-15T10:30:00Z',
  },
  {
    id: 2,
    clinic_id: 1,
    name: 'Dr. John Smith',
    email: 'doctor@clinic.com',
    role: 'doctor',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-03-15T09:15:00Z',
    specialization: 'Cardiology',
  },
  {
    id: 3,
    clinic_id: 1,
    name: 'Lab Technician',
    email: 'lab@clinic.com',
    role: 'lab_staff',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-03-15T08:45:00Z',
  },
  {
    id: 4,
    clinic_id: 1,
    name: 'Pharmacist',
    email: 'pharmacy@clinic.com',
    role: 'pharmacist',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-03-15T11:00:00Z',
  },
  {
    id: 5,
    clinic_id: 1,
    name: 'Patient Demo',
    email: 'patient@clinic.com',
    role: 'patient',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-03-14T14:30:00Z',
  },
    {
    id: 6,
    clinic_id: 1,
    name: 'Patient Demo',
    email: 'jerin@clinic.com',
    role: 'super_admin',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-03-14T14:30:00Z',
  },
];

// Mock login function
export const mockLogin = (email: string, password: string): LoginResponse => {
  // Find user by email
  const user = mockUsers.find(u => u.email === email);
  
  // Simulate network delay
  if (!user || password !== 'password123') {
    throw {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
      status_code: 401,
      timestamp: new Date().toISOString(),
    };
  }

  // Generate mock tokens
  const access_token = `mock_jwt_token_${user.id}_${Date.now()}`;
  const refresh_token = `mock_refresh_token_${user.id}_${Date.now()}`;

  return {
    access_token,
    refresh_token,
    expires_in: 3600,
    user,
  };
};