// src/providers/ClinicProvider.tsx
import React, { useState, type ReactNode, useCallback, useMemo, } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AdminService } from '../services/api/admin.service';
import { useAuth } from '../hooks/useAuth';
import { ClinicContext } from '../context/ClinicContext';
import toast from 'react-hot-toast';
import type { Clinic, ClinicSettingsnew, ClinicUsage, SubscriptionStatus, UsageStats } from '../types/clinic.types';

interface ClinicProviderProps {
  children: ReactNode;
}

// Tier features and limits
const TIER_FEATURES = {
  basic: [
    'Up to 5 doctors',
    'Up to 500 patients per day',
    'Basic appointment scheduling',
    'Patient records management',
    'Lab test tracking',
    'Email support',
  ],
  professional: [
    'Up to 20 doctors',
    'Up to 2000 patients per day',
    'Everything in Basic',
    'Advanced analytics',
    'SMS notifications',
    'Priority support',
    'API access',
    'Custom branding',
  ],
  enterprise: [
    'Unlimited doctors',
    'Unlimited patients',
    'Everything in Professional',
    'Dedicated account manager',
    '24/7 phone support',
    'Custom integrations',
    'SLA guarantee',
    'On-premise option',
  ],
};

const TIER_LIMITS = {
  basic: { doctors: 5, patients: 500, labStaff: 3, pharmacists: 2 },
  professional: { doctors: 20, patients: 2000, labStaff: 10, pharmacists: 5 },
  enterprise: { doctors: 999999, patients: 999999999, labStaff: 999999, pharmacists: 999999 },
};

