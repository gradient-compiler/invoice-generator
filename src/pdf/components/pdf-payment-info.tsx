import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  heading: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    fontSize: 9,
    color: "#718096",
    width: 100,
  },
  value: {
    fontSize: 9,
    color: "#2d3748",
  },
});

interface PDFPaymentInfoProps {
  bankName?: string;
  bankHolder?: string;
  bankAccount?: string;
  paynowNumber?: string;
}

export function PDFPaymentInfo({
  bankName,
  bankHolder,
  bankAccount,
  paynowNumber,
}: PDFPaymentInfoProps) {
  const hasInfo = bankName || bankHolder || bankAccount || paynowNumber;
  if (!hasInfo) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Payment Details</Text>
      {bankName && (
        <View style={styles.row}>
          <Text style={styles.label}>Bank</Text>
          <Text style={styles.value}>{bankName}</Text>
        </View>
      )}
      {bankHolder && (
        <View style={styles.row}>
          <Text style={styles.label}>Account Holder</Text>
          <Text style={styles.value}>{bankHolder}</Text>
        </View>
      )}
      {bankAccount && (
        <View style={styles.row}>
          <Text style={styles.label}>Account Number</Text>
          <Text style={styles.value}>{bankAccount}</Text>
        </View>
      )}
      {paynowNumber && (
        <View style={styles.row}>
          <Text style={styles.label}>PayNow</Text>
          <Text style={styles.value}>{paynowNumber}</Text>
        </View>
      )}
    </View>
  );
}
