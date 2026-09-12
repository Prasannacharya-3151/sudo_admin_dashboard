import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileText,
  FileWarning,
  Loader2,
  Monitor,
  Printer,
  RefreshCw,
  TrendingUp,
  XCircle,
  Clock3,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import {
  getRevenueByKiosk,
  getKioskRevenue,
  getKioskRevenueByPrintMode,
  getKioskRevenueByPaymentMethod,
  getKioskPages,
  getKioskStuckJobs,
  getKioskUnprintedDocuments,
} from "../../../api/kioskanalyticsApi";

import type {
  KioskRevenue,
  RevenueSummary,
  PrintModeRevenue,
  PaymentMethodRevenue,
  KioskPageAnalytics,
  StuckJob,
  UnprintedDocument,
} from "../../../types/kioskAnalytics";

// ==========================================
// COMPONENT
// ==========================================

export default function KioskAnalytics() {
  const {
    accessToken,
  } = useSudoAuth();

  // ========================================
  // KIOSKS
  // ========================================

  const [kiosks, setKiosks] =
    useState<KioskRevenue[]>([]);

  const [
    selectedKioskId,
    setSelectedKioskId,
  ] = useState("");

  const [
    isLoadingKiosks,
    setIsLoadingKiosks,
  ] = useState(true);

  // ========================================
  // ANALYTICS
  // ========================================

  const [revenue, setRevenue] =
    useState<RevenueSummary | null>(
      null,
    );

  const [bwRevenue, setBwRevenue] =
    useState<PrintModeRevenue | null>(
      null,
    );

  const [
    colorRevenue,
    setColorRevenue,
  ] = useState<PrintModeRevenue | null>(
    null,
  );

  const [upiRevenue, setUpiRevenue] =
    useState<PaymentMethodRevenue | null>(
      null,
    );

  const [
    rfidRevenue,
    setRfidRevenue,
  ] = useState<PaymentMethodRevenue | null>(
    null,
  );

  const [pages, setPages] =
    useState<KioskPageAnalytics[]>([]);

  const [stuckJobs, setStuckJobs] =
    useState<StuckJob[]>([]);

  const [
    unprintedDocuments,
    setUnprintedDocuments,
  ] = useState<UnprintedDocument[]>(
    [],
  );

  // ========================================
  // LOADING
  // ========================================

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  // ========================================
  // STUCK THRESHOLD
  // ========================================

  const [
    staleMinutes,
    setStaleMinutes,
  ] = useState(30);

  // ========================================
  // LOAD KIOSKS
  // ========================================

  const fetchKiosks = async () => {
    if (!accessToken) {
      setIsLoadingKiosks(false);
      return;
    }

    try {
      setIsLoadingKiosks(true);

      const data =
        await getRevenueByKiosk(
          accessToken,
        );

      setKiosks(data);

      if (data.length === 0) {
        setSelectedKioskId("");
        return;
      }

      const selectedStillExists =
        data.some(
          (kiosk) =>
            kiosk.kiosk_id ===
            selectedKioskId,
        );

      if (!selectedStillExists) {
        setSelectedKioskId(
          data[0].kiosk_id,
        );
      }
    } catch (error) {
      console.error(
        "Failed to load kiosks:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load kiosks";

      toast.error(message);
    } finally {
      setIsLoadingKiosks(false);
    }
  };

  // ========================================
  // LOAD ANALYTICS
  // ========================================

  const fetchAnalytics = async (
    refresh = false,
  ) => {
    if (
      !accessToken ||
      !selectedKioskId
    ) {
      return;
    }

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [
        revenueData,
        bwData,
        colorData,
        upiData,
        rfidData,
        pagesData,
        stuckJobsData,
        unprintedData,
      ] = await Promise.all([
        getKioskRevenue(
          accessToken,
          selectedKioskId,
        ),

        getKioskRevenueByPrintMode(
          accessToken,
          selectedKioskId,
          "BW",
        ),

        getKioskRevenueByPrintMode(
          accessToken,
          selectedKioskId,
          "COLOR",
        ),

        getKioskRevenueByPaymentMethod(
          accessToken,
          selectedKioskId,
          "upi",
        ),

        getKioskRevenueByPaymentMethod(
          accessToken,
          selectedKioskId,
          "rfid",
        ),

        getKioskPages(
          accessToken,
          selectedKioskId,
        ),

        getKioskStuckJobs(
          accessToken,
          selectedKioskId,
          staleMinutes,
        ),

        getKioskUnprintedDocuments(
          accessToken,
          selectedKioskId,
        ),
      ]);

      setRevenue(revenueData);

      setBwRevenue(bwData);

      setColorRevenue(colorData);

      setUpiRevenue(upiData);

      setRfidRevenue(rfidData);

      setPages(pagesData);

      setStuckJobs(stuckJobsData);

      setUnprintedDocuments(
        unprintedData,
      );
    } catch (error) {
      console.error(
        "Failed to load kiosk analytics:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load kiosk analytics";

      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // ========================================
  // INITIAL KIOSK LOAD
  // ========================================

  useEffect(() => {
    void fetchKiosks();
  }, [accessToken]);

  // ========================================
  // KIOSK ANALYTICS LOAD
  // ========================================

  useEffect(() => {
    if (!selectedKioskId) {
      return;
    }

    void fetchAnalytics();
  }, [
    accessToken,
    selectedKioskId,
    staleMinutes,
  ]);

  // ========================================
  // SELECTED KIOSK
  // ========================================

  const selectedKiosk =
    useMemo(() => {
      return kiosks.find(
        (kiosk) =>
          kiosk.kiosk_id ===
          selectedKioskId,
      );
    }, [
      kiosks,
      selectedKioskId,
    ]);

  // ========================================
  // TOTAL PAGES
  // ========================================

  const totalPrintedPages =
    pages.reduce(
      (sum, item) =>
        sum +
        Number(
          item.printed_pages || 0,
        ),
      0,
    );

  // ========================================
  // TOTAL SHEETS
  // ========================================

  const totalSheets =
    pages.reduce(
      (sum, item) =>
        sum +
        Number(
          item.total_sheets || 0,
        ),
      0,
    );

  // ========================================
  // CURRENCY
  // ========================================

  const formatCurrency = (
    value?: number | null,
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      },
    ).format(Number(value || 0));
  };

  // ========================================
  // DATE
  // ========================================

  const formatDate = (
    value?: string | null,
  ) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "—";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  // ========================================
  // STATUS BADGE
  // ========================================

  const renderStatus = (
    status: string,
  ) => {
    const normalized =
      status.toLowerCase();

    if (
      normalized === "printing"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
          <Clock3 className="h-3.5 w-3.5" />
          Printing
        </span>
      );
    }

    if (
      normalized === "failed"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          <XCircle className="h-3.5 w-3.5" />
          Failed
        </span>
      );
    }

    if (
      normalized === "printed"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Printed
        </span>
      );
    }

    return (
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
        {status}
      </span>
    );
  };

  // ========================================
  // REFRESH
  // ========================================

  const handleRefresh = async () => {
    await fetchKiosks();

    if (selectedKioskId) {
      await fetchAnalytics(true);
    }
  };

  // ========================================
  // KIOSK LOADING
  // ========================================

  if (isLoadingKiosks) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#7E49F2]" />

          <p className="text-sm text-gray-500">
            Loading kiosks...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // NO KIOSKS
  // ========================================

  if (kiosks.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1426]">
              Kiosk Analytics
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Monitor kiosk revenue,
              printing performance and
              health.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void handleRefresh()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1A1426] shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />

            Refresh
          </button>
        </div>

        <div className="rounded-3xl bg-white px-6 py-20 text-center shadow-sm ring-1 ring-gray-100">
          <Monitor className="mx-auto h-12 w-12 text-gray-300" />

          <h2 className="mt-4 text-lg font-bold text-[#1A1426]">
            No kiosks found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Create a kiosk first to view
            kiosk analytics.
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN
  // ========================================

  return (
    <div className="w-full">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1426]">
            Kiosk Analytics
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor kiosk revenue,
            printing performance and
            operational health.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void handleRefresh()
          }
          disabled={
            isLoading ||
            isRefreshing
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1A1426] shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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
          KIOSK SELECTOR
      ====================================== */}

      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-[#1A1426]">
              Select Kiosk
            </label>

            <select
              value={selectedKioskId}
              onChange={(event) =>
                setSelectedKioskId(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#1A1426] outline-none transition focus:border-[#7E49F2] focus:ring-2 focus:ring-[#7E49F2]/10"
            >
              {kiosks.map(
                (kiosk) => (
                  <option
                    key={
                      kiosk.kiosk_id
                    }
                    value={
                      kiosk.kiosk_id
                    }
                  >
                    {kiosk.kiosk_name}{" "}
                    —{" "}
                    {kiosk.kiosk_type}
                  </option>
                ),
              )}
            </select>
          </div>

          {selectedKiosk && (
            <div className="rounded-xl bg-purple-50 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                Selected
              </p>

              <p className="mt-1 text-sm font-bold text-[#7E49F2]">
                {
                  selectedKiosk.kiosk_name
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================
          ANALYTICS LOADING
      ====================================== */}

      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#7E49F2]" />

            <p className="text-sm text-gray-500">
              Loading kiosk analytics...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ====================================
              REVENUE CARDS
          ==================================== */}

          <div className="mb-6 grid gap-5 md:grid-cols-3">
            {/* Revenue */}

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Revenue
                  </p>

                  <p className="mt-3 text-3xl font-bold text-[#1A1426]">
                    {formatCurrency(
                      revenue?.total_revenue,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-purple-50 p-3 text-[#7E49F2]">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Sheets */}

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Sheets
                  </p>

                  <p className="mt-3 text-3xl font-bold text-[#1A1426]">
                    {revenue?.total_sheets ??
                      0}
                  </p>
                </div>

                <div className="rounded-2xl bg-yellow-50 p-3 text-yellow-600">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Sessions */}

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Print Sessions
                  </p>

                  <p className="mt-3 text-3xl font-bold text-[#1A1426]">
                    {revenue?.sessions ??
                      0}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <Printer className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* ====================================
              MODE + PAYMENT
          ==================================== */}

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* PRINT MODE */}

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#1A1426]">
                  Revenue by Print Mode
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Compare BW and COLOR
                  printing.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* BW */}

                <div className="rounded-2xl bg-gray-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">
                      Black & White
                    </span>

                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-gray-500">
                      BW
                    </span>
                  </div>

                  <p className="mt-4 text-2xl font-bold text-[#1A1426]">
                    {formatCurrency(
                      bwRevenue?.total_revenue,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {
                      bwRevenue?.total_sheets ??
                      0
                    }{" "}
                    sheets ·{" "}
                    {
                      bwRevenue?.printed_pages ??
                      0
                    }{" "}
                    pages
                  </p>
                </div>

                {/* COLOR */}

                <div className="rounded-2xl bg-purple-50 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-purple-700">
                      Color
                    </span>

                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-[#7E49F2]">
                      COLOR
                    </span>
                  </div>

                  <p className="mt-4 text-2xl font-bold text-[#1A1426]">
                    {formatCurrency(
                      colorRevenue?.total_revenue,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {
                      colorRevenue?.total_sheets ??
                      0
                    }{" "}
                    sheets ·{" "}
                    {
                      colorRevenue?.printed_pages ??
                      0
                    }{" "}
                    pages
                  </p>
                </div>
              </div>
            </div>

            {/* PAYMENT */}

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#1A1426]">
                  Revenue by Payment
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Compare UPI and RFID
                  payments.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* UPI */}

                <div className="rounded-2xl bg-blue-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white p-2 text-blue-600">
                      <CreditCard className="h-5 w-5" />
                    </div>

                    <span className="text-sm font-bold text-blue-700">
                      UPI
                    </span>
                  </div>

                  <p className="mt-4 text-2xl font-bold text-[#1A1426]">
                    {formatCurrency(
                      upiRevenue?.total_revenue,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {
                      upiRevenue?.payments ??
                      0
                    }{" "}
                    payments
                  </p>
                </div>

                {/* RFID */}

                <div className="rounded-2xl bg-yellow-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white p-2 text-yellow-600">
                      <CreditCard className="h-5 w-5" />
                    </div>

                    <span className="text-sm font-bold text-yellow-700">
                      RFID
                    </span>
                  </div>

                  <p className="mt-4 text-2xl font-bold text-[#1A1426]">
                    {formatCurrency(
                      rfidRevenue?.total_revenue,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {
                      rfidRevenue?.payments ??
                      0
                    }{" "}
                    payments
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================
              PAGE PERFORMANCE
          ==================================== */}

          <div className="mb-6 rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-50 p-3 text-[#7E49F2]">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#1A1426]">
                    Printing Performance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Logical pages vs physical
                    sheets.
                  </p>
                </div>
              </div>
            </div>

            {/* SUMMARY */}

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-6">
                <p className="text-sm font-medium text-gray-500">
                  Printed Pages
                </p>

                <p className="mt-2 text-3xl font-bold text-[#1A1426]">
                  {totalPrintedPages}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Logical pages
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-6">
                <p className="text-sm font-medium text-gray-500">
                  Physical Sheets
                </p>

                <p className="mt-2 text-3xl font-bold text-[#1A1426]">
                  {totalSheets}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Physical paper used
                </p>
              </div>
            </div>

            {/* TABLE */}

            {pages.length > 0 ? (
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full min-w-[600px] text-left">
                  <thead>
                    <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-6 py-4 font-semibold">
                        Print Mode
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Physical Sheets
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Printed Pages
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {pages.map(
                      (item) => (
                        <tr
                          key={
                            item.print_mode
                          }
                        >
                          <td className="px-6 py-4">
                            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-[#7E49F2]">
                              {
                                item.print_mode
                              }
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-[#1A1426]">
                            {
                              item.total_sheets
                            }
                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-[#1A1426]">
                            {
                              item.printed_pages
                            }
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border-t border-gray-100 px-6 py-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-gray-300" />

                <p className="mt-3 text-sm font-semibold text-gray-500">
                  No page data available
                </p>
              </div>
            )}
          </div>

          {/* ====================================
              KIOSK HEALTH
          ==================================== */}

          <div className="rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
            {/* HEADER */}

            <div className="border-b border-gray-100 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1A1426]">
                    Kiosk Health
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Monitor printing failures
                    and unprinted documents.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-500">
                    Stale after
                  </label>

                  <select
                    value={staleMinutes}
                    onChange={(event) =>
                      setStaleMinutes(
                        Number(
                          event.target
                            .value,
                        ),
                      )
                    }
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-[#1A1426] outline-none focus:border-[#7E49F2]"
                  >
                    <option value={15}>
                      15 minutes
                    </option>

                    <option value={30}>
                      30 minutes
                    </option>

                    <option value={60}>
                      60 minutes
                    </option>

                    <option value={120}>
                      120 minutes
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* HEALTH CARDS */}

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-3 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Stuck Jobs
                    </p>

                    <p className="mt-1 text-2xl font-bold text-[#1A1426]">
                      {
                        stuckJobs.length
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-3 text-yellow-600">
                    <FileWarning className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-yellow-700">
                      Unprinted Documents
                    </p>

                    <p className="mt-1 text-2xl font-bold text-[#1A1426]">
                      {
                        unprintedDocuments.length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================
                STUCK JOBS TABLE
            ================================== */}

            <div className="border-t border-gray-100">
              <div className="p-6">
                <h3 className="text-base font-bold text-[#1A1426]">
                  Stuck Jobs
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Jobs currently printing too
                  long or failed.
                </p>
              </div>

              {stuckJobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-6 py-4 font-semibold">
                          Job
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Status
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Stuck For
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Started
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Error
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {stuckJobs.map(
                        (job) => (
                          <tr
                            key={
                              job.job_id
                            }
                          >
                            <td className="px-6 py-4">
                              <p className="max-w-[180px] truncate text-sm font-semibold text-[#1A1426]">
                                {job.job_id}
                              </p>

                              <p className="mt-1 max-w-[180px] truncate text-xs text-gray-400">
                                {
                                  job.session_id
                                }
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              {renderStatus(
                                job.status,
                              )}
                            </td>

                            <td className="px-6 py-4 text-sm font-bold text-red-600">
                              {
                                job.stuck_for_minutes
                              }{" "}
                              min
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-600">
                              {formatDate(
                                job.started_at,
                              )}
                            </td>

                            <td className="max-w-[280px] px-6 py-4 text-sm text-gray-500">
                              <span className="block truncate">
                                {job.error_message ||
                                  "—"}
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border-t border-gray-100 px-6 py-12 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />

                  <p className="mt-3 text-sm font-semibold text-[#1A1426]">
                    No stuck jobs
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    This kiosk is operating
                    normally.
                  </p>
                </div>
              )}
            </div>

            {/* ==================================
                UNPRINTED DOCUMENTS
            ================================== */}

            <div className="border-t border-gray-100">
              <div className="p-6">
                <h3 className="text-base font-bold text-[#1A1426]">
                  Unprinted Documents
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Documents uploaded but not
                  successfully printed.
                </p>
              </div>

              {unprintedDocuments.length >
              0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left">
                    <thead>
                      <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-6 py-4 font-semibold">
                          Document
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Status
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Pages
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Mode
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Sheets
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Price
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {unprintedDocuments.map(
                        (document) => (
                          <tr
                            key={
                              document.document_id
                            }
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-purple-50 p-2.5 text-[#7E49F2]">
                                  <FileText className="h-5 w-5" />
                                </div>

                                <div>
                                  <p className="max-w-[260px] truncate text-sm font-semibold text-[#1A1426]">
                                    {
                                      document.filename
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-gray-400">
                                    {
                                      document.document_type ||
                                      "Document"
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              {renderStatus(
                                document.status,
                              )}
                            </td>

                            <td className="px-6 py-4 text-sm font-semibold text-[#1A1426]">
                              {
                                document.page_count
                              }
                            </td>

                            <td className="px-6 py-4">
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                {
                                  document.print_mode ||
                                  "—"
                                }
                              </span>
                            </td>

                            <td className="px-6 py-4 text-sm font-semibold text-[#1A1426]">
                              {
                                document.sheets_required ??
                                "—"
                              }
                            </td>

                            <td className="px-6 py-4 text-sm font-semibold text-[#1A1426]">
                              {formatCurrency(
                                document.calculated_price,
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border-t border-gray-100 px-6 py-12 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />

                  <p className="mt-3 text-sm font-semibold text-[#1A1426]">
                    No unprinted documents
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    All documents have completed
                    their printing flow.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}