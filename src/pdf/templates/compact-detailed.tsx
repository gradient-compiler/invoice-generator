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

const DARK = "#1a1a1a";
const MID = "#555555";
const LIGHT = "#999999";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: DARK,
  },
  /* ---- Header ---- */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  businessSection: {
    flex: 1,
  },
  businessRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 10,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 14,
    fontFamily: "EB Garamond",
    fontWeight: "bold",
    color: DARK,
    marginBottom: 2,
  },
  businessDetail: {
    fontSize: 8,
    color: MID,
    marginBottom: 1,
  },
  invoiceSection: {
    alignItems: "flex-end" as const,
    width: 160,
  },
  invoiceLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 2,
  },
  invoiceDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 160,
    marginBottom: 2,
  },
  invoiceDetailLabel: {
    fontSize: 8,
    color: LIGHT,
  },
  invoiceDetailValue: {
    fontSize: 8,
    color: DARK,
    fontWeight: "bold",
  },
  /* ---- Bill To ---- */
  billTo: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dddddd",
  },
  billToLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: LIGHT,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 10,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 1,
  },
  clientDetail: {
    fontSize: 8,
    color: MID,
    marginBottom: 1,
  },
  /* ---- Notes ---- */
  notesSection: {
    marginTop: 8,
    marginBottom: 10,
  },
  notesLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: LIGHT,
    textTransform: "uppercase" as const,
    marginBottom: 3,
  },
  notesText: {
    fontSize: 8,
    color: MID,
    lineHeight: 1.4,
  },
  /* ---- Tear-off separator ---- */
  tearOffSection: {
    marginTop: 14,
    marginBottom: 10,
    alignItems: "center" as const,
  },
  tearOffLine: {
    fontSize: 9,
    color: LIGHT,
    letterSpacing: 3,
  },
  tearOffLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: LIGHT,
    textTransform: "uppercase" as const,
    letterSpacing: 2,
    marginTop: 4,
  },
  /* ---- Payment Slip ---- */
  paymentSlip: {
    paddingTop: 8,
  },
  slipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  slipLeft: {
    flex: 1,
  },
  slipRight: {
    alignItems: "center" as const,
    marginLeft: 16,
  },
  slipSummaryRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  slipLabel: {
    fontSize: 8,
    color: LIGHT,
    width: 80,
  },
  slipValue: {
    fontSize: 8,
    color: DARK,
    fontWeight: "bold",
  },
  slipSectionHeading: {
    fontSize: 9,
    fontWeight: "bold",
    color: DARK,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  /* ---- Handwritten lines ---- */
  handwrittenSection: {
    marginTop: 12,
  },
  handwrittenLine: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  handwrittenLabel: {
    fontSize: 8,
    color: MID,
    marginRight: 4,
  },
  handwrittenBlank: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT,
    maxWidth: 160,
    height: 12,
  },
  /* ---- Footer ---- */
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 0.5,
    borderTopColor: "#dddddd",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    fontSize: 7,
    color: LIGHT,
  },
  footerTerms: {
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

interface CompactDetailedProps {
  data: InvoicePDFData;
}

export function CompactDetailedTemplate({ data }: CompactDetailedProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header: business left, invoice details right */}
        <View style={styles.header}>
          <View style={styles.businessSection}>
            <View style={styles.businessRow}>
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
          </View>
          <View style={styles.invoiceSection}>
            <Text style={styles.invoiceLabel}>Invoice</Text>
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

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Dashed tear-off separator */}
        <View style={styles.tearOffSection}>
          <Text style={styles.tearOffLine}>
            - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            - - - - - - - - - - - - - - - -
          </Text>
          <Text style={styles.tearOffLabel}>Payment Slip</Text>
        </View>

        {/* Payment Slip section */}
        <View style={styles.paymentSlip}>
          <Text style={styles.slipSectionHeading}>Payment Summary</Text>
          <View style={styles.slipRow}>
            <View style={styles.slipLeft}>
              <View style={styles.slipSummaryRow}>
                <Text style={styles.slipLabel}>Invoice #</Text>
                <Text style={styles.slipValue}>{data.invoiceNumber}</Text>
              </View>
              <View style={styles.slipSummaryRow}>
                <Text style={styles.slipLabel}>Client</Text>
                <Text style={styles.slipValue}>{data.clientName}</Text>
              </View>
              <View style={styles.slipSummaryRow}>
                <Text style={styles.slipLabel}>Amount Due</Text>
                <Text style={styles.slipValue}>
                  {data.currency} {fmt(data.total)}
                </Text>
              </View>

              {/* Bank / payment details */}
              <View style={{ marginTop: 8 }}>
                <PDFPaymentInfo
                  bankName={data.bankName}
                  bankHolder={data.bankHolder}
                  bankAccount={data.bankAccount}
                />
              </View>

              {/* Handwritten confirmation lines */}
              <View style={styles.handwrittenSection}>
                <View style={styles.handwrittenLine}>
                  <Text style={styles.handwrittenLabel}>Amount Paid:</Text>
                  <View style={styles.handwrittenBlank} />
                </View>
                <View style={styles.handwrittenLine}>
                  <Text style={styles.handwrittenLabel}>Date:</Text>
                  <View style={styles.handwrittenBlank} />
                </View>
              </View>
            </View>

            {/* QR code on the right */}
            {data.paynowQrDataUri && (
              <View style={styles.slipRight}>
                <PDFQRCode qrDataUri={data.paynowQrDataUri} />
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
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
