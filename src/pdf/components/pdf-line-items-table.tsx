import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  table: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#1a365d",
    paddingBottom: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  rowAlt: {
    backgroundColor: "#f7fafc",
  },
  colDescription: {
    flex: 3,
    paddingRight: 8,
  },
  colQty: {
    flex: 1,
    textAlign: "center" as const,
  },
  colUnitPrice: {
    flex: 1,
    textAlign: "right" as const,
  },
  colAmount: {
    flex: 1,
    textAlign: "right" as const,
  },
  headerText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1a365d",
    textTransform: "uppercase" as const,
  },
  cellText: {
    fontSize: 10,
    color: "#2d3748",
  },
});

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unitLabel: string;
  amount: number;
}

interface PDFLineItemsTableProps {
  lineItems: LineItem[];
  currency: string;
}

function formatAmount(amount: number, currency: string) {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PDFLineItemsTable({
  lineItems,
  currency,
}: PDFLineItemsTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <View style={styles.colDescription}>
          <Text style={styles.headerText}>Description</Text>
        </View>
        <View style={styles.colQty}>
          <Text style={styles.headerText}>Qty</Text>
        </View>
        <View style={styles.colUnitPrice}>
          <Text style={styles.headerText}>Unit Price</Text>
        </View>
        <View style={styles.colAmount}>
          <Text style={styles.headerText}>Amount</Text>
        </View>
      </View>
      {lineItems.map((item, index) => (
        <View
          key={index}
          style={[styles.row, index % 2 === 1 ? styles.rowAlt : {}]}
        >
          <View style={styles.colDescription}>
            <Text style={styles.cellText}>{item.description}</Text>
          </View>
          <View style={styles.colQty}>
            <Text style={styles.cellText}>
              {item.quantity} {item.unitLabel}
            </Text>
          </View>
          <View style={styles.colUnitPrice}>
            <Text style={styles.cellText}>
              {formatAmount(item.unitPrice, currency)}
            </Text>
          </View>
          <View style={styles.colAmount}>
            <Text style={styles.cellText}>
              {formatAmount(item.amount, currency)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
