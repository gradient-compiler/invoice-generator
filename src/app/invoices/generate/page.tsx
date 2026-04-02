"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Client } from "@/types";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

interface SessionSummary {
  clientId: number;
  clientName: string;
  sessionsCount: number;
  totalHours: number;
  estimatedAmount: number;
}

interface GeneratedInvoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  total: number;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function GenerateInvoicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [month, setMonth] = useState(currentMonth());
  const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(
    new Set()
  );
  const [grouping, setGrouping] = useState<"grouped" | "detailed">("grouped");
  const [showSessionDates, setShowSessionDates] = useState(false);

  const [summaries, setSummaries] = useState<SessionSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedInvoice[]>([]);
  const [existingInvoices, setExistingInvoices] = useState<GeneratedInvoice[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Fetch tuition clients
  useEffect(() => {
    fetch("/api/clients?active=true&type=tuition")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch clients");
        return r.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data.clients ?? [];
        setClients(list);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Fetch session summaries when month or selected clients change
  useEffect(() => {
    if (selectedClientIds.size === 0 || !month) {
      setSummaries([]);
      return;
    }

    setSummaryLoading(true);
    const ids = Array.from(selectedClientIds).join(",");
    fetch(`/api/sessions/summary?month=${month}&clientIds=${ids}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch session summaries");
        return r.json();
      })
      .then((data) => {
        setSummaries(Array.isArray(data) ? data : data.summaries ?? []);
        setSummaryLoading(false);
      })
      .catch(() => {
        setSummaries([]);
        setSummaryLoading(false);
      });
  }, [month, selectedClientIds]);

  function toggleClient(id: number) {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedClientIds.size === clients.length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(clients.map((c) => c.id)));
    }
  }

  async function handleGenerate() {
    if (selectedClientIds.size === 0) {
      setError("Please select at least one client.");
      return;
    }

    setGenerating(true);
    setError("");
    setShowResults(false);

    try {
      const res = await fetch("/api/invoices/generate-monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          clientIds: Array.from(selectedClientIds),
          lineItemGrouping: grouping,
          showSessionDates,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate invoices");
      }

      const data = await res.json();
      setGenerated(
        Array.isArray(data) ? data : data.invoices ?? data.generated ?? []
      );
      setExistingInvoices(data.existingInvoices ?? []);
      setShowResults(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Generate Monthly Invoices"
        description="Batch-generate invoices from session records for tuition clients"
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {showResults && generated.length > 0 && (
        <div className="rounded-lg border border-success/50 bg-success/10 p-6">
          <h3 className="mb-3 text-sm font-semibold text-success">
            Successfully generated {generated.length} invoice
            {generated.length !== 1 ? "s" : ""}
          </h3>
          <ul className="space-y-2">
            {generated.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 text-sm">
                <Link
                  href={`/invoices/${inv.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {inv.invoiceNumber}
                </Link>
                <span className="text-muted-foreground">
                  {inv.clientName}
                </span>
                <span className="ml-auto font-medium tabular-nums">
                  {formatCurrency(inv.total)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Link
              href="/invoices"
              className="text-sm text-primary hover:underline"
            >
              View all invoices
            </Link>
          </div>
        </div>
      )}

      {showResults && generated.length === 0 && existingInvoices.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
          <h3 className="mb-3 text-sm font-semibold text-primary">
            Invoices already exist for this month
          </h3>
          <ul className="space-y-2">
            {existingInvoices.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 text-sm">
                <Link
                  href={`/invoices/${inv.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {inv.invoiceNumber}
                </Link>
                <span className="text-muted-foreground">
                  {inv.clientName}
                </span>
                <span className="ml-auto font-medium tabular-nums">
                  {formatCurrency(inv.total)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Link
              href="/invoices"
              className="text-sm text-primary hover:underline"
            >
              View all invoices
            </Link>
          </div>
        </div>
      )}

      {showResults && generated.length === 0 && existingInvoices.length === 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No invoices were generated. There may be no unbilled sessions for the
          selected clients in this month.
        </div>
      )}

      {/* Configuration */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Configuration
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Billing Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setShowResults(false);
              }}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Line Item Grouping</label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="grouping"
                  value="grouped"
                  checked={grouping === "grouped"}
                  onChange={() => setGrouping("grouped")}
                />
                Grouped (one line per rate)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="grouping"
                  value="detailed"
                  checked={grouping === "detailed"}
                  onChange={() => setGrouping("detailed")}
                />
                Detailed (one line per session)
              </label>
            </div>
          </div>

          {grouping === "grouped" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Options</label>
              <label className="flex items-center gap-2 pt-1 text-sm">
                <input
                  type="checkbox"
                  checked={showSessionDates}
                  onChange={(e) => setShowSessionDates(e.target.checked)}
                  className="rounded"
                />
                Include session dates in description
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Client Selection */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Select Clients
          </h2>
          {clients.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-primary hover:underline"
            >
              {selectedClientIds.size === clients.length
                ? "Deselect All"
                : "Select All"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading clients...
          </div>
        ) : clients.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No active tuition clients found.{" "}
            <Link href="/clients/new" className="text-primary hover:underline">
              Add a client
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => {
              const summary = summaries.find(
                (s) => s.clientId === client.id
              );
              return (
                <label
                  key={client.id}
                  className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm cursor-pointer transition-colors ${
                    selectedClientIds.has(client.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedClientIds.has(client.id)}
                    onChange={() => toggleClient(client.id)}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{client.name}</span>
                    {client.parentName && (
                      <span className="ml-2 text-muted-foreground">
                        ({client.parentName})
                      </span>
                    )}
                    {client.gradeLevel && (
                      <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        {client.gradeLevel}
                      </span>
                    )}
                  </div>
                  {selectedClientIds.has(client.id) && summary && (
                    <div className="hidden text-right text-xs text-muted-foreground sm:block">
                      <span>
                        {summary.sessionsCount} session
                        {summary.sessionsCount !== 1 ? "s" : ""}
                      </span>
                      <span className="mx-1">&middot;</span>
                      <span>{summary.totalHours}h</span>
                      <span className="mx-1">&middot;</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(summary.estimatedAmount)}
                      </span>
                    </div>
                  )}
                  {selectedClientIds.has(client.id) && summary && (
                    <div className="text-right text-xs text-muted-foreground sm:hidden">
                      <span className="font-medium text-foreground">
                        {formatCurrency(summary.estimatedAmount)}
                      </span>
                    </div>
                  )}
                  {selectedClientIds.has(client.id) && summaryLoading && !summary && (
                    <div className="text-xs text-muted-foreground">
                      Loading...
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || selectedClientIds.size === 0}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {generating
            ? "Generating..."
            : `Generate Invoice${selectedClientIds.size !== 1 ? "s" : ""} (${selectedClientIds.size})`}
        </button>
        <Link
          href="/invoices"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
        >
          Back to Invoices
        </Link>
      </div>
    </PageContainer>
  );
}
