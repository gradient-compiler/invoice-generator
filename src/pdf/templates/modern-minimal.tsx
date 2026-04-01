import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { InvoicePDFData } from "@/types";

const DARK = "#1a1a1a";
const GRAY = "#f5f5f5";
const MID = "#888888";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: DARK,
  },
  // Top: large invoice number left, business name small right
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  invoiceNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: DARK,
  },
  invoiceDateRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  dateLabel: {
    fontSize: 9,
    color: MID,
    marginRight: 4,
  },
  dateValue: {
    fontSize: 9,
    color: DARK,
    marginRight: 14,
  },
  businessRight: {
    alignItems: "flex-end" as const,
  },
  businessName: {
    fontSize: 11,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 2,
  },
  businessDetail: {
    fontSize: 8,
    color: MID,
    marginBottom: 1,
    textAlign: "right" as const,
  },
  // Client section
  clientSection: {
    marginBottom: 30,
  },
  toLabel: {
    fontSize: 9,
    color: MID,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 12,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 9,
    color: "#555555",
    marginBottom: 1,
  },
  // Table: no borders
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: DARK,
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: DARK,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
    borderBottomStyle: "dotted",
  },
  colDesc: { flex: 3, paddingRight: 8 },
  colQty: { flex: 1, textAlign: "center" as const },
  colPrice: { flex: 1, textAlign: "right" as const },
  colAmt: { flex: 1, textAlign: "right" as const },
  cellText: {
    fontSize: 10,
    color: DARK,
  },
  // Totals - right-aligned, minimal
  totalsSection: {
    alignItems: "flex-end" as const,
    marginBottom: 30,
  },
  totalsRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalsLabel: {
    fontSize: 9,
    color: MID,
  },
  totalsValue: {
    fontSize: 9,
    color: DARK,
  },
  totalsFinalRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: DARK,
    paddingTop: 6,
    marginTop: 4,
  },
  totalsFinalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: DARK,
  },
  totalsFinalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: DARK,
  },
  // Bottom
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
  },
  paymentSection: {
    flex: 1,
  },
  paymentHeading: {
    fontSize: 9,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  paymentLabel: {
    fontSize: 8,
    color: MID,
    width: 90,
  },
  paymentValue: {
    fontSize: 8,
    color: DARK,
  },
  qrRight: {
    alignItems: "center" as const,
    marginLeft: 20,
  },
  qrImage: {
    width: 80,
    height: 80,
  },
  qrLabel: {
    fontSize: 7,
    color: MID,
    marginTop: 3,
  },
  // Notes
  notesSection: {
    marginTop: 16,
  },
  notesText: {
    fontSize: 8,
    color: MID,
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: MID,
  },
});

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface ModernMinimalProps {
  data: InvoicePDFData;
}

export function ModernMinimalTemplate({ data }: ModernMinimalProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top: Invoice number + dates left, business info right */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>
            <View style={styles.invoiceDateRow}>
              <Text style={styles.dateLabel}>Issued</Text>
              <Text style={styles.dateValue}>{data.issueDate}</Text>
              <Text style={styles.dateLabel}>Due</Text>
              <Text style={styles.dateValue}>{data.dueDate}</Text>
            </View>
          </View>
          <View style={styles.businessRight}>
            <Text style={styles.businessName}>{data.businessName}</Text>
            {data.businessAddress && (
              <Text style={styles.businessDetail}>{data.businessAddress}</Text>
            )}
            {data.businessPhone && (
              <Text style={styles.businessDetail}>{data.businessPhone}</Text>
            )}
            {data.businessEmail && (
              <Text style={styles.businessDetail}>{data.businessEmail}</Text>
            )}
            {data.gstNumber && (
              <Text style={styles.businessDetail}>
                GST: {data.gstNumber}
              </Text>
            )}
          </View>
        </View>

        {/* Minimal client section */}
        <View style={styles.clientSection}>
          <Text style={styles.toLabel}>To:</Text>
          <Text style={styles.clientName}>{data.clientName}</Text>
          {data.clientParentName && (
            <Text style={styles.clientDetail}>
              c/o {data.clientParentName}
            </Text>
          )}
          {data.clientAddress && (
            <Text style={styles.clientDetail}>{data.clientAddress}</Text>
          )}
          {data.clientEmail && (
            <Text style={styles.clientDetail}>{data.clientEmail}</Text>
          )}
        </View>

        {/* Table: no borders, header by weight + single bottom line, dotted separators */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.tableHeaderText}>Description</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.tableHeaderText}>Qty</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.tableHeaderText}>Unit Price</Text>
            </View>
            <View style={styles.colAmt}>
              <Text style={styles.tableHeaderText}>Amount</Text>
            </View>
          </View>
          {data.lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.cellText}>{item.description}</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={styles.cellText}>
                  {item.quantity} {item.unitLabel}
                </Text>
              </View>
              <View style={styles.colPrice}>
                <Text style={styles.cellText}>{fmt(item.unitPrice)}</Text>
              </View>
              <View style={styles.colAmt}>
                <Text style={styles.cellText}>{fmt(item.amount)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals right-aligned, only total has top border */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{fmt(data.subtotal)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                {data.discountLabel || "Discount"}
              </Text>
              <Text style={styles.totalsValue}>
                -{fmt(data.discountAmount)}
              </Text>
            </View>
          )}
          {data.taxAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                {data.taxLabel || "Tax"}
              </Text>
              <Text style={styles.totalsValue}>{fmt(data.taxAmount)}</Text>
            </View>
          )}
          <View style={styles.totalsFinalRow}>
            <Text style={styles.totalsFinalLabel}>Total</Text>
            <Text style={styles.totalsFinalValue}>
              {data.currency} {fmt(data.total)}
            </Text>
          </View>
        </View>

        {/* Bottom: payment left, QR right */}
        <View style={styles.bottomRow}>
          <View style={styles.paymentSection}>
            {(data.bankName || data.bankAccount || data.bankHolder) && (
              <View>
                <Text style={styles.paymentHeading}>Payment Details</Text>
                {data.bankName && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Bank</Text>
                    <Text style={styles.paymentValue}>{data.bankName}</Text>
                  </View>
                )}
                {data.bankHolder && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Account Holder</Text>
                    <Text style={styles.paymentValue}>{data.bankHolder}</Text>
                  </View>
                )}
                {data.bankAccount && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Account Number</Text>
                    <Text style={styles.paymentValue}>{data.bankAccount}</Text>
                  </View>
                )}
              </View>
            )}
            {data.paymentTerms && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.paymentLabel}>
                  Terms: {data.paymentTerms}
                </Text>
              </View>
            )}
          </View>
          {data.paynowQrDataUri && (
            <View style={styles.qrRight}>
              <Image src={data.paynowQrDataUri} style={styles.qrImage} />
              <Text style={styles.qrLabel}>Scan to PayNow</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Single line footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Thank you for your business.
            {data.lateFeeNote ? ` ${data.lateFeeNote}` : ""}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
