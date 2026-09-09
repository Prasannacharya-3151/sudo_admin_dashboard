import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  IndianRupee,
  Loader2,
  Plus,
  Power,
  Save,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import {
  createKioskPricing,
  deactivateKioskPricing,
  getKioskById,
  updateKioskPricing,
} from "../../../api/kioskApi";

import type {
  KioskPricing,
  PaperSize,
  PrintMode,
  PrintingSide,
} from "../../../types/kiosk";

// ==========================================
// COMBINATIONS — one pricing row can exist per
// (paper_size, print_mode, printing_side) triple
// ==========================================

const paperSizes: PaperSize[] = ["A4", "A3", "LETTER"];
const printModes: PrintMode[] = ["BW", "COLOR"];
const printingSides: PrintingSide[] = ["SIMPLEX", "DUPLEX"];

interface PricingCombo {
  paper_size: PaperSize;
  print_mode: PrintMode;
  printing_side: PrintingSide;
}

const comboKey = (combo: PricingCombo) =>
  `${combo.paper_size}__${combo.print_mode}__${combo.printing_side}`;

const printModeLabel = (mode: PrintMode) =>
  mode === "BW" ? "Black & White" : "Color";

const printingSideLabel = (side: PrintingSide) =>
  side === "SIMPLEX" ? "Single Side" : "Double Side";

// ==========================================
// COMPONENT
// ==========================================

