// src/hooks/useApi.ts
import { useState, useCallback } from 'react';
import { apiClient } from '../services/api/client';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

interface ApiHookResult<T, P = unknown> {
  execute: (params?: P) => Promise<T | null>;
  reset: () => void;
  state: ApiState<T>;
}

type ApiMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Generic API hook for making API calls with loading/error states
 * 
 * @example
 * const { execute, state } = useApi('get', '/patients', {
 *   successMessage: 'Patients loaded successfully',
 *   showSuccessToast: false,
 * });
 * 
 * useEffect(() => {
 *   execute();
 * }, []);
 */
export function useApi<T = unknown, P = unknown>(
  method: ApiMethod,
  url: string,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: AxiosError) => void;
  }
): ApiHookResult<T, P> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    status: 'idle',
  });

  const execute = useCallback(
    async (params?: P): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null, status: 'loading' }));

      try {
        let response: T;
        
        switch (method) {
          case 'get':
            response = await apiClient.get<T>(url, params);
            break;
          case 'post':
            response = await apiClient.post<T>(url, params);
            break;
          case 'put':
            response = await apiClient.put<T>(url, params);
            break;
          case 'patch':
            response = await apiClient.patch<T>(url, params);
            break;
          case 'delete':
            response = await apiClient.delete<T>(url);
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        setState({ data: response, loading: false, error: null, status: 'success' });

        if (options?.showSuccessToast !== false) {
          toast.success(options?.successMessage || 'Operation completed successfully');
        }

        options?.onSuccess?.(response);
        return response;
      } catch (error) {
        const axiosError = error as AxiosError;
        const errorMessage = axiosError.message || 'An error occurred';

        setState({
          data: null,
          loading: false,
          error: errorMessage,
          status: 'error',
        });

        if (options?.showErrorToast !== false) {
          toast.error(options?.errorMessage || errorMessage);
        }

        options?.onError?.(axiosError);
        return null;
      }
    },
    [method, url, options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null, status: 'idle' });
  }, []);

  return { execute, reset, state };
}

/**
 * Specialized hooks for common operations
 */

export function useGet<T = unknown>(url: string, options?: Parameters<typeof useApi>[2]) {
  return useApi<T>('get', url, options);
}

export function usePost<T = unknown, D = unknown>(url: string, options?: Parameters<typeof useApi>[2]) {
  return useApi<T, D>('post', url, options);
}

export function usePut<T = unknown, D = unknown>(url: string, options?: Parameters<typeof useApi>[2]) {
  return useApi<T, D>('put', url, options);
}

export function usePatch<T = unknown, D = unknown>(url: string, options?: Parameters<typeof useApi>[2]) {
  return useApi<T, D>('patch', url, options);
}

export function useDelete<T = unknown>(url: string, options?: Parameters<typeof useApi>[2]) {
  return useApi<T>('delete', url, options);
}

/**
 * Example usage in a component:
 * 
 * const { execute: fetchPatients, state: patientsState } = useGet('/patients');
 * const { execute: createPatient, state: createState } = usePost('/patients', {
 *   successMessage: 'Patient created successfully',
 * });
 * 
 * useEffect(() => {
 *   fetchPatients();
 * }, []);
 * 
 * const handleSubmit = async (data) => {
 *   await createPatient(data);
 *   fetchPatients(); // Refresh list
 * };
 */