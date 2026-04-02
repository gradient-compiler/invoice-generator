const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

/**
 * Escape a string for safe inclusion in HTML content.
 * Prevents XSS when interpolating user data into email templates.
 */
export function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);
}
