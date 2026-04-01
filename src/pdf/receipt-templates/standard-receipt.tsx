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
    alignItems: "center" as const,
    marginBottom: 40,
  },
  receiptLabel: {
    fontSize: 28,
    fontWeight: "bold",
    color: ACCENT,
    letterSpacing: 4,
    marginBottom: 8,
  },
  receiptNumber: {
    fontSize: 12,
    color: "#718096",
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    color: "#718096",
    width: 140,
  },
  value: {
    fontSize: 10,
    color: "#2d3748",
    fontWeight: "bold",
  },
  invoiceRef: {
    fontSize: 11,
    color: "#4a5568",
    textAlign: "center" as const,
    marginBottom: 24,
  },
  amountSection: {
    alignItems: "center" as const,
    backgroundColor: "#f7fafc",
    borderRadius: 6,
    padding: 20,
    marginVertical: 24,
  },
  amountLabel: {
    fontSize: 10,
    color: "#718096",
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: ACCENT,
  },
  businessSection: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 16,
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
    fontSize: 11,
    color: ACCENT,
    fontWeight: "bold",
    marginTop: 40,
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

interface StandardReceiptProps {
  data: ReceiptPDFData;
}

export function StandardReceiptTemplate({ data }: StandardReceiptProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.receiptLabel}>RECEIPT</Text>
          <Text style={styles.receiptNumber}>{data.receiptNumber}</Text>
        </View>

        {/* Invoice reference */}
        <Text style={styles.invoiceRef}>
          For payment of Invoice #{data.invoiceNumber}
        </Text>

        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Received From</Text>
            <Text style={styles.value}>
              {data.clientName}
              {data.clientParentName ? ` (${data.clientParentName})` : ""}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date</Text>
            <Text style={styles.value}>{data.paymentDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{data.paymentMethod || "\u2014"}</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>
            {fmt(data.amount, data.currency)}
          </Text>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>Notes</Text>
              <Text style={[styles.value, { fontWeight: "normal" }]}>
                {data.notes}
              </Text>
            </View>
          </View>
        )}

        {/* Business details */}
        <View style={styles.businessSection}>
          <Text style={styles.businessLabel}>Issued By</Text>
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
