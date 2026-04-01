import { renderToBuffer } from "@react-pdf/renderer";
import type { InvoicePDFData } from "@/types";
import { CleanProfessionalTemplate } from "./templates/clean-professional";
import { ClassicTemplate } from "./templates/classic";
import { ModernMinimalTemplate } from "./templates/modern-minimal";
import React from "react";

const TEMPLATES: Record<
  string,
  React.FC<{ data: InvoicePDFData }>
> = {
  "clean-professional": CleanProfessionalTemplate,
  classic: ClassicTemplate,
  "modern-minimal": ModernMinimalTemplate,
};

export async function renderInvoicePDF(
  data: InvoicePDFData,
  templateSlug: string
): Promise<Buffer> {
  const Template = TEMPLATES[templateSlug] ?? TEMPLATES["clean-professional"];
  const element = React.createElement(Template, { data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
