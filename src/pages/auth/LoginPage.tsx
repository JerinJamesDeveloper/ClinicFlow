// src/pages/auth/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, HeartIcon } from '@heroicons/react/24/outline';
import type { AuthError } from '../../types/error.types'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/';
function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error: unknown) {
  if (isAuthError(error)) {
    setLoginError(error.code || 'Invalid email or password');
  } else {
    setLoginError('Invalid email or password');
  }
}
 finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50">
        {/* Floating Shapes */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl animate-pulse-soft animation-delay-200" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-100/20 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iLjAyIj48cGF0aCBkPSJNMzAgMzBoMjB2MjBIMzB6TTAgMzBoMjB2MjBIMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="max-w-md text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-2xl shadow-primary-500/30 animate-float">
                <HeartIcon className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-primary-400 to-accent-400 opacity-30 blur-xl animate-pulse-soft" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gradient mb-4">
            ClinicFlow
          </h1>
          <p className="text-xl text-surface-600 mb-8">
            Modern Healthcare Management Platform
          </p>
          
          {/* Features */}
          <div className="space-y-4 text-left">
            {[
              'Streamlined patient management',
              'Real-time appointment scheduling',
              'Integrated pharmacy & lab workflows',
              'Comprehensive analytics dashboard'
            ].map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 text-surface-600 animate-slide-up"
                style={{ animationDelay: `${index * 100 + 300}ms` }}
              >
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
                <HeartIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient">ClinicFlow</h1>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 animate-scale-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-surface-900">Welcome back</h2>
              <p className="text-surface-500 mt-2">Sign in to access your dashboard</p>
            </div>

            {/* Error Alert */}
            {loginError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl animate-shake">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {loginError}
                </p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className={`input-field pl-11 ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`input-field pl-11 pr-11 ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-400 hover:text-surface-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    {...register('rememberMe')}
                    type="checkbox"
                    id="rememberMe"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-surface-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-surface-600">
                    Remember me
                  </label>
                </div>

                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            {/* Register Link */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-surface-500">
                    New to ClinicFlow?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/register-clinic"
                  className="btn-secondary w-full"
                >
                  Register your clinic
                </Link>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-surface-50 rounded-xl border border-surface-100">
              <p className="text-xs font-medium text-surface-600 mb-3">Demo Credentials:</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 bg-white rounded-lg">
                  <p className="font-medium text-surface-700">Admin</p>
                  <p className="text-surface-500">admin@clinic.com</p>
                </div>
                <div className="p-2 bg-white rounded-lg">
                  <p className="font-medium text-surface-700">Doctor</p>
                  <p className="text-surface-500">doctor@clinic.com</p>
                </div>
                <div className="p-2 bg-white rounded-lg">
                  <p className="font-medium text-surface-700">Front Desk</p>
                  <p className="text-surface-500">frontdesk@clinic.com</p>
                </div>
                {import.meta.env.DEV && (
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <p className="font-medium text-primary-700">Dev Admin</p>
                    <p className="text-primary-600">devadmin@clinic.com</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-surface-400 mt-2 text-center">Password: password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
