import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FrontBenchStore } from '../../services/local/frontbench.store';
import type { Invoice, InvoiceLine, PaymentMode, Refund, ServiceCatalogItem } from '../../types/frontbench.types';

export const useFrontBenchBilling = (clinicId: number) => {
  const [version, setVersion] = useState(0);

  const services = useMemo(() => {
    void version;
    return FrontBenchStore.getServiceCatalog().filter((s) => s.isActive);
  }, [version]);

  const invoices = useMemo(() => {
    void version;
    return FrontBenchStore.getInvoices().filter((i) => i.clinicId === clinicId);
  }, [clinicId, version]);

  const createInvoice = useCallback(
    (data: Omit<Invoice, 'id' | 'clinicId' | 'invoiceNo' | 'createdAt' | 'updatedAt'>) => {
      const created = FrontBenchStore.createInvoice(clinicId, data);
      setVersion((v) => v + 1);
      toast.success(`Invoice created (${created.invoiceNo})`);
      return created;
    },
    [clinicId]
  );

  const addPayment = useCallback((invoiceId: string, payment: { mode: PaymentMode; amount: number; reference?: string; receivedBy?: string }) => {
    const updated = FrontBenchStore.addPayment(invoiceId, {
      invoiceId,
      mode: payment.mode,
      amount: payment.amount,
      reference: payment.reference,
      receivedAt: new Date().toISOString(),
      receivedBy: payment.receivedBy,
    });
    if (!updated) throw new Error('Invoice not found');
    setVersion((v) => v + 1);
    toast.success('Payment recorded');
    return updated;
  }, []);

  const addRefund = useCallback((invoiceId: string, refund: Omit<Refund, 'id' | 'refundedAt'>) => {
    const updated = FrontBenchStore.addRefund(invoiceId, { ...refund, refundedAt: new Date().toISOString() });
    if (!updated) throw new Error('Invoice not found');
    setVersion((v) => v + 1);
    toast.success('Refund recorded');
    return updated;
  }, []);

  const upsertInvoice = useCallback((invoice: Invoice) => {
    FrontBenchStore.upsertInvoice(invoice);
    setVersion((v) => v + 1);
  }, []);

  const totals = useCallback((invoice: Pick<Invoice, 'lines' | 'payments' | 'refunds'>) => FrontBenchStore.calcInvoiceTotals(invoice), []);

  const serviceById = useCallback((id: string): ServiceCatalogItem | undefined => FrontBenchStore.getServiceCatalog().find((s) => s.id === id), []);

  const buildLineFromService = useCallback((service: ServiceCatalogItem): InvoiceLine => {
    return {
      id: `line_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      serviceId: service.id,
      description: service.name,
      qty: 1,
      unitPrice: service.price,
      gstRate: service.gstRate,
      discount: { type: 'flat', value: 0 },
      tags: [],
    };
  }, []);

  const dailyCashReport = useCallback((dayIso: string) => {
    const report = FrontBenchStore.generateDailyCashReport(clinicId, dayIso);
    setVersion((v) => v + 1);
    return report;
  }, [clinicId]);

  return {
    services,
    invoices,
    createInvoice,
    addPayment,
    addRefund,
    upsertInvoice,
    totals,
    serviceById,
    buildLineFromService,
    dailyCashReport,
    refresh: () => setVersion((v) => v + 1),
  };
};

