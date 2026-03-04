import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FrontBenchStore } from '../../services/local/frontbench.store';
import type { Department, DoctorCRM } from '../../types/frontbench.types';

export const useFrontBenchAdmin = () => {
  const [version, setVersion] = useState(0);

  const departments = useMemo(() => {
    void version;
    return FrontBenchStore.getDepartments().filter((d) => d.isActive);
  }, [version]);

  const doctors = useMemo(() => {
    void version;
    return FrontBenchStore.getDoctors().filter((d) => d.isActive);
  }, [version]);

  const addDepartment = useCallback((data: Omit<Department, 'id'>) => {
    const created: Department = { ...data, id: `dep_${Date.now()}_${Math.random().toString(16).slice(2)}` };
    const all = FrontBenchStore.getDepartments();
    FrontBenchStore.saveDepartments([created, ...all]);
    setVersion((v) => v + 1);
    toast.success('Department added');
    return created;
  }, []);

  const updateDepartment = useCallback((id: string, patch: Partial<Department>) => {
    const all = FrontBenchStore.getDepartments();
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    const updated: Department = { ...all[idx], ...patch };
    const copy = [...all];
    copy[idx] = updated;
    FrontBenchStore.saveDepartments(copy);
    setVersion((v) => v + 1);
    toast.success('Department updated');
    return updated;
  }, []);

  const updateDoctor = useCallback((id: string, patch: Partial<DoctorCRM>) => {
    const all = FrontBenchStore.getDoctors();
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    const updated: DoctorCRM = { ...all[idx], ...patch };
    const copy = [...all];
    copy[idx] = updated;
    FrontBenchStore.saveDoctors(copy);
    setVersion((v) => v + 1);
    toast.success('Doctor updated');
    return updated;
  }, []);

  return {
    departments,
    doctors,
    addDepartment,
    updateDepartment,
    updateDoctor,
    refresh: () => setVersion((v) => v + 1),
  };
};

