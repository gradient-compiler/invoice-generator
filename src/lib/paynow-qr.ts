import * as QRCode from "qrcode";

export interface PayNowQRParams {
  /** Company UEN */
  uen?: string;
  /** Mobile number (e.g. "+6591234567") */
  mobile?: string;
  /** Transaction amount in SGD */
  amount?: number;
  /** Payment reference / invoice number */
  reference?: string;
  /** Whether the amount is editable by the payer (default true) */
  editable?: boolean;
  /** Merchant/business name shown to payer (max 25 chars, default "NA") */
  merchantName?: string;
  /** Expiry date in YYYYMMDD format (default: 5 years from now) */
  expiry?: string;
}

/**
 * Build a TLV (Tag-Length-Value) field for the SGQR/EMV payload.
 */
function tlv(tag: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${tag}${len}${value}`;
}

/**
 * Compute the CRC-16/CCITT-FALSE checksum used in EMV QR codes.
 */
function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Build the PayNow QR payload string following the SGQR / EMV QRCPS standard.
 */
export function buildPayNowPayload(params: PayNowQRParams): string {
  const {
    uen,
    mobile,
    amount,
    reference,
    editable = true,
    merchantName,
    expiry,
  } = params;

  if (!uen && !mobile) {
    throw new Error("Either UEN or mobile number must be provided");
  }

  // Proxy type: 0 = mobile, 2 = UEN
  const proxyType = uen ? "2" : "0";

  // Normalize mobile to E.164 format with +65 prefix
  let proxyValue = uen ?? mobile!;
  if (!uen && proxyValue && !proxyValue.startsWith("+")) {
    proxyValue = "+65" + proxyValue;
  }

  // Build merchant account information (tag 26)
  let merchantAccount = "";
  merchantAccount += tlv("00", "SG.PAYNOW");
  merchantAccount += tlv("01", proxyType);
  merchantAccount += tlv("02", proxyValue);
  merchantAccount += tlv("03", editable ? "1" : "0");
  // Expiry date (default: 5 years from now)
  const expiryDate =
    expiry ||
    new Date(Date.now() + 5 * 365.25 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");
  merchantAccount += tlv("04", expiryDate);

  let payload = "";
  // Payload format indicator
  payload += tlv("00", "01");
  // Point of initiation method (12 = dynamic)
  payload += tlv("01", "12");
  // Merchant account information - PayNow
  payload += tlv("26", merchantAccount);
  // Merchant category code
  payload += tlv("52", "0000");
  // Transaction currency (702 = SGD)
  payload += tlv("53", "702");

  // Transaction amount (optional)
  if (amount !== undefined && amount > 0) {
    payload += tlv("54", String(amount));
  }

  // Country code
  payload += tlv("58", "SG");
  // Merchant name (max 25 chars per EMVCo spec)
  const name = merchantName ? merchantName.substring(0, 25) : "NA";
  payload += tlv("59", name);
  // Merchant city
  payload += tlv("60", "Singapore");

  // Additional data field (tag 62) with bill number (sub-tag 01 per PayNow v1.2)
  if (reference) {
    const additionalData = tlv("01", reference);
    payload += tlv("62", additionalData);
  }

  // CRC placeholder: tag "63", length "04", then compute over the whole string
  payload += "6304";
  const checksum = crc16(payload);
  payload += checksum;

  return payload;
}

/**
 * Generate a PayNow QR code as a PNG data URI (base64).
 *
 * @param params - PayNow parameters (UEN or mobile required)
 * @returns data:image/png;base64,... string
 */
export async function generatePayNowQR(
  params: PayNowQRParams
): Promise<string> {
  const payload = buildPayNowPayload(params);
  return QRCode.toDataURL(payload);
}
