import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  FileText,
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
  getKioskCapabilities,
  getKioskPaperPricing,

  createKioskPaperPricing,
  updateKioskPaperPricing,
  updateKioskPricing,
} from "../../../api/kioskApi";

import type {
  KioskCapabilities,
  KioskPricing,
  PagesPerSheet,
  PaperPricing,
  PaperSize,
  PrintMode,
  PrintingSide,
} from "../../../types/kiosk";

// ============================================================
// CONFIGURATION
// ============================================================

const paperSizes: PaperSize[] = ["A4", "A3", "LETTER"];

const printModes: PrintMode[] = ["BW", "COLOR"];

const printingSides: PrintingSide[] = ["SIMPLEX", "DUPLEX"];

const pageLayouts: PagesPerSheet[] = [1, 2, 4];

// ============================================================
// PRICING COMBINATION
// ============================================================

interface PricingCombo {
  paper_size: PaperSize;
  print_mode: PrintMode;
  printing_side: PrintingSide;
  pages_per_sheet: PagesPerSheet;
}

const comboKey = (combo: PricingCombo): string =>
  [
    combo.paper_size,
    combo.print_mode,
    combo.printing_side,
    combo.pages_per_sheet,
  ].join("__");

const printModeLabel = (mode: PrintMode): string =>
  mode === "BW" ? "Black & White" : "Color";

const printingSideLabel = (side: PrintingSide): string =>
  side === "SIMPLEX" ? "Single Side" : "Double Side";

const layoutCapabilityKey = (
  pages: PagesPerSheet,
): keyof KioskCapabilities => {
  switch (pages) {
    case 1:
      return "pages_per_sheet_1";
    case 2:
      return "pages_per_sheet_2";
    case 4:
      return "pages_per_sheet_4";
  }
};

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
// COMPONENT
// ============================================================

