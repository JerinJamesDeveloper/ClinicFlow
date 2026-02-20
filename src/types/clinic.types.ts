// src/types/clinic.types.ts
export interface Clinic {
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

export interface ClinicSettingsType {
  appointment_duration: number;
  working_hours: {
    monday: { start: string; end: string; isOpen: boolean };
    tuesday: { start: string; end: string; isOpen: boolean };
    wednesday: { start: string; end: string; isOpen: boolean };
    thursday: { start: string; end: string; isOpen: boolean };
    friday: { start: string; end: string; isOpen: boolean };
    saturday: { start: string; end: string; isOpen: boolean };
    sunday: { start: string; end: string; isOpen: boolean };
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

export interface ClinicUsage {
  totalDoctors: number;
  totalPatients: number;
  totalLabStaff: number;
  totalPharmacists: number;
  appointmentsThisMonth: number;
  labTestsThisMonth: number;
  prescriptionsThisMonth: number;
  revenueThisMonth: number;
}

export interface SubscriptionStatus {
  tier: string;
  isExpired: boolean;
  daysRemaining: number;
  features: string[];
  limits: {
    doctors: number;
    patients: number;
    labStaff: number;
    pharmacists: number;
  };
  usage: {
    doctors: number;
    patients: number;
    labStaff: number;
    pharmacists: number;
  };
}

export interface UsageStats {
  totalDoctors: number;
  totalPatients: number;
  totalLabStaff: number;
  totalPharmacists: number;
  appointmentsThisMonth: number;
  labTestsThisMonth: number;
  prescriptionsThisMonth: number;
  revenueThisMonth: number;
  usagePercentages: {
    doctors: number;
    patients: number;
    labStaff: number;
    pharmacists: number;
  };
}


export interface ClinicSettingsnew {
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
  settings: {
    appointment_duration: number;
    working_hours: {
      monday: { start: string; end: string; isOpen: boolean };
      tuesday: { start: string; end: string; isOpen: boolean };
      wednesday: { start: string; end: string; isOpen: boolean };
      thursday: { start: string; end: string; isOpen: boolean };
      friday: { start: string; end: string; isOpen: boolean };
      saturday: { start: string; end: string; isOpen: boolean };
      sunday: { start: string; end: string; isOpen: boolean };
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
  };
}

export interface ClinicUsage {
  totalDoctors: number;
  totalPatients: number;
  totalLabStaff: number;
  totalPharmacists: number;
  appointmentsThisMonth: number;
  labTestsThisMonth: number;
  prescriptionsThisMonth: number;
  revenueThisMonth: number;
}

export interface InviteUserData {
  name: string;
  email: string;
  role: 'doctor' | 'lab_staff' | 'pharmacist' | 'receptionist';
  specialization?: string;
}

export interface AuditLog {
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