export const ClinicProvider: React.FC<ClinicProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [clinic, setClinic] = useState<ClinicSettingsnew | null>(null);

  // Fetch clinic data
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<ClinicSettingsnew, Error>(
    ['clinic', user?.clinic_id],
    async () => {
      if (!user?.clinic_id) throw new Error('No clinic ID available');
      return AdminService.getClinicSettings(user.clinic_id);
    },
    {
      enabled: !!user?.clinic_id,
      onSuccess: (data) => setClinic(data),
      onError: (err) => {
        toast.error(err?.message || 'Failed to load clinic data');
      },
    }
  );

  // Fetch usage statistics
  const { data: usageData } = useQuery<ClinicUsage, Error>(
    ['clinicUsage', user?.clinic_id],
    async () => {
      if (!user?.clinic_id) throw new Error('No clinic ID available');
      return AdminService.getClinicUsage(user.clinic_id);
    },
    {
      enabled: !!user?.clinic_id,
    }
  );

  // Update clinic mutation
  const updateMutation = useMutation<ClinicSettingsnew, Error, Partial<Clinic>>(
    async (data) => {
      if (!user?.clinic_id) throw new Error('No clinic ID available');
      return AdminService.updateClinic(user.clinic_id, data);
    },
    {
      onSuccess: (updatedClinic) => {
        setClinic(updatedClinic);
        queryClient.invalidateQueries(['clinic', user?.clinic_id]);
        toast.success('Clinic settings updated successfully');
      },
      onError: (err) => {
        toast.error(err?.message || 'Failed to update clinic settings');
      },
    }
  );

  // Calculate subscription status
  const getSubscriptionStatus = useCallback((): SubscriptionStatus => {
    const currentClinic = clinic || data || null;
    
    if (!currentClinic) {
      return {
        tier: 'basic',
        isExpired: true,
        daysRemaining: 0,
        features: [],
        limits: { doctors: 0, patients: 0, labStaff: 0, pharmacists: 0 },
        usage: { doctors: 0, patients: 0, labStaff: 0, pharmacists: 0 },
      };
    }

    const expiryDate = new Date(currentClinic.subscription_expiry);
    const today = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;

    const usage = usageData || {
      totalDoctors: 0,
      totalPatients: 0,
      totalLabStaff: 0,
      totalPharmacists: 0,
      appointmentsThisMonth: 0,
      labTestsThisMonth: 0,
      prescriptionsThisMonth: 0,
      revenueThisMonth: 0,
    };

    return {
      tier: currentClinic.subscription_tier,
      isExpired,
      daysRemaining: Math.max(0, daysRemaining),
      features: TIER_FEATURES[currentClinic.subscription_tier] || [],
      limits: TIER_LIMITS[currentClinic.subscription_tier] || {
        doctors: 0,
        patients: 0,
        labStaff: 0,
        pharmacists: 0,
      },
      usage: {
        doctors: usage.totalDoctors,
        patients: usage.totalPatients,
        labStaff: usage.totalLabStaff,
        pharmacists: usage.totalPharmacists,
      },
    };
  }, [clinic, data, usageData]);

  // Check if can add new user based on subscription limits
  const canAddUser = useCallback((role: string): boolean => {
    const currentClinic = clinic || data || null;
    if (!currentClinic) return false;

    const status = getSubscriptionStatus();
    if (status.isExpired) return false;

    const usage = status.usage;
    const limits = status.limits;

    switch (role) {
      case 'doctor':
        return usage.doctors < limits.doctors;
      case 'lab_staff':
        return usage.labStaff < limits.labStaff;
      case 'pharmacist':
        return usage.pharmacists < limits.pharmacists;
      default:
        return true; // Other roles (admin, receptionist) are unlimited
    }
  }, [clinic, data, getSubscriptionStatus]);

  // Check if can add new patient
  const canAddPatient = useCallback((): boolean => {
    const currentClinic = clinic || data || null;
    if (!currentClinic) return false;

    const status = getSubscriptionStatus();
    if (status.isExpired) return false;

    return status.usage.patients < status.limits.patients;
  }, [clinic, data, getSubscriptionStatus]);

  // Get detailed usage statistics
  const getUsageStats = useCallback((): UsageStats => {
    const defaultStats = {
      totalDoctors: 0,
      totalPatients: 0,
      totalLabStaff: 0,
      totalPharmacists: 0,
      appointmentsThisMonth: 0,
      labTestsThisMonth: 0,
      prescriptionsThisMonth: 0,
      revenueThisMonth: 0,
      usagePercentages: {
        doctors: 0,
        patients: 0,
        labStaff: 0,
        pharmacists: 0,
      },
    };

    const currentClinic = clinic || data || null;
    if (!currentClinic || !usageData) return defaultStats;

    const status = getSubscriptionStatus();
    
    return {
      totalDoctors: usageData.totalDoctors,
      totalPatients: usageData.totalPatients,
      totalLabStaff: usageData.totalLabStaff,
      totalPharmacists: usageData.totalPharmacists,
      appointmentsThisMonth: usageData.appointmentsThisMonth || 0,
      labTestsThisMonth: usageData.labTestsThisMonth || 0,
      prescriptionsThisMonth: usageData.prescriptionsThisMonth || 0,
      revenueThisMonth: usageData.revenueThisMonth || 0,
      usagePercentages: {
        doctors: (usageData.totalDoctors / (status.limits.doctors || 1)) * 100,
        patients: (usageData.totalPatients / (status.limits.patients || 1)) * 100,
        labStaff: (usageData.totalLabStaff / (status.limits.labStaff || 1)) * 100,
        pharmacists: (usageData.totalPharmacists / (status.limits.pharmacists || 1)) * 100,
      },
    };
  }, [clinic, data, usageData, getSubscriptionStatus]);

  const refreshClinic = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const updateClinic = useCallback(async (data: Partial<Clinic>) => {
    await updateMutation.mutateAsync(data);
  }, [updateMutation]);

  const subscriptionStatus = getSubscriptionStatus();

  // Memoize context value
  const contextValue = useMemo(() => ({
    clinic: clinic || data || null,
    isLoading,
    error: error?.message || null,
    refreshClinic,
    updateClinic,
    getSubscriptionStatus,
    canAddUser,
    canAddPatient,
    getUsageStats,
    isSubscriptionExpired: subscriptionStatus.isExpired,
    daysRemaining: subscriptionStatus.daysRemaining,
  }), [
    clinic,
    data,
    isLoading,
    error,
    refreshClinic,
    updateClinic,
    getSubscriptionStatus,
    canAddUser,
    canAddPatient,
    getUsageStats,
    subscriptionStatus.isExpired,
    subscriptionStatus.daysRemaining,
  ]);

  return (
    <ClinicContext.Provider value={contextValue}>
      {children}
    </ClinicContext.Provider>
  );
};