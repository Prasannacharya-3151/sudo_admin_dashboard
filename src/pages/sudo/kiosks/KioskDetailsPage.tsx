import {
  ArrowLeft,
  Building2,
  CreditCard,
  Loader2,
  MapPin,
  Monitor,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  Unplug,
  Wifi,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import {
  addKioskPrinter,
  createKioskPricing,
  deactivateKioskPricing,
  deleteKiosk,
  getKioskById,
  removeKioskPrinter,
  unpairKiosk,
  updateKioskCapabilities,
  updateKioskPricing,
} from "../../../api/kioskApi";

import type {
  AddKioskPrinterPayload,
  CreateKioskPricingPayload,
  KioskCapabilities,
  KioskDetails,
  KioskPricing,
  PaperSize,
  PrintMode,
  PrintingSide,
  UpdateKioskCapabilitiesPayload,
} from "../../../types/kiosk";

// ==========================================
// TYPES
// ==========================================

type ActiveTab = "overview" | "capabilities" | "pricing" | "printers" | "pairing";

const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Monitor },
  { id: "capabilities", label: "Capabilities", icon: Settings2 },
  { id: "pricing", label: "Pricing", icon: CreditCard },
  { id: "printers", label: "Printers", icon: Printer },
  { id: "pairing", label: "Pairing", icon: Wifi },
];

const capabilityItems: { key: keyof KioskCapabilities; label: string; description: string }[] = [
  { key: "color_printing", label: "Color Printing", description: "Print in color" },
  { key: "duplex_printing", label: "Duplex Printing", description: "Print on both sides" },
  { key: "upi_payment", label: "UPI Payment", description: "Accept UPI token payments" },
  { key: "rfid_payment", label: "RFID Payment", description: "Accept institution RFID cards" },
];

const paperSizes: PaperSize[] = ["A4", "A3", "LETTER"];
const printModes: PrintMode[] = ["BW", "COLOR"];
const printingSides: PrintingSide[] = ["SIMPLEX", "DUPLEX"];

