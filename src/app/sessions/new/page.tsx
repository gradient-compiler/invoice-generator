"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  Client,
  RateTier,
  SessionStatus,
  MissedClassHandling,
} from "@/types";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function NewSessionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [rateTiers, setRateTiers] = useState<RateTier[]>([]);

  const [clientId, setClientId] = useState<string>("");
  const [sessionDate, setSessionDate] = useState(todayStr);
  const [durationHours, setDurationHours] = useState<number>(1.5);
  const [rateTierId, setRateTierId] = useState<string>("");
  const [useRateOverride, setUseRateOverride] = useState(false);
  const [rateOverride, setRateOverride] = useState<string>("");
  const [status, setStatus] = useState<SessionStatus>("completed");
  const [missedClassHandling, setMissedClassHandling] =
    useState<MissedClassHandling>("deduct");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/clients?active=true")
      .then((r) => r.json())
      .then((data) =>
        setClients(Array.isArray(data) ? data : data.clients ?? [])
      )
      .catch(() => {});

    fetch("/api/settings/rates")
      .then((r) => r.json())
      .then((data) =>
        setRateTiers(Array.isArray(data) ? data : data.rateTiers ?? [])
      )
      .catch(() => {});
  }, []);

  // Auto-select a rate tier when client changes (heuristic based on grade)
  useEffect(() => {
    if (!clientId) return;
    const client = clients.find((c) => String(c.id) === clientId);
    if (!client?.gradeLevel || rateTiers.length === 0) return;

    // Try to find a tier whose name matches the grade level
    const match = rateTiers.find(
      (t) =>
        t.isActive &&
        t.name.toLowerCase().includes(client.gradeLevel!.toLowerCase())
    );
    if (match) {
      setRateTierId(String(match.id));
    }
  }, [clientId, clients, rateTiers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      setError("Please select a client.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        clientId: Number(clientId),
        sessionDate,
        durationHours,
        rateTierId: rateTierId ? Number(rateTierId) : null,
        rateOverride:
          useRateOverride && rateOverride ? Number(rateOverride) : null,
        status,
        notes: notes.trim() || null,
      };

      if (status === "cancelled" || status === "no_show") {
        body.missedClassHandling = missedClassHandling;
      }

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create session");
      }

      router.push("/sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const isMissed = status === "cancelled" || status === "no_show";

  return (
    <PageContainer>
      <PageHeader
        title="Log Session"
        description="Record a tutoring or service session"
      />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">
                Client <span className="text-destructive">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Select Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                    {c.gradeLevel ? ` (${c.gradeLevel})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Session Date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration (hours)</label>
              <input
                type="number"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                step={0.5}
                min={0.5}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rate Tier</label>
              <select
                value={rateTierId}
                onChange={(e) => setRateTierId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Select Rate --</option>
                {rateTiers
                  .filter((t) => t.isActive)
                  .map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name} (${t.rate.toFixed(2)}/{t.rateType})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={useRateOverride}
                  onChange={(e) => setUseRateOverride(e.target.checked)}
                  className="rounded"
                />
                Rate Override
              </label>
              {useRateOverride && (
                <input
                  type="number"
                  value={rateOverride}
                  onChange={(e) => setRateOverride(e.target.value)}
                  step={0.01}
                  min={0}
                  placeholder="Custom rate"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SessionStatus)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            {isMissed && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Missed Class Handling
                </label>
                <div className="flex flex-col gap-2 pt-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="missedHandling"
                      value="deduct"
                      checked={missedClassHandling === "deduct"}
                      onChange={() => setMissedClassHandling("deduct")}
                    />
                    Deduct from invoice
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="missedHandling"
                      value="credit_forward"
                      checked={missedClassHandling === "credit_forward"}
                      onChange={() => setMissedClassHandling("credit_forward")}
                    />
                    Credit forward
                  </label>
                </div>
              </div>
            )}

            <div className={`space-y-1.5 ${isMissed ? "" : "sm:col-span-2"}`}>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Session notes..."
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
            {saving ? "Saving..." : "Save Session"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/sessions")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    </PageContainer>
  );
}
