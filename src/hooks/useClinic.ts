// src/hooks/useClinic.ts
import { useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';

export const useClinic = () => {
  const context = useContext(ClinicContext);
  
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  
  return context;
};