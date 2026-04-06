"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import type { BusinessSettings, RateTier, Term } from "@/types";
import {
  CleanProfessionalPreview,
  ClassicPreview,
  ModernMinimalPreview,
  CorporatePreview,
  CreativePreview,
  CompactDetailedPreview,
  CompactPreview,
} from "@/components/template-previews";

type Tab = "business" | "rates" | "terms" | "templates" | "appearance" | "email" | "data";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("business");

  const tabs: { id: Tab; label: string }[] = [
    { id: "business", label: "Business Info" },
    { id: "rates", label: "Rate Tiers" },
    { id: "terms", label: "Terms" },
    { id: "templates", label: "Templates" },
    { id: "appearance", label: "Appearance" },
    { id: "email", label: "Email / SMTP" },
    { id: "data", label: "Data" },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Configure your business details, rates, and templates"
      />

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === "business" && <BusinessInfoTab />}
        {activeTab === "rates" && <RateTiersTab />}
        {activeTab === "terms" && <TermsTab />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "appearance" && <AppearanceTab />}
        {activeTab === "email" && <EmailSmtpTab />}
        {activeTab === "data" && <DataTab />}
      </div>
    </PageContainer>
  );
}

function BusinessInfoTab() {
  const [settings, setSettings] = useState<Partial<BusinessSettings>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) setMessage("Settings saved successfully!");
      else setMessage("Failed to save settings");
    } catch {
      setMessage("Error saving settings");
    }
    setSaving(false);
  };

  const update = (field: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Section title="Business Details">
        <Field label="Business Name">
          <input
            type="text"
            value={settings.businessName || ""}
            onChange={(e) => update("businessName", e.target.value)}
            className="input-field"
            placeholder="Your Business Name"
          />
        </Field>
        <Field label="Address">
          <textarea
            value={settings.address || ""}
            onChange={(e) => update("address", e.target.value)}
            className="input-field min-h-[80px]"
            placeholder="Business address"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input
              type="tel"
              value={settings.phone || ""}
              onChange={(e) => update("phone", e.target.value)}
              className="input-field"
              placeholder="+65 XXXX XXXX"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={settings.email || ""}
              onChange={(e) => update("email", e.target.value)}
              className="input-field"
              placeholder="email@example.com"
            />
          </Field>
        </div>
      </Section>

      <Section title="Business Logo">
        <p className="text-sm text-muted-foreground">
          Upload your business logo to display on invoices and receipts. Max 2MB, PNG/JPG/SVG/WebP.
        </p>
        {settings.logoPath && (
          <div className="flex items-center gap-4 mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.logoPath}
              alt="Business logo"
              className="h-16 w-16 rounded border border-border object-contain bg-white"
            />
            <button
              type="button"
              onClick={async () => {
                setLogoUploading(true);
                try {
                  const res = await fetch("/api/settings/logo", { method: "DELETE" });
                  if (res.ok) {
                    setSettings((prev) => ({ ...prev, logoPath: undefined }));
                    setMessage("Logo removed");
                  }
                } catch { /* ignore */ }
                setLogoUploading(false);
              }}
              disabled={logoUploading}
              className="text-sm text-destructive hover:underline disabled:opacity-50"
            >
              Remove logo
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setLogoUploading(true);
            setMessage("");
            try {
              const fd = new FormData();
              fd.append("logo", file);
              const res = await fetch("/api/settings/logo", {
                method: "POST",
                body: fd,
              });
              if (res.ok) {
                const data = await res.json();
                setSettings((prev) => ({ ...prev, logoPath: data.logoPath }));
                setMessage("Logo uploaded successfully!");
              } else {
                const data = await res.json().catch(() => ({}));
                setMessage(data.error || "Failed to upload logo");
              }
            } catch {
              setMessage("Error uploading logo");
            }
            setLogoUploading(false);
            e.target.value = "";
          }}
          disabled={logoUploading}
          className="input-field cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary"
        />
      </Section>

      <Section title="Payment Details">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bank Name">
            <input
              type="text"
              value={settings.bankName || ""}
              onChange={(e) => update("bankName", e.target.value)}
              className="input-field"
              placeholder="e.g., DBS, OCBC, UOB"
            />
          </Field>
          <Field label="Account Holder">
            <input
              type="text"
              value={settings.bankHolder || ""}
              onChange={(e) => update("bankHolder", e.target.value)}
              className="input-field"
              placeholder="Account holder name"
            />
          </Field>
        </div>
        <Field label="Bank Account Number">
          <input
            type="text"
            value={settings.bankAccount || ""}
            onChange={(e) => update("bankAccount", e.target.value)}
            className="input-field"
            placeholder="XXX-XXXXX-X"
          />
        </Field>
        <Field label="PayNow Number (UEN or Phone)">
          <input
            type="text"
            value={settings.paynowNumber || ""}
            onChange={(e) => update("paynowNumber", e.target.value)}
            className="input-field"
            placeholder="UEN or +65XXXXXXXX"
          />
        </Field>
      </Section>

      <Section title="Tax Settings">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="gst"
            checked={settings.gstRegistered || false}
            onChange={(e) => update("gstRegistered", e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <label htmlFor="gst" className="text-sm font-medium">
            GST Registered (9%)
          </label>
        </div>
        {settings.gstRegistered && (
          <Field label="GST Registration Number">
            <input
              type="text"
              value={settings.gstNumber || ""}
              onChange={(e) => update("gstNumber", e.target.value)}
              className="input-field"
              placeholder="GST Reg No."
            />
          </Field>
        )}
      </Section>

      <Section title="Invoice Settings">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Invoice Number Prefix">
            <input
              type="text"
              value={settings.invoicePrefix || "INV"}
              onChange={(e) => update("invoicePrefix", e.target.value)}
              className="input-field"
              placeholder="INV"
            />
          </Field>
          <Field label="Default Currency">
            <select
              value={settings.defaultCurrency || "SGD"}
              onChange={(e) => update("defaultCurrency", e.target.value)}
              className="input-field"
            >
              <option value="SGD">SGD - Singapore Dollar</option>
              <option value="USD">USD - US Dollar</option>
              <option value="MYR">MYR - Malaysian Ringgit</option>
            </select>
          </Field>
        </div>
        <Field label="Default Payment Terms">
          <select
            value={settings.defaultPaymentTerms || "Due upon receipt"}
            onChange={(e) => update("defaultPaymentTerms", e.target.value)}
            className="input-field"
          >
            <option>Due upon receipt</option>
            <option>Net 7</option>
            <option>Net 14</option>
            <option>Net 30</option>
          </select>
        </Field>
        <Field label="Late Payment Note (optional)">
          <textarea
            value={settings.latePaymentNote || ""}
            onChange={(e) => update("latePaymentNote", e.target.value)}
            className="input-field min-h-[60px]"
            placeholder="e.g., Late payments will incur a 2% monthly charge"
          />
        </Field>
      </Section>

      {message && (
        <p
          className={`text-sm ${
            message.includes("success") ? "text-success" : "text-destructive"
          }`}
        >
          {message}
        </p>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

function RateTiersTab() {
  const [rates, setRates] = useState<RateTier[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newRate, setNewRate] = useState({
    name: "",
    rate: 0,
    rateType: "hourly",
    description: "",
  });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = () => {
    fetch("/api/settings/rates")
      .then((r) => r.json())
      .then(setRates)
      .catch(() => {});
  };

  const addRate = async () => {
    await fetch("/api/settings/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRate),
    });
    setNewRate({ name: "", rate: 0, rateType: "hourly", description: "" });
    setShowAdd(false);
    loadRates();
  };

  const updateRate = async (id: number, data: Partial<RateTier>) => {
    await fetch(`/api/settings/rates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingId(null);
    loadRates();
  };

  const deleteRate = async (id: number) => {
    if (!confirm("Deactivate this rate tier?")) return;
    await fetch(`/api/settings/rates/${id}`, { method: "DELETE" });
    loadRates();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure hourly rates for different grade levels and services
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Add Rate Tier
        </button>
      </div>

      {showAdd && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Name (e.g., P1)"
              value={newRate.name}
              onChange={(e) =>
                setNewRate((p) => ({ ...p, name: e.target.value }))
              }
              className="input-field"
            />
            <input
              type="number"
              placeholder="Rate"
              value={newRate.rate || ""}
              onChange={(e) =>
                setNewRate((p) => ({ ...p, rate: parseFloat(e.target.value) || 0 }))
              }
              className="input-field"
              step="0.50"
            />
            <select
              value={newRate.rateType}
              onChange={(e) =>
                setNewRate((p) => ({ ...p, rateType: e.target.value }))
              }
              className="input-field"
            >
              <option value="hourly">Hourly</option>
              <option value="fixed">Fixed</option>
              <option value="per_session">Per Session</option>
              <option value="per_unit">Per Unit</option>
            </select>
            <input
              type="text"
              placeholder="Description"
              value={newRate.description}
              onChange={(e) =>
                setNewRate((p) => ({ ...p, description: e.target.value }))
              }
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addRate}
              className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded bg-secondary px-3 py-1.5 text-sm text-secondary-foreground hover:opacity-90"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Rate ($/hr)</th>
            <th className="pb-2 font-medium">Type</th>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rates.map((rate) => (
            <RateRow
              key={rate.id}
              rate={rate}
              editing={editingId === rate.id}
              onEdit={() => setEditingId(rate.id)}
              onSave={(data) => updateRate(rate.id, data)}
              onCancel={() => setEditingId(null)}
              onDelete={() => deleteRate(rate.id)}
              onReactivate={() => updateRate(rate.id, { isActive: true })}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RateRow({
  rate,
  editing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onReactivate,
}: {
  rate: RateTier;
  editing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<RateTier>) => void;
  onCancel: () => void;
  onDelete: () => void;
  onReactivate: () => void;
}) {
  const [editData, setEditData] = useState(rate);

  useEffect(() => {
    setEditData(rate);
  }, [rate, editing]);

  if (editing) {
    return (
      <tr>
        <td className="py-2 pr-2">
          <input
            type="text"
            value={editData.name}
            onChange={(e) =>
              setEditData((p) => ({ ...p, name: e.target.value }))
            }
            className="input-field text-sm"
          />
        </td>
        <td className="py-2 pr-2">
          <input
            type="number"
            value={editData.rate}
            onChange={(e) =>
              setEditData((p) => ({
                ...p,
                rate: parseFloat(e.target.value) || 0,
              }))
            }
            className="input-field text-sm"
            step="0.50"
          />
        </td>
        <td className="py-2 pr-2">
          <select
            value={editData.rateType || "hourly"}
            onChange={(e) =>
              setEditData((p) => ({ ...p, rateType: e.target.value }))
            }
            className="input-field text-sm"
          >
            <option value="hourly">Hourly</option>
            <option value="fixed">Fixed</option>
            <option value="per_session">Per Session</option>
            <option value="per_unit">Per Unit</option>
          </select>
        </td>
        <td className="py-2 pr-2">
          <input
            type="text"
            value={editData.description || ""}
            onChange={(e) =>
              setEditData((p) => ({ ...p, description: e.target.value }))
            }
            className="input-field text-sm"
          />
        </td>
        <td className="py-2" />
        <td className="py-2 text-right">
          <button
            onClick={() => onSave(editData)}
            className="mr-2 text-primary hover:underline"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:underline"
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className={rate.isActive ? "" : "opacity-50"}>
      <td className="py-2 font-medium">{rate.name}</td>
      <td className="py-2">${rate.rate.toFixed(2)}</td>
      <td className="py-2 capitalize">{rate.rateType?.replace("_", " ")}</td>
      <td className="py-2 text-muted-foreground">{rate.description}</td>
      <td className="py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            rate.isActive
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {rate.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="py-2 text-right">
        <button
          onClick={onEdit}
          className="mr-2 text-primary hover:underline"
        >
          Edit
        </button>
        {rate.isActive ? (
          <button
            onClick={onDelete}
            className="text-destructive hover:underline"
          >
            Deactivate
          </button>
        ) : (
          <button
            onClick={onReactivate}
            className="text-primary hover:underline"
          >
            Reactivate
          </button>
        )}
      </td>
    </tr>
  );
}

function TermsTab() {
  const [termsList, setTermsList] = useState<Term[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTerm, setNewTerm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = () => {
    fetch("/api/settings/terms")
      .then((r) => r.json())
      .then(setTermsList)
      .catch(() => {});
  };

  const addTerm = async () => {
    await fetch("/api/settings/terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTerm),
    });
    setNewTerm({
      name: "",
      startDate: "",
      endDate: "",
      year: new Date().getFullYear(),
    });
    setShowAdd(false);
    loadTerms();
  };

  const deleteTerm = async (id: number) => {
    if (!confirm("Delete this term?")) return;
    await fetch(`/api/settings/terms/${id}`, { method: "DELETE" });
    loadTerms();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define academic terms with custom date ranges
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Add Term
        </button>
      </div>

      {showAdd && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Term Name"
              value={newTerm.name}
              onChange={(e) =>
                setNewTerm((p) => ({ ...p, name: e.target.value }))
              }
              className="input-field"
            />
            <input
              type="date"
              value={newTerm.startDate}
              onChange={(e) =>
                setNewTerm((p) => ({ ...p, startDate: e.target.value }))
              }
              className="input-field"
            />
            <input
              type="date"
              value={newTerm.endDate}
              onChange={(e) =>
                setNewTerm((p) => ({ ...p, endDate: e.target.value }))
              }
              className="input-field"
            />
            <input
              type="number"
              placeholder="Year"
              value={newTerm.year}
              onChange={(e) =>
                setNewTerm((p) => ({
                  ...p,
                  year: parseInt(e.target.value) || new Date().getFullYear(),
                }))
              }
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addTerm}
              className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded bg-secondary px-3 py-1.5 text-sm text-secondary-foreground hover:opacity-90"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 font-medium">Term Name</th>
            <th className="pb-2 font-medium">Start Date</th>
            <th className="pb-2 font-medium">End Date</th>
            <th className="pb-2 font-medium">Year</th>
            <th className="pb-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {termsList.map((term) => (
            <tr key={term.id}>
              <td className="py-2 font-medium">{term.name}</td>
              <td className="py-2">{term.startDate}</td>
              <td className="py-2">{term.endDate}</td>
              <td className="py-2">{term.year}</td>
              <td className="py-2 text-right">
                <button
                  onClick={() => deleteTerm(term.id)}
                  className="text-destructive hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {termsList.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-muted-foreground">
                No terms defined. Add your first term above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TemplatesTab() {
  const [templates, setTemplates] = useState<
    Array<{ slug: string; name: string; description: string }>
  >([]);
  const [settings, setSettings] = useState<Partial<BusinessSettings>>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setTemplates([
      {
        slug: "clean-professional",
        name: "Clean Professional",
        description:
          "Modern minimalist design with generous whitespace and a deep blue accent",
      },
      {
        slug: "classic",
        name: "Classic",
        description:
          "Traditional bordered layout with centered header and dark accents",
      },
      {
        slug: "modern-minimal",
        name: "Modern Minimal",
        description:
          "Ultra-clean design with no borders, bold invoice number, and subtle separators",
      },
      {
        slug: "corporate",
        name: "Corporate",
        description:
          "Formal layout with gray header band, structured grid, and professional sans-serif typography",
      },
      {
        slug: "creative",
        name: "Creative",
        description:
          "Colorful accent stripe with sidebar element, bold invoice number, and modern layout",
      },
      {
        slug: "compact-detailed",
        name: "Compact + Receipt",
        description:
          "Space-efficient layout with a tear-off payment slip section at the bottom",
      },
      {
        slug: "compact",
        name: "Compact",
        description:
          "Space-efficient layout with compact typography and minimal padding",
      },
    ]);
  }, []);

  const selectTemplate = async (slug: string) => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, defaultTemplate: slug }),
    });
    setSettings((prev) => ({ ...prev, defaultTemplate: slug }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose a default PDF template for your invoices
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {templates.map((tpl) => (
          <div
            key={tpl.slug}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
              settings.defaultTemplate === tpl.slug
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => selectTemplate(tpl.slug)}
          >
            {tpl.slug === "clean-professional" && <CleanProfessionalPreview />}
            {tpl.slug === "classic" && <ClassicPreview />}
            {tpl.slug === "modern-minimal" && <ModernMinimalPreview />}
            {tpl.slug === "corporate" && <CorporatePreview />}
            {tpl.slug === "creative" && <CreativePreview />}
            {tpl.slug === "compact-detailed" && <CompactDetailedPreview />}
            {tpl.slug === "compact" && <CompactPreview />}
            <h3 className="font-medium">{tpl.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {tpl.description}
            </p>
            {settings.defaultTemplate === tpl.slug && (
              <span className="mt-2 inline-block rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                Selected
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const themes = [
    {
      value: "light",
      label: "Light",
      description: "Classic light background with dark text",
    },
    {
      value: "dark",
      label: "Dark",
      description: "Dark background with light text, easier on the eyes at night",
    },
    {
      value: "system",
      label: "System",
      description: "Automatically matches your operating system preference",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <Section title="Theme">
        <p className="text-sm text-muted-foreground">
          Choose how the application looks. Select a theme or let it follow your
          system settings.
        </p>
        <div className="grid gap-3 sm:grid-cols-3 mt-3">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                theme === t.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent/50"
              }`}
            >
              <div className="font-medium text-sm">{t.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t.description}
              </div>
              {theme === t.value && (
                <span className="mt-2 inline-block rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function DataTab() {
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const downloadBackup = async () => {
    setDownloading(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings/backup");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Failed to download backup");
        setDownloading(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
        `invoice-generator-backup-${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage("Backup downloaded successfully!");
    } catch {
      setMessage("Error downloading backup");
    }
    setDownloading(false);
  };

  const restoreBackup = async (file: File) => {
    if (
      !confirm(
        "Are you sure you want to restore from this backup? This will replace ALL current data. A backup of the current database will be saved automatically."
      )
    ) {
      return;
    }

    setRestoring(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("database", file);
      const res = await fetch("/api/settings/backup", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Database restored successfully!");
      } else {
        setMessage(data.error || "Failed to restore backup");
      }
    } catch {
      setMessage("Error restoring backup");
    }
    setRestoring(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Section title="Download Backup">
        <p className="text-sm text-muted-foreground">
          Download a copy of your entire database. This includes all invoices,
          clients, sessions, receipts, and settings.
        </p>
        <button
          onClick={downloadBackup}
          disabled={downloading}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {downloading ? "Downloading..." : "Download Backup"}
        </button>
      </Section>

      <Section title="Restore from Backup">
        <p className="text-sm text-muted-foreground">
          Upload a previously downloaded backup file to restore your data. This
          will replace all current data. A backup of the current database is
          saved automatically before restoring.
        </p>
        <p className="text-sm font-medium text-destructive">
          Warning: Restoring a backup will overwrite all existing data. The
          application may need to be restarted after restoring.
        </p>
        <input
          type="file"
          accept=".db"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) restoreBackup(file);
            e.target.value = "";
          }}
          disabled={restoring}
          className="input-field cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary"
        />
      </Section>

      <Section title="Manual Backup">
        <p className="text-sm text-muted-foreground">
          You can also back up manually by copying the database file and uploads
          folder:
        </p>
        <pre className="rounded-lg bg-muted p-3 text-xs text-muted-foreground overflow-x-auto">
{`cp data/invoice-generator.db ~/backups/
cp -r public/uploads ~/backups/`}
        </pre>
      </Section>

      {message && (
        <p
          className={`text-sm ${
            message.includes("success") ? "text-success" : "text-destructive"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

// ─── EMAIL / SMTP TAB ───
function EmailSmtpTab() {
  const [settings, setSettings] = useState<Partial<BusinessSettings>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const update = (field: string, value: string | boolean | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) setMessage("SMTP settings saved!");
      else setMessage("Failed to save settings");
    } catch {
      setMessage("Error saving settings");
    }
    setSaving(false);
  };

  const sendTest = async () => {
    setTesting(true);
    setMessage("");
    try {
      // Save first so the test uses current values
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const res = await fetch("/api/email/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) setMessage(`Test email sent to ${data.sentTo}`);
      else setMessage(data.error || "Failed to send test email");
    } catch {
      setMessage("Error sending test email");
    }
    setTesting(false);
  };

  const smtpConfigured = settings.smtpHost && settings.smtpUser && settings.smtpPass;

  return (
    <div className="max-w-2xl space-y-6">
      <Section title="SMTP Configuration">
        <p className="text-sm text-muted-foreground -mt-2 mb-4">
          Configure SMTP to send invoices and payment reminders by email.
          Use Gmail App Passwords, SendGrid, or any SMTP provider.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="SMTP Host">
            <input
              type="text"
              value={(settings as Record<string, unknown>).smtpHost as string || ""}
              onChange={(e) => update("smtpHost", e.target.value)}
              className="input-field"
              placeholder="smtp.gmail.com"
            />
          </Field>
          <Field label="SMTP Port">
            <input
              type="number"
              value={(settings as Record<string, unknown>).smtpPort as number || 587}
              onChange={(e) => update("smtpPort", parseInt(e.target.value) || 587)}
              className="input-field"
              placeholder="587"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="SMTP Username">
            <input
              type="text"
              value={(settings as Record<string, unknown>).smtpUser as string || ""}
              onChange={(e) => update("smtpUser", e.target.value)}
              className="input-field"
              placeholder="your@email.com"
            />
          </Field>
          <Field label="SMTP Password">
            <input
              type="password"
              value={(settings as Record<string, unknown>).smtpPass as string || ""}
              onChange={(e) => update("smtpPass", e.target.value)}
              className="input-field"
              placeholder="App password or SMTP password"
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={(settings as Record<string, unknown>).smtpSecure as boolean || false}
            onChange={(e) => update("smtpSecure", e.target.checked)}
            className="rounded"
          />
          Use SSL/TLS (port 465). Leave unchecked for STARTTLS (port 587).
        </label>
      </Section>

      <Section title="Sender Details">
        <div className="grid grid-cols-2 gap-4">
          <Field label="From Name">
            <input
              type="text"
              value={(settings as Record<string, unknown>).smtpFromName as string || ""}
              onChange={(e) => update("smtpFromName", e.target.value)}
              className="input-field"
              placeholder={settings.businessName || "Your Business"}
            />
          </Field>
          <Field label="From Email">
            <input
              type="email"
              value={(settings as Record<string, unknown>).smtpFromEmail as string || ""}
              onChange={(e) => update("smtpFromEmail", e.target.value)}
              className="input-field"
              placeholder={settings.email || "noreply@yourdomain.com"}
            />
          </Field>
        </div>
      </Section>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.includes("sent") || message.includes("saved")
              ? "border border-success/50 bg-success/10 text-success"
              : "border border-destructive/50 bg-destructive/10 text-destructive"
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        <button
          type="button"
          onClick={sendTest}
          disabled={testing || !smtpConfigured}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          {testing ? "Sending..." : "Send Test Email"}
        </button>
      </div>
    </div>
  );
}
