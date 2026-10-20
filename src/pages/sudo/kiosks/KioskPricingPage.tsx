import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  IndianRupee,
  Loader2,
  Plus,
  Power,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import {
  getKioskById,
  createKioskPricing,
  updateKioskPricing,
  deactivateKioskPricing,
  getKioskPaperPricing,
  createKioskPaperPricing,
  updateKioskPaperPricing,
} from "../../../api/kioskApi";

import type {
  KioskPricing,
  PaperPricing,
  PaperSize,
  PrintMode,
  PrintingSide,
} from "../../../types/kiosk";

const PAPER_SIZES: PaperSize[] = ["A4", "A3", "LETTER"];
const PRINT_MODES: PrintMode[] = ["BW", "COLOR"];
const PRINTING_SIDES: PrintingSide[] = ["SIMPLEX", "DUPLEX"];

interface PricingCombination {
  paper_size: PaperSize;
  print_mode: PrintMode;
  printing_side: PrintingSide;
}

const getPricingKey = (item: PricingCombination) =>
  `${item.paper_size}-${item.print_mode}-${item.printing_side}`;

const formatPrintMode = (mode: PrintMode) =>
  mode === "BW" ? "Black & White" : "Color";

const formatPrintingSide = (side: PrintingSide) =>
  side === "SIMPLEX" ? "Single Side" : "Double Side";

