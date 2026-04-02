"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";

interface AnalyticsData {
  statusBreakdown: Record<string, { count: number; total: number }>;
  monthlyRevenue: Array<{
    month: string;
    invoiced: number;
    paid: number;
    count: number;
  }>;
  topClients: Array<{
    clientId: number;
    clientName: string;
    totalInvoiced: number;
    totalPaid: number;
    invoiceCount: number;
  }>;
  agingBuckets: Array<{
    bucket: string;
    count: number;
    amount: number;
  }>;
  collectionStats: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
  };
  monthlySessions: Array<{
    month: string;
    count: number;
    hours: number;
  }>;
  avgPaymentDays: number;
  comparison: {
    thisMonth: { invoiced: number; count: number; label: string };
    lastMonth: { invoiced: number; count: number; label: string };
  };
  upcomingDue: Array<{
    id: number;
    invoiceNumber: string;
    clientName: string;
    dueDate: string;
    total: number;
    amountPaid: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-secondary",
  sent: "bg-primary",
  paid: "bg-success",
  overdue: "bg-destructive",
  cancelled: "bg-muted",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  draft: "text-secondary-foreground",
  sent: "text-primary",
  paid: "text-success",
  overdue: "text-destructive",
  cancelled: "text-muted-foreground",
};

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function formatMonthLong(monthStr: string) {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Analytics"
          description="Income tracking, invoice insights, and performance metrics"
        />
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading analytics...
        </div>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer>
        <PageHeader
          title="Analytics"
          description="Income tracking, invoice insights, and performance metrics"
        />
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Failed to load analytics data.
        </div>
      </PageContainer>
    );
  }

  const { statusBreakdown, collectionStats, comparison, avgPaymentDays } = data;
  const totalInvoices = Object.values(statusBreakdown).reduce((s, v) => s + v.count, 0);
  const collectionRate =
    collectionStats.totalInvoiced > 0
      ? (collectionStats.totalCollected / collectionStats.totalInvoiced) * 100
      : 0;

  const monthDiff = comparison.thisMonth.invoiced - comparison.lastMonth.invoiced;
  const monthPctChange =
    comparison.lastMonth.invoiced > 0
      ? (monthDiff / comparison.lastMonth.invoiced) * 100
      : comparison.thisMonth.invoiced > 0
        ? 100
        : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Income tracking, invoice insights, and performance metrics"
        actions={
          <button
            type="button"
            onClick={() => window.open("/api/export/analytics", "_blank")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Export CSV
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total Invoiced"
          value={formatCurrency(collectionStats.totalInvoiced)}
          icon={<DollarSign className="h-4 w-4" />}
          sub={`${totalInvoices} invoices`}
        />
        <KpiCard
          label="Collected"
          value={formatCurrency(collectionStats.totalCollected)}
          icon={<CheckCircle className="h-4 w-4" />}
          sub={`${collectionRate.toFixed(1)}% collection rate`}
          highlight={collectionRate >= 80 ? "success" : collectionRate >= 50 ? "warning" : "destructive"}
        />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(collectionStats.totalOutstanding)}
          icon={<AlertTriangle className="h-4 w-4" />}
          sub={`${(statusBreakdown.sent?.count || 0) + (statusBreakdown.overdue?.count || 0)} unpaid invoices`}
          highlight={collectionStats.totalOutstanding > 0 ? "warning" : undefined}
        />
        <KpiCard
          label="Avg. Payment Time"
          value={`${avgPaymentDays} days`}
          icon={<Clock className="h-4 w-4" />}
          sub={avgPaymentDays <= 14 ? "Healthy" : avgPaymentDays <= 30 ? "Moderate" : "Slow"}
          highlight={avgPaymentDays <= 14 ? "success" : avgPaymentDays <= 30 ? "warning" : "destructive"}
        />
      </div>

      {/* Month-over-month comparison */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold">{formatCurrency(comparison.thisMonth.invoiced)}</p>
            <p className="text-xs text-muted-foreground">{comparison.thisMonth.count} invoices in {formatMonthLong(comparison.thisMonth.label)}</p>
          </div>
          <div className="flex items-center gap-2">
            {monthDiff >= 0 ? (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                <TrendingUp className="h-4 w-4" />
                +{monthPctChange.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                <TrendingDown className="h-4 w-4" />
                {monthPctChange.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Last Month</p>
            <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(comparison.lastMonth.invoiced)}</p>
            <p className="text-xs text-muted-foreground">{comparison.lastMonth.count} invoices in {formatMonthLong(comparison.lastMonth.label)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invoice Status Breakdown */}
        <StatusBreakdownCard statusBreakdown={statusBreakdown} total={totalInvoices} />

        {/* Invoice Aging */}
        <AgingCard agingBuckets={data.agingBuckets} />
      </div>

      {/* Monthly Revenue Chart */}
      <RevenueChart monthlyRevenue={data.monthlyRevenue} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Clients */}
        <TopClientsCard topClients={data.topClients} />

        {/* Upcoming Due */}
        <UpcomingDueCard upcomingDue={data.upcomingDue} />
      </div>

      {/* Session Activity */}
      <SessionActivityCard monthlySessions={data.monthlySessions} />
    </PageContainer>
  );
}

// --- Component: KPI Card ---
function KpiCard({
  label,
  value,
  icon,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
  highlight?: "success" | "warning" | "destructive";
}) {
  const highlightClass = highlight
    ? highlight === "success"
      ? "text-success"
      : highlight === "warning"
        ? "text-warning"
        : "text-destructive"
    : "";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className={`mt-1 text-2xl font-bold ${highlightClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// --- Component: Status Breakdown ---
function StatusBreakdownCard({
  statusBreakdown,
  total,
}: {
  statusBreakdown: Record<string, { count: number; total: number }>;
  total: number;
}) {
  const statuses = ["draft", "sent", "paid", "overdue", "cancelled"];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold">Invoice Status Breakdown</h3>
      </div>
      <div className="p-4">
        {/* Stacked bar */}
        {total > 0 && (
          <div className="mb-4 flex h-4 overflow-hidden rounded-full">
            {statuses.map((status) => {
              const data = statusBreakdown[status];
              if (!data || data.count === 0) return null;
              const pct = (data.count / total) * 100;
              return (
                <div
                  key={status}
                  className={`${STATUS_COLORS[status]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${status}: ${data.count} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>
        )}
        <div className="space-y-2.5">
          {statuses.map((status) => {
            const d = statusBreakdown[status];
            const count = d?.count || 0;
            const amount = d?.total || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={status} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]}`} />
                  <span className="capitalize">{status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">{count} ({pct.toFixed(0)}%)</span>
                  <span className={`font-medium ${STATUS_TEXT_COLORS[status]}`}>{formatCurrency(amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Component: Aging Card ---
function AgingCard({ agingBuckets }: { agingBuckets: AnalyticsData["agingBuckets"] }) {
  const bucketLabels: Record<string, string> = {
    not_due: "Not yet due",
    "0_30": "1-30 days overdue",
    "31_60": "31-60 days overdue",
    "61_90": "61-90 days overdue",
    "90_plus": "90+ days overdue",
  };
  const bucketColors: Record<string, string> = {
    not_due: "bg-primary",
    "0_30": "bg-warning",
    "31_60": "bg-orange-500",
    "61_90": "bg-destructive/70",
    "90_plus": "bg-destructive",
  };
  const orderedBuckets = ["not_due", "0_30", "31_60", "61_90", "90_plus"];
  const bucketMap = Object.fromEntries(agingBuckets.map((b) => [b.bucket, b]));
  const maxAmount = Math.max(...agingBuckets.map((b) => b.amount), 1);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold">Receivables Aging</h3>
      </div>
      <div className="p-4 space-y-3">
        {agingBuckets.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No outstanding invoices</p>
        ) : (
          orderedBuckets.map((key) => {
            const b = bucketMap[key];
            if (!b) return null;
            const pct = (b.amount / maxAmount) * 100;
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{bucketLabels[key]}</span>
                  <span className="font-medium">{formatCurrency(b.amount)} ({b.count})</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${bucketColors[key]} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- Component: Revenue Chart ---
function RevenueChart({ monthlyRevenue }: { monthlyRevenue: AnalyticsData["monthlyRevenue"] }) {
  const maxVal = Math.max(...monthlyRevenue.map((m) => Math.max(m.invoiced, m.paid)), 1);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Monthly Revenue</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
              Invoiced
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success" />
              Paid
            </span>
          </div>
        </div>
      </div>
      <div className="p-4">
        {monthlyRevenue.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No revenue data yet</p>
        ) : (
          <div className="flex items-end gap-1.5" style={{ height: 200 }}>
            {monthlyRevenue.map((m) => {
              const invoicedH = (m.invoiced / maxVal) * 180;
              const paidH = (m.paid / maxVal) * 180;
              return (
                <div key={m.month} className="group relative flex flex-1 flex-col items-center">
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-16 z-10 hidden rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-md group-hover:block">
                    <p className="font-medium">{formatMonthLong(m.month)}</p>
                    <p>Invoiced: {formatCurrency(m.invoiced)}</p>
                    <p>Paid: {formatCurrency(m.paid)}</p>
                    <p>{m.count} invoices</p>
                  </div>
                  <div className="flex w-full items-end justify-center gap-0.5">
                    <div
                      className="w-[45%] rounded-t bg-primary/80 transition-all hover:bg-primary"
                      style={{ height: Math.max(invoicedH, 2) }}
                    />
                    <div
                      className="w-[45%] rounded-t bg-success/80 transition-all hover:bg-success"
                      style={{ height: Math.max(paidH, 2) }}
                    />
                  </div>
                  <span className="mt-1.5 text-[10px] text-muted-foreground">{formatMonth(m.month)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Component: Top Clients ---
function TopClientsCard({ topClients }: { topClients: AnalyticsData["topClients"] }) {
  const maxRevenue = Math.max(...topClients.map((c) => c.totalInvoiced), 1);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold">Top Clients by Revenue</h3>
      </div>
      <div className="divide-y divide-border">
        {topClients.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No client data yet</p>
        ) : (
          topClients.slice(0, 7).map((client, i) => {
            const pct = (client.totalInvoiced / maxRevenue) * 100;
            const collectionPct =
              client.totalInvoiced > 0
                ? (client.totalPaid / client.totalInvoiced) * 100
                : 0;
            return (
              <div key={client.clientId} className="px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <Link href={`/clients/${client.clientId}`} className="font-medium hover:text-primary hover:underline">
                      {client.clientName}
                    </Link>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(client.totalInvoiced)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {client.invoiceCount} inv
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-10 text-right">
                    {collectionPct.toFixed(0)}% paid
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- Component: Upcoming Due ---
function UpcomingDueCard({ upcomingDue }: { upcomingDue: AnalyticsData["upcomingDue"] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Upcoming Due (14 days)</h3>
          <Link href="/invoices?status=sent" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
      </div>
      <div className="divide-y divide-border">
        {upcomingDue.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No invoices due in the next 14 days
          </p>
        ) : (
          upcomingDue.map((inv) => {
            const daysUntil = Math.ceil(
              (new Date(inv.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const remaining = inv.total - inv.amountPaid;
            return (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent/50"
              >
                <div>
                  <span className="text-sm font-medium">{inv.invoiceNumber}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{inv.clientName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatCurrency(remaining)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      daysUntil <= 3
                        ? "bg-destructive/10 text-destructive"
                        : daysUntil <= 7
                          ? "bg-warning/10 text-warning"
                          : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- Component: Session Activity ---
function SessionActivityCard({ monthlySessions }: { monthlySessions: AnalyticsData["monthlySessions"] }) {
  const maxHours = Math.max(...monthlySessions.map((s) => s.hours), 1);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold">Session Activity (Last 6 Months)</h3>
      </div>
      <div className="p-4">
        {monthlySessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No session data yet</p>
        ) : (
          <div className="space-y-3">
            {monthlySessions.map((s) => {
              const pct = (s.hours / maxHours) * 100;
              return (
                <div key={s.month}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{formatMonthLong(s.month)}</span>
                    <span className="text-muted-foreground">
                      {s.count} sessions &middot; {s.hours.toFixed(1)} hrs
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
