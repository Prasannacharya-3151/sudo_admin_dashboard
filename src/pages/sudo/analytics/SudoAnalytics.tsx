import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  FileText,
  Printer,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Loader2,
  Building2,
} from "lucide-react";

import {
  getSudoGrowth,
  getSudoRevenue,
  getSudoRevenueByKiosk,
} from "../../../api/analyticsApi";

import type {
  SudoGrowthResponse,
  SudoRevenueByKioskResponse,
  SudoRevenueResponse,
} from "../../../types/sudoAnalytics";

// ==========================================
// HELPERS
// ==========================================

const formatCurrency = (
  value: number,
): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (
  value: number,
): string => {
  return new Intl.NumberFormat("en-IN").format(
    value,
  );
};

const formatDate = (
  value: string,
): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

// ==========================================
// COMPONENT
// ==========================================

export default function SudoAnalytics() {
  // ========================================
  // STATE
  // ========================================

  const [revenue, setRevenue] =
    useState<SudoRevenueResponse | null>(
      null,
    );

  const [
    revenueByKiosk,
    setRevenueByKiosk,
  ] =
    useState<SudoRevenueByKioskResponse>([]);

  const [growth, setGrowth] =
    useState<SudoGrowthResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // ========================================
  // FETCH ANALYTICS
  // ========================================

  const fetchAnalytics = async (
    showRefreshLoader = false,
  ) => {
    try {
      setError(null);

      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [
        revenueData,
        kioskRevenueData,
        growthData,
      ] = await Promise.all([
        getSudoRevenue(),
        getSudoRevenueByKiosk(),
        getSudoGrowth(30),
      ]);

      setRevenue(revenueData);

      // Backend returns data directly as an array
      setRevenueByKiosk(
        kioskRevenueData,
      );

      setGrowth(growthData);
    } catch (err) {
      console.error(
        "Failed to load Sudo analytics:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load analytics",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    void fetchAnalytics();
  }, []);

  // ========================================
  // CHART DATA
  // ========================================

  const chartData = useMemo(() => {
    return growth?.daily_series ?? [];
  }, [growth]);

  const maxRevenue = useMemo(() => {
    if (!chartData.length) {
      return 0;
    }

    return Math.max(
      ...chartData.map(
        (item) => item.revenue,
      ),
      1,
    );
  }, [chartData]);

  // ========================================
  // LOADING
  // ========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />

          <p className="text-sm text-gray-500">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // FULL ERROR
  // ========================================

  if (error && !revenue) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-700">
            Unable to load analytics
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void fetchAnalytics()
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />

            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // PAGE
  // ========================================

  return (
    <div className="space-y-6 p-6">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold text-brand-dark">
            Analytics Overview
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor platform revenue,
            printing activity and growth.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void fetchAnalytics(true)
          }
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm transition hover:border-brand-purple/30 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          {isRefreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* ======================================
          ERROR BANNER
      ====================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ======================================
          OVERVIEW CARDS
      ====================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* TOTAL REVENUE */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Revenue
              </p>

              <h2 className="mt-2 text-3xl font-bold text-brand-dark">
                {formatCurrency(
                  revenue?.total_revenue ?? 0,
                )}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">
              <TrendingUp className="h-5 w-5 text-brand-purple" />
            </div>

          </div>

          {growth?.growth_pct !== null &&
            growth?.growth_pct !== undefined && (
              <div
                className={`mt-4 flex items-center gap-1.5 text-sm font-semibold ${
                  growth.growth_pct >= 0
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {growth.growth_pct >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}

                {growth.growth_pct >= 0
                  ? "+"
                  : "-"}
                {Math.abs(
                  growth.growth_pct,
                ).toFixed(1)}
                % from previous period
              </div>
            )}

        </div>

        {/* TOTAL SHEETS */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Sheets
              </p>

              <h2 className="mt-2 text-3xl font-bold text-brand-dark">
                {formatNumber(
                  revenue?.total_sheets ?? 0,
                )}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50">
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>

          </div>

          <p className="mt-4 text-sm text-gray-500">
            Physical sheets printed
          </p>

        </div>

        {/* PRINT SESSIONS */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Print Sessions
              </p>

              <h2 className="mt-2 text-3xl font-bold text-brand-dark">
                {formatNumber(
                  revenue?.sessions ?? 0,
                )}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Printer className="h-5 w-5 text-blue-600" />
            </div>

          </div>

          <p className="mt-4 text-sm text-gray-500">
            Total print sessions
          </p>

        </div>

      </div>

      {/* ======================================
          REVENUE GROWTH
      ====================================== */}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-bold text-brand-dark">
              Revenue Growth
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Revenue performance over the
              last 30 days
            </p>
          </div>

          {growth?.growth_pct !== null &&
            growth?.growth_pct !== undefined && (
              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                  growth.growth_pct >= 0
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {growth.growth_pct >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}

                {growth.growth_pct >= 0
                  ? "+"
                  : "-"}
                {Math.abs(
                  growth.growth_pct,
                ).toFixed(1)}
                %
              </div>
            )}

        </div>

        {/* ====================================
            CHART
        ==================================== */}

        <div className="mt-8">

          {chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl bg-gray-50">
              <div className="text-center">
                <BarChart3 className="mx-auto h-8 w-8 text-gray-300" />

                <p className="mt-2 text-sm text-gray-500">
                  No growth data available
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <div className="flex min-w-[700px] items-end gap-2">
                {chartData.map(
                  (item, index) => {
                    const height =
                      item.revenue === 0
                        ? 4
                        : Math.max(
                            (item.revenue /
                              maxRevenue) *
                              220,
                            8,
                          );

                    return (
                      <div
                        key={`${item.period_start}-${index}`}
                        className="group flex h-[280px] min-w-[28px] flex-1 flex-col items-center justify-end"
                      >

                        {/* TOOLTIP */}

                        <div className="pointer-events-none mb-2 whitespace-nowrap rounded-lg bg-brand-dark px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                          {formatCurrency(
                            item.revenue,
                          )}
                        </div>

                        {/* BAR */}

                        <div
                          className="w-full max-w-[36px] rounded-t-lg bg-brand-purple transition-all duration-300 group-hover:opacity-80"
                          style={{
                            height: `${height}px`,
                          }}
                        />

                        {/* DATE */}

                        <span className="mt-3 text-[10px] text-gray-400">
                          {formatDate(
                            item.period_start,
                          )}
                        </span>

                      </div>
                    );
                  },
                )}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ======================================
          REVENUE BY KIOSK
      ====================================== */}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

        {/* HEADER */}

        <div className="border-b border-gray-100 p-6">

          <h2 className="text-lg font-bold text-brand-dark">
            Revenue by Kiosk
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Platform revenue performance
            across kiosks
          </p>

        </div>

        {/* TABLE */}

        {revenueByKiosk.length > 0 ? (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[760px]">

              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Kiosk
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Type
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Revenue
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Sheets
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Sessions
                  </th>

                </tr>
              </thead>

              <tbody>

                {revenueByKiosk.map(
                  (kiosk) => (
                    <tr
                      key={kiosk.kiosk_id}
                      className="border-b border-gray-50 transition hover:bg-gray-50/70"
                    >

                      {/* KIOSK */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10">
                            <Building2 className="h-5 w-5 text-brand-purple" />
                          </div>

                          <div>
                            <p className="font-semibold text-brand-dark">
                              {kiosk.kiosk_name}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              {kiosk.kiosk_id}
                            </p>
                          </div>

                        </div>

                      </td>

                      {/* TYPE */}

                      <td className="px-6 py-4">

                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
                          {kiosk.kiosk_type ||
                            "Kiosk"}
                        </span>

                      </td>

                      {/* REVENUE */}

                      <td className="px-6 py-4 text-right">

                        <span className="font-semibold text-brand-dark">
                          {formatCurrency(
                            kiosk.total_revenue,
                          )}
                        </span>

                      </td>

                      {/* SHEETS */}

                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {formatNumber(
                          kiosk.total_sheets,
                        )}
                      </td>

                      {/* SESSIONS */}

                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {formatNumber(
                          kiosk.sessions,
                        )}
                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

            <Building2 className="h-10 w-10 text-gray-300" />

            <h3 className="mt-3 text-sm font-semibold text-brand-dark">
              No kiosk data
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Revenue information will
              appear here once kiosks
              have printing activity.
            </p>

          </div>
        )}

      </div>

    </div>
  );
}