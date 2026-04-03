"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import { useEffect, useState } from "react";
import type { Client } from "@/types";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

interface RecurringInvoice {
  id: number;
  clientId: number;
  clientName: string | null;
  frequency: string;
  lineItemsJson: string;
  currency: string | null;
  discountType: string | null;
  discountValue: number | null;
  discountLabel: string | null;
  paymentTerms: string | null;
  template: string | null;
  notes: string | null;
  nextGenerateDate: string;
  lastGeneratedDate: string | null;
  lastGeneratedInvoiceId: number | null;
  isActive: boolean | null;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unitLabel: string;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export default function RecurringInvoicesPage() {
  const [items, setItems] = useState<RecurringInvoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formClientId, setFormClientId] = useState<number>(0);
  const [formFrequency, setFormFrequency] = useState("monthly");
  const [formNextDate, setFormNextDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formPaymentTerms, setFormPaymentTerms] = useState("Due upon receipt");
  const [formTemplate, setFormTemplate] = useState("clean-professional");
  const [formNotes, setFormNotes] = useState("");
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, unitLabel: "hr" },
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/invoices/recurring").then((r) => r.json()),
      fetch("/api/clients?active=true").then((r) => r.json()),
    ])
      .then(([recData, clientData]) => {
        setItems(Array.isArray(recData) ? recData : []);
        setClients(
          Array.isArray(clientData) ? clientData : clientData.clients ?? []
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setFormClientId(0);
    setFormFrequency("monthly");
    setFormNextDate(new Date().toISOString().split("T")[0]);
    setFormPaymentTerms("Due upon receipt");
    setFormTemplate("clean-professional");
    setFormNotes("");
    setFormLineItems([
      { description: "", quantity: 1, unitPrice: 0, unitLabel: "hr" },
    ]);
    setEditingId(null);
  }

  function openEdit(item: RecurringInvoice) {
    setFormClientId(item.clientId);
    setFormFrequency(item.frequency);
    setFormNextDate(item.nextGenerateDate);
    setFormPaymentTerms(item.paymentTerms || "Due upon receipt");
    setFormTemplate(item.template || "clean-professional");
    setFormNotes(item.notes || "");
    setFormLineItems(JSON.parse(item.lineItemsJson));
    setEditingId(item.id);
    setShowForm(true);
  }

  async function handleSave() {
    const validItems = formLineItems.filter((li) => li.description.trim());
    if (!formClientId || validItems.length === 0 || !formNextDate) return;

    setSaving(true);
    try {
      const payload = {
        clientId: formClientId,
        frequency: formFrequency,
        lineItemsJson: JSON.stringify(validItems),
        currency: "SGD",
        paymentTerms: formPaymentTerms,
        template: formTemplate,
        notes: formNotes.trim() || null,
        nextGenerateDate: formNextDate,
      };

      const url = editingId
        ? `/api/invoices/recurring/${editingId}`
        : "/api/invoices/recurring";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save recurring invoice");
        return;
      }
      // Refetch list
      const updated = await fetch("/api/invoices/recurring").then((r) =>
        r.json()
      );
      setItems(Array.isArray(updated) ? updated : []);
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: number) {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const res = await fetch(`/api/invoices/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current.isActive }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to toggle recurring invoice");
      return;
    }
    const updated = await fetch("/api/invoices/recurring").then((r) =>
      r.json()
    );
    setItems(Array.isArray(updated) ? updated : []);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/invoices/recurring/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateLineItem(
    index: number,
    field: keyof LineItem,
    value: string | number
  ) {
    setFormLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  const formTotal = formLineItems.reduce(
    (s, li) => s + li.quantity * li.unitPrice,
    0
  );

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Recurring Invoices" />
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Recurring Invoices"
        description="Auto-generate invoices on a schedule for repeat clients"
        actions={
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            New Recurring Invoice
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
          <button type="button" onClick={() => setError("")} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold">
            {editingId ? "Edit" : "New"} Recurring Invoice
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Client</label>
              <select
                value={formClientId}
                onChange={(e) => setFormClientId(Number(e.target.value))}
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
              <label className="text-sm font-medium">Frequency</label>
              <select
                value={formFrequency}
                onChange={(e) => setFormFrequency(e.target.value)}
                className={inputClass}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Next Generate Date</label>
              <input
                type="date"
                value={formNextDate}
                onChange={(e) => setFormNextDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Payment Terms</label>
              <select
                value={formPaymentTerms}
                onChange={(e) => setFormPaymentTerms(e.target.value)}
                className={inputClass}
              >
                <option value="Due upon receipt">Due upon receipt</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 14">Net 14</option>
                <option value="Net 30">Net 30</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <label className="text-sm font-medium">Line Items</label>
            <table className="mt-2 w-full text-sm">
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
                  <th className="pb-2 text-right font-medium text-muted-foreground w-28">
                    Amount
                  </th>
                  <th className="pb-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {formLineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(idx, "description", e.target.value)
                        }
                        className={inputClass}
                        placeholder="Description"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(
                            idx,
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
                          updateLineItem(
                            idx,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className={inputClass}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="py-2 pr-2 text-right font-medium tabular-nums">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                    <td className="py-2 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setFormLineItems((prev) =>
                            prev.length > 1
                              ? prev.filter((_, i) => i !== idx)
                              : prev
                          )
                        }
                        className="text-muted-foreground hover:text-destructive"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setFormLineItems((prev) => [
                    ...prev,
                    { description: "", quantity: 1, unitPrice: 0, unitLabel: "hr" },
                  ])
                }
                className="rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
              >
                + Add Line Item
              </button>
              <span className="text-sm font-semibold">
                Total: {formatCurrency(formTotal)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="Notes for generated invoices..."
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !formClientId}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No recurring invoices set up yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Client
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Frequency
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Next Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Last Generated
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const lineItems: LineItem[] = JSON.parse(item.lineItemsJson);
                const total = lineItems.reduce(
                  (s, li) => s + li.quantity * li.unitPrice,
                  0
                );
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">
                      {item.clientName ?? "—"}
                    </td>
                    <td className="px-4 py-3 capitalize">{item.frequency}</td>
                    <td className="px-4 py-3">
                      {formatDate(item.nextGenerateDate)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(item.lastGeneratedDate)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.isActive
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.isActive ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded px-2 py-1 text-xs hover:bg-accent"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(item.id)}
                          className="rounded px-2 py-1 text-xs hover:bg-accent"
                        >
                          {item.isActive ? "Pause" : "Resume"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
