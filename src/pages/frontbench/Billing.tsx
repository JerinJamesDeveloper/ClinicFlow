import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import { useFrontBenchPatients } from '../../hooks/frontbench/useFrontBenchPatients';
import { useFrontBenchBilling } from '../../hooks/frontbench/useFrontBenchBilling';
import type { Invoice, InvoiceLine, PaymentMode, ServiceCatalogItem } from '../../types/frontbench.types';

const round2 = (n: number) => Math.round(n * 100) / 100;

const Billing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;

  const patients = useFrontBenchPatients(clinicId);
  const billing = useFrontBenchBilling(clinicId);

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedMrn, setSelectedMrn] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [billingType, setBillingType] = useState<'self' | 'corporate_credit' | 'insurance'>('self');
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [serviceFilter, setServiceFilter] = useState('');
  const [draftLines, setDraftLines] = useState<InvoiceLine[]>([]);
  const [notes, setNotes] = useState('');

  const [payMode, setPayMode] = useState<PaymentMode>('upi');
  const [payAmount, setPayAmount] = useState(0);
  const [payRef, setPayRef] = useState('');

  const [refundMode, setRefundMode] = useState<PaymentMode>('cash');
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');

  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);

  const patientResults = useMemo(() => {
    const t = patientSearch.trim();
    if (!t) return [];
    return patients.search(t).slice(0, 8);
  }, [patientSearch, patients]);

  const filteredServices = useMemo(() => {
    const t = serviceFilter.trim().toLowerCase();
    if (!t) return billing.services;
    return billing.services.filter((s) => `${s.name} ${s.category}`.toLowerCase().includes(t));
  }, [billing.services, serviceFilter]);

  const draftTotals = useMemo(() => {
    const temp: Invoice = {
      id: 'tmp',
      clinicId,
      invoiceNo: 'TMP',
      patientMrn: selectedMrn,
      patientNameSnapshot: selectedName,
      issuedAt: new Date().toISOString(),
      status: 'draft',
      lines: draftLines,
      payments: [],
      refunds: [],
      billingType,
      createdAt: '',
      updatedAt: '',
    };
    return billing.totals(temp);
  }, [billing, billingType, clinicId, draftLines, selectedMrn, selectedName]);

  const activeInvoice = useMemo(() => billing.invoices.find((i) => i.id === activeInvoiceId) ?? null, [activeInvoiceId, billing.invoices]);

  const resetDraft = () => {
    setDraftLines([]);
    setNotes('');
    setDiscountValue(0);
    setDiscountType('flat');
  };

  const addServiceLine = (svc: ServiceCatalogItem) => {
    const line = billing.buildLineFromService(svc);
    setDraftLines((l) => [line, ...l]);
  };

  const applyHeaderDiscount = () => {
    if (draftLines.length === 0) return;
    const next = draftLines.map((l) => ({ ...l, discount: { type: discountType, value: discountValue } }));
    setDraftLines(next);
    toast.success('Discount applied to all lines');
  };

  const updateLine = (id: string, patch: Partial<InvoiceLine>) => {
    setDraftLines((lines) => lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLine = (id: string) => setDraftLines((lines) => lines.filter((l) => l.id !== id));

  const createInvoice = () => {
    if (!selectedMrn) return toast.error('Select patient (MRN)');
    const p = patients.getByMrn(selectedMrn);
    if (!p) return toast.error('Patient not found in Front Bench CRM');
    if (draftLines.length === 0) return toast.error('Add at least one service');

    const inv = billing.createInvoice({
      patientMrn: selectedMrn,
      patientNameSnapshot: p.name,
      issuedAt: new Date().toISOString(),
      status: 'issued',
      lines: draftLines,
      payments: [],
      refunds: [],
      notes: notes || undefined,
      billingType,
    });
    setActiveInvoiceId(inv.id);
    resetDraft();
  };

  const recordPayment = () => {
    if (!activeInvoice) return;
    if (payAmount <= 0) return toast.error('Payment amount must be > 0');
    billing.addPayment(activeInvoice.id, { mode: payMode, amount: round2(payAmount), reference: payRef || undefined, receivedBy: user?.name });
    setPayAmount(0);
    setPayRef('');
  };

  const recordRefund = () => {
    if (!activeInvoice) return;
    if (refundAmount <= 0) return toast.error('Refund amount must be > 0');
    billing.addRefund(activeInvoice.id, {
      invoiceId: activeInvoice.id,
      amount: round2(refundAmount),
      mode: refundMode,
      reference: undefined,
      reason: refundReason || undefined,
    });
    setRefundAmount(0);
    setRefundReason('');
  };

  const invoiceColumns = useMemo(
    () => [
      { key: 'invoiceNo', header: 'Invoice' },
      { key: 'patientMrn', header: 'MRN' },
      { key: 'patientNameSnapshot', header: 'Patient' },
      { key: 'status', header: 'Status' },
      {
        key: 'actions',
        header: 'Actions',
        render: (_: unknown, row: Invoice) => (
          <div className="flex gap-3">
            <button onClick={() => setActiveInvoiceId(row.id)} className="text-primary-700 hover:text-primary-900">
              Open
            </button>
            <button onClick={() => navigate(`/front-bench/billing/receipt/${row.id}`)} className="text-gray-700 hover:text-gray-900">
              Receipt
            </button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-sm text-gray-500">Service catalog, GST support, discounts, split payments, refunds, receipts, daily cash + closing reports.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const report = billing.dailyCashReport(today);
              toast.success(`Daily cash report generated for ${report.dayIso}`);
            }}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            Daily Cash Report
          </button>
          <button
            onClick={() => navigate('/front-bench/reports')}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
          >
            Daily Closing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Select Patient</h2>
            <SearchBar onSearch={setPatientSearch} debounceMs={150} placeholder="Search patient (name/phone/MRN/Aadhaar)..." />
            {patientResults.length > 0 && (
              <div className="mt-2 border rounded-lg divide-y max-h-56 overflow-auto">
                {patientResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedMrn(p.mrn);
                      setSelectedName(p.name);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-600">{p.mrn} • {p.phone}</div>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3">
              <label className="block text-xs text-gray-600 mb-1">Selected MRN</label>
              <input value={selectedMrn} onChange={(e) => setSelectedMrn(e.target.value)} className="w-full border rounded-md p-2" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Billing Type</label>
                <select value={billingType} onChange={(e) => setBillingType(e.target.value as any)} className="w-full border rounded-md p-2">
                  <option value="self">Self Pay</option>
                  <option value="corporate_credit">Corporate Credit</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-md p-2" placeholder="optional" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Service Catalog</h2>
            <SearchBar onSearch={setServiceFilter} debounceMs={150} placeholder="Filter services..." className="mb-2" />
            <div className="space-y-2 max-h-80 overflow-auto">
              {filteredServices.map((s) => (
                <button key={s.id} onClick={() => addServiceLine(s)} className="w-full border rounded-lg p-3 text-left hover:bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-600">
                    {s.category} • ₹{s.price} • GST {s.gstRate}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Draft Bill</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="border rounded-md p-2">
                  <option value="flat">Flat</option>
                  <option value="percent">Percent</option>
                </select>
                <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className="border rounded-md p-2 w-28" />
                <button onClick={applyHeaderDiscount} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
                  Apply Discount
                </button>
                <button onClick={createInvoice} className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black">
                  Generate Bill
                </button>
              </div>
            </div>

            {draftLines.length === 0 ? (
              <p className="text-sm text-gray-600">Add services from the catalog to build a bill.</p>
            ) : (
              <div className="space-y-2">
                {draftLines.map((l) => (
                  <div key={l.id} className="border rounded-lg p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{l.description}</div>
                        <div className="text-xs text-gray-600">GST {l.gstRate}%</div>
                      </div>
                      <button onClick={() => removeLine(l.id)} className="text-sm text-red-700 hover:text-red-900">
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Qty</label>
                        <input type="number" value={l.qty} onChange={(e) => updateLine(l.id, { qty: Number(e.target.value) })} className="w-full border rounded-md p-2" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                        <input
                          type="number"
                          value={l.unitPrice}
                          onChange={(e) => updateLine(l.id, { unitPrice: Number(e.target.value) })}
                          className="w-full border rounded-md p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Disc Type</label>
                        <select value={l.discount.type} onChange={(e) => updateLine(l.id, { discount: { ...l.discount, type: e.target.value as any } })} className="w-full border rounded-md p-2">
                          <option value="flat">Flat</option>
                          <option value="percent">Percent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Disc</label>
                        <input
                          type="number"
                          value={l.discount.value}
                          onChange={(e) => updateLine(l.id, { discount: { ...l.discount, value: Number(e.target.value) } })}
                          className="w-full border rounded-md p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Line Total</label>
                        <div className="p-2 text-sm font-medium">₹{round2(billing.totals({ lines: [l], payments: [], refunds: [] } as any).total)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 border-t pt-3 flex flex-wrap justify-end gap-6 text-sm">
              <div>Subtotal: <span className="font-semibold">₹{round2(draftTotals.subtotal)}</span></div>
              <div>GST: <span className="font-semibold">₹{round2(draftTotals.gst)}</span></div>
              <div>Total: <span className="font-semibold">₹{round2(draftTotals.total)}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
              {activeInvoice && (
                <div className="text-xs text-gray-600">
                  Open: <span className="font-medium">{activeInvoice.invoiceNo}</span> {activeInvoice.receiptNo ? `(Receipt ${activeInvoice.receiptNo})` : ''}
                </div>
              )}
            </div>
            <DataTable<Invoice> columns={invoiceColumns as any} data={billing.invoices.slice(0, 30)} loading={false} />
          </div>

          {activeInvoice && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Payments & Refunds</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Collect Payment (Split Supported)</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={payMode} onChange={(e) => setPayMode(e.target.value as any)} className="border rounded-md p-2 col-span-1">
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank</option>
                      <option value="insurance">Insurance</option>
                      <option value="credit">Credit</option>
                    </select>
                    <input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} className="border rounded-md p-2 col-span-1" placeholder="Amount" />
                    <input value={payRef} onChange={(e) => setPayRef(e.target.value)} className="border rounded-md p-2 col-span-1" placeholder="Ref (opt)" />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button onClick={recordPayment} className="px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                      Record
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Refund</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={refundMode} onChange={(e) => setRefundMode(e.target.value as any)} className="border rounded-md p-2 col-span-1">
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank</option>
                    </select>
                    <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(Number(e.target.value))} className="border rounded-md p-2 col-span-1" placeholder="Amount" />
                    <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="border rounded-md p-2 col-span-1" placeholder="Reason" />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button onClick={recordRefund} className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-black">
                      Refund
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t pt-3 text-sm">
                {(() => {
                  const t = billing.totals(activeInvoice);
                  return (
                    <div className="flex flex-wrap justify-end gap-6">
                      <div>Total: <span className="font-semibold">₹{round2(t.total)}</span></div>
                      <div>Paid: <span className="font-semibold">₹{round2(t.paid)}</span></div>
                      <div>Refunded: <span className="font-semibold">₹{round2(t.refunded)}</span></div>
                      <div>Balance: <span className="font-semibold">₹{round2(t.balance)}</span></div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;

