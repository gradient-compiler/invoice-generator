"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ReceiptDetail {
  id: number;
  receiptNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  clientId: number;
  clientName: string;
  clientParentName: string | null;
  paymentDate: string;
  paymentMethod: string | null;
  amount: number;
  currency: string | null;
  notes: string | null;
  createdAt: string;
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

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/receipts/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch receipt");
        return r.json();
      })
      .then((data) => {
        setReceipt(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this receipt? The associated invoice will be reverted to \"sent\" status.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/receipts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete receipt");
      }
      router.push("/receipts");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete receipt");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading receipt...
        </div>
      </PageContainer>
    );
  }

  if (error || !receipt) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || "Receipt not found"}
        </div>
        <Link href="/receipts" className="text-sm text-primary hover:underline">
          Back to Receipts
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Receipt ${receipt.receiptNumber}`}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={`/receipts/${receipt.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Download PDF
            </a>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Receipt"}
            </button>
          </div>
        }
      />

      <div className="rounded-lg border border-border bg-card">
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Receipt Details
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-muted-foreground">Receipt Number</dt>
                <dd className="text-sm font-medium">{receipt.receiptNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Invoice Number</dt>
                <dd className="text-sm">
                  <Link
                    href={`/invoices/${receipt.invoiceId}`}
                    className="text-primary hover:underline"
                  >
                    {receipt.invoiceNumber}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Client</dt>
                <dd className="text-sm font-medium">{receipt.clientName}</dd>
                {receipt.clientParentName && (
                  <dd className="text-xs text-muted-foreground">
                    Parent: {receipt.clientParentName}
                  </dd>
                )}
              </div>
            </dl>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Payment Details
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-muted-foreground">Payment Date</dt>
                <dd className="text-sm">{formatDate(receipt.paymentDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Payment Method</dt>
                <dd className="text-sm">{receipt.paymentMethod ?? "\u2014"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Amount</dt>
                <dd className="text-lg font-bold">
                  {formatCurrency(receipt.amount, receipt.currency ?? "SGD")}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {receipt.notes && (
          <div className="border-t border-border p-6">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Notes
            </h3>
            <p className="text-sm whitespace-pre-wrap">{receipt.notes}</p>
          </div>
        )}
      </div>

      <div>
        <Link
          href="/receipts"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Receipts
        </Link>
      </div>
    </PageContainer>
  );
}
