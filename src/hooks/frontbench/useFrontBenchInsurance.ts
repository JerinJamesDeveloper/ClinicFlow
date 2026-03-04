import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FrontBenchStore } from '../../services/local/frontbench.store';
import type { Claim, InsuranceCompany, PolicyVerification, PreAuthRequest } from '../../types/frontbench.types';

export const useFrontBenchInsurance = (clinicId: number) => {
  const [version, setVersion] = useState(0);

  const insurers = useMemo(() => {
    void version;
    return FrontBenchStore.getInsurers().filter((i) => i.isActive);
  }, [version]);

  const verifications = useMemo(() => {
    void version;
    return FrontBenchStore.getPolicyVerifications().filter((v) => v.clinicId === clinicId);
  }, [clinicId, version]);

  const preauth = useMemo(() => {
    void version;
    return FrontBenchStore.getPreAuthRequests().filter((p) => p.clinicId === clinicId);
  }, [clinicId, version]);

  const claims = useMemo(() => {
    void version;
    return FrontBenchStore.getClaims().filter((c) => c.clinicId === clinicId);
  }, [clinicId, version]);

  const addInsurer = useCallback((name: string) => {
    const all = FrontBenchStore.getInsurers();
    const created: InsuranceCompany = { id: `ins_${Date.now()}`, name: name.trim(), isActive: true };
    FrontBenchStore.saveInsurers([created, ...all]);
    setVersion((v) => v + 1);
    toast.success('Insurer added');
    return created;
  }, []);

  const addVerification = useCallback((data: Omit<PolicyVerification, 'id' | 'createdAt'>) => {
    const created: PolicyVerification = { ...data, id: `pv_${Date.now()}`, createdAt: new Date().toISOString() };
    FrontBenchStore.savePolicyVerifications([created, ...FrontBenchStore.getPolicyVerifications()]);
    setVersion((v) => v + 1);
    toast.success('Verification created');
    return created;
  }, []);

  const updateVerification = useCallback((id: string, patch: Partial<PolicyVerification>) => {
    const all = FrontBenchStore.getPolicyVerifications();
    const idx = all.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    const updated: PolicyVerification = { ...all[idx], ...patch };
    const copy = [...all];
    copy[idx] = updated;
    FrontBenchStore.savePolicyVerifications(copy);
    setVersion((v) => v + 1);
    toast.success('Verification updated');
    return updated;
  }, []);

  const addPreAuth = useCallback((data: Omit<PreAuthRequest, 'id' | 'updatedAt'>) => {
    const created: PreAuthRequest = { ...data, id: `pa_${Date.now()}`, updatedAt: new Date().toISOString() };
    FrontBenchStore.savePreAuthRequests([created, ...FrontBenchStore.getPreAuthRequests()]);
    setVersion((v) => v + 1);
    toast.success('Pre-auth created');
    return created;
  }, []);

  const updatePreAuth = useCallback((id: string, patch: Partial<PreAuthRequest>) => {
    const all = FrontBenchStore.getPreAuthRequests();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated: PreAuthRequest = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
    const copy = [...all];
    copy[idx] = updated;
    FrontBenchStore.savePreAuthRequests(copy);
    setVersion((v) => v + 1);
    toast.success('Pre-auth updated');
    return updated;
  }, []);

  const addClaim = useCallback((data: Omit<Claim, 'id' | 'updatedAt'>) => {
    const created: Claim = { ...data, id: `cl_${Date.now()}`, updatedAt: new Date().toISOString() };
    FrontBenchStore.saveClaims([created, ...FrontBenchStore.getClaims()]);
    setVersion((v) => v + 1);
    toast.success('Claim created');
    return created;
  }, []);

  const updateClaim = useCallback((id: string, patch: Partial<Claim>) => {
    const all = FrontBenchStore.getClaims();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated: Claim = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
    const copy = [...all];
    copy[idx] = updated;
    FrontBenchStore.saveClaims(copy);
    setVersion((v) => v + 1);
    toast.success('Claim updated');
    return updated;
  }, []);

  const pendingApprovals = useMemo(() => preauth.filter((p) => p.status === 'submitted' || p.status === 'pending'), [preauth]);

  return {
    insurers,
    verifications,
    preauth,
    claims,
    pendingApprovals,
    addInsurer,
    addVerification,
    updateVerification,
    addPreAuth,
    updatePreAuth,
    addClaim,
    updateClaim,
    refresh: () => setVersion((v) => v + 1),
  };
};

