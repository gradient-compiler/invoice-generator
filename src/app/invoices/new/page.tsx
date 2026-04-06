"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import type { Client, BusinessSettings, DiscountType, RateTier } from "@/types";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

interface SessionRow {
  id: number;
  clientId: number;
  clientName: string | null;
  sessionDate: string;
  durationHours: number;
  rateTierId: number | null;
  rateTierName: string | null;
  rateTierRate: number | null;
  rateOverride: number | null;
  status: string;
  invoiceId: number | null;
}

interface LineItem {
  key: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unitLabel: string;
  amount: number;
}

function newLineItem(): LineItem {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unitPrice: 0,
    unitLabel: "hr",
    amount: 0,
  };
}

function rateTypeToUnitLabel(rateType: string | null | undefined): string {
  switch (rateType) {
    case "per_session": return "session";
    case "fixed": return "unit";
    default: return "hr";
  }
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [rateTiers, setRateTiers] = useState<RateTier[]>([]);
  const [uninvoicedSessions, setUninvoicedSessions] = useState<SessionRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form fields
  const [clientId, setClientId] = useState<number | "">("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [template, setTemplate] = useState("clean-professional");
  const [currency, setCurrency] = useState("SGD");
  const [paymentTerms, setPaymentTerms] = useState("Due upon receipt");
  const [notes, setNotes] = useState("");
  const [billingMonth, setBillingMonth] = useState("");

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);

  // Discount
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountLabel, setDiscountLabel] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/clients?active=true").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/settings/rates?active=true").then((r) => r.json()),
    ])
      .then(([clientData, settingsData, ratesData]) => {
        setClients(
          Array.isArray(clientData) ? clientData : clientData.clients ?? []
        );
        setSettings(settingsData);
        setRateTiers(Array.isArray(ratesData) ? ratesData : []);
        if (settingsData?.defaultCurrency) setCurrency(settingsData.defaultCurrency);
        if (settingsData?.defaultTemplate) setTemplate(settingsData.defaultTemplate);
        if (settingsData?.defaultPaymentTerms) setPaymentTerms(settingsData.defaultPaymentTerms);
        setLoadingData(false);
      })
      .catch(() => setLoadingData(false));
  }, []);

  // Auto-fill client details and fetch uninvoiced sessions
  useEffect(() => {
    if (clientId === "") {
      setSelectedClient(null);
      setUninvoicedSessions([]);
      return;
    }
    const c = clients.find((cl) => cl.id === clientId) ?? null;
    setSelectedClient(c);

    // Fetch uninvoiced sessions for this client
    fetch(`/api/sessions?clientId=${clientId}&invoiced=false&status=completed`)
      .then((r) => r.json())
      .then((data) => {
        setUninvoicedSessions(Array.isArray(data) ? data : []);
      })
      .catch(() => setUninvoicedSessions([]));
  }, [clientId, clients]);

  // Recalc line item amounts
  const updateLineItem = useCallback(
    (key: string, field: keyof LineItem, value: string | number) => {
      setLineItems((prev) =>
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

  const addLineItem = () => setLineItems((prev) => [...prev, newLineItem()]);
  const removeLineItem = (key: string) =>
    setLineItems((prev) => (prev.length <= 1 ? prev : prev.filter((i) => i.key !== key)));

  // Build suggested line items from uninvoiced sessions grouped by rate
  const sessionSuggestions = (() => {
    if (uninvoicedSessions.length === 0) return [];
    const groups = new Map<string, { tierName: string; rate: number; rateType: string; durations: number[] }>();
    for (const s of uninvoicedSessions) {
      const rate = s.rateOverride ?? s.rateTierRate ?? 0;
      const tierName = s.rateTierName || "Custom";
      const tier = rateTiers.find((t) => t.id === s.rateTierId);
      const rateType = tier?.rateType ?? "hourly";
      const key = `${tierName}-${rate}`;
      if (!groups.has(key)) groups.set(key, { tierName, rate, rateType, durations: [] });
      groups.get(key)!.durations.push(s.durationHours);
    }
    return Array.from(groups.values()).map((g) => {
      const totalHours = g.durations.reduce((a, b) => a + b, 0);
      const count = g.durations.length;
      const allSame = g.durations.every((d) => d === g.durations[0]);
      const unitLabel = rateTypeToUnitLabel(g.rateType);
      const durationDesc = allSame
        ? `${count} session${count !== 1 ? "s" : ""} x ${g.durations[0]} hrs`
        : `${count} session${count !== 1 ? "s" : ""} (${g.durations.map((d) => `${d} hrs`).join(", ")})`;
      return {
        description: `English Tuition (${g.tierName}) - ${durationDesc}, ${totalHours} hrs total`,
        quantity: totalHours,
        unitPrice: g.rate,
        tierName: g.tierName,
        unitLabel,
      };
    });
  })();

  function applySuggestion(suggestion: { description: string; quantity: number; unitPrice: number; unitLabel?: string }) {
    const item: LineItem = {
      key: crypto.randomUUID(),
      description: suggestion.description,
      quantity: suggestion.quantity,
      unitPrice: suggestion.unitPrice,
      unitLabel: suggestion.unitLabel || "hr",
      amount: Math.round(suggestion.quantity * suggestion.unitPrice * 100) / 100,
    };
    setLineItems((prev) => {
      // Replace the first empty line item, or append
      const firstEmpty = prev.findIndex((li) => !li.description.trim() && li.quantity <= 1 && li.unitPrice === 0);
      if (firstEmpty >= 0) {
        const next = [...prev];
        next[firstEmpty] = item;
        return next;
      }
      return [...prev, item];
    });
  }

  // Calculations
  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const discountAmount = applyDiscount
    ? discountType === "percentage"
      ? Math.round(subtotal * (discountValue / 100) * 100) / 100
      : Math.round(discountValue * 100) / 100
    : 0;
  const afterDiscount = subtotal - discountAmount;
  const gstRate = settings?.gstRegistered ? 0.09 : 0;
  const taxAmount = Math.round(afterDiscount * gstRate * 100) / 100;
  const total = Math.round((afterDiscount + taxAmount) * 100) / 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      setError("Please select a client.");
      return;
    }
    if (lineItems.every((li) => !li.description.trim())) {
      setError("Add at least one line item with a description.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          issueDate,
          dueDate,
          currency,
          template,
          paymentTerms,
          notes: notes.trim() || null,
          billingMonth: billingMonth || null,
          subtotal,
          discountType: applyDiscount ? discountType : null,
          discountValue: applyDiscount ? discountValue : 0,
          discountLabel: applyDiscount ? discountLabel.trim() || null : null,
          discountAmount,
          taxRate: gstRate * 100,
          taxAmount,
          total,
          lineItems: lineItems
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
        throw new Error(data.error || "Failed to create invoice");
      }

      const created = await res.json();
      router.push(`/invoices/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <PageContainer>
        <PageHeader title="New Invoice" />
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="New Invoice" description="Create a new invoice" />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & Dates */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Invoice Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Client <span className="text-destructive">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) =>
                  setClientId(e.target.value ? Number(e.target.value) : "")
                }
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
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className={inputClass}
              >
                <option value="clean-professional">Clean Professional</option>
                <option value="classic">Classic</option>
                <option value="modern-minimal">Modern Minimal</option>
                <option value="corporate">Corporate</option>
                <option value="creative">Creative</option>
                <option value="compact-detailed">Compact + Receipt</option>
                <option value="compact">Compact</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
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
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Client info preview */}
          {selectedClient && (
            <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{selectedClient.name}</p>
              {selectedClient.parentName && (
                <p className="text-muted-foreground">
                  Parent: {selectedClient.parentName}
                </p>
              )}
              {selectedClient.email && (
                <p className="text-muted-foreground">{selectedClient.email}</p>
              )}
              {selectedClient.phone && (
                <p className="text-muted-foreground">{selectedClient.phone}</p>
              )}
              {selectedClient.address && (
                <p className="text-muted-foreground">{selectedClient.address}</p>
              )}
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Line Items
          </h2>

          {/* Suggestions from uninvoiced sessions */}
          {clientId && sessionSuggestions.length > 0 && (
            <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Suggested from {uninvoicedSessions.length} uninvoiced session{uninvoicedSessions.length !== 1 ? "s" : ""}:
              </p>
              <div className="space-y-1.5">
                {sessionSuggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{s.tierName}</span>
                      <span className="text-muted-foreground"> - {s.quantity} hrs @ ${s.unitPrice.toFixed(2)}/hr = </span>
                      <span className="font-medium">${(s.quantity * s.unitPrice).toFixed(2)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rate tier quick-add */}
          {clientId && rateTiers.length > 0 && sessionSuggestions.length === 0 && (
            <div className="mb-4 rounded-md border border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Quick add from rate tiers:
              </p>
              <div className="flex flex-wrap gap-2">
                {rateTiers.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() =>
                      applySuggestion({
                        description: `English Tuition (${tier.name})`,
                        quantity: 1,
                        unitPrice: tier.rate,
                        unitLabel: rateTypeToUnitLabel(tier.rateType),
                      })
                    }
                    className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-primary hover:text-primary"
                  >
                    {tier.name} - ${tier.rate.toFixed(2)}/{rateTypeToUnitLabel(tier.rateType)}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                {lineItems.map((item) => (
                  <tr key={item.key}>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(item.key, "description", e.target.value)
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
                          updateLineItem(
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
                          updateLineItem(
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
                          updateLineItem(item.key, "unitLabel", e.target.value)
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
                        onClick={() => removeLineItem(item.key)}
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
            onClick={addLineItem}
            className="mt-3 rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            + Add Line Item
          </button>
        </div>

        {/* Totals */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Totals
          </h2>

          <div className="space-y-3 max-w-md ml-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">
                {subtotal.toFixed(2)}
              </span>
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={applyDiscount}
                  onChange={(e) => setApplyDiscount(e.target.checked)}
                  className="rounded"
                />
                Apply Discount
              </label>

              {applyDiscount && (
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as DiscountType)
                    }
                    className={inputClass}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) =>
                      setDiscountValue(parseFloat(e.target.value) || 0)
                    }
                    className={inputClass}
                    step="0.01"
                    min="0"
                    placeholder="Value"
                  />
                  <input
                    type="text"
                    value={discountLabel}
                    onChange={(e) => setDiscountLabel(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Sibling Discount"
                  />
                </div>
              )}

              {applyDiscount && discountAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Discount
                    {discountLabel ? ` (${discountLabel})` : ""}
                  </span>
                  <span className="font-medium tabular-nums text-destructive">
                    -{discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* GST */}
            {settings?.gstRegistered && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  GST (9%)
                </span>
                <span className="font-medium tabular-nums">
                  {taxAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
              <span>Total ({currency})</span>
              <span className="tabular-nums">{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Additional fields */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Additional Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={inputClass}
                placeholder="Additional notes for this invoice..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Invoice"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/invoices")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    </PageContainer>
  );
}
