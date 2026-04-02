"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PortalData {
  invoice: {
    id: number;
    invoiceNumber: string;
    status: string;
    issueDate: string;
    dueDate: string;
    currency: string | null;
    subtotal: number;
    discountAmount: number | null;
    discountLabel: string | null;
    taxRate: number | null;
    taxAmount: number | null;
    total: number;
    amountPaid: number | null;
    notes: string | null;
    paymentTerms: string | null;
    clientName: string | null;
    clientParentName: string | null;
    clientEmail: string | null;
    clientAddress: string | null;
  };
  lineItems: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    unitLabel: string | null;
    amount: number;
  }>;
  business: {
    businessName: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoPath: string | null;
    bankName: string | null;
    bankAccount: string | null;
    bankHolder: string | null;
    paynowNumber: string | null;
  } | null;
}

function formatCurrency(amount: number, currency: string = "SGD") {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-SG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PortalInvoicePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/portal/invoice/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Invoice not found");
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Invoice Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            This invoice link may have expired or been revoked.
          </p>
        </div>
      </div>
    );
  }

  const { invoice, lineItems, business } = data;
  const cur = invoice.currency || "SGD";
  const balanceDue = invoice.total - (invoice.amountPaid ?? 0);
  const isPaid = invoice.status === "paid";
  const isPartiallyPaid = (invoice.amountPaid ?? 0) > 0 && !isPaid;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {business?.businessName || "Invoice"}
            </h1>
            {business?.address && (
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                {business.address}
              </p>
            )}
            {business?.email && (
              <p className="text-sm text-muted-foreground">{business.email}</p>
            )}
            {business?.phone && (
              <p className="text-sm text-muted-foreground">{business.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {invoice.invoiceNumber}
            </p>
            <span
              className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${
                isPaid
                  ? "bg-success/10 text-success"
                  : invoice.status === "overdue"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
              }`}
            >
              {isPaid ? "Paid" : isPartiallyPaid ? "Partially Paid" : invoice.status}
            </span>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-border bg-card p-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bill To
            </h3>
            <p className="mt-1 font-medium">{invoice.clientName}</p>
            {invoice.clientParentName && (
              <p className="text-sm text-muted-foreground">
                c/o {invoice.clientParentName}
              </p>
            )}
            {invoice.clientAddress && (
              <p className="text-sm text-muted-foreground">
                {invoice.clientAddress}
              </p>
            )}
          </div>
          <div className="space-y-2 sm:text-right">
            <div>
              <p className="text-xs text-muted-foreground">Issue Date</p>
              <p className="text-sm font-medium">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="text-sm font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Terms</p>
              <p className="text-sm font-medium">
                {invoice.paymentTerms || "Due upon receipt"}
              </p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-20">
                  Qty
                </th>
                <th className="hidden sm:table-cell px-4 py-3 text-right font-medium text-muted-foreground w-28">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lineItems.map((li) => (
                <tr key={li.id}>
                  <td className="px-4 py-3">{li.description}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {li.quantity}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-right tabular-nums">
                    {formatCurrency(li.unitPrice, cur)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatCurrency(li.amount, cur)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="space-y-2 max-w-sm ml-auto text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(invoice.subtotal, cur)}
              </span>
            </div>
            {(invoice.discountAmount ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Discount{invoice.discountLabel ? ` (${invoice.discountLabel})` : ""}
                </span>
                <span className="font-medium tabular-nums text-destructive">
                  -{formatCurrency(invoice.discountAmount ?? 0, cur)}
                </span>
              </div>
            )}
            {(invoice.taxAmount ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  GST ({invoice.taxRate ?? 0}%)
                </span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(invoice.taxAmount ?? 0, cur)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">
                {formatCurrency(invoice.total, cur)}
              </span>
            </div>
            {(invoice.amountPaid ?? 0) > 0 && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium tabular-nums text-success">
                    -{formatCurrency(invoice.amountPaid ?? 0, cur)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Balance Due</span>
                  <span className={`tabular-nums ${balanceDue > 0 ? "text-destructive" : "text-success"}`}>
                    {formatCurrency(balanceDue, cur)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Information */}
        {!isPaid && business && (business.bankName || business.paynowNumber) && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Payment Information
            </h3>
            <div className="space-y-2 text-sm">
              {business.bankName && (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium">{business.bankName}</span>
                </div>
              )}
              {business.bankAccount && (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Account No.</span>
                  <span className="font-medium font-mono">{business.bankAccount}</span>
                </div>
              )}
              {business.bankHolder && (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Account Holder</span>
                  <span className="font-medium">{business.bankHolder}</span>
                </div>
              )}
              {business.paynowNumber && (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">PayNow</span>
                  <span className="font-medium font-mono">
                    {business.paynowNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Notes
            </h3>
            <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Download PDF */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() =>
              window.open(`/api/portal/invoice/${token}/pdf`, "_blank")
            }
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Download PDF
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Powered by Invoice Generator
        </p>
      </div>
    </div>
  );
}
