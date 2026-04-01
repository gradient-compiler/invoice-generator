import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  totals: {
    alignItems: "flex-end" as const,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
    width: 220,
  },
  label: {
    flex: 1,
    fontSize: 10,
    color: "#4a5568",
    textAlign: "right" as const,
    paddingRight: 12,
  },
  value: {
    width: 90,
    fontSize: 10,
    color: "#2d3748",
    textAlign: "right" as const,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 220,
    borderTopWidth: 2,
    borderTopColor: "#1a365d",
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a365d",
    textAlign: "right" as const,
    paddingRight: 12,
  },
  totalValue: {
    width: 90,
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a365d",
    textAlign: "right" as const,
  },
});

interface PDFTotalsProps {
  subtotal: number;
  discountLabel?: string;
  discountAmount: number;
  taxLabel?: string;
  taxAmount: number;
  total: number;
  currency: string;
}

function formatAmount(amount: number) {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PDFTotals({
  subtotal,
  discountLabel,
  discountAmount,
  taxLabel,
  taxAmount,
  total,
  currency,
}: PDFTotalsProps) {
  return (
    <View style={styles.totals}>
      <View style={styles.row}>
        <Text style={styles.label}>Subtotal</Text>
        <Text style={styles.value}>{formatAmount(subtotal)}</Text>
      </View>
      {discountAmount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>{discountLabel || "Discount"}</Text>
          <Text style={styles.value}>-{formatAmount(discountAmount)}</Text>
        </View>
      )}
      {taxAmount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>{taxLabel || "Tax"}</Text>
          <Text style={styles.value}>{formatAmount(taxAmount)}</Text>
        </View>
      )}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total ({currency})</Text>
        <Text style={styles.totalValue}>{formatAmount(total)}</Text>
      </View>
    </View>
  );
}
