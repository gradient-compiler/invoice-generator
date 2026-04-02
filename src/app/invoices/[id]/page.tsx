"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import type {
  Client,
  BusinessSettings,
  InvoiceWithItems,
  InvoiceLineItem,
  DiscountType,
} from "@/types";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-primary/10 text-primary",
    paid: "bg-success/10 text-success",
    overdue: "bg-warning/10 text-warning",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

function formatCurrency(amount: number, currency: string = "SGD") {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(d: string) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface EditLineItem {
  key: string;
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  unitLabel: string;
  amount: number;
}

function newEditLineItem(): EditLineItem {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unitPrice: 0,
    unitLabel: "hr",
    amount: 0,
  };
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  // Payment dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("PayNow");
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Payment history
  const [payments, setPayments] = useState<
    Array<{
      id: number;
      receiptNumber: string;
      paymentDate: string;
      paymentMethod: string | null;
      amount: number;
      notes: string | null;
      createdAt: string;
    }>
  >([]);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editClientId, setEditClientId] = useState<number>(0);
  const [editIssueDate, setEditIssueDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editTemplate, setEditTemplate] = useState("clean-professional");
  const [editCurrency, setEditCurrency] = useState("SGD");
  const [editPaymentTerms, setEditPaymentTerms] = useState("Due upon receipt");
  const [editNotes, setEditNotes] = useState("");
  const [editBillingMonth, setEditBillingMonth] = useState("");
  const [editLineItems, setEditLineItems] = useState<EditLineItem[]>([]);
  const [editApplyDiscount, setEditApplyDiscount] = useState(false);
  const [editDiscountType, setEditDiscountType] =
    useState<DiscountType>("percentage");
  const [editDiscountValue, setEditDiscountValue] = useState(0);
  const [editDiscountLabel, setEditDiscountLabel] = useState("");

  const fetchInvoice = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/invoices/${invoiceId}`).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch invoice");
        return r.json();
      }),
      fetch("/api/clients?active=true").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([inv, clientData, settingsData]) => {
        setInvoice(inv);
        setClients(
          Array.isArray(clientData) ? clientData : clientData.clients ?? []
        );
        setSettings(settingsData);
        setLoading(false);
        // Fetch payment history
        fetch(`/api/invoices/${invoiceId}/payments`)
          .then((r) => r.json())
          .then((p) => setPayments(Array.isArray(p) ? p : []))
          .catch(() => {});
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Populate edit form when entering edit mode
  function enterEditMode() {
    if (!invoice) return;
    setEditClientId(invoice.clientId);
    setEditIssueDate(invoice.issueDate);
    setEditDueDate(invoice.dueDate);
    setEditTemplate(invoice.template ?? "clean-professional");
    setEditCurrency(invoice.currency ?? "SGD");
    setEditPaymentTerms(invoice.paymentTerms ?? "Due upon receipt");
    setEditNotes(invoice.notes ?? "");
    setEditBillingMonth(invoice.billingMonth ?? "");
    setEditLineItems(
      invoice.lineItems.map((li: InvoiceLineItem) => ({
        key: crypto.randomUUID(),
        id: li.id,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        unitLabel: li.unitLabel ?? "hr",
        amount: li.amount,
      }))
    );
    setEditApplyDiscount(
      (invoice.discountAmount ?? 0) > 0 || !!invoice.discountType
    );
    setEditDiscountType(
      (invoice.discountType as DiscountType) ?? "percentage"
    );
    setEditDiscountValue(invoice.discountValue ?? 0);
    setEditDiscountLabel(invoice.discountLabel ?? "");
    setEditMode(true);
  }

  // Edit line item helpers
  const updateEditLineItem = useCallback(
    (key: string, field: keyof EditLineItem, value: string | number) => {
      setEditLineItems((prev) =>
        prev.map((item) => {
          if (item.key !== key) return item;
          const updated = { ...item, [field]: value };
          updated.amount =
            Math.round(updated.quantity * updated.unitPrice * 100) / 100;
          return updated;
        })
      );
    },
    []
  );

  const addEditLineItem = () =>
    setEditLineItems((prev) => [...prev, newEditLineItem()]);
  const removeEditLineItem = (key: string) =>
    setEditLineItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((i) => i.key !== key)
    );

  // Edit calculations
  const editSubtotal = editLineItems.reduce((s, i) => s + i.amount, 0);
  const editDiscountAmount = editApplyDiscount
    ? editDiscountType === "percentage"
      ? Math.round(editSubtotal * (editDiscountValue / 100) * 100) / 100
      : Math.round(editDiscountValue * 100) / 100
    : 0;
  const editAfterDiscount = editSubtotal - editDiscountAmount;
  const editGstRate = settings?.gstRegistered ? 0.09 : 0;
  const editTaxAmount =
    Math.round(editAfterDiscount * editGstRate * 100) / 100;
  const editTotal =
    Math.round((editAfterDiscount + editTaxAmount) * 100) / 100;

  // Save edit
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: editClientId,
          issueDate: editIssueDate,
          dueDate: editDueDate,
          currency: editCurrency,
          template: editTemplate,
          paymentTerms: editPaymentTerms,
          notes: editNotes.trim() || null,
          billingMonth: editBillingMonth || null,
          subtotal: editSubtotal,
          discountType: editApplyDiscount ? editDiscountType : null,
          discountValue: editApplyDiscount ? editDiscountValue : 0,
          discountLabel: editApplyDiscount
            ? editDiscountLabel.trim() || null
            : null,
          discountAmount: editDiscountAmount,
          taxRate: editGstRate * 100,
          taxAmount: editTaxAmount,
          total: editTotal,
          lineItems: editLineItems
            .filter((li) => li.description.trim())
            .map((li, idx) => ({
              description: li.description.trim(),
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              unitLabel: li.unitLabel,
              amount: li.amount,
              sortOrder: idx,
            })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update invoice");
      }

      setEditMode(false);
      fetchInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // Status actions
  async function updateStatus(newStatus: string, extra?: Record<string, unknown>) {
    setActionLoading(newStatus);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading("");
    }
  }

  async function handleRecordPayment() {
    if (paymentAmount <= 0) return;
    setActionLoading("paid");
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice!.id,
          paymentDate,
          paymentMethod,
          amount: paymentAmount,
        }),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      fetchInvoice();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading("");
    }
    setShowPaymentDialog(false);
  }

  async function handleDuplicate() {
    setActionLoading("duplicate");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to duplicate invoice");
      const data = await res.json();
      router.push(`/invoices/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setActionLoading("");
    }
  }

  async function handleDelete() {
    setActionLoading("delete");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete invoice");
      router.push("/invoices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setActionLoading("");
    }
  }

  function handleDownloadPdf() {
    window.open(`/invoices/${invoiceId}/pdf`, "_blank");
  }

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Invoice" />
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading invoice...
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer>
        <PageHeader title="Invoice Not Found" />
        <div className="py-12 text-center text-sm text-muted-foreground">
          {error || "Invoice not found."}
          <br />
          <Link href="/invoices" className="text-primary hover:underline">
            Back to invoices
          </Link>
        </div>
      </PageContainer>
    );
  }

  const cur = invoice.currency ?? "SGD";

  // ─── EDIT MODE ───
  if (editMode) {
    return (
      <PageContainer>
        <PageHeader
          title={`Edit ${invoice.invoiceNumber}`}
          actions={
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          }
        />

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveEdit} className="space-y-6">
          {/* Details */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Invoice Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Client</label>
                <select
                  value={editClientId}
                  onChange={(e) => setEditClientId(Number(e.target.value))}
                  className={inputClass}
                  required
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.parentName ? ` (${c.parentName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Issue Date</label>
                <input
                  type="date"
                  value={editIssueDate}
                  onChange={(e) => setEditIssueDate(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Template</label>
                <select
                  value={editTemplate}
                  onChange={(e) => setEditTemplate(e.target.value)}
                  className={inputClass}
                >
                  <option value="clean-professional">Clean Professional</option>
                  <option value="classic">Classic</option>
                  <option value="modern-minimal">Modern Minimal</option>
                  <option value="corporate">Corporate</option>
                  <option value="creative">Creative</option>
                  <option value="compact-detailed">Compact + Receipt</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Currency</label>
                <select
                  value={editCurrency}
                  onChange={(e) => setEditCurrency(e.target.value)}
                  className={inputClass}
                >
                  <option value="SGD">SGD</option>
                  <option value="USD">USD</option>
                  <option value="MYR">MYR</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Billing Month</label>
                <input
                  type="month"
                  value={editBillingMonth}
                  onChange={(e) => setEditBillingMonth(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Line Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="pb-2 text-left font-medium text-muted-foreground w-24">
                      Qty
                    </th>
                    <th className="pb-2 text-left font-medium text-muted-foreground w-28">
                      Unit Price
                    </th>
                    <th className="pb-2 text-left font-medium text-muted-foreground w-28">
                      Unit
                    </th>
                    <th className="pb-2 text-right font-medium text-muted-foreground w-28">
                      Amount
                    </th>
                    <th className="pb-2 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {editLineItems.map((item) => (
                    <tr key={item.key}>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateEditLineItem(
                              item.key,
                              "description",
                              e.target.value
                            )
                          }
                          className={inputClass}
                          placeholder="Item description"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateEditLineItem(
                              item.key,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={inputClass}
                          step="0.5"
                          min="0"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateEditLineItem(
                              item.key,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={inputClass}
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={item.unitLabel}
                          onChange={(e) =>
                            updateEditLineItem(
                              item.key,
                              "unitLabel",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        >
                          <option value="hr">hr</option>
                          <option value="unit">unit</option>
                          <option value="session">session</option>
                          <option value="item">item</option>
                          <option value="lot">lot</option>
                        </select>
                      </td>
                      <td className="py-2 pr-2 text-right font-medium tabular-nums">
                        {item.amount.toFixed(2)}
                      </td>
                      <td className="py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeEditLineItem(item.key)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Remove"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addEditLineItem}
              className="mt-3 rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
            >
              + Add Line Item
            </button>
          </div>

          {/* Totals */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="space-y-3 max-w-md ml-auto">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">
                  {editSubtotal.toFixed(2)}
                </span>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editApplyDiscount}
                    onChange={(e) => setEditApplyDiscount(e.target.checked)}
                    className="rounded"
                  />
                  Apply Discount
                </label>
                {editApplyDiscount && (
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={editDiscountType}
                      onChange={(e) =>
                        setEditDiscountType(e.target.value as DiscountType)
                      }
                      className={inputClass}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                    <input
                      type="number"
                      value={editDiscountValue}
                      onChange={(e) =>
                        setEditDiscountValue(parseFloat(e.target.value) || 0)
                      }
                      className={inputClass}
                      step="0.01"
                      min="0"
                    />
                    <input
                      type="text"
                      value={editDiscountLabel}
                      onChange={(e) => setEditDiscountLabel(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Sibling Discount"
                    />
                  </div>
                )}
                {editApplyDiscount && editDiscountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount{editDiscountLabel ? ` (${editDiscountLabel})` : ""}
                    </span>
                    <span className="font-medium tabular-nums text-destructive">
                      -{editDiscountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {settings?.gstRegistered && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">GST (9%)</span>
                  <span className="font-medium tabular-nums">
                    {editTaxAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Total ({editCurrency})</span>
                <span className="tabular-nums">{editTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Additional */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Payment Terms</label>
                <select
                  value={editPaymentTerms}
                  onChange={(e) => setEditPaymentTerms(e.target.value)}
                  className={inputClass}
                >
                  <option value="Due upon receipt">Due upon receipt</option>
                  <option value="Net 7">Net 7</option>
                  <option value="Net 14">Net 14</option>
                  <option value="Net 30">Net 30</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className={inputClass}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      </PageContainer>
    );
  }

  // ─── VIEW MODE ───
  return (
    <PageContainer>
      <PageHeader
        title={invoice.invoiceNumber}
        description={`Status: ${invoice.status}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={enterEditMode}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Download PDF
            </button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Status Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {statusBadge(invoice.status ?? "draft")}

        {invoice.status === "draft" && (
          <button
            type="button"
            onClick={() => updateStatus("sent")}
            disabled={!!actionLoading}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {actionLoading === "sent" ? "Updating..." : "Mark as Sent"}
          </button>
        )}

        {invoice.status === "sent" && (
          <>
            <button
              type="button"
              onClick={() => { setPaymentAmount(Math.round((invoice.total - (invoice.amountPaid ?? 0)) * 100) / 100); setShowPaymentDialog(true); }}
              disabled={!!actionLoading}
              className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Record Payment
            </button>
            <button
              type="button"
              onClick={() => updateStatus("overdue")}
              disabled={!!actionLoading}
              className="rounded-lg bg-warning px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === "overdue" ? "Updating..." : "Mark as Overdue"}
            </button>
          </>
        )}

        {invoice.status === "overdue" && (
          <>
            <button
              type="button"
              onClick={() => { setPaymentAmount(Math.round((invoice.total - (invoice.amountPaid ?? 0)) * 100) / 100); setShowPaymentDialog(true); }}
              disabled={!!actionLoading}
              className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Record Payment
            </button>
            <button
              type="button"
              onClick={() => updateStatus("sent")}
              disabled={!!actionLoading}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === "sent" ? "Updating..." : "Revert to Sent"}
            </button>
          </>
        )}

        {invoice.status === "paid" && (
          <Link
            href={`/receipts?invoiceId=${invoice.id}`}
            className="rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/20"
          >
            Generate Receipt
          </Link>
        )}

        {(invoice.status === "draft" || invoice.status === "sent") && (
          <button
            type="button"
            onClick={async () => {
              setActionLoading("email");
              try {
                const res = await fetch("/api/email/send-invoice", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ invoiceId: invoice.id }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to send");
                setError("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to send email");
              } finally {
                setActionLoading("");
              }
            }}
            disabled={!!actionLoading}
            className="rounded-lg border border-primary/50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {actionLoading === "email" ? "Sending..." : "Email Invoice"}
          </button>
        )}

        {(invoice.status === "sent" || invoice.status === "overdue") && (
          <button
            type="button"
            onClick={async () => {
              setActionLoading("reminder");
              try {
                const res = await fetch("/api/email/send-reminder", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ invoiceId: invoice.id }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to send");
                setError("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to send reminder");
              } finally {
                setActionLoading("");
              }
            }}
            disabled={!!actionLoading}
            className="rounded-lg border border-warning/50 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/10 disabled:opacity-50"
          >
            {actionLoading === "reminder" ? "Sending..." : "Send Reminder"}
          </button>
        )}

        <button
          type="button"
          onClick={handleDuplicate}
          disabled={!!actionLoading}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          {actionLoading === "duplicate" ? "Duplicating..." : "Duplicate Invoice"}
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={!!actionLoading}
          className="rounded-lg border border-destructive/50 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {/* Partial Payment Indicator */}
      {(invoice.amountPaid ?? 0) > 0 && invoice.status !== "paid" && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm">
          <span className="font-medium text-warning">Partially Paid</span>
          <span className="ml-2 text-muted-foreground">
            {formatCurrency(invoice.amountPaid ?? 0, cur)} of {formatCurrency(invoice.total, cur)} received
            &mdash; Balance due: <span className="font-semibold">{formatCurrency(invoice.total - (invoice.amountPaid ?? 0), cur)}</span>
          </span>
        </div>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold">Record Payment</h3>
          <div className="grid gap-4 sm:grid-cols-3 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className={inputClass}
                step="0.01"
                min="0.01"
                max={invoice.total - (invoice.amountPaid ?? 0)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={inputClass}
              >
                <option value="PayNow">PayNow</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleRecordPayment}
              disabled={!!actionLoading || paymentAmount <= 0}
              className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === "paid" ? "Saving..." : "Confirm Payment"}
            </button>
            <button
              type="button"
              onClick={() => setShowPaymentDialog(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Payment History</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Receipt #</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Method</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2">{p.receiptNumber}</td>
                  <td className="px-4 py-2">{formatDate(p.paymentDate)}</td>
                  <td className="px-4 py-2">{p.paymentMethod ?? "—"}</td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums">{formatCurrency(p.amount, cur)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <p className="text-sm text-destructive font-medium mb-4">
            Are you sure you want to delete invoice {invoice.invoiceNumber}? This
            action cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!!actionLoading}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === "delete" ? "Deleting..." : "Yes, Delete"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Share Link */}
      {invoice.status !== "draft" && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold">Client Portal Link</h3>
          {(invoice as Record<string, unknown>).shareToken ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={`${window.location.origin}/portal/invoice/${(invoice as Record<string, unknown>).shareToken}`}
                className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-sm font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/portal/invoice/${(invoice as Record<string, unknown>).shareToken}`
                  );
                }}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/invoices/${invoiceId}/share`, { method: "DELETE" });
                  fetchInvoice();
                }}
                className="rounded-lg border border-destructive/50 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                Revoke
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                await fetch(`/api/invoices/${invoiceId}/share`, { method: "POST" });
                fetchInvoice();
              }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Generate Share Link
            </button>
          )}
        </div>
      )}

      {/* From / Client Info */}
      <div className="grid gap-6 sm:grid-cols-2">
        {settings && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              From
            </h2>
            <div className="text-sm space-y-1">
              <p className="font-medium">{settings.businessName}</p>
              {settings.address && (
                <p className="text-muted-foreground">{settings.address}</p>
              )}
              {settings.phone && (
                <p className="text-muted-foreground">{settings.phone}</p>
              )}
              {settings.email && (
                <p className="text-muted-foreground">{settings.email}</p>
              )}
              {settings.gstNumber && (
                <p className="text-muted-foreground">GST: {settings.gstNumber}</p>
              )}
            </div>
          </div>
        )}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Bill To
          </h2>
          <div className="text-sm space-y-1">
            <p className="font-medium">{invoice.client?.name}</p>
            {invoice.client?.parentName && (
              <p className="text-muted-foreground">
                c/o {invoice.client.parentName}
              </p>
            )}
            {invoice.client?.email && (
              <p className="text-muted-foreground">{invoice.client.email}</p>
            )}
            {invoice.client?.phone && (
              <p className="text-muted-foreground">{invoice.client.phone}</p>
            )}
            {invoice.client?.address && (
              <p className="text-muted-foreground">{invoice.client.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Details Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Issue Date</p>
          <p className="text-sm font-medium">{formatDate(invoice.issueDate)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Due Date</p>
          <p className="text-sm font-medium">{formatDate(invoice.dueDate)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Payment Terms</p>
          <p className="text-sm font-medium">
            {invoice.paymentTerms ?? "Due upon receipt"}
          </p>
        </div>
        {invoice.billingMonth && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Billing Month</p>
            <p className="text-sm font-medium">{invoice.billingMonth}</p>
          </div>
        )}
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
              <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground sm:table-cell w-24">
                Unit Price
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell w-20">
                Unit
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoice.lineItems.map((li) => (
              <tr key={li.id}>
                <td className="px-4 py-3">{li.description}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {li.quantity}
                </td>
                <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">
                  {formatCurrency(li.unitPrice, cur)}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {li.unitLabel ?? "hr"}
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
                Discount
                {invoice.discountLabel ? ` (${invoice.discountLabel})` : ""}
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
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Balance Due</span>
                <span className="tabular-nums">
                  {formatCurrency(invoice.total - (invoice.amountPaid ?? 0), cur)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Notes
          </h2>
          <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
    </PageContainer>
  );
}
