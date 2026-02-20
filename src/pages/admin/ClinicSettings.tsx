// src/pages/admin/ClinicSettings.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminService } from '../../services/api/admin.service';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import toast from 'react-hot-toast';
import type { DatabaseError } from '../../types/error.types';
import {
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ClockIcon,
  BellIcon,
  PaintBrushIcon,
  UsersIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

import type { ClinicSettingsnew } from '../../types/clinic.types';


// Validation schema for general settings
const generalSettingsSchema = z.object({
  name: z.string().min(2, 'Clinic name is required'),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email address'),
  registration_number: z.string().optional(),
});

// Validation schema for working hours
const workingHoursSchema = z.object({
  monday: z.object({ start: z.string(), end: z.string(), isOpen: z.boolean() }),
  tuesday: z.object({ start: z.string(), end: z.string(), isOpen: z.boolean() }),
  wednesday: z.object({ start: z.string(), end: z.string(), isOpen: z.boolean() }),
  thursday: z.object({ start: z.string(), end: z.string(), isOpen: z.boolean() }),
  friday: z.object({ start: z.string(), end: z.string(), isOpen: z.boolean() }),
  saturday: z.object({ start: z.string(), end: z.string(), isOpen: z.boolean() }),
  sunday: z.object({ start: z.string(), end: z.string(), isOpen: z.boolean() }),
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;
type WorkingHoursFormData = z.infer<typeof workingHoursSchema>;

const ClinicSettings: React.FC = () => {
  const { user } = useAuth();
  const { refreshClinic, getUsageStats } = useClinic();
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch clinic settings
  const { data: clinic, isLoading, refetch } = useQuery(
    ['clinicSettings', user?.clinic_id],
    () => {
      if (!user) return null;
      return AdminService.getClinicSettings(user.clinic_id);
    },
    {
      enabled: !!user,
    }
  );


  // Fetch usage statistics
  const usageStats = getUsageStats();

  // Form for general settings
  const generalForm = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      registration_number: '',
    },
  });

  // Form for working hours
  const hoursForm = useForm<WorkingHoursFormData>({
    resolver: zodResolver(workingHoursSchema),
    defaultValues: {
      monday: { start: '09:00', end: '17:00', isOpen: true },
      tuesday: { start: '09:00', end: '17:00', isOpen: true },
      wednesday: { start: '09:00', end: '17:00', isOpen: true },
      thursday: { start: '09:00', end: '17:00', isOpen: true },
      friday: { start: '09:00', end: '17:00', isOpen: true },
      saturday: { start: '10:00', end: '14:00', isOpen: true },
      sunday: { start: '09:00', end: '13:00', isOpen: false },
    },
  });

  // Update form when clinic data loads
  useEffect(() => {
    if (clinic) {
      generalForm.reset({
        name: clinic.name || '',
        address: clinic.address || '',
        phone: clinic.phone || '',
        email: clinic.email || '',
        registration_number: clinic.registration_number || '',
      });

      if (clinic.settings?.working_hours) {
        hoursForm.reset(clinic.settings.working_hours);
      }
    }
  }, [clinic, generalForm, hoursForm]);

  // Update clinic mutation
  const updateMutation = useMutation(
    (data:Partial<ClinicSettingsnew>) => AdminService.updateClinic(user?.clinic_id || 0, data),
    {
      onSuccess: () => {
        toast.success('Clinic settings updated successfully');
        refetch();
        refreshClinic();
        setIsEditing(false);
      },
      onError: (error: DatabaseError) => {
        toast.error(error?.message || 'Failed to update settings');
      },
    }
  );

  // Handle general settings submit
  const onGeneralSubmit = (data: Partial<ClinicSettingsnew>) => {
    updateMutation.mutate(data);
  };

  // Handle working hours submit
  const onHoursSubmit = (data: WorkingHoursFormData) => {
    updateMutation.mutate({
      settings: {
        working_hours: data,
        appointment_duration: 30,
      }
    });
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your clinic information and preferences
          </p>
        </div>
        {!isEditing && activeTab === 'general' && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Edit Settings
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Patients</p>
              <p className="text-xl font-bold">{usageStats.totalPatients}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Doctors</p>
              <p className="text-xl font-bold">{usageStats.totalDoctors}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Appointments (Month)</p>
              <p className="text-xl font-bold">{usageStats.appointmentsThisMonth}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Revenue (Month)</p>
              <p className="text-xl font-bold">₹{usageStats.revenueThisMonth?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'general', name: 'General', icon: BuildingOfficeIcon },
              { id: 'working-hours', name: 'Working Hours', icon: ClockIcon },
              { id: 'notifications', name: 'Notifications', icon: BellIcon },
              { id: 'branding', name: 'Branding', icon: PaintBrushIcon },
              { id: 'users', name: 'Users', icon: UsersIcon },
              { id: 'subscription', name: 'Subscription', icon: CreditCardIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...generalForm.register('name')}
                      disabled={!isEditing}
                      type="text"
                      className={`w-full pl-10 pr-3 py-2 border rounded-md ${generalForm.formState.errors.name ? 'border-red-300' : 'border-gray-300'
                        } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                  {generalForm.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {generalForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...generalForm.register('phone')}
                      disabled={!isEditing}
                      type="tel"
                      className={`w-full pl-10 pr-3 py-2 border rounded-md ${generalForm.formState.errors.phone ? 'border-red-300' : 'border-gray-300'
                        } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...generalForm.register('email')}
                      disabled={!isEditing}
                      type="email"
                      className={`w-full pl-10 pr-3 py-2 border rounded-md ${generalForm.formState.errors.email ? 'border-red-300' : 'border-gray-300'
                        } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <IdentificationIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...generalForm.register('registration_number')}
                      disabled={!isEditing}
                      type="text"
                      className={`w-full pl-10 pr-3 py-2 border rounded-md border-gray-300 ${!isEditing ? 'bg-gray-50' : ''
                        }`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  {...generalForm.register('address')}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full border rounded-md p-2 ${generalForm.formState.errors.address ? 'border-red-300' : 'border-gray-300'
                    } ${!isEditing ? 'bg-gray-50' : ''}`}
                />
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      generalForm.reset();
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isLoading}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Working Hours Tab */}
          {activeTab === 'working-hours' && (
            <form onSubmit={hoursForm.handleSubmit(onHoursSubmit)} className="space-y-4">
              {Object.entries({
                monday: 'Monday',
                tuesday: 'Tuesday',
                wednesday: 'Wednesday',
                thursday: 'Thursday',
                friday: 'Friday',
                saturday: 'Saturday',
                sunday: 'Sunday',
              }).map(([key, label]) => {
                const day = key as keyof WorkingHoursFormData;
                return (
                  <div key={key} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-24 font-medium">{label}</div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        {...hoursForm.register(`${day}.isOpen`)}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <span className="ml-2 text-sm">Open</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        {...hoursForm.register(`${day}.start`)}
                        className="border rounded-md p-1 text-sm"
                        disabled={!hoursForm.watch(`${day}.isOpen`)}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        {...hoursForm.register(`${day}.end`)}
                        className="border rounded-md p-1 text-sm"
                        disabled={!hoursForm.watch(`${day}.isOpen`)}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={updateMutation.isLoading}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Save Working Hours
                </button>
              </div>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">SMS Notifications</h3>
                  <p className="text-sm text-gray-500">Send SMS for appointments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">WhatsApp Notifications</h3>
                  <p className="text-sm text-gray-500">Send updates via WhatsApp</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex justify-end pt-4">
                <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinic Logo
                </label>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    {clinic?.settings?.branding?.logo_url ? (
                      <img
                        src={clinic.settings.branding.logo_url}
                        alt="Clinic Logo"
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <BuildingOfficeIcon className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <button className="px-4 py-2 border rounded-md hover:bg-gray-50">
                    Upload New Logo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    defaultValue={clinic?.settings?.branding?.primary_color || '#0284c7'}
                    className="h-10 w-20"
                  />
                  <input
                    type="text"
                    defaultValue={clinic?.settings?.branding?.primary_color || '#0284c7'}
                    className="border rounded-md p-2 flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    defaultValue={clinic?.settings?.branding?.secondary_color || '#0369a1'}
                    className="h-10 w-20"
                  />
                  <input
                    type="text"
                    defaultValue={clinic?.settings?.branding?.secondary_color || '#0369a1'}
                    className="border rounded-md p-2 flex-1"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                  Save Branding
                </button>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">User Management</h3>
                <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                  + Invite User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Sample user rows */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">Dr. John Smith</td>
                      <td className="px-6 py-4 whitespace-nowrap">john.smith@clinic.com</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Doctor
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-primary-600 hover:text-primary-900 mr-2">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Disable</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-medium mb-2">Current Plan</h3>
                <p className="text-3xl font-bold capitalize mb-4">
                  {clinic?.subscription_tier || 'Basic'} Plan
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-primary-100">Doctors</p>
                    <p className="text-xl font-semibold">{usageStats.totalDoctors} / {clinic?.max_doctors || 5}</p>
                  </div>
                  <div>
                    <p className="text-primary-100">Patients</p>
                    <p className="text-xl font-semibold">{usageStats.totalPatients} / {clinic?.max_patients || 500}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Basic',
                    price: '₹2,999',
                    features: ['5 Doctors', '500 Patients', 'Basic Analytics', 'Email Support'],
                    current: clinic?.subscription_tier === 'basic',
                  },
                  {
                    name: 'Professional',
                    price: '₹6,999',
                    features: ['20 Doctors', '2000 Patients', 'Advanced Analytics', 'Priority Support', 'API Access'],
                    current: clinic?.subscription_tier === 'professional',
                  },
                  {
                    name: 'Enterprise',
                    price: 'Custom',
                    features: ['Unlimited Doctors', 'Unlimited Patients', 'Custom Analytics', '24/7 Support', 'Dedicated Manager'],
                    current: clinic?.subscription_tier === 'enterprise',
                  },
                ].map((plan) => (
                  <div
                    key={plan.name}
                    className={`border rounded-lg p-6 ${plan.current ? 'border-primary-500 ring-2 ring-primary-200' : ''
                      }`}
                  >
                    <h4 className="text-lg font-bold mb-2">{plan.name}</h4>
                    <p className="text-2xl font-bold text-primary-600 mb-4">{plan.price}</p>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="text-sm text-gray-600 flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`w-full py-2 rounded-md ${plan.current
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      disabled={plan.current}
                    >
                      {plan.current ? 'Current Plan' : 'Upgrade'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Billing History</h4>
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Invoice</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-sm">
                      <td className="py-2">Mar 1, 2024</td>
                      <td className="py-2">INV-2024-001</td>
                      <td className="py-2">₹2,999</td>
                      <td className="py-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Paid</span>
                      </td>
                      <td className="py-2">
                        <button className="text-primary-600 hover:text-primary-800">Download</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicSettings;