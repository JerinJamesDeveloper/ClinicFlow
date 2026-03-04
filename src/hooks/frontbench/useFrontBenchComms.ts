import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FrontBenchStore } from '../../services/local/frontbench.store';
import type { Complaint, MessageLog, MessageTemplate, SatisfactionRating } from '../../types/frontbench.types';

const fillVars = (body: string, vars: Record<string, string>) => {
  let out = body;
  for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{{${k}}}`, v);
  return out;
};

export const useFrontBenchComms = (clinicId: number) => {
  const [version, setVersion] = useState(0);

  const templates = useMemo(() => {
    void version;
    return FrontBenchStore.getMessageTemplates().filter((t) => t.isActive);
  }, [version]);

  const logs = useMemo(() => {
    void version;
    return FrontBenchStore.getMessageLogs().filter((l) => l.clinicId === clinicId);
  }, [clinicId, version]);

  const complaints = useMemo(() => {
    void version;
    return FrontBenchStore.getComplaints().filter((c) => c.clinicId === clinicId);
  }, [clinicId, version]);

  const ratings = useMemo(() => {
    void version;
    return FrontBenchStore.getRatings().filter((r) => r.clinicId === clinicId);
  }, [clinicId, version]);

  const send = useCallback(
    (data: { to: string; channel: 'sms' | 'whatsapp'; body: string; patientMrn?: string; templateId?: string }) => {
      const created = FrontBenchStore.queueMessage({
        clinicId,
        channel: data.channel,
        to: data.to,
        patientMrn: data.patientMrn,
        templateId: data.templateId,
        body: data.body,
      });
      setVersion((v) => v + 1);
      toast.success(`${data.channel.toUpperCase()} queued`);

      // dev placeholder: mark as sent immediately
      setTimeout(() => {
        FrontBenchStore.markMessageSent(created.id);
        setVersion((v) => v + 1);
      }, 500);

      return created;
    },
    [clinicId]
  );

  const sendTemplate = useCallback(
    (tpl: MessageTemplate, data: { to: string; vars: Record<string, string>; patientMrn?: string }) => {
      const body = fillVars(tpl.body, data.vars);
      return send({ to: data.to, channel: tpl.channel, body, patientMrn: data.patientMrn, templateId: tpl.id });
    },
    [send]
  );

  const createComplaint = useCallback((c: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created: Complaint = {
      ...c,
      id: `cmp_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = FrontBenchStore.getComplaints();
    FrontBenchStore.saveComplaints([created, ...all]);
    setVersion((v) => v + 1);
    toast.success('Complaint logged');
    return created;
  }, []);

  const updateComplaint = useCallback((id: string, patch: Partial<Complaint>) => {
    const all = FrontBenchStore.getComplaints();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated: Complaint = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
    const copy = [...all];
    copy[idx] = updated;
    FrontBenchStore.saveComplaints(copy);
    setVersion((v) => v + 1);
    toast.success('Complaint updated');
    return updated;
  }, []);

  const addRating = useCallback((r: Omit<SatisfactionRating, 'id' | 'createdAt'>) => {
    const created: SatisfactionRating = {
      ...r,
      id: `rate_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    FrontBenchStore.saveRatings([created, ...FrontBenchStore.getRatings()]);
    setVersion((v) => v + 1);
    toast.success('Rating saved');
    return created;
  }, []);

  return {
    templates,
    logs,
    complaints,
    ratings,
    send,
    sendTemplate,
    createComplaint,
    updateComplaint,
    addRating,
    refresh: () => setVersion((v) => v + 1),
  };
};

