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
import { PDFLineItemsTable } from "../components/pdf-line-items-table";
import { PDFTotals } from "../components/pdf-totals";
import { PDFPaymentInfo } from "../components/pdf-payment-info";
import { PDFQRCode } from "../components/pdf-qr-code";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#2d3748",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  businessSection: {
    flex: 1,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 8,
  },
  businessName: {
    fontSize: 18,
    fontFamily: "EB Garamond",
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 9,
    color: "#4a5568",
    marginBottom: 2,
  },
  invoiceBox: {
    backgroundColor: "#f7fafc",
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center" as const,
  },
  invoiceLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
  },
  twoCols: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  billToCol: {
    flex: 1,
  },
  invoiceDetailsCol: {
    width: 200,
    backgroundColor: "#f7fafc",
    borderRadius: 4,
    padding: 14,
  },
  invoiceDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  invoiceDetailLabel: {
    fontSize: 9,
    color: "#718096",
  },
  invoiceDetailValue: {
    fontSize: 9,
    color: "#2d3748",
    fontWeight: "bold",
  },
  billToLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#718096",
    textTransform: "uppercase" as const,
    marginBottom: 6,
    letterSpacing: 1,
  },
  clientName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 9,
    color: "#4a5568",
    marginBottom: 1,
  },
  notesSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#718096",
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#4a5568",
    lineHeight: 1.5,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
  },
  bottomLeft: {
    flex: 1,
  },
  bottomRight: {
    alignItems: "center" as const,
    marginLeft: 20,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#a0aec0",
  },
  footerTerms: {
    fontSize: 8,
    color: "#718096",
  },
});

interface CleanProfessionalProps {
  data: InvoicePDFData;
}

export function CleanProfessionalTemplate({ data }: CleanProfessionalProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.businessSection}>
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
          <View style={styles.invoiceBox}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
          </View>
        </View>

        {/* Two-column: Bill To + Invoice Details */}
        <View style={styles.twoCols}>
          <View style={styles.billToCol}>
            <Text style={styles.billToLabel}>Bill To</Text>
            <Text style={styles.clientName}>{data.clientName}</Text>
            {data.clientParentName && (
              <Text style={styles.clientDetail}>
                c/o {data.clientParentName}
              </Text>
            )}
            {data.clientAddress && (
              <Text style={styles.clientDetail}>{data.clientAddress}</Text>
            )}
            {data.clientPhone && (
              <Text style={styles.clientDetail}>{data.clientPhone}</Text>
            )}
            {data.clientEmail && (
              <Text style={styles.clientDetail}>{data.clientEmail}</Text>
            )}
          </View>
          <View style={styles.invoiceDetailsCol}>
            <Text style={styles.billToLabel}>Invoice Details</Text>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>Invoice #</Text>
              <Text style={styles.invoiceDetailValue}>
                {data.invoiceNumber}
              </Text>
            </View>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>Issue Date</Text>
              <Text style={styles.invoiceDetailValue}>{data.issueDate}</Text>
            </View>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>Due Date</Text>
              <Text style={styles.invoiceDetailValue}>{data.dueDate}</Text>
            </View>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>Status</Text>
              <Text style={styles.invoiceDetailValue}>{data.status}</Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <PDFLineItemsTable lineItems={data.lineItems} currency={data.currency} />

        {/* Totals */}
        <PDFTotals
          subtotal={data.subtotal}
          discountLabel={data.discountLabel}
          discountAmount={data.discountAmount}
          taxLabel={data.taxLabel}
          taxAmount={data.taxAmount}
          total={data.total}
          currency={data.currency}
        />

        {/* Bottom section: payment info left, QR right */}
        <View style={styles.bottomRow}>
          <View style={styles.bottomLeft}>
            <PDFPaymentInfo
              bankName={data.bankName}
              bankHolder={data.bankHolder}
              bankAccount={data.bankAccount}
            />
          </View>
          {data.paynowQrDataUri && (
            <View style={styles.bottomRight}>
              <PDFQRCode qrDataUri={data.paynowQrDataUri} />
            </View>
          )}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View>
            {data.paymentTerms && (
              <Text style={styles.footerTerms}>
                Payment Terms: {data.paymentTerms}
              </Text>
            )}
            {data.lateFeeNote && (
              <Text style={styles.footerTerms}>{data.lateFeeNote}</Text>
            )}
            <Text style={[styles.footerText, { marginTop: 2 }]}>
              Thank you for your business.
            </Text>
          </View>
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