export default function KioskPricingPage() {
  const navigate = useNavigate();

  const { kioskId } = useParams<{ kioskId: string }>();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [pricingRows, setPricingRows] = useState<KioskPricing[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // draft price text per combo key — covers both existing rows
  // (pre-filled from server) and not-yet-created rows (empty)
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});

  // tracks which combo key is currently mid-request
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  // ==========================================
  // ROW LOOKUP
  // ==========================================

  const rowsByCombo = useMemo(() => {
    const map: Record<string, KioskPricing> = {};

    for (const row of pricingRows) {
      const key = comboKey({
        paper_size: row.paper_size,
        print_mode: row.print_mode,
        printing_side: row.printing_side,
      });

      // if there are multiple rows for the same combo (soft-deleted
      // history), prefer the active one
      if (!map[key] || row.active) {
        map[key] = row;
      }
    }

    return map;
  }, [pricingRows]);

  // ==========================================
  // LOAD PRICING — via kiosk details, no dedicated
  // GET /pricing endpoint exists in the spec
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

      const details = await getKioskById(accessToken, kioskId);

      const rows = details.pricing ?? [];

      setPricingRows(rows);

      const nextDrafts: Record<string, string> = {};

      for (const row of rows) {
        const key = comboKey({
          paper_size: row.paper_size,
          print_mode: row.print_mode,
          printing_side: row.printing_side,
        });

        nextDrafts[key] = String(row.price_per_sheet);
      }

      setDraftPrices(nextDrafts);
    } catch (error) {
      console.error("Failed to load kiosk pricing:", error);

      const message =
        error instanceof Error ? error.message : "Failed to load kiosk pricing";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [kioskId, accessToken, navigate]);

  useEffect(() => {
    void loadPricing();
  }, [loadPricing]);

  // ==========================================
  // DRAFT CHANGE
  // ==========================================

  const handleDraftChange = (combo: PricingCombo, value: string) => {
    setDraftPrices((previous) => ({
      ...previous,
      [comboKey(combo)]: value,
    }));
  };

  // ==========================================
  // SAVE ROW (create if missing, update if it exists)
  // ==========================================

  const handleSaveRow = async (combo: PricingCombo) => {
    if (!kioskId || !accessToken) {
      toast.error("Authentication or kiosk information missing");
      return;
    }

    const key = comboKey(combo);

    const rawValue = draftPrices[key] ?? "";

    const price = Number(rawValue);

    if (rawValue === "" || Number.isNaN(price) || price <= 0) {
      toast.error("Enter a valid price greater than 0");
      return;
    }

    const existingRow = rowsByCombo[key];

    try {
      setPendingKey(key);

      if (existingRow) {
        const updated = await updateKioskPricing(
          accessToken,
          kioskId,
          existingRow.id,
          { price_per_sheet: price },
        );

        setPricingRows((previous) =>
          previous.map((row) => (row.id === updated.id ? updated : row)),
        );
      } else {
        const created = await createKioskPricing(accessToken, kioskId, {
          paper_size: combo.paper_size,
          print_mode: combo.print_mode,
          printing_side: combo.printing_side,
          price_per_sheet: price,
        });

        setPricingRows((previous) => [...previous, created]);
      }

      toast.success("Pricing saved successfully");
    } catch (error) {
      console.error("Failed to save kiosk pricing:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to save kiosk pricing",
      );
    } finally {
      setPendingKey(null);
    }
  };

  // ==========================================
  // TOGGLE ACTIVE
  // ==========================================

  const handleToggleActive = async (row: KioskPricing) => {
    if (!kioskId || !accessToken) {
      toast.error("Authentication or kiosk information missing");
      return;
    }

    const key = comboKey({
      paper_size: row.paper_size,
      print_mode: row.print_mode,
      printing_side: row.printing_side,
    });

    try {
      setPendingKey(key);

      if (row.active) {
        // soft delete — DELETE endpoint flips active -> false
        await deactivateKioskPricing(accessToken, kioskId, row.id);

        setPricingRows((previous) =>
          previous.map((item) =>
            item.id === row.id ? { ...item, active: false } : item,
          ),
        );

        toast.success("Pricing deactivated");
      } else {
        const updated = await updateKioskPricing(accessToken, kioskId, row.id, {
          active: true,
        });

        setPricingRows((previous) =>
          previous.map((item) => (item.id === updated.id ? updated : item)),
        );

        toast.success("Pricing activated");
      }
    } catch (error) {
      console.error("Failed to update pricing status:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to update pricing status",
      );
    } finally {
      setPendingKey(null);
    }
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
            onClick={() => navigate(`/sudo/kiosks/${kioskId}`)}
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-brand-purple"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <WalletCards className="h-6 w-6 text-brand-purple" />
              <h1 className="text-2xl font-bold text-gray-900">Kiosk Pricing</h1>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Configure per-sheet pricing for this kiosk.
            </p>
          </div>
        </div>
      </div>

      {/* INFO */}

      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple text-white">
            <IndianRupee className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">Pricing Configuration</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Each row is a combination of paper size, color mode, and printing
              side. Rows without a saved price yet can be added below; existing
              rows can be updated or deactivated.
            </p>
          </div>
        </div>
      </div>

      {/* PRICING GRID */}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-bold text-gray-900">Service Prices</h2>
          <p className="mt-1 text-sm text-gray-500">
            Price per sheet, in ₹.
          </p>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
          {paperSizes.map((paperSize) =>
            printModes.map((printMode) =>
              printingSides.map((printingSide) => {
                const combo: PricingCombo = {
                  paper_size: paperSize,
                  print_mode: printMode,
                  printing_side: printingSide,
                };

                const key = comboKey(combo);

                const existingRow = rowsByCombo[key];

                const isPending = pendingKey === key;

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-gray-200 p-5"
                  >
                    <div className="mb-4 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {paperSize} · {printModeLabel(printMode)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {printingSideLabel(printingSide)}
                        </p>
                      </div>

                      {existingRow && (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            existingRow.active
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {existingRow.active ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draftPrices[key] ?? ""}
                          onChange={(event) =>
                            handleDraftChange(combo, event.target.value)
                          }
                          placeholder="0.00"
                          className="h-12 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleSaveRow(combo)}
                        disabled={isPending}
                        title={existingRow ? "Save price" : "Add price"}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-purple text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : existingRow ? (
                          <Save className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>

                      {existingRow && (
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(existingRow)}
                          disabled={isPending}
                          title={
                            existingRow.active
                              ? "Deactivate pricing"
                              : "Activate pricing"
                          }
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            existingRow.active
                              ? "border-red-100 text-red-500 hover:bg-red-50"
                              : "border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }),
            ),
          )}
        </div>
      </div>
    </div>
  );
}