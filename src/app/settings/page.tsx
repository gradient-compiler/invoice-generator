"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/header";
import { useEffect, useState } from "react";
import type { BusinessSettings, RateTier, Term } from "@/types";

type Tab = "business" | "rates" | "terms" | "templates";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("business");

  const tabs: { id: Tab; label: string }[] = [
    { id: "business", label: "Business Info" },
    { id: "rates", label: "Rate Tiers" },
    { id: "terms", label: "Terms" },
    { id: "templates", label: "Templates" },
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
      </div>
    </PageContainer>
  );
}

function BusinessInfoTab() {
  const [settings, setSettings] = useState<Partial<BusinessSettings>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
}: {
  rate: RateTier;
  editing: boolean;
  onEdit: () => void;
  onSave: (data: Partial<RateTier>) => void;
  onCancel: () => void;
  onDelete: () => void;
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
        {rate.isActive && (
          <button
            onClick={onDelete}
            className="text-destructive hover:underline"
          >
            Deactivate
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
            <div className="mb-3 aspect-[210/297] rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
              Preview
            </div>
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
