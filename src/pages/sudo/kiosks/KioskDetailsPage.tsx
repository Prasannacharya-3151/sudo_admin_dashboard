import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CreditCard,
  ExternalLink,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  Monitor,
  Pencil,
  Plus,
  Power,
  Printer,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  Unplug,
  Wifi,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useSudoAuth } from "../../../context/SudoAuthContext";
import { getInstitutionById } from "../../../api/institutionApi";
import {
  addKioskPrinter,
  createKioskPaperPricing,
  createKioskPricing,
  deactivateKioskPricing,
  deleteKiosk,
  getKioskById,
  getKioskPaperPricing,
  removeKioskPrinter,
  unpairKiosk,
  updateKioskCapabilities,
  updateKioskPaperPricing,
  updateKioskPricing,
} from "../../../api/kioskApi";
import type {
  AddKioskPrinterPayload,
  CreateKioskPricingPayload,
  KioskCapabilities,
  KioskDetails,
  KioskPricing,
  PagesPerSheet,
  PaperPricing,
  PaperSize,
  PrintMode,
  PrintingSide,
} from "../../../types/kiosk";

// ==========================================
// TYPES
// ==========================================

type ActiveTab =
  | "overview"
  | "capabilities"
  | "pricing"
  | "printers"
  | "pairing";

const tabs: {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "overview", label: "Overview", icon: Monitor },
  { id: "capabilities", label: "Capabilities", icon: Settings2 },
  { id: "pricing", label: "Pricing", icon: CreditCard },
  { id: "printers", label: "Printers", icon: Printer },
  { id: "pairing", label: "Pairing", icon: Wifi },
];

const capabilityItems: {
  key: keyof KioskCapabilities;
  label: string;
  description: string;
}[] = [
  {
    key: "color_printing",
    label: "Color Printing",
    description: "Print in color",
  },
  {
    key: "duplex_printing",
    label: "Duplex Printing",
    description: "Print on both sides",
  },
  {
    key: "upi_payment",
    label: "UPI Payment",
    description: "Accept UPI token payments",
  },
  {
    key: "rfid_payment",
    label: "RFID Payment",
    description: "Accept institution RFID cards",
  },
  {
    key: "pages_per_sheet_1",
    label: "1 Page per Sheet",
    description: "One document page on each sheet",
  },
  {
    key: "pages_per_sheet_2",
    label: "2 Pages per Sheet",
    description: "Two document pages on each sheet",
  },
  {
    key: "pages_per_sheet_4",
    label: "4 Pages per Sheet",
    description: "Four document pages on each sheet",
  },
];

const defaultCapabilities: KioskCapabilities = {
  color_printing: false,
  duplex_printing: false,
  upi_payment: false,
  rfid_payment: false,
  pages_per_sheet_1: false,
  pages_per_sheet_2: false,
  pages_per_sheet_4: false,
};

const paperSizes: PaperSize[] = ["A4", "A3", "LETTER"];
const printModes: PrintMode[] = ["BW", "COLOR"];
const printingSides: PrintingSide[] = ["SIMPLEX", "DUPLEX"];
const pageLayouts: PagesPerSheet[] = [1, 2, 4];

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

// Backend may omit `pricing` / `printers` / `capabilities`.
// Every place we set `kiosk` state runs through this so
// .length / .map never crash the page.
const normalizeKiosk = (data: KioskDetails): KioskDetails => ({
  ...data,
  capabilities: { ...defaultCapabilities, ...(data.capabilities ?? {}) },
  pricing: data.pricing ?? [],
  printers: data.printers ?? [],
});

const emptyNewPricing = (): CreateKioskPricingPayload => ({
  paper_size: "A4",
  print_mode: "BW",
  printing_side: "SIMPLEX",
  pages_per_sheet: 1,
  price_per_sheet: 0,
});

// ==========================================
// SHARED STYLE TOKENS (classes only)
// ==========================================

const inputClass =
  "h-9 w-full rounded-full border border-slate-200 bg-white px-4 text-xs text-slate-800 outline-none transition focus:border-brand-purple";

const labelClass =
  "mb-1.5 block px-1 text-xs font-semibold text-slate-700";

const primaryBtn =
  "inline-flex h-9 items-center justify-center gap-2 rounded-full bg-brand-purple px-5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

const outlineBtn =
  "inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