export default function KioskPricingPage() {
  const navigate = useNavigate();

  const { kioskId } = useParams<{ kioskId: string }>();

  const { accessToken } = useSudoAuth();

  const accessTokenRef = useRef(accessToken);

  accessTokenRef.current = accessToken;

  const hasAccessToken = Boolean(accessToken);

  // ==========================================================
  // STATE
  // ==========================================================

  const [pricingRows, setPricingRows] = useState<KioskPricing[]>([]);

  const [capabilities, setCapabilities] =
    useState<KioskCapabilities>(defaultCapabilities);

  const [isLoading, setIsLoading] = useState(true);

  const [draftPrices, setDraftPrices] =
    useState<Record<string, string>>({});

  const [pendingKey, setPendingKey] = useState<string | null>(null);

  // Simple A4 blank-sheet pricing
  const [a4Pricing, setA4Pricing] = useState<PaperPricing | null>(null);

  const [a4DraftPrice, setA4DraftPrice] = useState("");

  const [a4Loading, setA4Loading] = useState(false);

  const [a4Saving, setA4Saving] = useState(false);

  const [a4Toggling, setA4Toggling] = useState(false);

  // ==========================================================
  // LOOK UP PRICING ROWS
  //
  // The unique key includes pages_per_sheet.
  // For example, A4/BW/SIMPLEX/1 and A4/BW/SIMPLEX/2
  // are separate pricing combinations.
  // ==========================================================

  const rowsByCombo = useMemo(() => {
    const map: Record<string, KioskPricing> = {};

    for (const row of pricingRows) {
      const combo: PricingCombo = {
        paper_size: row.paper_size,
        print_mode: row.print_mode,
        printing_side: row.printing_side,
        pages_per_sheet: row.pages_per_sheet ?? 1,
      };

      const key = comboKey(combo);

      // Prefer the active row if historical inactive rows exist.
      if (!map[key] || row.active) {
        map[key] = row;
      }
    }

    return map;
  }, [pricingRows]);

  // ==========================================================
  // LOAD PRICING AND CAPABILITIES
  // ==========================================================

  const loadPricing = useCallback(async () => {
    if (!kioskId) {
      toast.error("Kiosk ID is missing");
      navigate("/sudo/kiosks");
      return;
    }

    const token = accessTokenRef.current;

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const [details, capabilityData] = await Promise.all([
        getKioskById(token, kioskId),
        getKioskCapabilities(kioskId),
      ]);

      const rows = details.pricing ?? [];

      setPricingRows(rows);

      setCapabilities({
        ...defaultCapabilities,
        ...capabilityData,
      });

      const nextDrafts: Record<string, string> = {};

      for (const row of rows) {
        const combo: PricingCombo = {
          paper_size: row.paper_size,
          print_mode: row.print_mode,
          printing_side: row.printing_side,
          pages_per_sheet: row.pages_per_sheet ?? 1,
        };

        nextDrafts[comboKey(combo)] = String(row.price_per_sheet);
      }

      setDraftPrices(nextDrafts);
    } catch (error) {
      console.error("Failed to load kiosk pricing:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load kiosk pricing",
      );
    } finally {
      setIsLoading(false);
    }
  }, [kioskId, navigate]);

  useEffect(() => {
    if (accessToken) {
      void loadPricing();
    }
  }, [loadPricing, hasAccessToken]);

  // ==========================================================
  // DRAFT PRICE CHANGE
  // ==========================================================

  const handleDraftChange = (
    combo: PricingCombo,
    value: string,
  ) => {
    setDraftPrices((previous) => ({
      ...previous,
      [comboKey(combo)]: value,
    }));
  };

  // ==========================================================
  // SAVE PRICING
  //
  // POST when the combination does not exist.
  // PATCH when it already exists.
  //
  // pages_per_sheet is immutable after creation.
  // ==========================================================

  const handleSaveRow = async (combo: PricingCombo) => {
    if (!kioskId || !accessToken) {
      toast.error("Authentication or kiosk information missing");
      return;
    }

    const key = comboKey(combo);

    const capabilityKey = layoutCapabilityKey(
      combo.pages_per_sheet,
    );

    if (!capabilities[capabilityKey]) {
      toast.error(
        `${combo.pages_per_sheet} page(s) per sheet is not enabled for this kiosk. Enable it in Kiosk Capabilities first.`,
      );
      return;
    }

    if (
      combo.print_mode === "COLOR" &&
      !capabilities.color_printing
    ) {
      toast.error(
        "Color printing is disabled. Enable it in Kiosk Capabilities first.",
      );
      return;
    }

    if (
      combo.printing_side === "DUPLEX" &&
      !capabilities.duplex_printing
    ) {
      toast.error(
        "Duplex printing is disabled. Enable it in Kiosk Capabilities first.",
      );
      return;
    }

    const rawValue = (draftPrices[key] ?? "").trim();

    const price = Number(rawValue);

    if (
      rawValue === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
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
          {
            price_per_sheet: price,
          },
        );

        setPricingRows((previous) =>
          previous.map((row) =>
            row.id === updated.id ? updated : row,
          ),
        );

        setDraftPrices((previous) => ({
          ...previous,
          [key]: String(updated.price_per_sheet),
        }));

        toast.success("Pricing updated successfully");
      } else {
        const created = await createKioskPricing(
          accessToken,
          kioskId,
          {
            paper_size: combo.paper_size,
            print_mode: combo.print_mode,
            printing_side: combo.printing_side,
            pages_per_sheet: combo.pages_per_sheet,
            price_per_sheet: price,
          },
        );

        setPricingRows((previous) => [
          ...previous,
          created,
        ]);

        setDraftPrices((previous) => ({
          ...previous,
          [key]: String(created.price_per_sheet),
        }));

        toast.success("Pricing created successfully");
      }
    } catch (error) {
      console.error("Failed to save kiosk pricing:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save kiosk pricing",
      );
    } finally {
      setPendingKey(null);
    }
  };

  // ==========================================================
  // ACTIVATE / DEACTIVATE PRICING
  // ==========================================================

  const handleToggleActive = async (row: KioskPricing) => {
    if (!kioskId || !accessToken) {
      toast.error("Authentication or kiosk information missing");
      return;
    }

    const combo: PricingCombo = {
      paper_size: row.paper_size,
      print_mode: row.print_mode,
      printing_side: row.printing_side,
      pages_per_sheet: row.pages_per_sheet ?? 1,
    };

    const key = comboKey(combo);

    try {
      setPendingKey(key);

      if (row.active) {
        await deactivateKioskPricing(
          accessToken,
          kioskId,
          row.id,
        );

        setPricingRows((previous) =>
          previous.map((item) =>
            item.id === row.id
              ? { ...item, active: false }
              : item,
          ),
        );

        toast.success("Pricing deactivated");
      } else {
        const updated = await updateKioskPricing(
          accessToken,
          kioskId,
          row.id,
          { active: true },
        );

        setPricingRows((previous) =>
          previous.map((item) =>
            item.id === updated.id ? updated : item,
          ),
        );

        toast.success("Pricing activated");
      }
    } catch (error) {
      console.error("Failed to update pricing status:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update pricing status",
      );
    } finally {
      setPendingKey(null);
    }
  };

  // ==========================================================
  // SIMPLE A4 BLANK-SHEET PRICING
  //
  // This section preserves the existing paper-pricing API.
  // It is separate from print-mode/layout pricing.
  // ==========================================================

  const loadA4Pricing = useCallback(async () => {
    if (!kioskId) return;

    const token = accessTokenRef.current;

    if (!token) return;

    try {
      setA4Loading(true);

      const rows = await getKioskPaperPricing(
        token,
        kioskId,
      );

      const a4Rows = rows.filter(
        (row) => row.paper_size.toUpperCase() === "A4",
      );

      const selected =
        a4Rows.find((row) => row.active) ??
        a4Rows[0] ??
        null;

      setA4Pricing(selected);

      setA4DraftPrice(
        selected ? String(selected.price_per_sheet) : "",
      );
    } catch (error) {
      console.error("Failed to load A4 paper pricing:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load A4 paper pricing",
      );
    } finally {
      setA4Loading(false);
    }
  }, [kioskId]);

  useEffect(() => {
    if (accessToken) {
      void loadA4Pricing();
    }
  }, [loadA4Pricing, hasAccessToken]);

  const handleSaveA4Pricing = async () => {
    const token = accessTokenRef.current;

    if (!kioskId || !token) {
      toast.error("Authentication or kiosk information missing");
      return;
    }

    const rawValue = a4DraftPrice.trim();

    const price = Number(rawValue);

    if (
      rawValue === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      toast.error("Enter a valid A4 price greater than 0");
      return;
    }

    try {
      setA4Saving(true);

      if (a4Pricing) {
        const updated = await updateKioskPaperPricing(
          token,
          kioskId,
          a4Pricing.id,
          { price_per_sheet: price },
        );

        setA4Pricing(updated);

        setA4DraftPrice(
          String(updated.price_per_sheet),
        );
      } else {
        const created = await createKioskPaperPricing(
          token,
          kioskId,
          {
            paper_size: "A4",
            price_per_sheet: price,
          },
        );

        setA4Pricing(created);

        setA4DraftPrice(
          String(created.price_per_sheet),
        );
      }

      toast.success("A4 paper pricing saved successfully");
    } catch (error) {
      console.error("Failed to save A4 paper pricing:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save A4 paper pricing",
      );
    } finally {
      setA4Saving(false);
    }
  };

  const handleToggleA4Pricing = async () => {
    const token = accessTokenRef.current;

    if (!kioskId || !token || !a4Pricing) {
      toast.error("A4 pricing information is missing");
      return;
    }

    try {
      setA4Toggling(true);

      const updated = await updateKioskPaperPricing(
        token,
        kioskId,
        a4Pricing.id,
        {
          active: !a4Pricing.active,
        },
      );

      setA4Pricing(updated);

      toast.success(
        updated.active
          ? "A4 paper pricing activated"
          : "A4 paper pricing deactivated",
      );
    } catch (error) {
      console.error(
        "Failed to update A4 pricing status:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update A4 pricing status",
      );
    } finally {
      setA4Toggling(false);
    }
  };

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

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

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() =>
              navigate(`/sudo/kiosks/${kioskId}`)
            }
            aria-label="Back to kiosk"
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
              Configure pricing by paper size, print mode,
              printing side, and pages per sheet.
            </p>
          </div>
        </div>
      </div>

      {/* INFORMATION CARD */}

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
              Each combination has its own price. For example,
              A4, Black & White, Single Side, and 2 Pages per
              Sheet is a different pricing row from the same
              configuration with 1 Page per Sheet. Enable the
              required capabilities before creating pricing.
            </p>
          </div>
        </div>
      </div>

      {/* CAPABILITY STATUS */}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">
          Supported Features
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          These settings come from the kiosk capabilities page.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {pageLayouts.map((pages) => {
            const supported =
              capabilities[layoutCapabilityKey(pages)];

            return (
              <span
                key={pages}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  supported
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {pages} Page{pages > 1 ? "s" : ""} per Sheet
                {" · "}
                {supported ? "Enabled" : "Disabled"}
              </span>
            );
          })}

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              capabilities.color_printing
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            Color Printing ·{" "}
            {capabilities.color_printing
              ? "Enabled"
              : "Disabled"}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              capabilities.duplex_printing
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            Duplex Printing ·{" "}
            {capabilities.duplex_printing
              ? "Enabled"
              : "Disabled"}
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(`/sudo/kiosks/${kioskId}/capabilities`)
          }
          className="mt-4 text-sm font-semibold text-brand-purple hover:underline"
        >
          Manage Kiosk Capabilities →
        </button>
      </section>

      {/* PRICING GRID */}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-bold text-gray-900">
            Service Prices
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Prices are in ₹ per physical sheet.
          </p>
        </div>

        <div className="space-y-8 p-6">
          {paperSizes.map((paperSize) => (
            <div key={paperSize}>
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-900">
                  {paperSize} Paper
                </h3>
              </div>

              {pageLayouts.map((pages) => {
                const layoutEnabled =
                  capabilities[layoutCapabilityKey(pages)];

                return (
                  <div
                    key={`${paperSize}-${pages}`}
                    className="mb-5 rounded-2xl border border-gray-200 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {pages} Page{pages > 1 ? "s" : ""} per Sheet
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
                          {layoutEnabled
                            ? "Configure the supported print combinations."
                            : "This layout is disabled in kiosk capabilities."}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          layoutEnabled
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {layoutEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {printModes.map((printMode) =>
                        printingSides.map((printingSide) => {
                          const combo: PricingCombo = {
                            paper_size: paperSize,
                            print_mode: printMode,
                            printing_side: printingSide,
                            pages_per_sheet: pages,
                          };

                          const key = comboKey(combo);

                          const existingRow = rowsByCombo[key];

                          const isPending = pendingKey === key;

                          const colorUnsupported =
                            printMode === "COLOR" &&
                            !capabilities.color_printing;

                          const duplexUnsupported =
                            printingSide === "DUPLEX" &&
                            !capabilities.duplex_printing;

                          const unsupported =
                            !layoutEnabled ||
                            colorUnsupported ||
                            duplexUnsupported;

                          return (
                            <div
                              key={key}
                              className={`rounded-xl border p-4 ${
                                unsupported
                                  ? "border-gray-200 bg-gray-50"
                                  : "border-gray-200 bg-white"
                              }`}
                            >
                              <div className="mb-4 flex items-start justify-between gap-2">
                                <div>
                                  <h5 className="font-semibold text-gray-900">
                                    {printModeLabel(printMode)}
                                  </h5>

                                  <p className="mt-1 text-sm text-gray-500">
                                    {printingSideLabel(printingSide)}
                                  </p>
                                </div>

                                {existingRow && (
                                  <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      existingRow.active
                                        ? "bg-green-50 text-green-700"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {existingRow.active
                                      ? "Active"
                                      : "Inactive"}
                                  </span>
                                )}
                              </div>

                              <label
                                htmlFor={`price-${key}`}
                                className="mb-2 block text-xs font-medium text-gray-600"
                              >
                                Price per sheet (₹)
                              </label>

                              <div className="flex items-center gap-2">
                                <div className="relative min-w-0 flex-1">
                                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                                  <input
                                    id={`price-${key}`}
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={draftPrices[key] ?? ""}
                                    onChange={(event) =>
                                      handleDraftChange(
                                        combo,
                                        event.target.value,
                                      )
                                    }
                                    placeholder="0.00"
                                    disabled={isPending}
                                    className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm font-medium text-gray-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 disabled:bg-gray-100"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleSaveRow(combo)
                                  }
                                  disabled={
                                    isPending || unsupported
                                  }
                                  title={
                                    unsupported
                                      ? "Enable the required kiosk capabilities first"
                                      : existingRow
                                        ? "Save price"
                                        : "Add price"
                                  }
                                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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
                                    onClick={() =>
                                      void handleToggleActive(
                                        existingRow,
                                      )
                                    }
                                    disabled={isPending}
                                    title={
                                      existingRow.active
                                        ? "Deactivate pricing"
                                        : "Activate pricing"
                                    }
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                      existingRow.active
                                        ? "border-red-100 text-red-500 hover:bg-red-50"
                                        : "border-green-100 text-green-700 hover:bg-green-50"
                                    }`}
                                  >
                                    <Power className="h-4 w-4" />
                                  </button>
                                )}
                              </div>

                              {unsupported && (
                                <p className="mt-3 text-xs leading-5 text-gray-500">
                                  {colorUnsupported
                                    ? "Enable Color Printing in capabilities."
                                    : duplexUnsupported
                                      ? "Enable Duplex Printing in capabilities."
                                      : "Enable this page layout in capabilities."}
                                </p>
                              )}
                            </div>
                          );
                        }),
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* SIMPLE A4 BLANK-SHEET PRICING */}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-brand-purple">
              <FileText className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                A4 Blank Sheets
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Configure a simple price per A4 sheet,
                independent of print mode, sides, and layout.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {a4Loading ? (
            <div className="flex items-center gap-3 py-3 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />
              Loading A4 pricing...
            </div>
          ) : (
            <div className="max-w-2xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    A4 · Price per sheet
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Enter the price in ₹ for one blank A4 sheet.
                  </p>
                </div>

                {a4Pricing && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      a4Pricing.active
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {a4Pricing.active ? "Active" : "Inactive"}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={a4DraftPrice}
                    onChange={(event) =>
                      setA4DraftPrice(event.target.value)
                    }
                    placeholder="Enter price"
                    disabled={a4Saving || a4Toggling}
                    className="h-12 w-full rounded-xl border border-gray-200 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 disabled:bg-gray-50"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void handleSaveA4Pricing()}
                  disabled={a4Saving || a4Toggling}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {a4Saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : a4Pricing ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}

                  {a4Saving
                    ? "Saving..."
                    : a4Pricing
                      ? "Save Price"
                      : "Add Price"}
                </button>

                {a4Pricing && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleToggleA4Pricing()
                    }
                    disabled={a4Saving || a4Toggling}
                    className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      a4Pricing.active
                        ? "border-red-100 text-red-600 hover:bg-red-50"
                        : "border-green-100 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {a4Toggling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}

                    {a4Pricing.active
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                )}
              </div>

              {!a4Pricing && (
                <p className="mt-3 text-xs text-gray-500">
                  No simple A4 blank-sheet price has been
                  configured yet.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}