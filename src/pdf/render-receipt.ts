import { renderToBuffer } from "@react-pdf/renderer";
import type { ReceiptPDFData } from "@/types";
import { StandardReceiptTemplate } from "./receipt-templates/standard-receipt";
import React from "react";

export async function renderReceiptPDF(
  data: ReceiptPDFData
): Promise<Buffer> {
  const element = React.createElement(StandardReceiptTemplate, { data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
