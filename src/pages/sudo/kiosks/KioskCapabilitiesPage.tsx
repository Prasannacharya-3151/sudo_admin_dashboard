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

// ==========================================
// CAPABILITY ITEM
// ==========================================

interface CapabilityItem {
  key: keyof KioskCapabilities;
  title: string;
  description: string;
}

// ==========================================
// CAPABILITIES
// ==========================================

const capabilityItems: CapabilityItem[] = [
  {
    key: "print",
    title: "Print",
    description:
      "Allow this kiosk to provide document printing services.",
  },
  {
    key: "scan",
    title: "Scan",
    description:
      "Allow users to scan physical documents.",
  },
  {
    key: "copy",
    title: "Copy",
    description:
      "Allow users to make document copies.",
  },
  {
    key: "color_print",
    title: "Color Print",
    description:
      "Enable color printing functionality.",
  },
  {
    key: "black_white_print",
    title: "Black & White Print",
    description:
      "Enable black and white printing functionality.",
  },
  {
    key: "duplex",
    title: "Duplex Printing",
    description:
      "Allow double-sided printing.",
  },
];

// ==========================================
// DEFAULT CAPABILITIES
// ==========================================

const defaultCapabilities: KioskCapabilities = {
  print: false,
  scan: false,
  copy: false,
  color_print: false,
  black_white_print: false,
  duplex: false,
};

// ==========================================
// COMPONENT
// ==========================================

export default function KioskCapabilitiesPage() {
  const navigate = useNavigate();

  const { kioskId } = useParams<{
    kioskId: string;
  }>();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [capabilities, setCapabilities] =
    useState<KioskCapabilities>(
      defaultCapabilities,
    );

  const [initialCapabilities, setInitialCapabilities] =
    useState<KioskCapabilities>(
      defaultCapabilities,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  // ==========================================
  // LOAD CAPABILITIES
  // ==========================================

  const loadCapabilities = useCallback(
    async () => {
      if (!kioskId) {
        toast.error("Kiosk ID is missing");

        navigate("/sudo/kiosks");

        return;
      }

      if (!accessToken) {
        toast.error("Authentication required");

        navigate("/sudo/login");

        return;
      }

      try {
        setIsLoading(true);

        // FIX: accessToken first, kioskId second —
        // matches getKioskCapabilities(accessToken, kioskId) signature
        const data =
          await getKioskCapabilities(
            accessToken,
            kioskId,
          );

        const normalizedCapabilities: KioskCapabilities =
          {
            ...defaultCapabilities,
            ...data,
          };

        setCapabilities(
          normalizedCapabilities,
        );

        setInitialCapabilities(
          normalizedCapabilities,
        );
      } catch (error) {
        console.error(
          "Failed to load kiosk capabilities:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load kiosk capabilities";

        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [
      kioskId,
      accessToken,
      navigate,
    ],
  );

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    void loadCapabilities();
  }, [loadCapabilities]);

  // ==========================================
  // TOGGLE CAPABILITY
  // ==========================================

  const handleToggle = (
    key: keyof KioskCapabilities,
  ) => {
    setCapabilities((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  // ==========================================
  // CHECK CHANGES
  // ==========================================

  const hasChanges =
    JSON.stringify(capabilities) !==
    JSON.stringify(initialCapabilities);

  // ==========================================
  // SAVE
  // ==========================================

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

    try {
      setIsSaving(true);

      const payload: UpdateKioskCapabilitiesPayload =
        {
          print:
            capabilities.print ?? false,

          scan:
            capabilities.scan ?? false,

          copy:
            capabilities.copy ?? false,

          color_print:
            capabilities.color_print ??
            false,

          black_white_print:
            capabilities.black_white_print ??
            false,

          duplex:
            capabilities.duplex ?? false,
        };

      // FIX: accessToken first, then kioskId, then payload —
      // matches updateKioskCapabilities(accessToken, kioskId, payload) signature
      const updatedCapabilities =
        await updateKioskCapabilities(
          accessToken,
          kioskId,
          payload,
        );

      const normalizedCapabilities: KioskCapabilities =
        {
          ...defaultCapabilities,
          ...updatedCapabilities,
        };

      setCapabilities(
        normalizedCapabilities,
      );

      setInitialCapabilities(
        normalizedCapabilities,
      );

      toast.success(
        "Kiosk capabilities updated successfully",
      );
    } catch (error) {
      console.error(
        "Failed to update kiosk capabilities:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to update kiosk capabilities";

      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // RESET
  // ==========================================

  const handleReset = () => {
    setCapabilities(initialCapabilities);

    toast.info(
      "Changes have been reset",
    );
  };

  // ==========================================
  // BACK
  // ==========================================

  const handleBack = () => {
    navigate(
      `/sudo/kiosks/${kioskId}`,
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />

          <p className="text-sm font-medium text-gray-500">
            Loading kiosk capabilities...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-4">

          <button
            type="button"
            onClick={handleBack}
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
              Configure the services and features available on this kiosk.
            </p>

          </div>

        </div>

        {/* SAVE BUTTON */}

        <button
          type="button"
          onClick={handleSave}
          disabled={
            isSaving ||
            !hasChanges
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {isSaving
            ? "Saving..."
            : "Save Changes"}
        </button>

      </div>

      {/* ======================================
          INFO CARD
      ====================================== */}

      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">

        <div className="flex gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple text-white">
            <Monitor className="h-5 w-5" />
          </div>

          <div>

            <h2 className="font-semibold text-gray-900">
              Service Configuration
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Enable or disable services that users can access from this kiosk.
              Disabled capabilities will not be available in the kiosk interface.
            </p>

          </div>

        </div>

      </div>

      {/* ======================================
          CAPABILITIES CARD
      ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* CARD HEADER */}

        <div className="border-b border-gray-100 px-6 py-5">

          <h2 className="text-lg font-bold text-gray-900">
            Available Services
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Control which features are enabled for this kiosk.
          </p>

        </div>

        {/* CAPABILITIES */}

        <div className="divide-y divide-gray-100">

          {capabilityItems.map(
            (item) => {
              const enabled =
                capabilities[item.key] ??
                false;

              return (
                <div
                  key={item.key}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >

                  {/* TEXT */}

                  <div>

                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {item.description}
                    </p>

                  </div>

                  {/* TOGGLE */}

                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() =>
                      handleToggle(
                        item.key,
                      )
                    }
                    className={`relative flex h-8 w-14 shrink-0 items-center rounded-full transition-all duration-200 ${
                      enabled
                        ? "bg-brand-purple"
                        : "bg-gray-200"
                    }`}
                  >

                    <span
                      className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-200 ${
                        enabled
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    >
                      {enabled ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </span>

                  </button>

                </div>
              );
            },
          )}

        </div>

      </div>

      {/* ======================================
          BOTTOM ACTIONS
      ====================================== */}

      {hasChanges && (
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset Changes
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {isSaving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>
      )}

    </div>
  );
}