const getStatusStyle = (status: string) => {
  switch (status) {
    case "online":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "offline":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

// FIX: backend may omit `pricing` / `printers` entirely (undefined,
// not []). Every place we set `kiosk` state runs through this so
// .length / .map never crash the whole page.
const normalizeKiosk = (data: KioskDetails): KioskDetails => ({
  ...data,
  pricing: data.pricing ?? [],
  printers: data.printers ?? [],
});

// ==========================================
// COMPONENT
// ==========================================

export default function KioskDetailsPage() {
  const navigate = useNavigate();
  const { kioskId } = useParams<{ kioskId: string }>();
  const { accessToken } = useSudoAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [kiosk, setKiosk] = useState<KioskDetails | null>(null);

  // capabilities
  const [capabilities, setCapabilities] = useState<KioskCapabilities>({
    color_printing: false,
    duplex_printing: false,
    upi_payment: false,
    rfid_payment: false,
  });
  const [isSavingCapabilities, setIsSavingCapabilities] = useState(false);

  // pricing
  const [isAddingPricing, setIsAddingPricing] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [newPricing, setNewPricing] = useState<CreateKioskPricingPayload>({
    paper_size: "A4",
    print_mode: "BW",
    printing_side: "SIMPLEX",
    price_per_sheet: 0,
  });

  // printers
  const [isAddingPrinter, setIsAddingPrinter] = useState(false);
  const [isSavingPrinter, setIsSavingPrinter] = useState(false);
  const [printerForm, setPrinterForm] = useState<AddKioskPrinterPayload>({
    manufacturer: "",
    model: "",
    serial_number: "",
  });

  // pairing
  const [isUnpairing, setIsUnpairing] = useState(false);

  // delete
  const [isDeleting, setIsDeleting] = useState(false);

  // ==========================================
  // LOAD
  // ==========================================

  const loadKioskData = useCallback(async () => {
    if (!kioskId) return;

    if (!accessToken) {
      toast.error("Authentication required");
      navigate("/sudo/login");
      return;
    }

    try {
      setIsLoading(true);
      const data = await getKioskById(accessToken, kioskId);
      const normalized = normalizeKiosk(data);
      setKiosk(normalized);
      setCapabilities(normalized.capabilities);
    } catch (error) {
      console.error("Failed to load kiosk:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load kiosk details");
    } finally {
      setIsLoading(false);
    }
  }, [kioskId, accessToken, navigate]);

  useEffect(() => {
    void loadKioskData();
  }, [loadKioskData]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadKioskData();
      toast.success("Kiosk data refreshed");
    } finally {
      setIsRefreshing(false);
    }
  };

  // ==========================================
  // CAPABILITIES
  // ==========================================

  const handleSaveCapabilities = async () => {
    if (!kioskId || !accessToken) return;

    try {
      setIsSavingCapabilities(true);
      const payload: UpdateKioskCapabilitiesPayload = { ...capabilities };
      const updated = await updateKioskCapabilities(accessToken, kioskId, payload);
      setCapabilities(updated);
      setKiosk((previous) => (previous ? { ...previous, capabilities: updated } : previous));
      toast.success("Capabilities updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update capabilities");
    } finally {
      setIsSavingCapabilities(false);
    }
  };

  // ==========================================
  // PRICING
  // ==========================================

  const handleAddPricing = async () => {
    if (!kioskId || !accessToken) return;

    if (newPricing.price_per_sheet <= 0) {
      toast.error("Price per sheet must be greater than 0");
      return;
    }

    try {
      setIsSavingPricing(true);
      const created = await createKioskPricing(accessToken, kioskId, newPricing);
      setKiosk((previous) =>
        // FIX: guard previous.pricing with ?? [] before spreading
        previous ? { ...previous, pricing: [...(previous.pricing ?? []), created] } : previous,
      );
      setIsAddingPricing(false);
      setNewPricing({ paper_size: "A4", print_mode: "BW", printing_side: "SIMPLEX", price_per_sheet: 0 });
      toast.success("Pricing row added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add pricing row");
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleTogglePricingActive = async (row: KioskPricing) => {
    if (!kioskId || !accessToken) return;

    try {
      if (row.active) {
        await deactivateKioskPricing(accessToken, kioskId, row.id);
        setKiosk((previous) =>
          previous
            ? {
                ...previous,
                pricing: (previous.pricing ?? []).map((p) =>
                  p.id === row.id ? { ...p, active: false } : p,
                ),
              }
            : previous,
        );
        toast.success("Pricing row deactivated");
      } else {
        const updated = await updateKioskPricing(accessToken, kioskId, row.id, { active: true });
        setKiosk((previous) =>
          previous
            ? {
                ...previous,
                pricing: (previous.pricing ?? []).map((p) => (p.id === row.id ? updated : p)),
              }
            : previous,
        );
        toast.success("Pricing row re-enabled");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update pricing row");
    }
  };

  const handleUpdatePricingAmount = async (row: KioskPricing, newPrice: number) => {
    if (!kioskId || !accessToken || newPrice <= 0) return;

    try {
      const updated = await updateKioskPricing(accessToken, kioskId, row.id, { price_per_sheet: newPrice });
      setKiosk((previous) =>
        previous
          ? { ...previous, pricing: (previous.pricing ?? []).map((p) => (p.id === row.id ? updated : p)) }
          : previous,
      );
      toast.success("Price updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update price");
    }
  };

  // ==========================================
  // PRINTERS
  // ==========================================

  const handleAddPrinter = async () => {
    if (!kioskId || !accessToken) return;

    if (!printerForm.manufacturer.trim() || !printerForm.model.trim() || !printerForm.serial_number.trim()) {
      toast.error("Manufacturer, model, and serial number are all required");
      return;
    }

    try {
      setIsSavingPrinter(true);
      const created = await addKioskPrinter(accessToken, kioskId, printerForm);
      setKiosk((previous) =>
        // FIX: guard previous.printers with ?? [] before spreading
        previous ? { ...previous, printers: [...(previous.printers ?? []), created] } : previous,
      );
      setPrinterForm({ manufacturer: "", model: "", serial_number: "" });
      setIsAddingPrinter(false);
      toast.success("Printer added — set as default automatically");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add printer");
    } finally {
      setIsSavingPrinter(false);
    }
  };

  const handleRemovePrinter = async (printerId: string) => {
    if (!kioskId || !accessToken) return;
    if (!window.confirm("Remove this printer?")) return;

    try {
      await removeKioskPrinter(accessToken, kioskId, printerId);
      setKiosk((previous) =>
        previous
          ? {
              ...previous,
              printers: (previous.printers ?? []).map((p) =>
                p.id === printerId ? { ...p, removed_at: new Date().toISOString() } : p,
              ),
            }
          : previous,
      );
      toast.success("Printer removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove printer");
    }
  };

  // ==========================================
  // PAIRING
  // ==========================================

  const handleUnpair = async () => {
    if (!kioskId || !accessToken) return;
    if (!window.confirm("Unpair this device? The machine will need the new code to reconnect.")) return;

    try {
      setIsUnpairing(true);
      const result = await unpairKiosk(accessToken, kioskId);
      setKiosk((previous) =>
        previous ? { ...previous, pairing_code: result.pairing_code, device_id: null, paired_at: null } : previous,
      );
      toast.success("Device unpaired — new pairing code issued");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unpair device");
    } finally {
      setIsUnpairing(false);
    }
  };

  // ==========================================
  // DELETE (⏳ backend route not built yet)
  // ==========================================

  const handleDeleteKiosk = async () => {
    if (!kioskId || !kiosk || !accessToken) return;
    if (!window.confirm(`Delete "${kiosk.name}"? This action cannot be undone.`)) return;

    try {
      setIsDeleting(true);
      await deleteKiosk(accessToken, kioskId);
      toast.success("Kiosk deleted successfully");
      navigate("/sudo/kiosks");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete isn't available yet — backend route pending");
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // LOADING / NOT FOUND
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
          <p className="text-sm text-slate-500">Loading kiosk details...</p>
        </div>
      </div>
    );
  }

  if (!kiosk) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <Monitor className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-900">Kiosk not found</h2>
        <button
          type="button"
          onClick={() => navigate("/sudo/kiosks")}
          className="mt-5 rounded-xl bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to Kiosks
        </button>
      </div>
    );
  }

  const isPaired = !!kiosk.paired_at;

  // FIX: single source of truth for these two — every render below
  // reads from here instead of kiosk.pricing / kiosk.printers directly
  const pricingRows = kiosk.pricing ?? [];
  const printerRows = kiosk.printers ?? [];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate("/sudo/kiosks")}
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{kiosk.name}</h1>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(kiosk.status)}`}>
                {kiosk.status}
              </span>
            </div>
            <p className="mt-1 text-sm capitalize text-slate-500">
              {kiosk.kiosk_type} kiosk · {kiosk.city}, {kiosk.state}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/sudo/kiosks/${kioskId}/edit`)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-brand-purple text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Kiosk Information</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Type</p>
                <p className="mt-2 flex items-center gap-2 font-semibold capitalize text-slate-800">
                  {kiosk.kiosk_type === "institution" ? <Building2 className="h-4 w-4 text-slate-400" /> : <Monitor className="h-4 w-4 text-slate-400" />}
                  {kiosk.kiosk_type}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Institution</p>
                <p className="mt-2 break-all font-semibold text-slate-800">
                  {kiosk.institution_id || "Public kiosk — no institution"}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Address</p>
                <p className="mt-2 flex items-start gap-2 font-semibold text-slate-800">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    {kiosk.address_line_1}
                    {kiosk.address_line_2 ? `, ${kiosk.address_line_2}` : ""}, {kiosk.city}, {kiosk.state},{" "}
                    {kiosk.country} {kiosk.postal_code ? `- ${kiosk.postal_code}` : ""}
                  </span>
                </p>
              </div>

              {kiosk.latitude != null && kiosk.longitude != null && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Coordinates</p>
                  <p className="mt-2 font-semibold text-slate-800">
                    {kiosk.latitude}, {kiosk.longitude}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-700">Danger Zone</h2>
            <p className="mt-1 text-sm text-red-600">
              Permanently remove this kiosk. Note: this depends on a backend route that isn't live yet.
            </p>
            <button
              type="button"
              onClick={handleDeleteKiosk}
              disabled={isDeleting}
              className="mt-5 flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Kiosk
            </button>
          </div>
        </div>
      )}

      {/* CAPABILITIES */}
      {activeTab === "capabilities" && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-semibold text-slate-900">Capabilities</h2>
            <p className="mt-1 text-sm text-slate-500">Enforced at print time on this kiosk.</p>
          </div>

          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {capabilityItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-xl border border-slate-200 p-5">
                  <div>
                    <h3 className="font-semibold text-slate-800">{item.label}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCapabilities((previous) => ({ ...previous, [item.key]: !previous[item.key] }))
                    }
                    className={`relative h-7 w-12 rounded-full transition ${
                      capabilities[item.key] ? "bg-brand-purple" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                        capabilities[item.key] ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSaveCapabilities}
                disabled={isSavingCapabilities}
                className="flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSavingCapabilities ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Capabilities
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRICING */}
      {activeTab === "pricing" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pricing Rows</h2>
              <p className="mt-1 text-sm text-slate-500">One row per paper size + mode + side combination.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingPricing(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Add Pricing Row
            </button>
          </div>

          {isAddingPricing && (
            <div className="rounded-2xl border border-brand-purple/20 bg-white p-6">
              <h3 className="font-semibold text-slate-900">New Pricing Row</h3>
              <div className="mt-5 grid gap-5 md:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Paper Size</label>
                  <select
                    value={newPricing.paper_size}
                    onChange={(e) => setNewPricing((p) => ({ ...p, paper_size: e.target.value as PaperSize }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                  >
                    {paperSizes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Print Mode</label>
                  <select
                    value={newPricing.print_mode}
                    onChange={(e) => setNewPricing((p) => ({ ...p, print_mode: e.target.value as PrintMode }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                  >
                    {printModes.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Side</label>
                  <select
                    value={newPricing.printing_side}
                    onChange={(e) => setNewPricing((p) => ({ ...p, printing_side: e.target.value as PrintingSide }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                  >
                    {printingSides.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Price / Sheet (₹)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newPricing.price_per_sheet || ""}
                    onChange={(e) => setNewPricing((p) => ({ ...p, price_per_sheet: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddingPricing(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPricing}
                  disabled={isSavingPricing}
                  className="flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSavingPricing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Row
                </button>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Paper</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Side</th>
                  <th className="px-6 py-3">Price / Sheet</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pricingRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No pricing rows yet.</td>
                  </tr>
                ) : (
                  pricingRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-6 py-4 font-semibold text-slate-800">{row.paper_size}</td>
                      <td className="px-6 py-4 text-slate-600">{row.print_mode}</td>
                      <td className="px-6 py-4 text-slate-600">{row.printing_side}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          defaultValue={row.price_per_sheet}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== row.price_per_sheet && val > 0) handleUpdatePricingAmount(row, val);
                          }}
                          className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-brand-purple"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${row.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
                          {row.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleTogglePricingActive(row)}
                          className="text-sm font-semibold text-brand-purple hover:underline"
                        >
                          {row.active ? "Deactivate" : "Re-enable"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINTERS */}
      {activeTab === "printers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Printers</h2>
              <p className="mt-1 text-sm text-slate-500">Registering a new printer replaces the current default.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingPrinter(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Add Printer
            </button>
          </div>

          {isAddingPrinter && (
            <div className="rounded-2xl border border-brand-purple/20 bg-white p-6">
              <h3 className="font-semibold text-slate-900">Add New Printer</h3>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Manufacturer</label>
                  <input
                    value={printerForm.manufacturer}
                    onChange={(e) => setPrinterForm((p) => ({ ...p, manufacturer: e.target.value }))}
                    placeholder="HP"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Model</label>
                  <input
                    value={printerForm.model}
                    onChange={(e) => setPrinterForm((p) => ({ ...p, model: e.target.value }))}
                    placeholder="LaserJet Pro M404dn"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Serial Number</label>
                  <input
                    value={printerForm.serial_number}
                    onChange={(e) => setPrinterForm((p) => ({ ...p, serial_number: e.target.value }))}
                    placeholder="CNB1X2Y3Z4"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddingPrinter(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPrinter}
                  disabled={isSavingPrinter}
                  className="flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSavingPrinter && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Printer
                </button>
              </div>
            </div>
          )}

          {printerRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Printer className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-4 font-semibold text-slate-700">No printers registered</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {printerRows.map((printer) => {
                const isRemoved = !!printer.removed_at;
                return (
                  <div key={printer.id} className={`rounded-2xl border bg-white p-5 ${isRemoved ? "border-slate-200 opacity-60" : "border-slate-200"}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-brand-purple">
                          <Printer className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{printer.manufacturer} {printer.model}</h3>
                            {printer.is_default && !isRemoved && (
                              <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-brand-purple">Default</span>
                            )}
                            {isRemoved && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Removed</span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-500">S/N: {printer.serial_number}</p>
                        </div>
                      </div>

                      {!isRemoved && (
                        <button
                          type="button"
                          onClick={() => handleRemovePrinter(printer.id)}
                          className="flex h-10 w-10 items-center justify-center self-end rounded-xl border border-red-100 text-red-600 hover:bg-red-50 lg:self-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PAIRING */}
      {activeTab === "pairing" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-brand-purple">
                  <Wifi className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Device Pairing Status</p>
                  <h2 className={`mt-1 text-xl font-bold ${isPaired ? "text-emerald-700" : "text-slate-500"}`}>
                    {isPaired ? "Paired" : "Awaiting Pairing"}
                  </h2>
                </div>
              </div>

              {isPaired && (
                <button
                  type="button"
                  onClick={handleUnpair}
                  disabled={isUnpairing}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {isUnpairing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                  Unpair Device
                </button>
              )}
            </div>

            <div className="mt-6 grid gap-5 border-t border-slate-100 pt-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Device ID</p>
                <p className="mt-2 break-all font-mono text-sm font-medium text-slate-800">
                  {kiosk.device_id || "No device paired"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Paired At</p>
                <p className="mt-2 font-medium text-slate-800">
                  {kiosk.paired_at ? new Date(kiosk.paired_at).toLocaleString() : "Not paired"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Pairing Code</h2>
            <p className="mt-1 text-sm text-slate-500">
              Hand this to the on-site installer — it's entered once on the kiosk machine to pair it.
              {isPaired && " This code is already consumed and can no longer be used."}
            </p>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="break-all font-mono text-lg font-bold tracking-wider text-slate-900">
                {kiosk.pairing_code || "Not available"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}