import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ReceiptPDFData } from "@/types";

const ACCENT = "#1a365d";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#2d3748",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end" as const,
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
    paddingBottom: 12,
  },
  receiptLabel: {
    fontSize: 22,
    fontWeight: "bold",
    color: ACCENT,
    letterSpacing: 3,
  },
  receiptNumber: {
    fontSize: 10,
    color: "#718096",
    marginTop: 4,
  },
  invoiceRef: {
    fontSize: 10,
    color: "#4a5568",
    textAlign: "right" as const,
  },
  invoiceRefStrong: {
    fontWeight: "bold",
    color: "#2d3748",
  },
  detailsGrid: {
    flexDirection: "row",
    marginBottom: 24,
  },
  detailsCol: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    fontSize: 9,
    color: "#718096",
    width: 90,
  },
  value: {
    fontSize: 10,
    color: "#2d3748",
    flex: 1,
  },
  valueStrong: {
    fontWeight: "bold",
  },
  sectionHeading: {
    fontSize: 9,
    color: "#718096",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
  },
  itemsTable: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginBottom: 16,
  },
  itemsHeader: {
    flexDirection: "row",
    backgroundColor: "#f7fafc",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  itemsHeaderCell: {
    fontSize: 8,
    color: "#718096",
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
  },
  itemDescription: {
    flex: 1,
    fontSize: 9,
    color: "#2d3748",
    paddingRight: 8,
  },
  itemQty: {
    width: 70,
    fontSize: 9,
    color: "#4a5568",
    textAlign: "right" as const,
    paddingRight: 8,
  },
  itemAmount: {
    width: 80,
    fontSize: 9,
    color: "#2d3748",
    textAlign: "right" as const,
  },
  totalsBlock: {
    alignItems: "flex-end" as const,
    marginTop: 8,
  },
  totalsRow: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: {
    fontSize: 9,
    color: "#718096",
  },
  totalsValue: {
    fontSize: 10,
    color: "#2d3748",
  },
  amountPaidRow: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e0",
  },
  amountPaidLabel: {
    fontSize: 10,
    color: "#2d3748",
    fontWeight: "bold",
  },
  amountPaidValue: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: "bold",
  },
  notesSection: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  notesLabel: {
    fontSize: 9,
    color: "#718096",
    textTransform: "uppercase" as const,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 9,
    color: "#4a5568",
  },
  businessSection: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  businessLabel: {
    fontSize: 9,
    color: "#718096",
    textTransform: "uppercase" as const,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  businessDetail: {
    fontSize: 9,
    color: "#4a5568",
    marginBottom: 1,
  },
  thankYou: {
    textAlign: "center" as const,
    fontSize: 10,
    color: "#718096",
    marginTop: 28,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center" as const,
  },
  footerText: {
    fontSize: 7,
    color: "#a0aec0",
  },
});

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPaymentMethod(method: string | null | undefined) {
  if (!method) return "—";
  const map: Record<string, string> = {
    paynow: "PayNow",
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    cheque: "Cheque",
    other: "Other",
  };
  return map[method] ?? method;
}

interface StandardReceiptProps {
  data: ReceiptPDFData;
}

export function StandardReceiptTemplate({ data }: StandardReceiptProps) {
  const items = data.lineItems ?? [];
  const showInvoiceTotal =
    typeof data.invoiceTotal === "number" &&
    Math.abs(data.invoiceTotal - data.amount) > 0.005;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.receiptLabel}>RECEIPT</Text>
            <Text style={styles.receiptNumber}>{data.receiptNumber}</Text>
          </View>
          <View>
            <Text style={styles.invoiceRef}>
              For Invoice{" "}
              <Text style={styles.invoiceRefStrong}>
                #{data.invoiceNumber}
              </Text>
            </Text>
            {data.invoiceIssueDate && (
              <Text style={styles.invoiceRef}>
                Issued {data.invoiceIssueDate}
              </Text>
            )}
            {data.invoiceBillingMonth && (
              <Text style={styles.invoiceRef}>
                Billing period: {data.invoiceBillingMonth}
              </Text>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailsCol}>
            <View style={styles.row}>
              <Text style={styles.label}>Received from</Text>
              <Text style={[styles.value, styles.valueStrong]}>
                {data.clientName}
                {data.clientParentName ? ` (${data.clientParentName})` : ""}
              </Text>
            </View>
          </View>
          <View style={styles.detailsCol}>
            <View style={styles.row}>
              <Text style={styles.label}>Payment date</Text>
              <Text style={styles.value}>{data.paymentDate}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Payment method</Text>
              <Text style={styles.value}>
                {formatPaymentMethod(data.paymentMethod)}
              </Text>
            </View>
          </View>
        </View>

        {/* Line items from the invoice */}
        {items.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Sessions / items paid</Text>
            <View style={styles.itemsTable}>
              <View style={styles.itemsHeader}>
                <Text style={[styles.itemsHeaderCell, { flex: 1 }]}>
                  Description
                </Text>
                <Text
                  style={[
                    styles.itemsHeaderCell,
                    { width: 70, textAlign: "right" },
                  ]}
                >
                  Qty
                </Text>
                <Text
                  style={[
                    styles.itemsHeaderCell,
                    { width: 80, textAlign: "right" },
                  ]}
                >
                  Amount
                </Text>
              </View>
              {items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <Text style={styles.itemQty}>
                    {item.quantity} {item.unitLabel}
                  </Text>
                  <Text style={styles.itemAmount}>
                    {fmt(item.amount, data.currency)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Totals — amount paid is the most prominent line, but quietly */}
        <View style={styles.totalsBlock}>
          {showInvoiceTotal && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Invoice total</Text>
              <Text style={styles.totalsValue}>
                {fmt(data.invoiceTotal!, data.currency)}
              </Text>
            </View>
          )}
          <View style={styles.amountPaidRow}>
            <Text style={styles.amountPaidLabel}>Amount paid</Text>
            <Text style={styles.amountPaidValue}>
              {fmt(data.amount, data.currency)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Business details */}
        <View style={styles.businessSection}>
          <Text style={styles.businessLabel}>Issued by</Text>
          <Text style={[styles.businessDetail, { fontWeight: "bold" }]}>
            {data.businessName}
          </Text>
          {data.businessAddress && (
            <Text style={styles.businessDetail}>{data.businessAddress}</Text>
          )}
          {data.businessPhone && (
            <Text style={styles.businessDetail}>{data.businessPhone}</Text>
          )}
          {data.businessEmail && (
            <Text style={styles.businessDetail}>{data.businessEmail}</Text>
          )}
        </View>

        {/* Thank you */}
        <Text style={styles.thankYou}>Thank you for your payment.</Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