export default function KioskPricingPage() {
  const { kioskId } = useParams<{ kioskId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useSudoAuth();

  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  const [pricingRows, setPricingRows] = useState<KioskPricing[]>([]);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const [paperPricing, setPaperPricing] = useState<PaperPricing | null>(null);
  const [paperPriceDraft, setPaperPriceDraft] = useState("");
  const [paperLoading, setPaperLoading] = useState(true);
  const [paperSaving, setPaperSaving] = useState(false);
  const [paperToggling, setPaperToggling] = useState(false);
  const [paperModalOpen, setPaperModalOpen] = useState(false);

  // -------------------------------------------------------
  // LOAD EXISTING PRINT PRICING
  // -------------------------------------------------------

  const loadPrintPricing = useCallback(async () => {
    if (!kioskId) {
      setLoading(false);
      toast.error("Kiosk ID is missing");
      return;
    }

    const token = tokenRef.current;

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const kiosk = await getKioskById(token, kioskId);
      const rows = kiosk.pricing ?? [];

      setPricingRows(rows);

      const drafts: Record<string, string> = {};

      rows.forEach((row) => {
        const key = getPricingKey(row);
        drafts[key] = String(row.price_per_sheet);
      });

      setDraftPrices(drafts);
    } catch (error) {
      console.error("Failed to load print pricing:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load printing prices",
      );
    } finally {
      setLoading(false);
    }
  }, [kioskId]);

  // -------------------------------------------------------
  // LOAD BLANK A4 SHEET PRICING
  // -------------------------------------------------------

  const loadPaperPricing = useCallback(async () => {
    if (!kioskId) {
      setPaperLoading(false);
      return;
    }

    const token = tokenRef.current;

    if (!token) {
      setPaperLoading(false);
      return;
    }

    try {
      setPaperLoading(true);

      const rows = await getKioskPaperPricing(token, kioskId);

      // Only use the A4 entry from the independent paper-pricing API.
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
  }, [kioskId]);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      setPaperLoading(false);
      return;
    }

    void loadPrintPricing();
    void loadPaperPricing();
  }, [Boolean(accessToken), loadPrintPricing, loadPaperPricing]);

  // -------------------------------------------------------
  // BLANK A4 MODAL OPEN / CLOSE
  // -------------------------------------------------------

  const paperBusy = paperSaving || paperToggling;

  const openPaperModal = () => {
    // Reset the draft to the saved value each time the popup opens.
    setPaperPriceDraft(
      paperPricing ? String(paperPricing.price_per_sheet) : "",
    );
    setPaperModalOpen(true);
  };

  const closePaperModal = useCallback(() => {
    if (paperBusy) return;
    setPaperModalOpen(false);
  }, [paperBusy]);

  useEffect(() => {
    if (!paperModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePaperModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paperModalOpen, closePaperModal]);

  // -------------------------------------------------------
  // PRINT PRICING DRAFT
  // -------------------------------------------------------

  const changePrintPrice = (
    combination: PricingCombination,
    value: string,
  ) => {
    const key = getPricingKey(combination);

    setDraftPrices((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // -------------------------------------------------------
  // CREATE OR UPDATE PRINT PRICING
  // -------------------------------------------------------

  const savePrintPrice = async (combination: PricingCombination) => {
    const token = tokenRef.current;

    if (!token || !kioskId) {
      toast.error("Missing authentication or kiosk ID");
      return;
    }

    const key = getPricingKey(combination);
    const rawPrice = draftPrices[key] ?? "";
    const price = Number(rawPrice);

    if (
      rawPrice.trim() === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      toast.error("Enter a price greater than zero");
      return;
    }

    const existing = pricingRows.find(
      (row) =>
        getPricingKey(row) === key && row.active,
    ) ?? pricingRows.find(
      (row) => getPricingKey(row) === key,
    );

    try {
      setPendingKey(key);

      if (existing) {
        const updated = await updateKioskPricing(
          token,
          kioskId,
          existing.id,
          { price_per_sheet: price },
        );

        setPricingRows((previous) =>
          previous.map((row) =>
            row.id === updated.id ? updated : row,
          ),
        );
      } else {
        const created = await createKioskPricing(
          token,
          kioskId,
          {
            paper_size: combination.paper_size,
            print_mode: combination.print_mode,
            printing_side: combination.printing_side,
            price_per_sheet: price,
          },
        );

        setPricingRows((previous) => [...previous, created]);
      }

      toast.success("Printing price saved");
    } catch (error) {
      console.error("Failed to save printing price:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save printing price",
      );
    } finally {
      setPendingKey(null);
    }
  };

  // -------------------------------------------------------
  // ACTIVATE / DEACTIVATE PRINT PRICING
  // -------------------------------------------------------

  const togglePrintPricing = async (row: KioskPricing) => {
    const token = tokenRef.current;

    if (!token || !kioskId) {
      toast.error("Missing authentication or kiosk ID");
      return;
    }

    const key = getPricingKey(row);

    try {
      setPendingKey(key);

      if (row.active) {
        await deactivateKioskPricing(token, kioskId, row.id);

        setPricingRows((previous) =>
          previous.map((item) =>
            item.id === row.id ? { ...item, active: false } : item,
          ),
        );

        toast.success("Printing price deactivated");
      } else {
        const updated = await updateKioskPricing(
          token,
          kioskId,
          row.id,
          { active: true },
        );

        setPricingRows((previous) =>
          previous.map((item) =>
            item.id === updated.id ? updated : item,
          ),
        );

        toast.success("Printing price activated");
      }
    } catch (error) {
      console.error("Failed to change printing price status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update printing price status",
      );
    } finally {
      setPendingKey(null);
    }
  };

  // -------------------------------------------------------
  // CREATE OR UPDATE BLANK A4 SHEET PRICE
  // -------------------------------------------------------

  const savePaperPrice = async () => {
    const token = tokenRef.current;

    if (!token || !kioskId) {
      toast.error("Missing authentication or kiosk ID");
      return;
    }

    const rawPrice = paperPriceDraft.trim();
    const price = Number(rawPrice);

    if (
      rawPrice === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      toast.error("Enter a blank A4 sheet price greater than zero");
      return;
    }

    try {
      setPaperSaving(true);

      if (paperPricing) {
        const updated = await updateKioskPaperPricing(
          token,
          kioskId,
          paperPricing.id,
          { price_per_sheet: price },
        );

        setPaperPricing(updated);
        setPaperPriceDraft(String(updated.price_per_sheet));
      } else {
        // Blank-sheet pricing has no print mode or printing side.
        const created = await createKioskPaperPricing(
          token,
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

  // -------------------------------------------------------
  // ACTIVATE / DEACTIVATE BLANK A4 SHEET PRICE
  // -------------------------------------------------------

  const togglePaperPrice = async () => {
    const token = tokenRef.current;

    if (!token || !kioskId || !paperPricing) {
      toast.error("Blank A4 sheet pricing was not found");
      return;
    }

    try {
      setPaperToggling(true);

      const updated = await updateKioskPaperPricing(
        token,
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

  // -------------------------------------------------------
  // PAGE
  // -------------------------------------------------------

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Kiosk Pricing
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure printing and blank-sheet prices.
            </p>
          </div>
        </div>

        {/* ONLY ONE BUTTON FOR BLANK A4 PRICING */}
        <button
          type="button"
          onClick={openPaperModal}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 text-sm font-semibold text-white hover:opacity-90"
        >
          <FileText className="h-4 w-4" />
          Blank A4 Price
        </button>
      </header>

      {/* PRINTING PRICING */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-bold text-gray-900">
            Printing Service Pricing
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            One row per paper size, print mode, and side combination.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />
            Loading printing prices...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {PAPER_SIZES.flatMap((paperSize) =>
              PRINT_MODES.flatMap((printMode) =>
                PRINTING_SIDES.map((printingSide) => {
                  const combination: PricingCombination = {
                    paper_size: paperSize,
                    print_mode: printMode,
                    printing_side: printingSide,
                  };

                  const key = getPricingKey(combination);
                  const existing =
                    pricingRows.find(
                      (row) =>
                        getPricingKey(row) === key && row.active,
                    ) ??
                    pricingRows.find(
                      (row) => getPricingKey(row) === key,
                    );

                  const busy = pendingKey === key;

                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-gray-200 p-5"
                    >
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {paperSize} · {formatPrintMode(printMode)}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {formatPrintingSide(printingSide)}
                          </p>
                        </div>

                        {existing && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              existing.active
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {existing.active ? "Active" : "Inactive"}
                          </span>
                        )}
                      </div>

                      <label className="mb-2 block text-xs font-medium text-gray-500">
                        Price per sheet (₹)
                      </label>

                      <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1">
                          <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={draftPrices[key] ?? ""}
                            onChange={(event) =>
                              changePrintPrice(
                                combination,
                                event.target.value,
                              )
                            }
                            placeholder="0.00"
                            className="h-11 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void savePrintPrice(combination)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple text-white hover:opacity-90 disabled:opacity-50"
                          title={existing ? "Save price" : "Add price"}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : existing ? (
                            <Save className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>

                        {existing && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void togglePrintPricing(existing)
                            }
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border disabled:opacity-50 ${
                              existing.active
                                ? "border-red-100 text-red-600 hover:bg-red-50"
                                : "border-green-100 text-green-700 hover:bg-green-50"
                            }`}
                            title={
                              existing.active ? "Deactivate" : "Activate"
                            }
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
        )}
      </section>

      {/* BLANK A4 PRICE POPUP */}
      {paperModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closePaperModal}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="blank-a4-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-brand-purple">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <h2
                    id="blank-a4-title"
                    className="text-lg font-bold text-gray-900"
                  >
                    Blank A4 Sheet Price
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Separate from black-and-white and color printing.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePaperModal}
                disabled={paperBusy}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {paperLoading ? (
                <div className="flex items-center gap-3 py-3 text-sm text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />
                  Loading blank-sheet price...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="blank-a4-price"
                      className="text-sm font-medium text-gray-700"
                    >
                      A4 · Price per blank sheet (₹)
                    </label>

                    {paperPricing && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          paperPricing.active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {paperPricing.active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="blank-a4-price"
                      type="number"
                      min="0"
                      step="0.01"
                      autoFocus
                      value={paperPriceDraft}
                      onChange={(event) =>
                        setPaperPriceDraft(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !paperBusy) {
                          void savePaperPrice();
                        }
                      }}
                      disabled={paperBusy}
                      placeholder="Price per blank A4 sheet"
                      className="h-12 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 disabled:bg-gray-50"
                    />
                  </div>

                  {!paperPricing && (
                    <p className="text-xs text-gray-500">
                      No blank A4 sheet price has been configured yet.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
              {paperPricing && !paperLoading ? (
                <button
                  type="button"
                  disabled={paperBusy}
                  onClick={() => void togglePaperPrice()}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-50 ${
                    paperPricing.active
                      ? "border-red-100 text-red-600 hover:bg-red-50"
                      : "border-green-100 text-green-700 hover:bg-green-50"
                  }`}
                >
                  {paperToggling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4" />
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
                  className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={paperBusy || paperLoading}
                  onClick={() => void savePaperPrice()}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {paperSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : paperPricing ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
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
    </div>
  );
}