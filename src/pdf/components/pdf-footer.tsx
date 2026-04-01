import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#718096",
    marginBottom: 2,
  },
  thankYou: {
    fontSize: 9,
    color: "#4a5568",
    fontWeight: "bold",
    marginTop: 4,
  },
  pageNumber: {
    fontSize: 8,
    color: "#a0aec0",
    textAlign: "right" as const,
    marginTop: 4,
  },
});

interface PDFFooterProps {
  paymentTerms?: string;
  lateFeeNote?: string;
}

export function PDFFooter({ paymentTerms, lateFeeNote }: PDFFooterProps) {
  return (
    <View style={styles.footer} fixed>
      {paymentTerms && (
        <Text style={styles.footerText}>Payment Terms: {paymentTerms}</Text>
      )}
      {lateFeeNote && (
        <Text style={styles.footerText}>{lateFeeNote}</Text>
      )}
      <Text style={styles.thankYou}>Thank you for your business.</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}
