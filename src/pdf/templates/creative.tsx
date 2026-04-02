import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { InvoicePDFData } from "@/types";
import { PDFLineItemsTable } from "../components/pdf-line-items-table";
import { PDFTotals } from "../components/pdf-totals";
import { PDFPaymentInfo } from "../components/pdf-payment-info";
import { PDFQRCode } from "../components/pdf-qr-code";

const ACCENT = "#3182ce";
const DARK = "#1a202c";
const MID_GRAY = "#4a5568";

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingLeft: 50,
    paddingRight: 40,
    paddingBottom: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: DARK,
  },
  /* Accent stripe across the very top of the page */
  topStripe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: ACCENT,
  },
  /* Thin sidebar strip running down the left edge */
  sidebarStrip: {
    position: "absolute",
    top: 8,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: ACCENT,
  },
  /* Large "INVOICE" heading */
  invoiceTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: ACCENT,
    marginTop: 12,
    marginBottom: 4,
  },
  /* Invoice number displayed prominently */
  invoiceNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 16,
  },
  /* Header row: business info (with logo) left, invoice details right */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  businessSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  logo: {
    width: 56,
    height: 56,
    marginRight: 10,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 14,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 3,
  },
  businessDetail: {
    fontSize: 9,
    color: MID_GRAY,
    marginBottom: 1,
  },
  invoiceDetailsBox: {
    width: 160,
  },
  invoiceDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  invoiceDetailLabel: {
    fontSize: 9,
    color: MID_GRAY,
  },
  invoiceDetailValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: DARK,
  },
  /* Bill To section */
  billTo: {
    marginBottom: 24,
  },
  billToLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: ACCENT,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 12,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 9,
    color: MID_GRAY,
    marginBottom: 1,
  },
  /* Notes */
  notesSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: ACCENT,
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: MID_GRAY,
    lineHeight: 1.5,
  },
  /* Bottom row: payment info left, QR right */
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
  /* Footer */
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: ACCENT,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerTerms: {
    fontSize: 8,
    color: MID_GRAY,
  },
  footerText: {
    fontSize: 8,
    color: MID_GRAY,
  },
});

interface CreativeProps {
  data: InvoicePDFData;
}

export function CreativeTemplate({ data }: CreativeProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Accent stripe at the very top */}
        <View style={styles.topStripe} fixed />

        {/* Thin sidebar strip down the left edge */}
        <View style={styles.sidebarStrip} fixed />

        {/* Large bold INVOICE title */}
        <Text style={styles.invoiceTitle}>INVOICE</Text>

        {/* Invoice number prominently displayed */}
        <Text style={styles.invoiceNumber}>{data.invoiceNumber}</Text>

        {/* Header: business info (with logo) left, invoice details right */}
        <View style={styles.headerRow}>
          <View style={styles.businessSection}>
            {data.logoPath && (
              <Image src={data.logoPath} style={styles.logo} />
            )}
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{data.businessName}</Text>
              {data.businessAddress && (
                <Text style={styles.businessDetail}>
                  {data.businessAddress}
                </Text>
              )}
              {data.businessPhone && (
                <Text style={styles.businessDetail}>
                  {data.businessPhone}
                </Text>
              )}
              {data.businessEmail && (
                <Text style={styles.businessDetail}>
                  {data.businessEmail}
                </Text>
              )}
              {data.gstNumber && (
                <Text style={styles.businessDetail}>
                  GST Reg: {data.gstNumber}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.invoiceDetailsBox}>
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

        {/* Bill To */}
        <View style={styles.billTo}>
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
