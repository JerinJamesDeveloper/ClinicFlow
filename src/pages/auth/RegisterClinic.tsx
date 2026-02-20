// src/pages/auth/RegisterClinic.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthService } from '../../services/api/auth.service';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
const registerSchema = z.object({
  // Clinic Information
  clinic_name: z.string().min(2, 'Clinic name is required'),
  clinic_address: z.string().min(5, 'Address is required'),
  clinic_phone: z.string().min(10, 'Valid phone number required'),
  clinic_email: z.string().email('Invalid email address'),
  
  // Admin Information
  admin_name: z.string().min(2, 'Admin name is required'),
  admin_email: z.string().email('Invalid email address'),
  admin_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Please confirm your password'),
  
  // Terms
  agree_terms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine((data) => data.admin_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterClinic: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      clinic_name: '',
      clinic_address: '',
      clinic_phone: '',
      clinic_email: '',
      admin_name: '',
      admin_email: '',
      admin_password: '',
      confirm_password: '',
      agree_terms: false,
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['clinic_name', 'clinic_address', 'clinic_phone', 'clinic_email'];
    } else if (step === 2) {
      fieldsToValidate = ['admin_name', 'admin_email', 'admin_password', 'confirm_password'];
    }

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setRegistrationError(null);

    try {
      await AuthService.registerClinic({
        clinic_name: data.clinic_name,
        clinic_address: data.clinic_address,
        admin_name: data.admin_name,
        admin_email: data.admin_email,
        admin_password: data.admin_password,
      });
      
      setRegistrationSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: unknown) {
      setRegistrationError((error as Error)?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 text-center">
            <div className="flex justify-center">
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Registration Successful!</h2>
            <p className="mt-2 text-gray-600">
              Your clinic has been registered. You will be redirected to the login page.
            </p>
            <div className="mt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-3xl font-bold text-white">CF</span>
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Register Your Clinic
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join thousands of healthcare providers using ClinicFlow
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex-1 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className="text-center">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  1
                </div>
                <p className="mt-2 text-sm font-medium">Clinic Details</p>
              </div>
            </div>
            <div className={`flex-1 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className="text-center">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  2
                </div>
                <p className="mt-2 text-sm font-medium">Admin Account</p>
              </div>
            </div>
            <div className={`flex-1 ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className="text-center">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                  step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200'
                }`}>
                  3
                </div>
                <p className="mt-2 text-sm font-medium">Confirmation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {registrationError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            <p className="text-sm">{registrationError}</p>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-white shadow-xl rounded-lg px-6 py-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Clinic Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Clinic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Name *
                  </label>
                  <input
                    {...register('clinic_name')}
                    type="text"
                    className={`w-full border rounded-md p-2 ${
                      errors.clinic_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., City Medical Center"
                  />
                  {errors.clinic_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.clinic_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Address *
                  </label>
                  <textarea
                    {...register('clinic_address')}
                    rows={3}
                    className={`w-full border rounded-md p-2 ${
                      errors.clinic_address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Full address with street, city, state, pincode"
                  />
                  {errors.clinic_address && (
                    <p className="mt-1 text-sm text-red-600">{errors.clinic_address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Phone *
                  </label>
                  <input
                    {...register('clinic_phone')}
                    type="tel"
                    className={`w-full border rounded-md p-2 ${
                      errors.clinic_phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+91 98765 43210"
                  />
                  {errors.clinic_phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.clinic_phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Email *
                  </label>
                  <input
                    {...register('clinic_email')}
                    type="email"
                    className={`w-full border rounded-md p-2 ${
                      errors.clinic_email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="contact@clinic.com"
                  />
                  {errors.clinic_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.clinic_email.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Admin Account */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Admin Account Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Name *
                  </label>
                  <input
                    {...register('admin_name')}
                    type="text"
                    className={`w-full border rounded-md p-2 ${
                      errors.admin_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Dr. John Smith"
                  />
                  {errors.admin_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.admin_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email *
                  </label>
                  <input
                    {...register('admin_email')}
                    type="email"
                    className={`w-full border rounded-md p-2 ${
                      errors.admin_email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="admin@clinic.com"
                  />
                  {errors.admin_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.admin_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    {...register('admin_password')}
                    type="password"
                    className={`w-full border rounded-md p-2 ${
                      errors.admin_password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.admin_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.admin_password.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 8 characters with at least one number and one letter
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    {...register('confirm_password')}
                    type="password"
                    className={`w-full border rounded-md p-2 ${
                      errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Review & Confirm</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium">Clinic Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{watch('clinic_name')}</span>
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium">{watch('clinic_address')}</span>
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{watch('clinic_phone')}</span>
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{watch('clinic_email')}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium">Admin Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{watch('admin_name')}</span>
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{watch('admin_email')}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-start">
                    <input
                      {...register('agree_terms')}
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-primary-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-600">
                      I agree to the{' '}
                      <a href="/terms" className="text-primary-600 hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-primary-600 hover:underline">
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                  {errors.agree_terms && (
                    <p className="mt-1 text-sm text-red-600">{errors.agree_terms.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-6 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="ml-auto px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registering...
                    </div>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-primary-600 font-bold text-lg">14-Day Free Trial</div>
            <p className="text-sm text-gray-600">No credit card required</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-primary-600 font-bold text-lg">24/7 Support</div>
            <p className="text-sm text-gray-600">We're here to help</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-primary-600 font-bold text-lg">Cancel Anytime</div>
            <p className="text-sm text-gray-600">No hidden fees</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterClinic;