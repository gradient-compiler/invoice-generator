"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Client, SessionStatus, SessionWithClient } from "@/types";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function computeAmount(session: SessionWithClient): number {
  if (session.rateOverride != null) {
    return session.durationHours * session.rateOverride;
  }
  if (session.rateTier) {
    return session.durationHours * session.rateTier.rate;
  }
  return 0;
}

function getRate(session: SessionWithClient): number {
  if (session.rateOverride != null) return session.rateOverride;
  if (session.rateTier) return session.rateTier.rate;
  return 0;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(getCurrentMonth);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SessionStatus>(
    "all"
  );

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : data.clients ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    fetch(`/api/sessions?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch sessions");
        return r.json();
      })
      .then((data) => {
        setSessions(Array.isArray(data) ? data : data.sessions ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [month]);

  const filtered = sessions.filter((s) => {
    if (clientFilter !== "all" && String(s.clientId) !== clientFilter)
      return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  const totalSessions = filtered.filter(
    (s) => s.status === "completed"
  ).length;
  const totalHours = filtered
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.durationHours, 0);
  const totalAmount = filtered
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + computeAmount(s), 0);

  return (
    <PageContainer>
      <PageHeader
        title="Sessions"
        description="Track tutoring and service sessions"
        actions={
          <Link
            href="/sessions/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Log Session
          </Link>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Sessions</p>
          <p className="mt-1 text-2xl font-bold">{totalSessions}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Hours</p>
          <p className="mt-1 text-2xl font-bold">{totalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="mt-1 text-2xl font-bold">${totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | SessionStatus)
          }
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
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
          Loading sessions...
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-border">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              {sessions.length === 0 ? (
                <>
                  No sessions this month.{" "}
                  <Link
                    href="/sessions/new"
                    className="text-primary hover:underline"
                  >
                    Log your first session
                  </Link>
                </>
              ) : (
                "No sessions match your filters."
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Student
                  </th>
                  <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground sm:table-cell">
                    Duration (hrs)
                  </th>
                  <th className="hidden px-4 py-3 text-right font-medium text-muted-foreground md:table-cell">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((session) => {
                  const isMissed =
                    session.status === "cancelled" ||
                    session.status === "no_show";
                  const rowClass = isMissed
                    ? session.status === "no_show"
                      ? "bg-destructive/5"
                      : "bg-muted/30"
                    : "";

                  return (
                    <tr
                      key={session.id}
                      className={`hover:bg-accent/50 transition-colors ${rowClass}`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/sessions/${session.id}`}
                          className="text-primary hover:underline"
                        >
                          {formatDate(session.sessionDate)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {session.client?.name ?? `Client #${session.clientId}`}
                      </td>
                      <td className="hidden px-4 py-3 text-right sm:table-cell">
                        {session.durationHours}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-muted-foreground md:table-cell">
                        ${getRate(session).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${computeAmount(session).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <SessionStatusBadge status={session.status || "completed"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </PageContainer>
  );
}

function SessionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-success/10 text-success",
    cancelled: "bg-muted text-muted-foreground",
    no_show: "bg-destructive/10 text-destructive",
  };

  const labels: Record<string, string> = {
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] || styles.completed
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
