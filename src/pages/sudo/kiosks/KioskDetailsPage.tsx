import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
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

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import {
  addKioskPrinter,
  deleteKiosk,
  deleteKioskPrinter,
  getKioskById,
  getKioskCapabilities,
  getKioskPairing,
  getKioskPricing,
  getKioskPrinters,
  pairKiosk,
  unpairKiosk,
  updateKiosk,
  updateKioskCapabilities,
  updateKioskPricing,
  updateKioskPrinter,
} from "../../../api/kioskApi";

import type {
  AddKioskPrinterPayload,
  Kiosk,
  KioskCapabilities,
  KioskPairing,
  KioskPricing,
  KioskPrinter,
  KioskStatus,
  KioskType,
  UpdateKioskCapabilitiesPayload,
  UpdateKioskPayload,
  UpdateKioskPricingPayload,
  UpdateKioskPrinterPayload,
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

// ==========================================
// CONSTANTS
// ==========================================

const tabs: {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
}[] = [
  {
    id: "overview",
    label: "Overview",
    icon: Monitor,
  },
  {
    id: "capabilities",
    label: "Capabilities",
    icon: Settings2,
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: CreditCard,
  },
  {
    id: "printers",
    label: "Printers",
    icon: Printer,
  },
  {
    id: "pairing",
    label: "Device Pairing",
    icon: Wifi,
  },
];

const statusOptions: KioskStatus[] = [
  "active",
  "inactive",
  "maintenance",
  "suspended",
];

const kioskTypeOptions: KioskType[] = [
  "institution",
  "public",
];

// ==========================================
// STATUS STYLE
// ==========================================

const getStatusStyle = (
  status: string,
) => {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "inactive":
      return "bg-slate-100 text-slate-600 border-slate-200";

    case "maintenance":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "suspended":
      return "bg-red-50 text-red-700 border-red-200";

    case "paired":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "unpaired":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

// ==========================================
// COMPONENT
// ==========================================

export default function KioskDetailsPage() {
  const navigate = useNavigate();

  const { kioskId } = useParams<{
    kioskId: string;
  }>();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [activeTab, setActiveTab] =
    useState<ActiveTab>("overview");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [kiosk, setKiosk] =
    useState<Kiosk | null>(null);

  const [capabilities, setCapabilities] =
    useState<KioskCapabilities>({});

  const [pricing, setPricing] =
    useState<KioskPricing>({});

  const [printers, setPrinters] =
    useState<KioskPrinter[]>([]);

  const [pairing, setPairing] =
    useState<KioskPairing | null>(null);

  // ==========================================
  // EDIT KIOSK
  // ==========================================

  const [isEditingKiosk, setIsEditingKiosk] =
    useState(false);

  const [isSavingKiosk, setIsSavingKiosk] =
    useState(false);

  const [kioskForm, setKioskForm] =
    useState<UpdateKioskPayload>({});

  // ==========================================
  // CAPABILITIES
  // ==========================================

  const [isSavingCapabilities, setIsSavingCapabilities] =
    useState(false);

  // ==========================================
  // PRICING
  // ==========================================

  const [isSavingPricing, setIsSavingPricing] =
    useState(false);

  // ==========================================
  // PRINTER
  // ==========================================

  const [isAddingPrinter, setIsAddingPrinter] =
    useState(false);

  const [isSavingPrinter, setIsSavingPrinter] =
    useState(false);

  const [editingPrinterId, setEditingPrinterId] =
    useState<string | null>(null);

  const [printerForm, setPrinterForm] =
    useState<AddKioskPrinterPayload>({
      name: "",
      model: "",
      is_default: false,
    });

  const [editingPrinterForm, setEditingPrinterForm] =
    useState<UpdateKioskPrinterPayload>({});

  // ==========================================
  // PAIRING
  // ==========================================

  const [isPairing, setIsPairing] =
    useState(false);

  const [isUnpairing, setIsUnpairing] =
    useState(false);

  const [pairingCode, setPairingCode] =
    useState("");

  const [deviceId, setDeviceId] =
    useState("");

  // ==========================================
  // DELETE
  // ==========================================

  const [isDeleting, setIsDeleting] =
    useState(false);

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadKioskData = useCallback(
    async () => {
      if (!kioskId) return;

      if (!accessToken) {
        toast.error("Authentication required");

        navigate("/sudo/login");

        return;
      }

      try {
        setIsLoading(true);

        const [
          kioskData,
          capabilitiesData,
          pricingData,
          printersData,
          pairingData,
        ] = await Promise.all([
          getKioskById(accessToken, kioskId),
          getKioskCapabilities(accessToken, kioskId),
          getKioskPricing(accessToken, kioskId),
          getKioskPrinters(accessToken, kioskId),
          getKioskPairing(accessToken, kioskId),
        ]);

        setKiosk(kioskData);

        setCapabilities(
          capabilitiesData || {},
        );

        setPricing(
          pricingData || {},
        );

        setPrinters(
          printersData || [],
        );

        setPairing(
          pairingData || null,
        );

        setKioskForm({
          name: kioskData.name,
          code: kioskData.code,
          type: kioskData.type,
          institution_id:
            kioskData.institution_id || null,
          location:
            kioskData.location || "",
          status: kioskData.status,
        });
      } catch (error) {
        console.error(
          "Failed to load kiosk:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load kiosk details",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [kioskId, accessToken, navigate],
  );

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    void loadKioskData();
  }, [loadKioskData]);

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      await loadKioskData();

      toast.success(
        "Kiosk data refreshed",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // ==========================================
  // UPDATE KIOSK
  // ==========================================

  const handleSaveKiosk = async () => {
    if (!kioskId) return;

    if (!accessToken) {
      toast.error("Authentication required");

      navigate("/sudo/login");

      return;
    }

    if (!kioskForm.name?.trim()) {
      toast.error(
        "Kiosk name is required",
      );
      return;
    }

    if (!kioskForm.code?.trim()) {
      toast.error(
        "Kiosk code is required",
      );
      return;
    }

    try {
      setIsSavingKiosk(true);

      const updatedKiosk =
        await updateKiosk(
          accessToken,
          kioskId,
          kioskForm,
        );

      setKiosk(updatedKiosk);

      setIsEditingKiosk(false);

      toast.success(
        "Kiosk updated successfully",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update kiosk",
      );
    } finally {
      setIsSavingKiosk(false);
    }
  };

  // ==========================================
  // SAVE CAPABILITIES
  // ==========================================

  const handleSaveCapabilities =
    async () => {
      if (!kioskId) return;

      if (!accessToken) {
        toast.error("Authentication required");

        navigate("/sudo/login");

        return;
      }

      try {
        setIsSavingCapabilities(true);

        const payload: UpdateKioskCapabilitiesPayload =
          {
            ...capabilities,
          };

        const updated =
          await updateKioskCapabilities(
            accessToken,
            kioskId,
            payload,
          );

        setCapabilities(updated);

        toast.success(
          "Capabilities updated successfully",
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update capabilities",
        );
      } finally {
        setIsSavingCapabilities(false);
      }
    };

  // ==========================================
  // SAVE PRICING
  // ==========================================

  const handleSavePricing = async () => {
    if (!kioskId) return;

    if (!accessToken) {
      toast.error("Authentication required");

      navigate("/sudo/login");

      return;
    }

    try {
      setIsSavingPricing(true);

      const payload: UpdateKioskPricingPayload =
        {
          black_white_single:
            pricing.black_white_single,
          black_white_double:
            pricing.black_white_double,
          color_single:
            pricing.color_single,
          color_double:
            pricing.color_double,
          scan: pricing.scan,
          copy: pricing.copy,
        };

      const updated =
        await updateKioskPricing(
          accessToken,
          kioskId,
          payload,
        );

      setPricing(updated);

      toast.success(
        "Pricing updated successfully",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update pricing",
      );
    } finally {
      setIsSavingPricing(false);
    }
  };

  // ==========================================
  // ADD PRINTER
  // ==========================================

  const handleAddPrinter = async () => {
    if (!kioskId) return;

    if (!accessToken) {
      toast.error("Authentication required");

      navigate("/sudo/login");

      return;
    }

    if (!printerForm.name.trim()) {
      toast.error(
        "Printer name is required",
      );
      return;
    }

    try {
      setIsSavingPrinter(true);

      const newPrinter =
        await addKioskPrinter(
          accessToken,
          kioskId,
          printerForm,
        );

      setPrinters((previous) => [
        ...previous,
        newPrinter,
      ]);

      setPrinterForm({
        name: "",
        model: "",
        is_default: false,
      });

      setIsAddingPrinter(false);

      toast.success(
        "Printer added successfully",
      );
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

  // ==========================================
  // START EDIT PRINTER
  // ==========================================

  const handleStartEditPrinter = (
    printer: KioskPrinter,
  ) => {
    setEditingPrinterId(printer.id);

    setEditingPrinterForm({
      name: printer.name,
      model: printer.model || "",
      status:
        printer.status || "active",
      is_default:
        printer.is_default || false,
    });
  };

  // ==========================================
  // SAVE PRINTER
  // ==========================================

  const handleSavePrinter = async (
    printerId: string,
  ) => {
    if (!kioskId) return;

    if (!accessToken) {
      toast.error("Authentication required");

      navigate("/sudo/login");

      return;
    }

    try {
      setIsSavingPrinter(true);

      const updated =
        await updateKioskPrinter(
          accessToken,
          kioskId,
          printerId,
          editingPrinterForm,
        );

      setPrinters((previous) =>
        previous.map((printer) =>
          printer.id === printerId
            ? updated
            : printer,
        ),
      );

      setEditingPrinterId(null);

      toast.success(
        "Printer updated successfully",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update printer",
      );
    } finally {
      setIsSavingPrinter(false);
    }
  };

  // ==========================================
  // DELETE PRINTER
  // ==========================================

  const handleDeletePrinter = async (
    printerId: string,
  ) => {
    if (!kioskId) return;

    if (!accessToken) {
      toast.error("Authentication required");

      navigate("/sudo/login");

      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this printer?",
    );

    if (!confirmed) return;

    try {
      await deleteKioskPrinter(
        accessToken,
        kioskId,
        printerId,
      );

      setPrinters((previous) =>
        previous.filter(
          (printer) =>
            printer.id !== printerId,
        ),
      );

      toast.success(
        "Printer deleted successfully",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete printer",
      );
    }
  };

  // ==========================================
  // PAIR KIOSK
  // ==========================================

  const handlePairKiosk = async () => {
    if (!kioskId) return;

    if (!accessToken) {
      toast.error("Authentication required");

      navigate("/sudo/login");

      return;
    }

    if (
      !pairingCode.trim() &&
      !deviceId.trim()
    ) {
      toast.error(
        "Enter pairing code or device ID",
      );
      return;
    }

    try {
      setIsPairing(true);

      const pairingData =
        await pairKiosk(accessToken, kioskId, {
          pairing_code:
            pairingCode.trim() || undefined,
          device_id:
            deviceId.trim() || undefined,
        });

      setPairing(pairingData);

      setPairingCode("");
      setDeviceId("");

      toast.success(
        "Kiosk paired successfully",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to pair kiosk",
      );
    } finally {
      setIsPairing(false);
    }
  };

  // ==========================================
  // UNPAIR KIOSK
  // ==========================================

  const handleUnpairKiosk = async () => {
    if (!kioskId) return;

    if (!accessToken) {
      toast.error("Authentication required");

      navigate("/sudo/login");

      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to unpair this device?",
    );

    if (!confirmed) return;

    try {
      setIsUnpairing(true);

      await unpairKiosk(accessToken, kioskId);

      setPairing({
        kiosk_id: kioskId,
        status: "unpaired",
      });

      toast.success(
        "Device unpaired successfully",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to unpair device",
      );
    } finally {
      setIsUnpairing(false);
    }
  };

  // ==========================================
  // DELETE KIOSK
  // ==========================================

  const handleDeleteKiosk = async () => {
    if (!kioskId || !kiosk) return;

    if (!accessToken) {
      toast.error("Authentication required");

      navigate("/sudo/login");

      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${kiosk.name}"?`,
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);

      await deleteKiosk(accessToken, kioskId);

      toast.success(
        "Kiosk deleted successfully",
      );

      navigate("/sudo/kiosks");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete kiosk",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />

          <p className="text-sm text-slate-500">
            Loading kiosk details...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // NOT FOUND
  // ==========================================

  if (!kiosk) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <Monitor className="mx-auto mb-4 h-12 w-12 text-slate-300" />

        <h2 className="text-lg font-semibold text-slate-900">
          Kiosk not found
        </h2>

        <button
          type="button"
          onClick={() =>
            navigate("/sudo/kiosks")
          }
          className="mt-5 rounded-xl bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to Kiosks
        </button>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-start gap-4">

          <button
            type="button"
            onClick={() =>
              navigate("/sudo/kiosks")
            }
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-2xl font-bold text-slate-900">
                {kiosk.name}
              </h1>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                  kiosk.status,
                )}`}
              >
                {kiosk.status}
              </span>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Kiosk Code:{" "}
              <span className="font-semibold text-slate-700">
                {kiosk.code}
              </span>
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isRefreshing
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>

      </div>

      {/* ======================================
          TABS
      ====================================== */}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">

        <div className="flex min-w-max gap-2">

          {tabs.map((tab) => {
            const Icon = tab.icon;

            const isActive =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand-purple text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />

                {tab.label}
              </button>
            );
          })}

        </div>

      </div>

      {/* ======================================
          OVERVIEW TAB
      ====================================== */}

      {activeTab === "overview" && (

        <div className="space-y-6">

          <div className="rounded-2xl border border-slate-200 bg-white">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Kiosk Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage basic kiosk details
                </p>
              </div>

              {!isEditingKiosk && (
                <button
                  type="button"
                  onClick={() =>
                    setIsEditingKiosk(true)
                  }
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />

                  Edit
                </button>
              )}

            </div>

            <div className="p-6">

              {!isEditingKiosk ? (

                <div className="grid gap-6 md:grid-cols-2">

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Kiosk Name
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {kiosk.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Kiosk Code
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {kiosk.code}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Type
                    </p>

                    <p className="mt-2 capitalize font-semibold text-slate-800">
                      {kiosk.type}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Status
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                        kiosk.status,
                      )}`}
                    >
                      {kiosk.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Location
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {kiosk.location ||
                        "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Institution ID
                    </p>

                    <p className="mt-2 break-all font-semibold text-slate-800">
                      {kiosk.institution_id ||
                        "Public kiosk"}
                    </p>
                  </div>

                </div>

              ) : (

                <div className="space-y-6">

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Kiosk Name
                      </label>

                      <input
                        value={
                          kioskForm.name || ""
                        }
                        onChange={(event) =>
                          setKioskForm(
                            (previous) => ({
                              ...previous,
                              name:
                                event.target.value,
                            }),
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-purple"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Kiosk Code
                      </label>

                      <input
                        value={
                          kioskForm.code || ""
                        }
                        onChange={(event) =>
                          setKioskForm(
                            (previous) => ({
                              ...previous,
                              code:
                                event.target.value,
                            }),
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 uppercase outline-none transition focus:border-brand-purple"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Kiosk Type
                      </label>

                      <select
                        value={
                          kioskForm.type ||
                          kiosk.type
                        }
                        onChange={(event) =>
                          setKioskForm(
                            (previous) => ({
                              ...previous,
                              type:
                                event.target
                                  .value as KioskType,
                            }),
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                      >
                        {kioskTypeOptions.map(
                          (type) => (
                            <option
                              key={type}
                              value={type}
                            >
                              {type}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Status
                      </label>

                      <select
                        value={
                          kioskForm.status ||
                          kiosk.status
                        }
                        onChange={(event) =>
                          setKioskForm(
                            (previous) => ({
                              ...previous,
                              status:
                                event.target
                                  .value as KioskStatus,
                            }),
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                      >
                        {statusOptions.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Location
                      </label>

                      <input
                        value={
                          kioskForm.location || ""
                        }
                        onChange={(event) =>
                          setKioskForm(
                            (previous) => ({
                              ...previous,
                              location:
                                event.target.value,
                            }),
                          )
                        }
                        placeholder="Enter kiosk location"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                      />
                    </div>

                  </div>

                  <div className="flex justify-end gap-3">

                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingKiosk(
                          false,
                        );

                        setKioskForm({
                          name: kiosk.name,
                          code: kiosk.code,
                          type: kiosk.type,
                          institution_id:
                            kiosk.institution_id ||
                            null,
                          location:
                            kiosk.location || "",
                          status:
                            kiosk.status,
                        });
                      }}
                      className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleSaveKiosk
                      }
                      disabled={
                        isSavingKiosk
                      }
                      className="flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isSavingKiosk ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}

                      Save Changes
                    </button>

                  </div>

                </div>

              )}

            </div>

          </div>

          {/* Danger Zone */}

          <div className="rounded-2xl border border-red-200 bg-red-50">

            <div className="p-6">

              <h2 className="font-semibold text-red-700">
                Danger Zone
              </h2>

              <p className="mt-1 text-sm text-red-600">
                Permanently remove or deactivate this kiosk.
              </p>

              <button
                type="button"
                onClick={
                  handleDeleteKiosk
                }
                disabled={isDeleting}
                className="mt-5 flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                Delete Kiosk
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================
          CAPABILITIES TAB
      ====================================== */}

      {activeTab === "capabilities" && (

        <div className="rounded-2xl border border-slate-200 bg-white">

          <div className="border-b border-slate-100 px-6 py-5">

            <h2 className="font-semibold text-slate-900">
              Kiosk Capabilities
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enable or disable services available on this kiosk
            </p>

          </div>

          <div className="p-6">

            <div className="grid gap-4 md:grid-cols-2">

              {[
                {
                  key: "print",
                  label: "Printing",
                  description:
                    "Allow document printing",
                },
                {
                  key: "scan",
                  label: "Scanning",
                  description:
                    "Allow document scanning",
                },
                {
                  key: "copy",
                  label: "Copy",
                  description:
                    "Allow document copying",
                },
                {
                  key: "color_print",
                  label: "Color Print",
                  description:
                    "Enable color printing",
                },
                {
                  key: "black_white_print",
                  label: "Black & White",
                  description:
                    "Enable black and white printing",
                },
                {
                  key: "duplex",
                  label: "Duplex",
                  description:
                    "Enable double-sided printing",
                },
              ].map((item) => {

                const key =
                  item.key as keyof KioskCapabilities;

                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-5"
                  >

                    <div>

                      <h3 className="font-semibold text-slate-800">
                        {item.label}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.description}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCapabilities(
                          (previous) => ({
                            ...previous,
                            [key]:
                              !previous[key],
                          }),
                        )
                      }
                      className={`relative h-7 w-12 rounded-full transition ${
                        capabilities[key]
                          ? "bg-brand-purple"
                          : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                          capabilities[key]
                            ? "left-6"
                            : "left-1"
                        }`}
                      />
                    </button>

                  </div>
                );
              })}

            </div>

            <div className="mt-6 flex justify-end">

              <button
                type="button"
                onClick={
                  handleSaveCapabilities
                }
                disabled={
                  isSavingCapabilities
                }
                className="flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSavingCapabilities ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                Save Capabilities
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================
          PRICING TAB
      ====================================== */}

      {activeTab === "pricing" && (

        <div className="rounded-2xl border border-slate-200 bg-white">

          <div className="border-b border-slate-100 px-6 py-5">

            <h2 className="font-semibold text-slate-900">
              Service Pricing
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure pricing for kiosk services
            </p>

          </div>

          <div className="p-6">

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {[
                {
                  key: "black_white_single",
                  label:
                    "B&W Single Side",
                },
                {
                  key: "black_white_double",
                  label:
                    "B&W Double Side",
                },
                {
                  key: "color_single",
                  label:
                    "Color Single Side",
                },
                {
                  key: "color_double",
                  label:
                    "Color Double Side",
                },
                {
                  key: "scan",
                  label: "Scanning",
                },
                {
                  key: "copy",
                  label: "Copy",
                },
              ].map((item) => {

                const key =
                  item.key as keyof KioskPricing;

                return (
                  <div key={item.key}>

                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {item.label}
                    </label>

                    <div className="relative">

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          pricing[key] ?? ""
                        }
                        onChange={(event) =>
                          setPricing(
                            (previous) => ({
                              ...previous,
                              [key]:
                                event.target.value ===
                                ""
                                  ? undefined
                                  : Number(
                                      event
                                        .target
                                        .value,
                                    ),
                            }),
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 outline-none focus:border-brand-purple"
                      />

                    </div>

                  </div>
                );
              })}

            </div>

            <div className="mt-6 flex justify-end">

              <button
                type="button"
                onClick={handleSavePricing}
                disabled={isSavingPricing}
                className="flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSavingPricing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                Save Pricing
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ======================================
          PRINTERS TAB
      ====================================== */}

      {activeTab === "printers" && (

        <div className="space-y-6">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Connected Printers
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage printers connected to this kiosk
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsAddingPrinter(true)
              }
              className="flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />

              Add Printer
            </button>

          </div>

          {/* Add Printer Form */}

          {isAddingPrinter && (

            <div className="rounded-2xl border border-brand-purple/20 bg-white p-6">

              <h3 className="font-semibold text-slate-900">
                Add New Printer
              </h3>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Printer Name
                  </label>

                  <input
                    value={
                      printerForm.name
                    }
                    onChange={(event) =>
                      setPrinterForm(
                        (previous) => ({
                          ...previous,
                          name:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="HP LaserJet"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Model
                  </label>

                  <input
                    value={
                      printerForm.model ||
                      ""
                    }
                    onChange={(event) =>
                      setPrinterForm(
                        (previous) => ({
                          ...previous,
                          model:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="Model number"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                  />
                </div>

              </div>

              <label className="mt-5 flex items-center gap-3 text-sm font-medium text-slate-700">

                <input
                  type="checkbox"
                  checked={
                    printerForm.is_default ||
                    false
                  }
                  onChange={(event) =>
                    setPrinterForm(
                      (previous) => ({
                        ...previous,
                        is_default:
                          event.target.checked,
                      }),
                    )
                  }
                  className="h-4 w-4 accent-brand-purple"
                />

                Set as default printer

              </label>

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setIsAddingPrinter(false)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleAddPrinter
                  }
                  disabled={
                    isSavingPrinter
                  }
                  className="flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSavingPrinter && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  Add Printer
                </button>

              </div>

            </div>

          )}

          {/* Printer List */}

          {printers.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">

              <Printer className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-700">
                No printers connected
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add a printer to start managing kiosk printing.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {printers.map((printer) => {

                const isEditing =
                  editingPrinterId ===
                  printer.id;

                return (
                  <div
                    key={printer.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >

                    {!isEditing ? (

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex items-center gap-4">

                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-brand-purple">
                            <Printer className="h-6 w-6" />
                          </div>

                          <div>

                            <div className="flex items-center gap-2">

                              <h3 className="font-semibold text-slate-900">
                                {printer.name}
                              </h3>

                              {printer.is_default && (
                                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-brand-purple">
                                  Default
                                </span>
                              )}

                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                              {printer.model ||
                                "Model not specified"}
                            </p>

                          </div>

                        </div>

                        <div className="flex items-center gap-2">

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              printer.status ===
                              "active"
                                ? getStatusStyle(
                                    "active",
                                  )
                                : getStatusStyle(
                                    "inactive",
                                  )
                            }`}
                          >
                            {printer.status ||
                              "active"}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleStartEditPrinter(
                                printer,
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeletePrinter(
                                printer.id,
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </div>

                      </div>

                    ) : (

                      <div className="space-y-5">

                        <div className="grid gap-5 md:grid-cols-2">

                          <input
                            value={
                              editingPrinterForm.name ||
                              ""
                            }
                            onChange={(
                              event,
                            ) =>
                              setEditingPrinterForm(
                                (
                                  previous,
                                ) => ({
                                  ...previous,
                                  name:
                                    event.target
                                      .value,
                                }),
                              )
                            }
                            placeholder="Printer Name"
                            className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                          />

                          <input
                            value={
                              editingPrinterForm.model ||
                              ""
                            }
                            onChange={(
                              event,
                            ) =>
                              setEditingPrinterForm(
                                (
                                  previous,
                                ) => ({
                                  ...previous,
                                  model:
                                    event.target
                                      .value,
                                }),
                              )
                            }
                            placeholder="Printer Model"
                            className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                          />

                        </div>

                        <div className="flex justify-end gap-3">

                          <button
                            type="button"
                            onClick={() =>
                              setEditingPrinterId(
                                null,
                              )
                            }
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleSavePrinter(
                                printer.id,
                              )
                            }
                            disabled={
                              isSavingPrinter
                            }
                            className="flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white"
                          >
                            <Check className="h-4 w-4" />

                            Save
                          </button>

                        </div>

                      </div>

                    )}

                  </div>
                );
              })}

            </div>

          )}

        </div>

      )}

      {/* ======================================
          PAIRING TAB
      ====================================== */}

      {activeTab === "pairing" && (

        <div className="space-y-6">

          {/* Current Status */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-brand-purple">
                  <Wifi className="h-7 w-7" />
                </div>

                <div>

                  <p className="text-sm text-slate-500">
                    Device Pairing Status
                  </p>

                  <div className="mt-1 flex items-center gap-3">

                    <h2 className="text-xl font-bold capitalize text-slate-900">
                      {pairing?.status ||
                        "unpaired"}
                    </h2>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                        pairing?.status ||
                          "unpaired",
                      )}`}
                    >
                      {pairing?.status ||
                        "unpaired"}
                    </span>

                  </div>

                </div>

              </div>

              {pairing?.status ===
                "paired" && (

                <button
                  type="button"
                  onClick={
                    handleUnpairKiosk
                  }
                  disabled={
                    isUnpairing
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {isUnpairing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unplug className="h-4 w-4" />
                  )}

                  Unpair Device
                </button>

              )}

            </div>

            {pairing?.status ===
              "paired" && (

              <div className="mt-6 grid gap-5 border-t border-slate-100 pt-6 md:grid-cols-2">

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Device ID
                  </p>

                  <p className="mt-2 break-all font-medium text-slate-800">
                    {pairing.device_id ||
                      "Not available"}
                  </p>

                </div>

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Paired At
                  </p>

                  <p className="mt-2 font-medium text-slate-800">
                    {pairing.paired_at
                      ? new Date(
                          pairing.paired_at,
                        ).toLocaleString()
                      : "Not available"}
                  </p>

                </div>

              </div>

            )}

          </div>

          {/* Pair Device */}

          {pairing?.status !== "paired" && (

            <div className="rounded-2xl border border-slate-200 bg-white">

              <div className="border-b border-slate-100 px-6 py-5">

                <h2 className="font-semibold text-slate-900">
                  Pair New Device
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Connect a physical kiosk device using pairing credentials
                </p>

              </div>

              <div className="space-y-5 p-6">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Pairing Code
                  </label>

                  <input
                    value={pairingCode}
                    onChange={(event) =>
                      setPairingCode(
                        event.target.value,
                      )
                    }
                    placeholder="Enter pairing code"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                  />

                </div>

                <div className="relative flex items-center gap-4">

                  <div className="h-px flex-1 bg-slate-200" />

                  <span className="text-xs font-medium text-slate-400">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-slate-200" />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Device ID
                  </label>

                  <input
                    value={deviceId}
                    onChange={(event) =>
                      setDeviceId(
                        event.target.value,
                      )
                    }
                    placeholder="Enter device ID"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-purple"
                  />

                </div>

                <button
                  type="button"
                  onClick={
                    handlePairKiosk
                  }
                  disabled={isPairing}
                  className="flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isPairing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wifi className="h-4 w-4" />
                  )}

                  Pair Device
                </button>

              </div>

            </div>

          )}

        </div>

      )}

    </div>
  );
}