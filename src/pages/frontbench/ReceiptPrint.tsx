import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFrontBenchBilling } from '../../hooks/frontbench/useFrontBenchBilling';

const round2 = (n: number) => Math.round(n * 100) / 100;

const ReceiptPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;
  const billing = useFrontBenchBilling(clinicId);

  const invoice = useMemo(() => billing.invoices.find((i) => i.id === id) ?? null, [billing.invoices, id]);

  if (!invoice) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Receipt not found.</p>
        <button onClick={() => navigate('/front-bench/billing')} className="mt-3 px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
          Back
        </button>
      </div>
    );
  }

  const totals = billing.totals(invoice);

  return (
    <div className="p-6">
      <div className="flex justify-between gap-3 mb-4 print:hidden">
        <button onClick={() => navigate('/front-bench/billing')} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
          Back
        </button>
        <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black">
          Print
        </button>
      </div>

      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">ClinicFlow</h1>
          <p className="text-sm text-gray-600">Receipt</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-600">Invoice</div>
            <div className="font-semibold">{invoice.invoiceNo}</div>
          </div>
          <div>
            <div className="text-gray-600">Receipt</div>
            <div className="font-semibold">{invoice.receiptNo ?? '-'}</div>
          </div>
          <div>
            <div className="text-gray-600">Patient</div>
            <div className="font-semibold">{invoice.patientNameSnapshot}</div>
            <div className="text-xs text-gray-600">{invoice.patientMrn}</div>
          </div>
          <div>
            <div className="text-gray-600">Issued</div>
            <div className="font-semibold">{new Date(invoice.issuedAt).toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-4 border-t pt-3">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr>
                <th className="py-1">Item</th>
                <th className="py-1">Qty</th>
                <th className="py-1">GST</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((l) => {
                const t = billing.totals({ lines: [l], payments: [], refunds: [] } as any);
                return (
                  <tr key={l.id} className="border-t">
                    <td className="py-2">{l.description}</td>
                    <td className="py-2">{l.qty}</td>
                    <td className="py-2">{l.gstRate}%</td>
                    <td className="py-2 text-right">₹{round2(t.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 border-t pt-3 text-sm">
          <div className="flex justify-end gap-6">
            <div>Subtotal: <span className="font-semibold">₹{round2(totals.subtotal)}</span></div>
            <div>GST: <span className="font-semibold">₹{round2(totals.gst)}</span></div>
            <div>Total: <span className="font-semibold">₹{round2(totals.total)}</span></div>
          </div>
          <div className="mt-2 flex justify-end gap-6">
            <div>Paid: <span className="font-semibold">₹{round2(totals.paid)}</span></div>
            <div>Refunded: <span className="font-semibold">₹{round2(totals.refunded)}</span></div>
            <div>Balance: <span className="font-semibold">₹{round2(totals.balance)}</span></div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-600">
          Thanks for visiting. This is a development-mode receipt print.
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrint;

