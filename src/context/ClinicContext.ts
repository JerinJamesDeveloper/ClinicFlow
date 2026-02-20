// src/context/ClinicContext.ts
import { createContext } from 'react';
import type { Clinic, SubscriptionStatus, UsageStats } from '../types/clinic.types';

export interface ClinicContextType {
  clinic: Clinic | null;
  isLoading: boolean;
  error: string | null;
  refreshClinic: () => Promise<void>;
  updateClinic: (data: Partial<Clinic>) => Promise<void>;
  getSubscriptionStatus: () => SubscriptionStatus;
  canAddUser: (role: string) => boolean;
  canAddPatient: () => boolean;
  getUsageStats: () => UsageStats;
  isSubscriptionExpired: boolean;
  daysRemaining: number;
}

export const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

ClinicContext.displayName = 'ClinicContext';