const dangerBtn =
  "inline-flex h-9 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60";

const cardClass = "rounded-3xl border border-slate-200 bg-white";

const eyebrowClass =
  "text-[11px] font-medium uppercase tracking-wide text-slate-400";

// ==========================================
// CONFIRM DIALOG (replaces window.confirm)
// ==========================================

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmLabel: string;
  variant: "danger" | "default";
  onConfirm: () => void | Promise<void>;
} | null;

interface ConfirmDialogProps {
  state: ConfirmDialogState;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  state,
  isSubmitting,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!state) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, isSubmitting, onCancel]);

  if (!state) return null;

  const isDanger = state.variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => !isSubmitting && onCancel()}
        className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-sm"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={() => !isSubmitting && onCancel()}
          disabled={isSubmitting}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            isDanger
              ? "bg-red-50 text-red-600"
              : "bg-purple-50 text-brand-purple"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>

        <h2 className="mt-4 text-sm font-bold text-slate-900">
          {state.title}
        </h2>

        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {state.description}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={outlineBtn}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={isDanger ? dangerBtn : primaryBtn}
          >
            {isSubmitting && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}

            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT
// ==========================================

export default function KioskDetailsPage() {
  const navigate = useNavigate();
  const { kioskId } = useParams<{ kioskId: string }>();
  const { accessToken } = useSudoAuth();

  // Always read the latest token inside callbacks without
  // re-creating them every time the token rotates.
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;
  const hasAccessToken = Boolean(accessToken);

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [kiosk, setKiosk] = useState<KioskDetails | null>(null);

  // Institution name for institution kiosks.
  const [institutionName, setInstitutionName] = useState<string | null>(
    null,
  );

  // capabilities: the key currently being saved (null = idle)
  const [savingCapabilityKey, setSavingCapabilityKey] = useState<
    keyof KioskCapabilities | null
  >(null);

  // pricing
  const [isAddingPricing, setIsAddingPricing] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  const [newPricing, setNewPricing] =
    useState<CreateKioskPricingPayload>(emptyNewPricing());

  // blank A4 sheet pricing (popup)
  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [paperPricing, setPaperPricing] = useState<PaperPricing | null>(
    null,
  );
  const [paperPriceDraft, setPaperPriceDraft] = useState("");
  const [paperLoading, setPaperLoading] = useState(false);
  const [paperSaving, setPaperSaving] = useState(false);
  const [paperToggling, setPaperToggling] = useState(false);

  const paperBusy = paperSaving || paperToggling;

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

  // confirm dialog (replaces window.confirm everywhere on this page)
  const [confirmDialog, setConfirmDialog] =
    useState<ConfirmDialogState>(null);

  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

  const closeConfirmDialog = () => {
    if (isConfirmSubmitting) return;
    setConfirmDialog(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;

    try {
      setIsConfirmSubmitting(true);
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } finally {
      setIsConfirmSubmitting(false);
    }
  };

  // ==========================================
  // LOAD
  // ==========================================

  const loadKioskData = useCallback(
    async (silent = false) => {
      if (!kioskId) return;

      const token = accessTokenRef.current;

      // Auth context may still be hydrating; the effect below
      // re-runs once the token is available.
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        if (!silent) setIsLoading(true);

        const data = await getKioskById(token, kioskId);
        const normalized = normalizeKiosk(data);

        setKiosk(normalized);

        // Reset the previous institution name before resolving the current one.
        setInstitutionName(null);

        if (
          normalized.kiosk_type === "institution" &&
          normalized.institution_id
        ) {
          try {
            const institution = await getInstitutionById(
              normalized.institution_id,
              token,
            );

            setInstitutionName(institution.name ?? null);
          } catch (institutionError) {
            console.error(
              "Failed to load kiosk institution:",
              institutionError,
            );

            setInstitutionName(null);
          }
        }
      } catch (error) {
        console.error("Failed to load kiosk:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load kiosk details",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [kioskId],
  );

  // Runs when the kiosk changes or when the token first becomes
  // available. It does NOT refetch when the token merely rotates.
  useEffect(() => {
    void loadKioskData();
  }, [loadKioskData, hasAccessToken]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadKioskData(true);
      toast.success("Kiosk data refreshed");
    } finally {
      setIsRefreshing(false);
    }
  };

  // ==========================================
  // CAPABILITIES — toggle = instant save
  // ==========================================

  const handleToggleCapability = async (
    key: keyof KioskCapabilities,
    label: string,
  ) => {
    const token = accessTokenRef.current;

    if (!kioskId || !token || !kiosk) {
      toast.error("Authentication required");
      return;
    }

    // One save at a time, so quick clicks can't race each other.
    if (savingCapabilityKey) return;

    const previousValue = Boolean(kiosk.capabilities[key]);
    const nextValue = !previousValue;

    // Optimistic update: the switch flips immediately.
    setKiosk((previous) =>
      previous
        ? {
            ...previous,
            capabilities: { ...previous.capabilities, [key]: nextValue },
          }
        : previous,
    );

    try {
      setSavingCapabilityKey(key);

      // PUT supports partial updates, so only this one key is sent.
      const updated = await updateKioskCapabilities(token, kioskId, {
        [key]: nextValue,
      });

      setKiosk((previous) =>
        previous
          ? {
              ...previous,
              capabilities: { ...defaultCapabilities, ...updated },
            }
          : previous,
      );

      toast.success(`${label} ${nextValue ? "enabled" : "disabled"}`);
    } catch (error) {
      // Roll the switch back if the backend rejected the change.
      setKiosk((previous) =>
        previous
          ? {
              ...previous,
              capabilities: {
                ...previous.capabilities,
                [key]: previousValue,
              },
            }
          : previous,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to update ${label}`,
      );
    } finally {
      setSavingCapabilityKey(null);
    }
  };

  // ==========================================
  // PRICING
  // ==========================================

  const handleAddPricing = async () => {
    if (!kioskId || !accessToken) return;

    if (
      !Number.isFinite(newPricing.price_per_sheet) ||
      newPricing.price_per_sheet <= 0
    ) {
      toast.error("Price per sheet must be greater than 0");
      return;
    }

    try {
      setIsSavingPricing(true);

      const created = await createKioskPricing(
        accessToken,
        kioskId,
        newPricing,
      );

      setKiosk((previous) =>
        previous
          ? {
              ...previous,
              pricing: [...(previous.pricing ?? []), created],
            }
          : previous,
      );

      setIsAddingPricing(false);
      setNewPricing(emptyNewPricing());

      toast.success("Pricing row added");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add pricing row",
      );
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
        const updated = await updateKioskPricing(
          accessToken,
          kioskId,
          row.id,
          { active: true },
        );

        setKiosk((previous) =>
          previous
            ? {
                ...previous,
                pricing: (previous.pricing ?? []).map((p) =>
                  p.id === row.id ? updated : p,
                ),
              }
            : previous,
        );

        toast.success("Pricing row re-enabled");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update pricing row",
      );
    }
  };

  const handleUpdatePricingAmount = async (
    row: KioskPricing,
    newPrice: number,
  ) => {
    if (!kioskId || !accessToken || newPrice <= 0) return;

    try {
      const updated = await updateKioskPricing(
        accessToken,
        kioskId,
        row.id,
        { price_per_sheet: newPrice },
      );

      setKiosk((previous) =>
        previous
          ? {
              ...previous,
              pricing: (previous.pricing ?? []).map((p) =>
                p.id === row.id ? updated : p,
              ),
            }
          : previous,
      );

      toast.success("Price updated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update price",
      );
    }
  };

  // ==========================================
  // BLANK A4 SHEET PRICING (popup)
  // ==========================================

  const loadPaperPricing = async () => {
    if (!kioskId || !accessToken) return;

    try {
      setPaperLoading(true);

      const rows = await getKioskPaperPricing(accessToken, kioskId);

      // Only the A4 entry is used for blank-sheet pricing.
      const a4Rows = rows.filter(
        (row) => row.paper_size?.toUpperCase() === "A4",
      );

      const selected =
        a4Rows.find((row) => row.active) ?? a4Rows[0] ?? null;

      setPaperPricing(selected);
      setPaperPriceDraft(
        selected ? String(selected.price_per_sheet) : "",
      );
    } catch (error) {
      console.error("Failed to load blank A4 sheet pricing:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load blank A4 sheet price",
      );
    } finally {
      setPaperLoading(false);
    }
  };

  const openPaperModal = () => {
    setPaperModalOpen(true);
    void loadPaperPricing();
  };

  const closePaperModal = useCallback(() => {
    if (paperBusy) return;
    setPaperModalOpen(false);
  }, [paperBusy]);

  useEffect(() => {
    if (!paperModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePaperModal();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paperModalOpen, closePaperModal]);

  const handleSavePaperPrice = async () => {
    if (!kioskId || !accessToken) return;

    const rawPrice = paperPriceDraft.trim();
    const price = Number(rawPrice);

    if (rawPrice === "" || !Number.isFinite(price) || price <= 0) {
      toast.error("Enter a blank A4 sheet price greater than zero");
      return;
    }

    try {
      setPaperSaving(true);

      if (paperPricing) {
        const updated = await updateKioskPaperPricing(
          accessToken,
          kioskId,
          paperPricing.id,
          { price_per_sheet: price },
        );

        setPaperPricing(updated);
        setPaperPriceDraft(String(updated.price_per_sheet));
      } else {
        // Blank-sheet pricing has no print mode or printing side.
        const created = await createKioskPaperPricing(
          accessToken,
          kioskId,
          {
            paper_size: "A4",
            price_per_sheet: price,
          },
        );

        setPaperPricing(created);
        setPaperPriceDraft(String(created.price_per_sheet));
      }

      toast.success("Blank A4 sheet price saved");
      setPaperModalOpen(false);
    } catch (error) {
      console.error("Failed to save blank A4 sheet price:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save blank A4 sheet price",
      );
    } finally {
      setPaperSaving(false);
    }
  };

  const handleTogglePaperPrice = async () => {
    if (!kioskId || !accessToken || !paperPricing) {
      toast.error("Blank A4 sheet pricing was not found");
      return;
    }

    try {
      setPaperToggling(true);

      const updated = await updateKioskPaperPricing(
        accessToken,
        kioskId,
        paperPricing.id,
        { active: !paperPricing.active },
      );

      setPaperPricing(updated);

      toast.success(
        updated.active
          ? "Blank A4 sheet price activated"
          : "Blank A4 sheet price deactivated",
      );
    } catch (error) {
      console.error("Failed to change blank A4 price status:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update blank A4 price status",
      );
    } finally {
      setPaperToggling(false);
    }
  };

  // ==========================================
  // PRINTERS
  // ==========================================

  const handleAddPrinter = async () => {
    if (!kioskId || !accessToken) return;

    if (
      !printerForm.manufacturer.trim() ||
      !printerForm.model.trim() ||
      !printerForm.serial_number.trim()
    ) {
      toast.error(
        "Manufacturer, model, and serial number are all required",
      );
      return;
    }

    try {
      setIsSavingPrinter(true);

      const created = await addKioskPrinter(
        accessToken,
        kioskId,
        printerForm,
      );

      // A new printer replaces the current default, so clear the
      // old default flag locally to match the backend.
      setKiosk((previous) =>
        previous
          ? {
              ...previous,
              printers: [
                ...(previous.printers ?? []).map((p) =>
                  created.is_default ? { ...p, is_default: false } : p,
                ),
                created,
              ],
            }
          : previous,
      );

      setPrinterForm({
        manufacturer: "",
        model: "",
        serial_number: "",
      });

      setIsAddingPrinter(false);

      toast.success("Printer added — set as default automatically");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add printer",
      );
    } finally {
      setIsSavingPrinter(false);
    }
  };

  const handleRemovePrinter = (printerId: string) => {
    if (!kioskId || !accessToken) return;

    setConfirmDialog({
      title: "Remove printer",
      description:
        "This printer will be removed from the kiosk. You can register a new one afterwards.",
      confirmLabel: "Remove Printer",
      variant: "danger",
      onConfirm: async () => {
        try {
          await removeKioskPrinter(accessToken, kioskId, printerId);

          setKiosk((previous) =>
            previous
              ? {
                  ...previous,
                  printers: (previous.printers ?? []).map((p) =>
                    p.id === printerId
                      ? { ...p, removed_at: new Date().toISOString() }
                      : p,
                  ),
                }
              : previous,
          );

          toast.success("Printer removed");
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to remove printer",
          );
        }
      },
    });
  };

  // ==========================================
  // PAIRING
  // ==========================================

  const handleUnpair = () => {
    if (!kioskId || !accessToken) return;

    setConfirmDialog({
      title: "Unpair device",
      description:
        "The machine will need the new code to reconnect after this.",
      confirmLabel: "Unpair Device",
      variant: "danger",
      onConfirm: async () => {
        try {
          setIsUnpairing(true);

          const result = await unpairKiosk(accessToken, kioskId);

          setKiosk((previous) =>
            previous
              ? {
                  ...previous,
                  pairing_code: result.pairing_code,
                  device_id: null,
                  paired_at: null,
                }
              : previous,
          );

          toast.success("Device unpaired — new pairing code issued");
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to unpair device",
          );
        } finally {
          setIsUnpairing(false);
        }
      },
    });
  };

  const handleDeleteKiosk = () => {
    if (!kioskId || !kiosk || !accessToken) return;

    setConfirmDialog({
      title: "Delete kiosk",
      description: `Delete "${kiosk.name}"? This action cannot be undone.`,
      confirmLabel: "Delete Kiosk",
      variant: "danger",
      onConfirm: async () => {
        try {
          setIsDeleting(true);

          await deleteKiosk(accessToken, kioskId);

          toast.success("Kiosk deleted successfully");

          navigate("/sudo/kiosks");
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Delete isn't available yet — backend route pending",
          );
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  // ==========================================
  // LOADING / EMPTY STATES
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
          <p className="text-xs text-slate-500">
            Loading kiosk details...
          </p>
        </div>
      </div>
    );
  }

  if (!kiosk) {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border bg-white p-8 text-center">
        <Monitor className="mx-auto mb-3 h-10 w-10 text-slate-300" />

        <h2 className="text-base font-semibold text-slate-900">
          Kiosk not found
        </h2>

        <button
          type="button"
          onClick={() => navigate("/sudo/kiosks")}
          className={`${primaryBtn} mt-4`}
        >
          Back to Kiosks
        </button>
      </div>
    );
  }

  const isPaired = !!kiosk.paired_at;
  const capabilities = kiosk.capabilities;
  const pricingRows = kiosk.pricing ?? [];
  const printerRows = kiosk.printers ?? [];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="mx-auto w-full space-y-4 px-4 pb-8">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/sudo/kiosks")}
            aria-label="Back to kiosks"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold leading-tight text-slate-900">
                {kiosk.name}
              </h1>

              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${getStatusStyle(
                  kiosk.status,
                )}`}
              >
                {kiosk.status}
              </span>
            </div>

            <p className="mt-0.5 text-xs capitalize text-slate-500">
              {kiosk.kiosk_type} kiosk · {kiosk.city}, {kiosk.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/sudo/kiosks/${kioskId}/edit`)}
            className={outlineBtn}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className={outlineBtn}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="overflow-x-auto rounded-full border border-slate-200 bg-white p-1">
        <div className="flex min-w-max items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex h-8 items-center gap-2 rounded-full px-4 text-xs font-semibold transition ${
                  isActive
                    ? "bg-brand-purple text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className={`${cardClass} p-5`}>
            <h2 className="text-sm font-semibold text-slate-900">
              Kiosk Information
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* Kiosk type */}
              <div>
                <p className={eyebrowClass}>Type</p>

                <p className="mt-1 flex items-center gap-2 text-sm font-semibold capitalize text-slate-800">
                  {kiosk.kiosk_type === "institution" ? (
                    <Building2 className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Monitor className="h-4 w-4 text-slate-400" />
                  )}

                  {kiosk.kiosk_type}
                </p>
              </div>

              {/* Kiosk code (permanent, read-only) */}
              <div>
                <p className={eyebrowClass}>Kiosk Code</p>

                <p className="mt-1 font-mono text-sm font-semibold tracking-wider text-slate-800">
                  {kiosk.kiosk_code || "—"}
                </p>
              </div>

              {/* Institution name or public kiosk name */}
              <div>
                <p className={eyebrowClass}>
                  {kiosk.kiosk_type === "institution"
                    ? "Institution Name"
                    : "Public Kiosk Name"}
                </p>

                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  {kiosk.kiosk_type === "institution" ? (
                    <>
                      <Building2 className="h-4 w-4 shrink-0 text-slate-400" />

                      <span>
                        {institutionName ?? "Institution name unavailable"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Monitor className="h-4 w-4 shrink-0 text-slate-400" />

                      <span>{kiosk.name}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <p className={eyebrowClass}>Address</p>

                <p className="mt-1 flex items-start gap-2 text-sm font-semibold text-slate-800">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <span>
                    {kiosk.address_line_1}
                    {kiosk.address_line_2
                      ? `, ${kiosk.address_line_2}`
                      : ""}
                    , {kiosk.city}, {kiosk.state}, {kiosk.country}
                    {kiosk.postal_code ? ` - ${kiosk.postal_code}` : ""}
                  </span>
                </p>
              </div>

              {/* Coordinates */}
              {kiosk.latitude != null && kiosk.longitude != null && (
                <div>
                  <p className={eyebrowClass}>Coordinates</p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {kiosk.latitude}, {kiosk.longitude}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-red-700">
                  Danger Zone
                </h2>

                <p className="mt-0.5 text-xs text-red-600">
                  Permanently remove this kiosk. Note: this depends on a
                  backend route that isn't live yet.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDeleteKiosk}
                disabled={isDeleting}
                className={`${dangerBtn} shrink-0`}
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}

                Delete Kiosk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAPABILITIES — each toggle saves instantly */}
      {activeTab === "capabilities" && (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Capabilities
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Enforced at print time on this kiosk. Changes save
              automatically when you flip a toggle.
            </p>
          </div>

          <div className="p-5">
            <div className="grid gap-3 md:grid-cols-2">
              {capabilityItems.map((item) => {
                const enabled = Boolean(capabilities[item.key]);
                const isSavingThis = savingCapabilityKey === item.key;

                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-full border border-slate-200 py-3 pl-5 pr-4"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {item.label}
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {isSavingThis && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-purple" />
                      )}

                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={item.label}
                        disabled={savingCapabilityKey !== null}
                        onClick={() =>
                          void handleToggleCapability(item.key, item.label)
                        }
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                          enabled ? "bg-brand-purple" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                            enabled
                              ? "translate-x-[22px]"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PRICING */}
      {activeTab === "pricing" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Pricing Rows
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                One row per paper size + mode + side + pages per sheet.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(`/sudo/kiosks/${kioskId}/pricing`)
                }
                className={outlineBtn}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Pricing Grid
              </button>

              <button
                type="button"
                onClick={openPaperModal}
                className={outlineBtn}
              >
                <FileText className="h-3.5 w-3.5" />
                Blank A4 Price
              </button>

              <button
                type="button"
                onClick={() => setIsAddingPricing(true)}
                className={primaryBtn}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Pricing Row
              </button>
            </div>
          </div>

          {isAddingPricing && (
            <div className="rounded-3xl border border-brand-purple/20 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                New Pricing Row
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-5">
                <div>
                  <label className={labelClass}>Paper Size</label>

                  <select
                    value={newPricing.paper_size}
                    onChange={(e) =>
                      setNewPricing((p) => ({
                        ...p,
                        paper_size: e.target.value as PaperSize,
                      }))
                    }
                    className={inputClass}
                  >
                    {paperSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Print Mode</label>

                  <select
                    value={newPricing.print_mode}
                    onChange={(e) =>
                      setNewPricing((p) => ({
                        ...p,
                        print_mode: e.target.value as PrintMode,
                      }))
                    }
                    className={inputClass}
                  >
                    {printModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Side</label>

                  <select
                    value={newPricing.printing_side}
                    onChange={(e) =>
                      setNewPricing((p) => ({
                        ...p,
                        printing_side: e.target.value as PrintingSide,
                      }))
                    }
                    className={inputClass}
                  >
                    {printingSides.map((side) => (
                      <option key={side} value={side}>
                        {side}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Pages / Sheet</label>

                  <select
                    value={newPricing.pages_per_sheet ?? 1}
                    onChange={(e) =>
                      setNewPricing((p) => ({
                        ...p,
                        pages_per_sheet: Number(
                          e.target.value,
                        ) as PagesPerSheet,
                      }))
                    }
                    className={inputClass}
                  >
                    {pageLayouts.map((pages) => (
                      <option key={pages} value={pages}>
                        {pages}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Price / Sheet (₹)</label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newPricing.price_per_sheet || ""}
                    onChange={(e) =>
                      setNewPricing((p) => ({
                        ...p,
                        price_per_sheet: Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPricing(false);
                    setNewPricing(emptyNewPricing());
                  }}
                  className={outlineBtn}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleAddPricing()}
                  disabled={isSavingPricing}
                  className={primaryBtn}
                >
                  {isSavingPricing && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}

                  Add Row
                </button>
              </div>
            </div>
          )}

          <div className={`${cardClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5">Paper</th>
                    <th className="px-5 py-2.5">Mode</th>
                    <th className="px-5 py-2.5">Side</th>
                    <th className="px-5 py-2.5">Pages / Sheet</th>
                    <th className="px-5 py-2.5">Price / Sheet</th>
                    <th className="px-5 py-2.5">Status</th>
                    <th className="px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {pricingRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-6 text-center text-slate-500"
                      >
                        No pricing rows yet.
                      </td>
                    </tr>
                  ) : (
                    pricingRows.map((row) => (
                      <tr key={row.id} className="align-middle">
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          {row.paper_size}
                        </td>

                        <td className="px-5 py-3 text-slate-600">
                          {row.print_mode}
                        </td>

                        <td className="px-5 py-3 text-slate-600">
                          {row.printing_side}
                        </td>

                        <td className="px-5 py-3 text-slate-600">
                          {row.pages_per_sheet ?? 1}
                        </td>

                        <td className="px-5 py-3">
                          <input
                            key={`${row.id}-${row.price_per_sheet}`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            defaultValue={row.price_per_sheet}
                            onBlur={(e) => {
                              const val = Number(e.target.value);

                              if (
                                Number.isFinite(val) &&
                                val !== row.price_per_sheet &&
                                val > 0
                              ) {
                                void handleUpdatePricingAmount(row, val);
                              }
                            }}
                            className="h-8 w-24 rounded-full border border-slate-200 px-3 text-xs outline-none transition focus:border-brand-purple"
                          />
                        </td>

                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                              row.active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-500"
                            }`}
                          >
                            {row.active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              void handleTogglePricingActive(row)
                            }
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-brand-purple transition hover:bg-purple-50"
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
        </div>
      )}

      {/* PRINTERS */}
      {activeTab === "printers" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Printers</h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Registering a new printer replaces the current default.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingPrinter(true)}
              className={primaryBtn}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Printer
            </button>
          </div>

          {isAddingPrinter && (
            <div className="rounded-3xl border border-brand-purple/20 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Add New Printer
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label className={labelClass}>Manufacturer</label>

                  <input
                    value={printerForm.manufacturer}
                    onChange={(e) =>
                      setPrinterForm((p) => ({
                        ...p,
                        manufacturer: e.target.value,
                      }))
                    }
                    placeholder="HP"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Model</label>

                  <input
                    value={printerForm.model}
                    onChange={(e) =>
                      setPrinterForm((p) => ({
                        ...p,
                        model: e.target.value,
                      }))
                    }
                    placeholder="LaserJet Pro M404dn"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Serial Number</label>

                  <input
                    value={printerForm.serial_number}
                    onChange={(e) =>
                      setPrinterForm((p) => ({
                        ...p,
                        serial_number: e.target.value,
                      }))
                    }
                    placeholder="CNB1X2Y3Z4"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPrinter(false)}
                  className={outlineBtn}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleAddPrinter()}
                  disabled={isSavingPrinter}
                  className={primaryBtn}
                >
                  {isSavingPrinter && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}

                  Add Printer
                </button>
              </div>
            </div>
          )}

          {printerRows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Printer className="mx-auto h-8 w-8 text-slate-300" />

              <h3 className="mt-3 text-sm font-semibold text-slate-700">
                No printers registered
              </h3>
            </div>
          ) : (
            <div className="space-y-3">
              {printerRows.map((printer) => {
                const isRemoved = !!printer.removed_at;

                return (
                  <div
                    key={printer.id}
                    className={`rounded-3xl border bg-white px-5 py-3.5 ${
                      isRemoved
                        ? "border-slate-200 opacity-60"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-brand-purple">
                          <Printer className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {printer.manufacturer} {printer.model}
                            </h3>

                            {printer.is_default && !isRemoved && (
                              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-purple">
                                Default
                              </span>
                            )}

                            {isRemoved && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                                Removed
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 text-xs text-slate-500">
                            S/N: {printer.serial_number}
                          </p>
                        </div>
                      </div>

                      {!isRemoved && (
                        <button
                          type="button"
                          aria-label="Remove printer"
                          onClick={() => handleRemovePrinter(printer.id)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-100 text-red-600 transition hover:bg-red-50"
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
        <div className="space-y-4">
          <div className={`${cardClass} p-5`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-50 text-brand-purple">
                  <Wifi className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Device Pairing Status
                  </p>

                  <h2
                    className={`mt-0.5 text-base font-bold ${
                      isPaired ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    {isPaired ? "Paired" : "Awaiting Pairing"}
                  </h2>
                </div>
              </div>

              {isPaired && (
                <button
                  type="button"
                  onClick={handleUnpair}
                  disabled={isUnpairing}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-red-200 px-5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUnpairing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Unplug className="h-3.5 w-3.5" />
                  )}

                  Unpair Device
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
              <div>
                <p className={eyebrowClass}>Device ID</p>

                <p className="mt-1 break-all font-mono text-xs font-medium text-slate-800">
                  {kiosk.device_id || "No device paired"}
                </p>
              </div>

              <div>
                <p className={eyebrowClass}>Paired At</p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {kiosk.paired_at
                    ? new Date(kiosk.paired_at).toLocaleString()
                    : "Not paired"}
                </p>
              </div>
            </div>
          </div>

          <div className={`${cardClass} p-5`}>
            <h2 className="text-sm font-semibold text-slate-900">
              Pairing Code
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Hand this to the on-site installer — it's entered once on the
              kiosk machine to pair it.
              {isPaired &&
                " This code is already consumed and can no longer be used."}
            </p>

            <div className="mt-4 rounded-full bg-slate-50 px-5 py-3">
              <p className="break-all text-center font-mono text-base font-bold tracking-wider text-slate-900">
                {kiosk.pairing_code || "Not available"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BLANK A4 SHEET PRICE POPUP */}
      {paperModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blank-a4-title"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cancel"
            onClick={closePaperModal}
            className="absolute inset-0 cursor-default bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={closePaperModal}
              disabled={paperBusy}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-50 text-brand-purple">
              <FileText className="h-5 w-5" />
            </div>

            <h2
              id="blank-a4-title"
              className="mt-4 text-sm font-bold text-slate-900"
            >
              Blank A4 Sheet Price
            </h2>

            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Price for one blank A4 sheet. This is separate from
              black-and-white and color printing.
            </p>

            <div className="mt-5">
              {paperLoading ? (
                <div className="flex items-center gap-3 py-3 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-purple" />
                  Loading blank-sheet price...
                </div>
              ) : (
                <>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label
                      htmlFor="blank-a4-price"
                      className="px-1 text-xs font-semibold text-slate-700"
                    >
                      A4 · Price per blank sheet (₹)
                    </label>

                    {paperPricing && (
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                          paperPricing.active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-500"
                        }`}
                      >
                        {paperPricing.active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="blank-a4-price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      autoFocus
                      value={paperPriceDraft}
                      onChange={(e) => setPaperPriceDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !paperBusy) {
                          void handleSavePaperPrice();
                        }
                      }}
                      disabled={paperBusy}
                      placeholder="Price per blank A4 sheet"
                      className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-800 outline-none transition focus:border-brand-purple disabled:bg-slate-50"
                    />
                  </div>

                  {!paperPricing && (
                    <p className="mt-2 px-1 text-[11px] text-slate-500">
                      No blank A4 sheet price has been configured yet.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              {paperPricing && !paperLoading ? (
                <button
                  type="button"
                  onClick={() => void handleTogglePaperPrice()}
                  disabled={paperBusy}
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    paperPricing.active
                      ? "border-red-200 text-red-600 hover:bg-red-50"
                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {paperToggling ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Power className="h-3.5 w-3.5" />
                  )}

                  {paperPricing.active ? "Deactivate" : "Activate"}
                </button>
              ) : (
                <span />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closePaperModal}
                  disabled={paperBusy}
                  className={outlineBtn}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleSavePaperPrice()}
                  disabled={paperBusy || paperLoading}
                  className={primaryBtn}
                >
                  {paperSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : paperPricing ? (
                    <Save className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}

                  {paperSaving
                    ? "Saving..."
                    : paperPricing
                      ? "Save Price"
                      : "Add Price"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG — delete / unpair / remove printer */}
      <ConfirmDialog
        state={confirmDialog}
        isSubmitting={isConfirmSubmitting}
        onCancel={closeConfirmDialog}
        onConfirm={() => void handleConfirmAction()}
      />
    </div>
  );
}