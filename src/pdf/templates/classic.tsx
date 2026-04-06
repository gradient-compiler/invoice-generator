import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import "@/pdf/fonts";
import type { InvoicePDFData } from "@/types";

const ACCENT = "#1a365d";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#000000",
  },
  // Header - centered
  headerSection: {
    alignItems: "center" as const,
    marginBottom: 6,
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 6,
  },
  businessName: {
    fontSize: 18,
    fontFamily: "EB Garamond",
    fontWeight: "bold",
    color: ACCENT,
    marginBottom: 2,
    textAlign: "center" as const,
  },
  businessDetail: {
    fontSize: 9,
    color: "#333333",
    marginBottom: 1,
    textAlign: "center" as const,
  },
  hr: {
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
    marginVertical: 12,
  },
  // Two-column: Bill To + Invoice details
  twoCols: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  col: {
    width: "48%",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: ACCENT,
    marginBottom: 6,
    textTransform: "uppercase" as const,
  },
  detailText: {
    fontSize: 9,
    color: "#333333",
    marginBottom: 2,
  },
  detailLabel: {
    fontWeight: "bold",
  },
  // Table
  table: {
    marginBottom: 2,
    borderWidth: 1,
    borderColor: "#333333",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: ACCENT,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase" as const,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  colDesc: { flex: 3, paddingRight: 6 },
  colQty: { flex: 1, textAlign: "center" as const },
  colPrice: { flex: 1, textAlign: "right" as const },
  colAmt: { flex: 1, textAlign: "right" as const },
  cellText: {
    fontSize: 9,
    color: "#000000",
  },
  // Totals as table rows
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  grandTotalRow: {
    flexDirection: "row",
    borderTopWidth: 2,
    borderTopColor: ACCENT,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: "#f0f4f8",
  },
  totalLabel: {
    flex: 5,
    textAlign: "right" as const,
    paddingRight: 10,
    fontSize: 9,
    color: "#333333",
  },
  totalValue: {
    flex: 1,
    textAlign: "right" as const,
    fontSize: 9,
    color: "#333333",
  },
  grandTotalLabel: {
    flex: 5,
    textAlign: "right" as const,
    paddingRight: 10,
    fontSize: 11,
    fontWeight: "bold",
    color: ACCENT,
  },
  grandTotalValue: {
    flex: 1,
    textAlign: "right" as const,
    fontSize: 11,
    fontWeight: "bold",
    color: ACCENT,
  },
  // Payment terms centered
  paymentTermsCenter: {
    textAlign: "center" as const,
    fontSize: 9,
    color: "#333333",
    marginVertical: 14,
  },
  // Bank details box
  bankBox: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
    padding: 12,
    marginBottom: 14,
  },
  bankHeading: {
    fontSize: 10,
    fontWeight: "bold",
    color: ACCENT,
    marginBottom: 6,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bankLabel: {
    fontSize: 9,
    color: "#666666",
    width: 110,
  },
  bankValue: {
    fontSize: 9,
    color: "#000000",
  },
  // QR centered
  qrCenter: {
    alignItems: "center" as const,
    marginBottom: 12,
  },
  qrImage: {
    width: 90,
    height: 90,
  },
  qrLabel: {
    fontSize: 8,
    color: "#666666",
    marginTop: 4,
  },
  // Notes
  notesSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#666666",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#999999",
  },
});

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface ClassicProps {
  data: InvoicePDFData;
}

export function ClassicTemplate({ data }: ClassicProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Centered header */}
        <View style={styles.headerSection}>
          {data.logoPath && (
            <Image src={data.logoPath} style={styles.logo} />
          )}
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
              GST Reg: {data.gstNumber}
            </Text>
          )}
        </View>

        <View style={styles.hr} />

        {/* Two columns: Bill To + Invoice info */}
        <View style={styles.twoCols}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={[styles.detailText, { fontWeight: "bold" }]}>
              {data.clientName}
            </Text>
            {data.clientParentName && (
              <Text style={styles.detailText}>
                c/o {data.clientParentName}
              </Text>
            )}
            {data.clientAddress && (
              <Text style={styles.detailText}>{data.clientAddress}</Text>
            )}
            {data.clientPhone && (
              <Text style={styles.detailText}>{data.clientPhone}</Text>
            )}
            {data.clientEmail && (
              <Text style={styles.detailText}>{data.clientEmail}</Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Invoice Details</Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Invoice #: </Text>
              {data.invoiceNumber}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Issue Date: </Text>
              {data.issueDate}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Due Date: </Text>
              {data.dueDate}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Status: </Text>
              {data.status}
            </Text>
          </View>
        </View>

        {/* Table with full borders */}
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

          {/* Totals as final rows */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(data.subtotal)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {data.discountLabel || "Discount"}
              </Text>
              <Text style={styles.totalValue}>
                -{fmt(data.discountAmount)}
              </Text>
            </View>
          )}
          {data.taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {data.taxLabel || "Tax"}
              </Text>
              <Text style={styles.totalValue}>{fmt(data.taxAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total ({data.currency})</Text>
            <Text style={styles.grandTotalValue}>{fmt(data.total)}</Text>
          </View>
        </View>

        {/* Payment terms centered */}
        {data.paymentTerms && (
          <Text style={styles.paymentTermsCenter}>
            Payment Terms: {data.paymentTerms}
            {data.lateFeeNote ? ` | ${data.lateFeeNote}` : ""}
          </Text>
        )}

        {/* Bank details in bordered box */}
        {(data.bankName || data.bankAccount || data.bankHolder) && (
          <View style={styles.bankBox}>
            <Text style={styles.bankHeading}>Payment Details</Text>
            {data.bankName && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Bank</Text>
                <Text style={styles.bankValue}>{data.bankName}</Text>
              </View>
            )}
            {data.bankHolder && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Account Holder</Text>
                <Text style={styles.bankValue}>{data.bankHolder}</Text>
              </View>
            )}
            {data.bankAccount && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Account Number</Text>
                <Text style={styles.bankValue}>{data.bankAccount}</Text>
              </View>
            )}
          </View>
        )}

        {/* QR code centered */}
        {data.paynowQrDataUri && (
          <View style={styles.qrCenter}>
            <Image src={data.paynowQrDataUri} style={styles.qrImage} />
            <Text style={styles.qrLabel}>Scan to PayNow</Text>
          </View>
        )}

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Thank you for your business.
          </Text>
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
