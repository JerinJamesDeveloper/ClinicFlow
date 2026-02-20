// src/providers/AuthProvider.tsx
import React, { useState, type ReactNode, useCallback, useMemo, useEffect } from 'react';
import { AuthService } from '../services/api/auth.service';
import type { User } from '../types/api.types';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import type { BaseErrorResponse, ValidationErrorResponse, AuthError } from '../types/error.types';
import { mockLogin } from '../services/mock/auth.mock';


interface AuthProviderProps {
  children: ReactNode;
}

// Type guard functions
const isAuthError = (error: unknown): error is AuthError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as BaseErrorResponse).code === 'string' &&
    ['INVALID_CREDENTIALS', 'UNAUTHORIZED', 'TOKEN_EXPIRED'].includes((error as BaseErrorResponse).code)
  );
};

const isValidationError = (error: unknown): error is ValidationErrorResponse => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as BaseErrorResponse).code === 'VALIDATION_ERROR'
  );
};

const getErrorMessage = (error: unknown): string => {
  // Handle case where error is not an object
  if (typeof error !== 'object' || error === null) {
    return 'An unexpected error occurred';
  }

  const err = error as Record<string, unknown>;

  if (isValidationError(err)) {
    return err.detail?.[0]?.msg || 'Validation failed';
  }
  
  if (isAuthError(err)) {
    switch (err.code) {
      case 'INVALID_CREDENTIALS':
        return 'Invalid email or password';
      case 'UNAUTHORIZED':
        return 'Please login to continue';
      case 'TOKEN_EXPIRED':
        return 'Your session has expired. Please login again';
      default:
        return err.message || 'Authentication failed';
    }
  }
  
  if (err?.code === 'TENANT_VIOLATION') {
    return 'Access denied: Cross-tenant access attempt detected';
  }
  
  if (err?.code === 'RESOURCE_NOT_FOUND') {
    return 'The requested resource was not found';
  }
  
  if (err?.code === 'RATE_LIMIT_EXCEEDED') {
    return 'Too many requests. Please try again later';
  }
  
  if (err?.code === 'CLINIC_LIMIT_EXCEEDED') {
    return 'Clinic limit exceeded. Please upgrade your plan';
  }
  
  if (err?.code === 'SUBSCRIPTION_EXPIRED') {
    return 'Your subscription has expired. Please renew';
  }
  if (err?.code === 'PAYMENT_REQUIRED') 
  return err?.code || err?.message || 'An unexpected error occurred';
  return 'An unexpected error occurred';
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize user from localStorage with lazy initializer
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('clinic_id');
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Optional: Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('access_token');
      if (!token || !user) return;
      // Token validation logic here if needed
    };

    validateToken();
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // const response = await AuthService.login({ email, password });

      const response =  mockLogin(email, password);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      toast.success('Login successful');
    } catch (error: unknown) {  // Use 'unknown' type
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      
      // Handle specific error cases using type guards
      if (isAuthError(error)) {
        // Clear any stale data for auth errors
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('clinic_id');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('clinic_id');
      toast.success('Logged out successfully');
    } catch (error: unknown) {  // Use 'unknown' type
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasRole = useCallback((roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const refreshUser = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    hasRole,
    refreshUser,
  }), [user, isLoading, login, logout, hasRole, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};