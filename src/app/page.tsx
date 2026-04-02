"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import Link from "next/link";
import { FileText, Users, Calendar, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalClients: number;
  draftInvoices: number;
  sentInvoices: number;
  paidThisMonth: number;
  overdueInvoices: number;
  totalOutstanding: number;
  sessionsThisMonth: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<
    Array<{
      id: number;
      invoiceNumber: string;
      clientName: string;
      total: number;
      status: string;
    }>
  >([]);

  useEffect(() => {
    // Auto-mark overdue invoices and process recurring invoices before loading dashboard data
    Promise.all([
      fetch("/api/invoices/mark-overdue", { method: "POST" }).catch(() => {}),
      fetch("/api/invoices/recurring/process", { method: "POST" }).catch(() => {}),
    ]).finally(() => {
        fetch("/api/dashboard")
          .then((r) => r.json())
          .then((data) => {
            setStats(data.stats);
            setRecentInvoices(data.recentInvoices || []);
          })
          .catch(() => {});
      });
  }, []);

  const quickActions = [
    {
      href: "/invoices/new",
      label: "New Invoice",
      icon: FileText,
      color: "bg-primary text-primary-foreground",
    },
    {
      href: "/clients/new",
      label: "Add Client",
      icon: Users,
      color: "bg-success text-success-foreground",
    },
    {
      href: "/sessions/new",
      label: "Log Session",
      icon: Calendar,
      color: "bg-warning text-warning-foreground",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      color: "bg-secondary text-secondary-foreground",
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your invoicing activity"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg p-6 ${action.color} transition-opacity hover:opacity-90`}
          >
            <action.icon className="h-6 w-6" />
            <span className="text-sm font-medium">{action.label}</span>
          </Link>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Clients" value={stats.totalClients} />
          <StatCard label="Draft Invoices" value={stats.draftInvoices} />
          <StatCard
            label="Outstanding"
            value={`$${stats.totalOutstanding.toFixed(2)}`}
          />
          <StatCard label="Overdue" value={stats.overdueInvoices} highlight />
        </div>
      )}

      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Recent Invoices</h2>
        </div>
        <div className="divide-y divide-border">
          {recentInvoices.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No invoices yet.{" "}
              <Link
                href="/invoices/new"
                className="text-primary hover:underline"
              >
                Create your first invoice
              </Link>
            </div>
          ) : (
            recentInvoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent/50"
              >
                <div>
                  <span className="font-medium">{inv.invoiceNumber}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {inv.clientName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    ${inv.total.toFixed(2)}
                  </span>
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          highlight ? "text-destructive" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-secondary text-secondary-foreground",
    sent: "bg-primary/10 text-primary",
    paid: "bg-success/10 text-success",
    overdue: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        colors[status] || colors.draft
      }`}
    >
      {status}
    </span>
  );
}
