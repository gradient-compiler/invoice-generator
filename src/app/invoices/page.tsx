"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Client, InvoiceWithItems, InvoiceStatus } from "@/types";

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const STATUS_OPTIONS: { value: "all" | InvoiceStatus; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithItems[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [billingMonth, setBillingMonth] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/invoices").then((r) => {
        if (!r.ok) throw new Error("Failed to fetch invoices");
        return r.json();
      }),
      fetch("/api/clients").then((r) => {
        if (!r.ok) throw new Error("Failed to fetch clients");
        return r.json();
      }),
    ])
      .then(([invoiceData, clientData]) => {
        setInvoices(
          Array.isArray(invoiceData) ? invoiceData : invoiceData.invoices ?? []
        );
        setClients(
          Array.isArray(clientData) ? clientData : clientData.clients ?? []
        );
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (clientFilter !== "all" && String(inv.clientId) !== clientFilter)
      return false;
    if (billingMonth && inv.billingMonth !== billingMonth) return false;
    return true;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Invoices"
        description="Manage and track your invoices"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/invoices/generate"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Generate Monthly
            </Link>
            <Link
              href="/invoices/new"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              New Invoice
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | InvoiceStatus)
          }
          className={inputClass + " sm:w-44"}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className={inputClass + " sm:w-52"}
        >
          <option value="all">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="month"
          value={billingMonth}
          onChange={(e) => setBillingMonth(e.target.value)}
          className={inputClass + " sm:w-44"}
          placeholder="Billing Month"
        />

        {billingMonth && (
          <button
            type="button"
            onClick={() => setBillingMonth("")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear month
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading invoices...
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-border">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              {invoices.length === 0 ? (
                <>
                  No invoices yet.{" "}
                  <Link
                    href="/invoices/new"
                    className="text-primary hover:underline"
                  >
                    Create your first invoice
                  </Link>
                </>
              ) : (
                "No invoices match your filters."
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Client
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                    Issue Date
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Total
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
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {inv.client?.name ?? "\u2014"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(inv.total, inv.currency ?? "SGD")}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(inv.status ?? "draft")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          View
                        </Link>
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </PageContainer>
  );
}
