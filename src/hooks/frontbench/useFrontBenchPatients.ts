import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FrontBenchStore } from '../../services/local/frontbench.store';
import type { PatientCRM } from '../../types/frontbench.types';

const normalize = (value: string) => value.trim().toLowerCase();

export const useFrontBenchPatients = (clinicId: number) => {
  const [version, setVersion] = useState(0);

  const patients = useMemo(() => {
    void version;
    return FrontBenchStore.getPatients().filter((p) => p.clinicId === clinicId);
  }, [clinicId, version]);

  const search = useCallback(
    (term: string) => {
      const t = normalize(term);
      if (!t) return patients;
      return patients.filter((p) => p.searchKey.includes(t));
    },
    [patients]
  );

  const findDuplicates = useCallback(
    (input: { phone?: string; aadhaar?: string; name?: string }) => {
      return FrontBenchStore.findDuplicates(input, patients);
    },
    [patients]
  );

  const createPatient = useCallback(
    (
      data: Omit<PatientCRM, 'id' | 'clinicId' | 'mrn' | 'createdAt' | 'updatedAt' | 'searchKey'>,
      opts?: { allowDuplicates?: boolean }
    ) => {
      const aadhaarResult = FrontBenchStore.validateAadhaar(data.aadhaar);
      if (!aadhaarResult.ok) {
        toast.error(aadhaarResult.reason ?? 'Invalid Aadhaar');
        throw new Error(aadhaarResult.reason ?? 'Invalid Aadhaar');
      }

      const insuranceResult = FrontBenchStore.validateInsurance(data.insurance);
      if (!insuranceResult.ok) {
        toast.error(insuranceResult.reason ?? 'Invalid insurance');
        throw new Error(insuranceResult.reason ?? 'Invalid insurance');
      }

      if (!opts?.allowDuplicates) {
        const dupes = FrontBenchStore.findDuplicates(
          { phone: data.phone, aadhaar: data.aadhaar, name: data.name },
          patients
        );
        if (dupes.length > 0) {
          toast.error('Possible duplicate patient detected');
          throw new Error('Possible duplicate patient detected');
        }
      }

      const created = FrontBenchStore.createPatient(clinicId, data);
      setVersion((v) => v + 1);
      toast.success(`Patient created (${created.mrn})`);
      return created;
    },
    [clinicId, patients]
  );

  const updatePatient = useCallback((id: number, patch: Partial<PatientCRM>) => {
    const aadhaarResult = FrontBenchStore.validateAadhaar(patch.aadhaar);
    if (!aadhaarResult.ok) {
      toast.error(aadhaarResult.reason ?? 'Invalid Aadhaar');
      throw new Error(aadhaarResult.reason ?? 'Invalid Aadhaar');
    }
    const insuranceResult = FrontBenchStore.validateInsurance(patch.insurance);
    if (!insuranceResult.ok) {
      toast.error(insuranceResult.reason ?? 'Invalid insurance');
      throw new Error(insuranceResult.reason ?? 'Invalid insurance');
    }

    const updated = FrontBenchStore.updatePatient(id, patch);
    if (!updated) throw new Error('Patient not found');
    setVersion((v) => v + 1);
    toast.success('Patient updated');
    return updated;
  }, []);

  const getByMrn = useCallback((mrn: string) => FrontBenchStore.getPatientByMrn(mrn), []);

  return {
    patients,
    search,
    createPatient,
    updatePatient,
    findDuplicates,
    getByMrn,
    refresh: () => setVersion((v) => v + 1),
  };
};
