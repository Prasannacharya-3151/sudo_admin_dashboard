import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Monitor, Save, Settings2, X } from "lucide-react";
import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import { getKioskCapabilities, updateKioskCapabilities } from "../../../api/kioskApi";

import type { KioskCapabilities, UpdateKioskCapabilitiesPayload } from "../../../types/kiosk";

// ==========================================
// CAPABILITY ITEMS — the exact 4 booleans the spec defines
// ==========================================

interface CapabilityItem {
  key: keyof KioskCapabilities;
  title: string;
  description: string;
}

const capabilityItems: CapabilityItem[] = [
  {
    key: "color_printing",
    title: "Color Printing",
    description: "Allow users to print documents in color on this kiosk.",
  },
  {
    key: "duplex_printing",
    title: "Duplex Printing",
    description: "Allow double-sided (duplex) printing on this kiosk.",
  },
  {
    key: "upi_payment",
    title: "UPI Payment",
    description: "Accept payment through the UPI token flow.",
  },
  {
    key: "rfid_payment",
    title: "RFID Payment",
    description: "Accept payment via institution RFID cards.",
  },
];

const defaultCapabilities: KioskCapabilities = {
  color_printing: false,
  duplex_printing: false,
  upi_payment: false,
  rfid_payment: false,
};

// ==========================================
// COMPONENT
// ==========================================

export default function KioskCapabilitiesPage() {
  const navigate = useNavigate();
  const { kioskId } = useParams<{ kioskId: string }>();
  const { accessToken } = useSudoAuth();

  const [capabilities, setCapabilities] = useState<KioskCapabilities>(defaultCapabilities);
  const [initialCapabilities, setInitialCapabilities] = useState<KioskCapabilities>(defaultCapabilities);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ==========================================
  // LOAD CAPABILITIES — GET /kiosks/{kioskId}/capabilities is PUBLIC, no auth needed
  // ==========================================

  const loadCapabilities = useCallback(async () => {
    if (!kioskId) {
      toast.error("Kiosk ID is missing");
      navigate("/sudo/kiosks");
      return;
    }

    try {
      setIsLoading(true);

      const data = await getKioskCapabilities(kioskId);

      const normalized: KioskCapabilities = { ...defaultCapabilities, ...data };

      setCapabilities(normalized);
      setInitialCapabilities(normalized);
    } catch (error) {
      console.error("Failed to load kiosk capabilities:", error);
      const message = error instanceof Error ? error.message : "Failed to load kiosk capabilities";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [kioskId, navigate]);

  useEffect(() => {
    void loadCapabilities();
  }, [loadCapabilities]);

  const handleToggle = (key: keyof KioskCapabilities) => {
    setCapabilities((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const hasChanges = JSON.stringify(capabilities) !== JSON.stringify(initialCapabilities);

  // ==========================================
  // SAVE — PUT /sudo-admin/kiosks/{kioskId}/capabilities, sudo-admin only
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

      const payload: UpdateKioskCapabilitiesPayload = {
        color_printing: capabilities.color_printing,
        duplex_printing: capabilities.duplex_printing,
        upi_payment: capabilities.upi_payment,
        rfid_payment: capabilities.rfid_payment,
      };

      const updated = await updateKioskCapabilities(accessToken, kioskId, payload);

      const normalized: KioskCapabilities = { ...defaultCapabilities, ...updated };

      setCapabilities(normalized);
      setInitialCapabilities(normalized);

      toast.success("Kiosk capabilities updated successfully");
    } catch (error) {
      console.error("Failed to update kiosk capabilities:", error);
      const message = error instanceof Error ? error.message : "Failed to update kiosk capabilities";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setCapabilities(initialCapabilities);
    toast.info("Changes have been reset");
  };

  const handleBack = () => {
    navigate(`/sudo/kiosks/${kioskId}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
          <p className="text-sm font-medium text-gray-500">Loading kiosk capabilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-10">
      {/* HEADER */}
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
              <h1 className="text-2xl font-bold text-gray-900">Kiosk Capabilities</h1>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Control what this kiosk can do at print time.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* INFO CARD */}
      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple text-white">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Enforced at Print Time</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              A user choosing a feature this kiosk doesn't have (e.g. COLOR on a
              black-and-white-only machine) is blocked at the moment they try to print.
            </p>
          </div>
        </div>
      </div>

      {/* CAPABILITIES CARD */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-bold text-gray-900">Capabilities</h2>
          <p className="mt-1 text-sm text-gray-500">Toggle what this kiosk supports.</p>
        </div>

        <div className="divide-y divide-gray-100">
          {capabilityItems.map((item) => {
            const enabled = capabilities[item.key] ?? false;

            return (
              <div
                key={item.key}
                className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => handleToggle(item.key)}
                  className={`relative flex h-8 w-14 shrink-0 items-center rounded-full transition-all duration-200 ${
                    enabled ? "bg-brand-purple" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-200 ${
                      enabled ? "translate-x-7" : "translate-x-1"
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
          })}
        </div>
      </div>

      {/* BOTTOM ACTIONS */}
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
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}