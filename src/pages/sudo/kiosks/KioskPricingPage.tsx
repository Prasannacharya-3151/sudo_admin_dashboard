import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  IndianRupee,
  Loader2,
  Save,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import {
  getKioskPricing,
  updateKioskPricing,
} from "../../../api/kioskApi";

import type {
  KioskPricing,
  UpdateKioskPricingPayload,
} from "../../../types/kiosk";

// ==========================================
// DEFAULT PRICING
// ==========================================

const defaultPricing: KioskPricing = {
  black_white_single: 0,
  black_white_double: 0,
  color_single: 0,
  color_double: 0,
  scan: 0,
  copy: 0,
};

// ==========================================
// PRICING FIELD
// ==========================================

interface PricingField {
  key: keyof UpdateKioskPricingPayload;
  label: string;
  description: string;
}

const pricingFields: PricingField[] = [
  {
    key: "black_white_single",
    label: "Black & White Single Side",
    description: "Price per single-sided black and white page",
  },
  {
    key: "black_white_double",
    label: "Black & White Double Side",
    description: "Price per double-sided black and white page",
  },
  {
    key: "color_single",
    label: "Color Single Side",
    description: "Price per single-sided color page",
  },
  {
    key: "color_double",
    label: "Color Double Side",
    description: "Price per double-sided color page",
  },
  {
    key: "scan",
    label: "Scan",
    description: "Price per scanned page",
  },
  {
    key: "copy",
    label: "Copy",
    description: "Price per copied page",
  },
];

// ==========================================
// COMPONENT
// ==========================================

export default function KioskPricingPage() {
  const navigate = useNavigate();

  const { kioskId } = useParams<{
    kioskId: string;
  }>();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [pricing, setPricing] =
    useState<KioskPricing>(defaultPricing);

  const [initialPricing, setInitialPricing] =
    useState<KioskPricing>(defaultPricing);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  // ==========================================
  // LOAD PRICING
  // ==========================================

  const loadPricing = useCallback(async () => {
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
      // matches getKioskPricing(accessToken, kioskId) signature
      const data = await getKioskPricing(
        accessToken,
        kioskId,
      );

      const normalizedPricing: KioskPricing = {
        ...defaultPricing,
        ...data,
      };

      setPricing(normalizedPricing);

      setInitialPricing(normalizedPricing);
    } catch (error) {
      console.error(
        "Failed to load kiosk pricing:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load kiosk pricing";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    kioskId,
    accessToken,
    navigate,
  ]);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    void loadPricing();
  }, [loadPricing]);

  // ==========================================
  // UPDATE FIELD
  // ==========================================

  const handleChange = (
    key: keyof UpdateKioskPricingPayload,
    value: string,
  ) => {
    const numericValue =
      value === ""
        ? 0
        : Number(value);

    if (Number.isNaN(numericValue)) {
      return;
    }

    setPricing((previous) => ({
      ...previous,
      [key]: numericValue,
    }));
  };

  // ==========================================
  // CHECK CHANGES
  // ==========================================

  const hasChanges =
    JSON.stringify({
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
    }) !==
    JSON.stringify({
      black_white_single:
        initialPricing.black_white_single,
      black_white_double:
        initialPricing.black_white_double,
      color_single:
        initialPricing.color_single,
      color_double:
        initialPricing.color_double,
      scan: initialPricing.scan,
      copy: initialPricing.copy,
    });

  // ==========================================
  // SAVE
  // ==========================================

  const handleSave = async () => {
    if (!kioskId || !accessToken) {
      toast.error(
        "Authentication or kiosk information missing",
      );

      return;
    }

    try {
      setIsSaving(true);

      const payload: UpdateKioskPricingPayload = {
        black_white_single:
          pricing.black_white_single ?? 0,

        black_white_double:
          pricing.black_white_double ?? 0,

        color_single:
          pricing.color_single ?? 0,

        color_double:
          pricing.color_double ?? 0,

        scan:
          pricing.scan ?? 0,

        copy:
          pricing.copy ?? 0,
      };

      // FIX: accessToken first, then kioskId, then payload —
      // matches updateKioskPricing(accessToken, kioskId, payload) signature
      const updatedPricing =
        await updateKioskPricing(
          accessToken,
          kioskId,
          payload,
        );

      const normalizedPricing: KioskPricing = {
        ...defaultPricing,
        ...updatedPricing,
      };

      setPricing(normalizedPricing);

      setInitialPricing(normalizedPricing);

      toast.success(
        "Kiosk pricing updated successfully",
      );
    } catch (error) {
      console.error(
        "Failed to update kiosk pricing:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to update kiosk pricing";

      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // RESET
  // ==========================================

  const handleReset = () => {
    setPricing(initialPricing);

    toast.info("Pricing changes reset");
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
            Loading kiosk pricing...
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

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-4">

          <button
            type="button"
            onClick={() =>
              navigate(`/sudo/kiosks/${kioskId}`)
            }
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-brand-purple"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <WalletCards className="h-6 w-6 text-brand-purple" />

              <h1 className="text-2xl font-bold text-gray-900">
                Kiosk Pricing
              </h1>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Configure service pricing for this kiosk.
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
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

      {/* INFO */}

      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple text-white">
            <IndianRupee className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Pricing Configuration
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              Set the amount charged for each service.
              Prices are calculated per page unless specified otherwise.
            </p>
          </div>

        </div>

      </div>

      {/* PRICING CARD */}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-100 px-6 py-5">

          <h2 className="text-lg font-bold text-gray-900">
            Service Prices
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the price for each kiosk service.
          </p>

        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">

          {pricingFields.map((field) => {

            const value =
              pricing[field.key] ?? 0;

            return (
              <div
                // FIX: cast to string — field.key is typed as
                // keyof UpdateKioskPricingPayload, which resolves
                // to string | number | symbol, and React's `key`
                // prop rejects symbol
                key={String(field.key)}
                className="rounded-xl border border-gray-200 p-5"
              >

                <div className="mb-4">

                  <h3 className="font-semibold text-gray-900">
                    {field.label}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {field.description}
                  </p>

                </div>

                <div className="relative">

                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={value}
                    onChange={(event) =>
                      handleChange(
                        field.key,
                        event.target.value,
                      )
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                  />

                </div>

              </div>
            );
          })}

        </div>

      </div>

      {/* BOTTOM ACTION */}

      {hasChanges && (
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Reset Changes
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {isSaving && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            Save Changes
          </button>

        </div>
      )}

    </div>
  );
}