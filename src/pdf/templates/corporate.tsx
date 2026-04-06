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

const NAVY = "#1a365d";
const DARK_GRAY = "#2d3748";
const MED_GRAY = "#4a5568";
const LIGHT_BG = "#f0f4f8";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: DARK_GRAY,
  },
  // Header band
  headerBand: {
    backgroundColor: LIGHT_BG,
    marginHorizontal: -40,
    marginTop: -40,
    paddingHorizontal: 40,
    paddingVertical: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 64,
    height: 64,
    marginRight: 14,
  },
  businessInfo: {},
  businessName: {
    fontSize: 20,
    fontFamily: "EB Garamond",
    fontWeight: "bold",
    color: NAVY,
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 9,
    color: MED_GRAY,
    marginBottom: 2,
  },
  headerRight: {
    alignItems: "flex-end" as const,
    justifyContent: "center" as const,
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: NAVY,
    textTransform: "uppercase" as const,
    letterSpacing: 2,
  },
  // Two-column section below header
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
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
    padding: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: NAVY,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 12,
    fontWeight: "bold",
    color: DARK_GRAY,
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 9,
    color: MED_GRAY,
    marginBottom: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 9,
    color: MED_GRAY,
  },
  detailValue: {
    fontSize: 9,
    color: DARK_GRAY,
    fontWeight: "bold",
  },
  // Notes
  notesSection: {
    marginTop: 12,
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: MED_GRAY,
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: MED_GRAY,
    lineHeight: 1.5,
  },
  // Bottom row: payment + QR
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
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerLeft: {},
  footerTerms: {
    fontSize: 8,
    color: MED_GRAY,
  },
  footerText: {
    fontSize: 8,
    color: "#a0aec0",
  },
});

interface CorporateProps {
  data: InvoicePDFData;
}

export function CorporateTemplate({ data }: CorporateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Gray header band */}
        <View style={styles.headerBand}>
          <View style={styles.headerLeft}>
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
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>Invoice</Text>
          </View>
        </View>

        {/* Two-column: Bill To + Invoice Details box */}
        <View style={styles.twoCols}>
          <View style={styles.billToCol}>
            <Text style={styles.sectionLabel}>Bill To</Text>
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
            <Text style={styles.sectionLabel}>Invoice Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice #</Text>
              <Text style={styles.detailValue}>{data.invoiceNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Issue Date</Text>
              <Text style={styles.detailValue}>{data.issueDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={styles.detailValue}>{data.dueDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{data.status}</Text>
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
