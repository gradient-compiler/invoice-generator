import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { InvoicePDFData } from "@/types";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  businessSection: {
    flex: 1,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  businessName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 9,
    color: "#4a5568",
    marginBottom: 2,
  },
  invoiceSection: {
    alignItems: "flex-end" as const,
  },
  invoiceLabel: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 8,
  },
  invoiceDetail: {
    fontSize: 9,
    color: "#4a5568",
    marginBottom: 2,
    textAlign: "right" as const,
  },
  invoiceDetailLabel: {
    fontWeight: "bold",
    color: "#2d3748",
  },
});

interface PDFHeaderProps {
  data: InvoicePDFData;
}

export function PDFHeader({ data }: PDFHeaderProps) {
  return (
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
          <Text style={styles.businessDetail}>GST Reg: {data.gstNumber}</Text>
        )}
      </View>
      <View style={styles.invoiceSection}>
        <Text style={styles.invoiceLabel}>INVOICE</Text>
        <Text style={styles.invoiceDetail}>
          <Text style={styles.invoiceDetailLabel}>Invoice #: </Text>
          {data.invoiceNumber}
        </Text>
        <Text style={styles.invoiceDetail}>
          <Text style={styles.invoiceDetailLabel}>Issue Date: </Text>
          {data.issueDate}
        </Text>
        <Text style={styles.invoiceDetail}>
          <Text style={styles.invoiceDetailLabel}>Due Date: </Text>
          {data.dueDate}
        </Text>
      </View>
    </View>
  );
}
