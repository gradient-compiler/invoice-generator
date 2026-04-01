"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ReceiptRow {
  id: number;
  receiptNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  clientName: string;
  paymentDate: string;
  paymentMethod: string | null;
  amount: number;
  notes: string | null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
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

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/receipts")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch receipts");
        return r.json();
      })
      .then((data) => {
        setReceipts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Receipts" description="Payment receipts for invoices" />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading receipts...
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-border">
          {receipts.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No receipts yet. Receipts are created when an invoice is marked as
              paid.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Receipt #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Client
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                    Payment Date
                  </th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                    Method
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {receipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/receipts/${receipt.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {receipt.receiptNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/invoices/${receipt.invoiceId}`}
                        className="text-primary hover:underline"
                      >
                        {receipt.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {receipt.clientName ?? "\u2014"}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {formatDate(receipt.paymentDate)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {receipt.paymentMethod ?? "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(receipt.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/receipts/${receipt.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          View
                        </Link>
                        <a
                          href={`/receipts/${receipt.id}/pdf`}
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
