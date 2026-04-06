/**
 * Miniature visual previews of each PDF template.
 * These are standard HTML/CSS components (not @react-pdf/renderer)
 * that approximate each template's layout at thumbnail scale.
 */

const bar = (w: string, bg: string, h = "3px") => (
  <div style={{ width: w, height: h, borderRadius: 1, background: bg }} />
);

const rows = (count: number, accent: string, gray: string) =>
  Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "2px 0",
        borderBottom: `0.5px solid ${gray}`,
      }}
    >
      {bar("55%", "#9ca3af")}
      {bar("12%", "#d1d5db")}
      {bar("12%", "#d1d5db")}
      {bar("12%", accent)}
    </div>
  ));

export function CleanProfessionalPreview() {
  const accent = "#1a365d";
  return (
    <div
      className="mb-3 aspect-[210/297] rounded border bg-white overflow-hidden"
      style={{ padding: "10px", fontSize: 0 }}
    >
      {/* Header: business left, invoice box right */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          {bar("48px", accent, "6px")}
          <div style={{ marginTop: 3 }}>{bar("36px", "#94a3b8")}</div>
          <div style={{ marginTop: 2 }}>{bar("30px", "#cbd5e1")}</div>
        </div>
        <div
          style={{
            background: "#f7fafc",
            borderRadius: 2,
            padding: 4,
            width: 44,
          }}
        >
          {bar("28px", accent, "5px")}
          <div style={{ marginTop: 3 }}>{bar("100%", "#e2e8f0")}</div>
          <div style={{ marginTop: 2 }}>{bar("100%", "#e2e8f0")}</div>
          <div style={{ marginTop: 2 }}>{bar("100%", "#e2e8f0")}</div>
        </div>
      </div>
      {/* Bill To */}
      <div style={{ marginBottom: 6 }}>
        {bar("20px", "#94a3b8", "2px")}
        <div style={{ marginTop: 3 }}>{bar("40px", "#4a5568", "4px")}</div>
        <div style={{ marginTop: 2 }}>{bar("32px", "#cbd5e1")}</div>
      </div>
      {/* Table header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "2px 0",
          borderBottom: `1px solid ${accent}`,
          marginBottom: 2,
        }}
      >
        {bar("55%", accent)}
        {bar("12%", accent)}
        {bar("12%", accent)}
        {bar("12%", accent)}
      </div>
      {/* Table rows */}
      {rows(3, "#4a5568", "#e2e8f0")}
      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <div style={{ width: "40%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            {bar("50%", "#94a3b8")}
            {bar("30%", "#4a5568")}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: `1px solid ${accent}`,
              paddingTop: 2,
            }}
          >
            {bar("50%", accent, "4px")}
            {bar("30%", accent, "4px")}
          </div>
        </div>
      </div>
      {/* Payment info */}
      <div style={{ marginTop: 8 }}>
        {bar("32px", "#cbd5e1")}
        <div style={{ marginTop: 2 }}>{bar("48px", "#e2e8f0")}</div>
      </div>
    </div>
  );
}

export function ClassicPreview() {
  const accent = "#1a365d";
  return (
    <div
      className="mb-3 aspect-[210/297] rounded border bg-white overflow-hidden"
      style={{ padding: "10px", fontSize: 0 }}
    >
      {/* Header: centered */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 4 }}>
        {bar("52px", accent, "6px")}
        <div style={{ marginTop: 3 }}>{bar("36px", "#94a3b8")}</div>
        <div style={{ marginTop: 2 }}>{bar("28px", "#cbd5e1")}</div>
      </div>
      {/* HR */}
      <div style={{ borderBottom: `1.5px solid ${accent}`, marginBottom: 6, marginTop: 4 }} />
      {/* Two columns: Bill To + Invoice details */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          {bar("20px", "#94a3b8", "2px")}
          <div style={{ marginTop: 3 }}>{bar("36px", "#4a5568", "4px")}</div>
          <div style={{ marginTop: 2 }}>{bar("28px", "#cbd5e1")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {bar("20px", "#94a3b8", "2px")}
          <div style={{ marginTop: 3 }}>{bar("36px", "#e2e8f0")}</div>
          <div style={{ marginTop: 2 }}>{bar("36px", "#e2e8f0")}</div>
        </div>
      </div>
      {/* Table with dark header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: accent,
          padding: "3px 2px",
          borderRadius: "1px",
          marginBottom: 1,
        }}
      >
        {bar("55%", "#ffffff")}
        {bar("12%", "#ffffff")}
        {bar("12%", "#ffffff")}
        {bar("12%", "#ffffff")}
      </div>
      {rows(3, "#333333", "#d1d5db")}
      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <div style={{ width: "40%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            {bar("50%", "#94a3b8")}
            {bar("30%", "#333333")}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: `1.5px solid ${accent}`,
              paddingTop: 2,
            }}
          >
            {bar("50%", accent, "4px")}
            {bar("30%", accent, "4px")}
          </div>
        </div>
      </div>
      {/* Footer */}
      <div style={{ marginTop: 8, borderTop: "0.5px solid #e2e8f0", paddingTop: 4 }}>
        {bar("56px", "#e2e8f0")}
      </div>
    </div>
  );
}

export function CorporatePreview() {
  const accent = "#1a365d";
  return (
    <div
      className="mb-3 aspect-[210/297] rounded border bg-white overflow-hidden"
      style={{ fontSize: 0 }}
    >
      {/* Gray header band */}
      <div style={{ background: "#f0f4f8", padding: "8px 10px", marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {bar("52px", accent, "6px")}
            <div style={{ marginTop: 3 }}>{bar("36px", "#64748b")}</div>
            <div style={{ marginTop: 2 }}>{bar("28px", "#94a3b8")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {bar("36px", accent, "5px")}
            <div style={{ marginTop: 3 }}>{bar("28px", "#94a3b8")}</div>
            <div style={{ marginTop: 2 }}>{bar("28px", "#94a3b8")}</div>
          </div>
        </div>
      </div>
      {/* Two columns */}
      <div style={{ padding: "0 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            {bar("20px", "#94a3b8", "2px")}
            <div style={{ marginTop: 3 }}>{bar("40px", "#4a5568", "4px")}</div>
            <div style={{ marginTop: 2 }}>{bar("32px", "#cbd5e1")}</div>
          </div>
          <div style={{ background: "#f8fafc", borderRadius: 2, padding: 4, width: 44 }}>
            {bar("100%", "#e2e8f0")}</div>
        </div>
        {/* Table */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "2px 0",
            borderBottom: `1.5px solid ${accent}`,
            marginBottom: 2,
          }}
        >
          {bar("55%", accent)}
          {bar("12%", accent)}
          {bar("12%", accent)}
          {bar("12%", accent)}
        </div>
        {rows(3, "#4a5568", "#e2e8f0")}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <div style={{ width: "40%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              {bar("50%", "#94a3b8")}
              {bar("30%", "#4a5568")}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${accent}`, paddingTop: 2 }}>
              {bar("50%", accent, "4px")}
              {bar("30%", accent, "4px")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreativePreview() {
  const accent = "#3182ce";
  return (
    <div
      className="mb-3 aspect-[210/297] rounded border bg-white overflow-hidden"
      style={{ fontSize: 0 }}
    >
      {/* Top accent stripe */}
      <div style={{ height: 6, background: accent }} />
      <div style={{ display: "flex" }}>
        {/* Left sidebar strip */}
        <div style={{ width: 3, background: accent, minHeight: "100%" }} />
        <div style={{ flex: 1, padding: "8px 10px 10px 10px" }}>
          {/* Invoice label */}
          {bar("40px", accent, "7px")}
          <div style={{ marginTop: 2 }}>{bar("52px", "#1a202c", "4px")}</div>
          {/* Business info */}
          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
            <div>
              {bar("36px", "#4a5568")}
              <div style={{ marginTop: 2 }}>{bar("28px", "#94a3b8")}</div>
            </div>
            <div>
              {bar("28px", "#94a3b8")}
              <div style={{ marginTop: 2 }}>{bar("28px", "#94a3b8")}</div>
            </div>
          </div>
          {/* Bill To */}
          <div style={{ marginTop: 6 }}>
            {bar("20px", accent, "2px")}
            <div style={{ marginTop: 3 }}>{bar("36px", "#1a202c", "4px")}</div>
            <div style={{ marginTop: 2 }}>{bar("28px", "#cbd5e1")}</div>
          </div>
          {/* Table */}
          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: `1px solid ${accent}`, marginBottom: 2 }}>
            {bar("55%", accent)}
            {bar("12%", accent)}
            {bar("12%", accent)}
            {bar("12%", accent)}
          </div>
          {rows(3, "#1a202c", "#e2e8f0")}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <div style={{ width: "40%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                {bar("50%", "#94a3b8")}
                {bar("30%", "#4a5568")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1.5px solid ${accent}`, paddingTop: 2 }}>
                {bar("50%", accent, "4px")}
                {bar("30%", accent, "4px")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompactDetailedPreview() {
  const dark = "#1a1a1a";
  const mid = "#555555";
  return (
    <div
      className="mb-3 aspect-[210/297] rounded border bg-white overflow-hidden"
      style={{ padding: "8px", fontSize: 0 }}
    >
      {/* Compact header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          {bar("40px", dark, "5px")}
          <div style={{ marginTop: 2 }}>{bar("32px", "#999")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {bar("32px", dark, "4px")}
          <div style={{ marginTop: 2 }}>{bar("24px", mid)}</div>
        </div>
      </div>
      {/* Bill To - minimal */}
      <div style={{ marginBottom: 4 }}>
        {bar("14px", "#999", "2px")}
        <div style={{ marginTop: 2 }}>{bar("32px", dark, "3px")}</div>
      </div>
      {/* Table compact */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0", borderBottom: `1px solid ${dark}`, marginBottom: 1 }}>
        {bar("55%", mid)}
        {bar("12%", mid)}
        {bar("12%", mid)}
        {bar("12%", mid)}
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1.5px 0", borderBottom: "0.5px solid #e5e5e5" }}>
          {bar("55%", "#999")}
          {bar("12%", "#ccc")}
          {bar("12%", "#ccc")}
          {bar("12%", mid)}
        </div>
      ))}
      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
        <div style={{ width: "36%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
            {bar("50%", "#999")}
            {bar("30%", mid)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${dark}`, paddingTop: 1 }}>
            {bar("50%", dark, "3px")}
            {bar("30%", dark, "3px")}
          </div>
        </div>
      </div>
      {/* Dashed line separator */}
      <div style={{ borderTop: "1px dashed #999", marginTop: 8, marginBottom: 4, paddingTop: 2 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {bar("40px", mid, "3px")}
        </div>
      </div>
      {/* Mini receipt section */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          {bar("32px", dark, "3px")}
          <div style={{ marginTop: 2 }}>{bar("48px", "#ccc")}</div>
          <div style={{ marginTop: 2 }}>{bar("48px", "#ccc")}</div>
        </div>
        <div style={{ width: 20, height: 20, border: "1px solid #ccc", borderRadius: 1 }} />
      </div>
    </div>
  );
}

export function CompactPreview() {
  const dark = "#1a1a1a";
  const mid = "#555555";
  return (
    <div
      className="mb-3 aspect-[210/297] rounded border bg-white overflow-hidden"
      style={{ padding: "8px", fontSize: 0 }}
    >
      {/* Compact header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          {bar("40px", dark, "5px")}
          <div style={{ marginTop: 2 }}>{bar("32px", "#999")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {bar("32px", dark, "4px")}
          <div style={{ marginTop: 2 }}>{bar("24px", mid)}</div>
        </div>
      </div>
      {/* Bill To - minimal */}
      <div style={{ marginBottom: 4 }}>
        {bar("14px", "#999", "2px")}
        <div style={{ marginTop: 2 }}>{bar("32px", dark, "3px")}</div>
      </div>
      {/* Table compact */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0", borderBottom: `1px solid ${dark}`, marginBottom: 1 }}>
        {bar("55%", mid)}
        {bar("12%", mid)}
        {bar("12%", mid)}
        {bar("12%", mid)}
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1.5px 0", borderBottom: "0.5px solid #e5e5e5" }}>
          {bar("55%", "#999")}
          {bar("12%", "#ccc")}
          {bar("12%", "#ccc")}
          {bar("12%", mid)}
        </div>
      ))}
      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
        <div style={{ width: "36%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
            {bar("50%", "#999")}
            {bar("30%", mid)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${dark}`, paddingTop: 1 }}>
            {bar("50%", dark, "3px")}
            {bar("30%", dark, "3px")}
          </div>
        </div>
      </div>
      {/* Payment info */}
      <div style={{ marginTop: 8 }}>
        {bar("32px", "#ccc")}
        <div style={{ marginTop: 2 }}>{bar("48px", "#e5e5e5")}</div>
      </div>
    </div>
  );
}

export function ModernMinimalPreview() {
  const dark = "#1a1a1a";
  const mid = "#888888";
  return (
    <div
      className="mb-3 aspect-[210/297] rounded border bg-white overflow-hidden"
      style={{ padding: "12px", fontSize: 0 }}
    >
      {/* Top: large invoice number left, business right */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          {bar("56px", dark, "8px")}
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {bar("18px", mid)}
            {bar("18px", mid)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {bar("36px", "#9ca3af")}
          <div style={{ marginTop: 2 }}>{bar("28px", "#d1d5db")}</div>
        </div>
      </div>
      {/* Bill To - minimal */}
      <div style={{ marginBottom: 10 }}>
        {bar("16px", mid, "2px")}
        <div style={{ marginTop: 3 }}>{bar("36px", dark, "4px")}</div>
        <div style={{ marginTop: 2 }}>{bar("28px", "#d1d5db")}</div>
      </div>
      {/* Table - no borders, dotted separators */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: 3,
          marginBottom: 2,
        }}
      >
        {bar("55%", mid)}
        {bar("12%", mid)}
        {bar("12%", mid)}
        {bar("12%", mid)}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "3px 0",
            borderBottom: `0.5px dotted #d1d5db`,
          }}
        >
          {bar("55%", "#9ca3af")}
          {bar("12%", "#d1d5db")}
          {bar("12%", "#d1d5db")}
          {bar("12%", dark)}
        </div>
      ))}
      {/* Totals - right aligned, minimal */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <div style={{ width: "36%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            {bar("50%", mid)}
            {bar("30%", "#9ca3af")}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {bar("50%", dark, "5px")}
            {bar("30%", dark, "5px")}
          </div>
        </div>
      </div>
    </div>
  );
}
