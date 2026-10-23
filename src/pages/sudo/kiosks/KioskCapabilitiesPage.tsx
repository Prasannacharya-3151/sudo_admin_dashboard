import { useCallback, useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Check,
  Loader2,
  Monitor,
  Save,
  Settings2,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import {
  getKioskCapabilities,
  updateKioskCapabilities,
} from "../../../api/kioskApi";

import type {
  KioskCapabilities,
  UpdateKioskCapabilitiesPayload,
} from "../../../types/kiosk";

// ============================================================
// CAPABILITY CONFIGURATION
// ============================================================

interface CapabilityItem {
  key: keyof KioskCapabilities;
  title: string;
  description: string;
  category: "printing" | "payment" | "layout";
}

const capabilityItems: CapabilityItem[] = [
  {
    key: "color_printing",
    title: "Color Printing",
    description:
      "Allow users to print documents in color on this kiosk.",
    category: "printing",
  },
  {
    key: "duplex_printing",
    title: "Duplex Printing",
    description:
      "Allow double-sided printing on this kiosk.",
    category: "printing",
  },
  {
    key: "upi_payment",
    title: "UPI Payment",
    description:
      "Accept payments through the UPI payment flow.",
    category: "payment",
  },
  {
    key: "rfid_payment",
    title: "RFID Payment",
    description:
      "Accept payments through supported institution RFID cards.",
    category: "payment",
  },
  {
    key: "pages_per_sheet_1",
    title: "1 Page per Sheet",
    description:
      "Allow printing one document page on each physical sheet.",
    category: "layout",
  },
  {
    key: "pages_per_sheet_2",
    title: "2 Pages per Sheet",
    description:
      "Allow printing two document pages on each physical sheet.",
    category: "layout",
  },
  {
    key: "pages_per_sheet_4",
    title: "4 Pages per Sheet",
    description:
      "Allow printing four document pages on each physical sheet.",
    category: "layout",
  },
];

// ============================================================
// DEFAULT CAPABILITIES
// ============================================================

const defaultCapabilities: KioskCapabilities = {
  color_printing: false,
  duplex_printing: false,
  upi_payment: false,
  rfid_payment: false,
  pages_per_sheet_1: false,
  pages_per_sheet_2: false,
  pages_per_sheet_4: false,
};

// ============================================================
// NORMALIZE SERVER RESPONSE
// ============================================================

function normalizeCapabilities(
  data: Partial<KioskCapabilities> | null | undefined,
): KioskCapabilities {
  return {
    ...defaultCapabilities,
    ...data,
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function KioskCapabilitiesPage() {
  const navigate = useNavigate();

  const { kioskId } = useParams<{ kioskId: string }>();

  const { accessToken } = useSudoAuth();

  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [capabilities, setCapabilities] =
    useState<KioskCapabilities>(defaultCapabilities);

  const [initialCapabilities, setInitialCapabilities] =
    useState<KioskCapabilities>(defaultCapabilities);

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  // ----------------------------------------------------------
  // LOAD CAPABILITIES
  // GET /api/v1/kiosks/{kioskId}/capabilities
  //
  // This is the public GET endpoint. It does not require the
  // Sudo Admin access token.
  // ----------------------------------------------------------

  const loadCapabilities = useCallback(async () => {
    if (!kioskId) {
      toast.error("Kiosk ID is missing");
      navigate("/sudo/kiosks");
      return;
    }

    try {
      setIsLoading(true);

      const data = await getKioskCapabilities(kioskId);

      const normalized = normalizeCapabilities(data);

      setCapabilities(normalized);
      setInitialCapabilities(normalized);
    } catch (error) {
      console.error(
        "Failed to load kiosk capabilities:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load kiosk capabilities",
      );
    } finally {
      setIsLoading(false);
    }
  }, [kioskId, navigate]);

  useEffect(() => {
    void loadCapabilities();
  }, [loadCapabilities]);

  // ----------------------------------------------------------
  // TOGGLE CAPABILITY
  // ----------------------------------------------------------

  const handleToggle = (key: keyof KioskCapabilities) => {
    setCapabilities((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  // ----------------------------------------------------------
  // CHECK UNSAVED CHANGES
  // ----------------------------------------------------------

  const hasChanges =
    JSON.stringify(capabilities) !==
    JSON.stringify(initialCapabilities);

  // ----------------------------------------------------------
  // SAVE CAPABILITIES
  //
  // PUT /api/v1/sudo-admin/kiosks/{kioskId}/capabilities
  //
  // Sends the seven capability values.
  // ----------------------------------------------------------

  const handleSave = async () => {
    if (!kioskId) {
      toast.error("Kiosk ID is missing");
      return;
    }

    if (!accessToken) {
      toast.error("Authentication required");
      navigate("/sudo/login");
      return;
    }

    if (!hasChanges) {
      toast.info("There are no changes to save");
      return;
    }

    const payload: UpdateKioskCapabilitiesPayload = {
      color_printing: capabilities.color_printing,
      duplex_printing: capabilities.duplex_printing,
      upi_payment: capabilities.upi_payment,
      rfid_payment: capabilities.rfid_payment,
      pages_per_sheet_1: capabilities.pages_per_sheet_1,
      pages_per_sheet_2: capabilities.pages_per_sheet_2,
      pages_per_sheet_4: capabilities.pages_per_sheet_4,
    };

    try {
      setIsSaving(true);

      const updated = await updateKioskCapabilities(
        accessToken,
        kioskId,
        payload,
      );

      const normalized = normalizeCapabilities(updated);

      setCapabilities(normalized);
      setInitialCapabilities(normalized);

      toast.success(
        "Kiosk capabilities updated successfully",
      );
    } catch (error) {
      console.error(
        "Failed to update kiosk capabilities:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update kiosk capabilities",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------------------------
  // RESET UNSAVED CHANGES
  // ----------------------------------------------------------

  const handleReset = () => {
    setCapabilities({ ...initialCapabilities });

    toast.info("Unsaved changes have been reset");
  };

  // ----------------------------------------------------------
  // NAVIGATION
  // ----------------------------------------------------------

  const handleBack = () => {
    navigate(`/sudo/kiosks/${kioskId}`);
  };

  // ----------------------------------------------------------
  // LOADING SCREEN
  // ----------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-brand-purple" />

          <p className="text-sm font-medium text-gray-500">
            Loading kiosk capabilities...
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // GROUP CAPABILITIES
  // ----------------------------------------------------------

  const printingCapabilities = capabilityItems.filter(
    (item) => item.category === "printing",
  );

  const paymentCapabilities = capabilityItems.filter(
    (item) => item.category === "payment",
  );

  const layoutCapabilities = capabilityItems.filter(
    (item) => item.category === "layout",
  );

  // ----------------------------------------------------------
  // REUSABLE CAPABILITY SECTION
  // ----------------------------------------------------------

  const renderCapabilitySection = (
    title: string,
    description: string,
    items: CapabilityItem[],
  ) => (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-bold text-gray-900">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-5 text-gray-500">
          {description}
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {items.map((item) => {
          const enabled = capabilities[item.key] ?? false;

          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">
                  {item.title}
                </h3>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  {item.description}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={item.title}
                disabled={isSaving}
                onClick={() => handleToggle(item.key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  enabled
                    ? "bg-brand-purple"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    enabled
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                >
                  {enabled ? (
                    <Check className="h-3 w-3 text-brand-purple" />
                  ) : (
                    <X className="h-3 w-3 text-gray-400" />
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );

  // ----------------------------------------------------------
  // PAGE
  // ----------------------------------------------------------

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-10">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back to kiosk"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-brand-purple"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <Settings2 className="h-6 w-6 text-brand-purple" />

              <h1 className="text-2xl font-bold text-gray-900">
                Kiosk Capabilities
              </h1>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Configure printing, payment, and page layout
              features for this kiosk.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || !hasChanges}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* INFORMATION CARD */}

      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple text-white">
            <Monitor className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Kiosk Feature Configuration
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Enable only the features supported by this kiosk.
              Page layouts control how many document pages can
              be placed on one physical sheet. The backend
              validates whether the requested layout is enabled
              when pricing is configured.
            </p>
          </div>
        </div>
      </div>

      {/* PRINTING CAPABILITIES */}

      {renderCapabilitySection(
        "Printing Capabilities",
        "Choose which printing modes this kiosk supports.",
        printingCapabilities,
      )}

      {/* PAYMENT CAPABILITIES */}

      {renderCapabilitySection(
        "Payment Capabilities",
        "Choose which payment methods this kiosk accepts.",
        paymentCapabilities,
      )}

      {/* PAGE LAYOUT CAPABILITIES */}

      {renderCapabilitySection(
        "Pages per Sheet",
        "Enable the page layouts that users can select when printing documents.",
        layoutCapabilities,
      )}

      {/* ENABLED LAYOUT SUMMARY */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-bold text-gray-900">
          Enabled Page Layouts
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {layoutCapabilities
            .filter((item) => capabilities[item.key])
            .map((item) => (
              <span
                key={item.key}
                className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700"
              >
                {item.title}
              </span>
            ))}

          {layoutCapabilities.every(
            (item) => !capabilities[item.key],
          ) && (
            <p className="text-sm text-amber-700">
              No page layouts are enabled. Enable at least one
              layout before configuring its pricing.
            </p>
          )}
        </div>
      </div>

      {/* UNSAVED CHANGES ACTIONS */}

      {hasChanges && (
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-700">
            You have unsaved changes.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset Changes
            </button>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}