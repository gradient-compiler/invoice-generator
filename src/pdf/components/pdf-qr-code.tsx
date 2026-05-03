import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    alignItems: "center" as const,
  },
  image: {
    width: 100,
    height: 100,
  },
  label: {
    fontSize: 8,
    color: "#718096",
    marginTop: 4,
    textAlign: "center" as const,
  },
});

interface PDFQRCodeProps {
  qrDataUri: string;
  paynowNumber?: string;
}

export function PDFQRCode({ qrDataUri, paynowNumber }: PDFQRCodeProps) {
  return (
    <View style={styles.container}>
      <Image src={qrDataUri} style={styles.image} />
      <Text style={styles.label}>Scan to PayNow</Text>
      {paynowNumber && (
        <Text style={styles.label}>or PayNow to {paynowNumber}</Text>
      )}
    </View>
  );
}
