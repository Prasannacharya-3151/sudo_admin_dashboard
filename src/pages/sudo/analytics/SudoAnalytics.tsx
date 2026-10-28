import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  CalendarDays,
  FileText,
  Filter,
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
  getSudoSheetsPrintedToday,
} from "../../../api/analyticsApi";

import { getInstitutions } from "../../../api/institutionApi";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import type {
  SheetsPrintedResponse,
  SudoGrowthResponse,
  SudoRevenueByKioskResponse,
  SudoRevenueResponse,
} from "../../../types/sudoAnalytics";

import type { Institution } from "../../../types/institution";

import {
  addDaysIso,
  buildAnalyticsPeriod,
  getTodayIso,
  periodOptions,
} from "./analyticsPeriod";

import type {
  AnalyticsPeriod,
  AnalyticsQuery,
  PeriodPreset,
} from "./analyticsPeriod";

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
// SCOPE OPTIONS
// ==========================================

type AnalyticsScope =
  | "all"
  | "institution"
  | "public";

const scopeOptions: Array<{
  value: AnalyticsScope;
  label: string;
}> = [
  { value: "all", label: "All kiosks" },
  { value: "institution", label: "Institution" },
  { value: "public", label: "Public" },
];

// ==========================================
// COMPONENT
// ==========================================

export default function SudoAnalytics() {
  const { accessToken } = useSudoAuth();

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

  const [sheetsToday, setSheetsToday] =
    useState<SheetsPrintedResponse | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // ========================================
  // PERIOD FILTER
  // ========================================

  const [preset, setPreset] =
    useState<PeriodPreset>("last30");

  const [customDate, setCustomDate] =
    useState(getTodayIso());

  const [rangeFrom, setRangeFrom] =
    useState(
      addDaysIso(getTodayIso(), -6),
    );

  const [rangeTo, setRangeTo] =
    useState(getTodayIso());

  const [activePeriod, setActivePeriod] =
    useState<AnalyticsPeriod>(() =>
      buildAnalyticsPeriod("last30"),
    );

  const [filterError, setFilterError] =
    useState<string | null>(null);

  // ========================================
  // SCOPE FILTER
  // ========================================

  const [scope, setScope] =
    useState<AnalyticsScope>("all");

  const [
    selectedInstitutionId,
    setSelectedInstitutionId,
  ] = useState("");

  const [institutions, setInstitutions] =
    useState<Institution[]>([]);

  const sortedInstitutions = useMemo(() => {
    return [...institutions].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [institutions]);

  const institutionNameById = useMemo(() => {
    return new Map(
      institutions.map((institution) => [
        institution.id,
        institution.name,
      ]),
    );
  }, [institutions]);

  const effectiveInstitutionId =
    scope === "institution"
      ? selectedInstitutionId ||
        sortedInstitutions[0]?.id ||
        ""
      : "";

  const selectedInstitution = useMemo(() => {
    return sortedInstitutions.find(
      (institution) =>
        institution.id ===
        effectiveInstitutionId,
    );
  }, [
    sortedInstitutions,
    effectiveInstitutionId,
  ]);

  const scopeLabel =
    scope === "all"
      ? "All kiosks"
      : scope === "public"
        ? "Public kiosks"
        : selectedInstitution?.name ||
          "Institution";

  const isScoped = scope !== "all";

  // ========================================
  // LOAD INSTITUTIONS
  // ========================================

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    const loadInstitutions = async () => {
      try {
        const data =
          await getInstitutions(accessToken);

        if (!cancelled) {
          setInstitutions(data);
        }
      } catch (error) {
        console.error(
          "Failed to load institutions:",
          error,
        );
      }
    };

    void loadInstitutions();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // ========================================
  // FETCH ANALYTICS
  // ========================================

  const fetchAnalytics = async (
    showRefreshLoader = false,
    query: AnalyticsQuery = activePeriod.query,
    scopeValue: AnalyticsScope = scope,
    institutionId: string = effectiveInstitutionId,
  ) => {
    try {
      setError(null);

      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const kioskRevenueData =
        await getSudoRevenueByKiosk(query);

      // Only keep kiosks that belong to the selected scope.
      const scopedKiosks =
        kioskRevenueData.filter((kiosk) => {
          if (scopeValue === "all") {
            return true;
          }

          if (scopeValue === "public") {
            return kiosk.kiosk_type === "public";
          }

          return (
            kiosk.institution_id ===
            institutionId
          );
        });

      const scopedTotals =
        scopedKiosks.reduce(
          (totals, kiosk) => ({
            revenue:
              totals.revenue +
              Number(
                kiosk.total_revenue || 0,
              ),
            sheets:
              totals.sheets +
              Number(
                kiosk.total_sheets || 0,
              ),
            sessions:
              totals.sessions +
              Number(kiosk.sessions || 0),
          }),
          {
            revenue: 0,
            sheets: 0,
            sessions: 0,
          },
        );

      const revenuePromise =
        scopeValue === "all"
          ? getSudoRevenue(query)
          : Promise.resolve({
              total_revenue:
                scopedTotals.revenue,
              total_sheets:
                scopedTotals.sheets,
              sessions:
                scopedTotals.sessions,
            });

      const growthPromise =
        scopeValue === "all"
          ? getSudoGrowth(30).catch(
              (growthError) => {
                console.error(
                  "Failed to load revenue growth:",
                  growthError,
                );

                return null;
              },
            )
          : Promise.resolve(null);

      const sheetsTodayPromise =
        scopeValue === "all"
          ? getSudoSheetsPrintedToday().catch(
              (sheetsError) => {
                console.error(
                  "Failed to load sheets printed today:",
                  sheetsError,
                );

                return null;
              },
            )
          : Promise.all(
              scopedKiosks.map((kiosk) =>
                getSudoSheetsPrintedToday(
                  kiosk.kiosk_id,
                ).catch((sheetsError) => {
                  console.error(
                    "Failed to load sheets printed today for kiosk:",
                    kiosk.kiosk_id,
                    sheetsError,
                  );

                  return null;
                }),
              ),
            ).then((results) => ({
              total_sheets: results.reduce(
                (sum, result) =>
                  sum +
                  Number(
                    result?.total_sheets ?? 0,
                  ),
                0,
              ),
            }));

      const [
        revenueData,
        growthData,
        sheetsTodayData,
      ] = await Promise.all([
        revenuePromise,
        growthPromise,
        sheetsTodayPromise,
      ]);

      setRevenue(revenueData);

      setRevenueByKiosk(scopedKiosks);

      setGrowth(growthData);

      setSheetsToday(sheetsTodayData);
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
  // PERIOD ACTIONS
  // ========================================

  const handlePresetChange = (
    nextPreset: PeriodPreset,
  ) => {
    setPreset(nextPreset);
    setFilterError(null);

    if (
      nextPreset === "date" ||
      nextPreset === "range"
    ) {
      return;
    }

    const nextPeriod =
      buildAnalyticsPeriod(nextPreset);

    setActivePeriod(nextPeriod);

    void fetchAnalytics(
      true,
      nextPeriod.query,
    );
  };

  const handleApplyCustomPeriod = () => {
    setFilterError(null);

    if (preset === "date") {
      if (!customDate) {
        setFilterError(
          "Select a date to continue.",
        );

        return;
      }

      const nextPeriod =
        buildAnalyticsPeriod("date", {
          date: customDate,
        });

      setActivePeriod(nextPeriod);

      void fetchAnalytics(
        true,
        nextPeriod.query,
      );

      return;
    }

    if (preset === "range") {
      if (!rangeFrom || !rangeTo) {
        setFilterError(
          "Select both a start and end date.",
        );

        return;
      }

      if (rangeFrom > rangeTo) {
        setFilterError(
          "The start date must be on or before the end date.",
        );

        return;
      }

      const nextPeriod =
        buildAnalyticsPeriod("range", {
          from: rangeFrom,
          to: rangeTo,
        });

      setActivePeriod(nextPeriod);

      void fetchAnalytics(
        true,
        nextPeriod.query,
      );
    }
  };

  // ========================================
  // SCOPE ACTIONS
  // ========================================

  const handleScopeChange = (
    nextScope: AnalyticsScope,
  ) => {
    setScope(nextScope);
  };

  const handleInstitutionChange = (
    institutionId: string,
  ) => {
    setSelectedInstitutionId(institutionId);
  };

  // ========================================
  // INITIAL LOAD + SCOPE REFRESH
  // ========================================

  useEffect(() => {
    void fetchAnalytics(
      true,
      activePeriod.query,
      scope,
      effectiveInstitutionId,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, effectiveInstitutionId]);

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

  const kioskTotals = useMemo(() => {
    return revenueByKiosk.reduce(
      (totals, kiosk) => ({
        revenue:
          totals.revenue +
          Number(kiosk.total_revenue || 0),
        sheets:
          totals.sheets +
          Number(kiosk.total_sheets || 0),
        sessions:
          totals.sessions +
          Number(kiosk.sessions || 0),
      }),
      {
        revenue: 0,
        sheets: 0,
        sessions: 0,
      },
    );
  }, [revenueByKiosk]);

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
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm transition hover:border-brand-purple/30 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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
          PERIOD FILTER
      ====================================== */}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">

        {/* ====================================
            SCOPE
        ==================================== */}

        <div className="mb-4 flex flex-col gap-4 border-b border-gray-100 pb-4 lg:flex-row lg:items-end lg:justify-between">

          <div className="flex flex-wrap items-end gap-3">

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Analytics scope
              </label>

              <div className="inline-flex rounded-xl bg-gray-100 p-1">
                {scopeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={
                      scope === option.value
                    }
                    onClick={() =>
                      handleScopeChange(
                        option.value,
                      )
                    }
                    className={`h-9 rounded-lg px-4 text-sm font-semibold transition ${
                      scope === option.value
                        ? "bg-white text-brand-purple shadow-sm"
                        : "text-gray-500 hover:text-brand-dark"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {scope === "institution" && (
              <div className="min-w-[240px]">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Institution
                </label>

                <select
                  value={effectiveInstitutionId}
                  onChange={(event) =>
                    handleInstitutionChange(
                      event.target.value,
                    )
                  }
                  disabled={
                    sortedInstitutions.length === 0
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-brand-dark outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-purple-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                >
                  {sortedInstitutions.length === 0 ? (
                    <option value="">
                      No institutions available
                    </option>
                  ) : (
                    sortedInstitutions.map(
                      (institution) => (
                        <option
                          key={institution.id}
                          value={institution.id}
                        >
                          {institution.name}
                        </option>
                      ),
                    )
                  )}
                </select>
              </div>
            )}

          </div>

          <div className="rounded-xl bg-purple-50 px-4 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-500">
              Viewing
            </p>

            <p className="mt-0.5 text-sm font-bold text-brand-purple">
              {scopeLabel}
            </p>

            <p className="mt-0.5 text-[11px] font-medium text-purple-500">
              {revenueByKiosk.length} kiosk
              {revenueByKiosk.length === 1
                ? ""
                : "s"}
            </p>
          </div>

        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

          <div className="flex flex-wrap items-end gap-3">

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Period
              </label>

              <select
                value={preset}
                onChange={(event) =>
                  handlePresetChange(
                    event.target
                      .value as PeriodPreset,
                  )
                }
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-brand-dark outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-purple-50"
              >
                {periodOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            {preset === "date" && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </label>

                <input
                  type="date"
                  value={customDate}
                  max={getTodayIso()}
                  onChange={(event) =>
                    setCustomDate(
                      event.target.value,
                    )
                  }
                  className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-brand-dark outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-purple-50"
                />
              </div>
            )}

            {preset === "range" && (
              <>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    From
                  </label>

                  <input
                    type="date"
                    value={rangeFrom}
                    max={getTodayIso()}
                    onChange={(event) =>
                      setRangeFrom(
                        event.target.value,
                      )
                    }
                    className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-brand-dark outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-purple-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    To
                  </label>

                  <input
                    type="date"
                    value={rangeTo}
                    max={getTodayIso()}
                    onChange={(event) =>
                      setRangeTo(
                        event.target.value,
                      )
                    }
                    className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-brand-dark outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-purple-50"
                  />
                </div>
              </>
            )}

            {(preset === "date" ||
              preset === "range") && (
              <button
                type="button"
                onClick={
                  handleApplyCustomPeriod
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Filter className="h-4 w-4" />
                Apply
              </button>
            )}

          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">

            <Filter className="h-4 w-4 text-gray-400" />

            <span>
              Showing{" "}
              <span className="font-semibold text-brand-dark">
                {scopeLabel}
              </span>{" "}
              ·{" "}
              <span className="font-semibold text-brand-dark">
                {activePeriod.label}
              </span>{" "}
              · UTC
            </span>

          </div>

        </div>

        {filterError && (
          <p className="mt-3 text-sm font-medium text-red-600">
            {filterError}
          </p>
        )}

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* REVENUE */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Revenue
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

          <p className="mt-4 text-sm text-gray-500">
            For {scopeLabel} ·{" "}
            {activePeriod.label}
          </p>

        </div>

        {/* SHEETS */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Sheets Printed
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
            Physical sheets · {scopeLabel} ·{" "}
            {activePeriod.label}
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
            For {scopeLabel} ·{" "}
            {activePeriod.label}
          </p>

        </div>

        {/* SHEETS TODAY */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Sheets Printed Today
              </p>

              <h2 className="mt-2 text-3xl font-bold text-brand-dark">
                {formatNumber(
                  sheetsToday?.total_sheets ?? 0,
                )}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
            </div>

          </div>

          <p className="mt-4 text-sm text-gray-500">
            {scope === "all"
              ? "Platform-wide"
              : scopeLabel}{" "}
            · UTC
          </p>

        </div>

      </div>

      {/* ======================================
          REVENUE GROWTH
      ====================================== */}

      {!isScoped ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-bold text-brand-dark">
              Revenue Growth
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Revenue performance over the
              last 30 days · UTC
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
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                Revenue Growth
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Growth trend is available for the
                all-kiosks view only. Select{" "}
                <span className="font-semibold text-brand-dark">
                  All kiosks
                </span>{" "}
                to see the platform-wide 30-day trend.
              </p>
            </div>
          </div>
        </div>
      )}

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
            Revenue performance for{" "}
            <span className="font-semibold text-brand-dark">
              {scopeLabel}
            </span>{" "}
            over{" "}
            <span className="font-semibold text-brand-dark">
              {activePeriod.label}
            </span>
            . Kiosks in this scope are included,
            even with zero revenue.
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

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                            <Building2 className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="font-semibold text-brand-dark">
                              {kiosk.kiosk_name}
                            </p>

                            {kiosk.institution_id && (
                              <p className="mt-0.5 text-xs text-gray-400">
                                {institutionNameById.get(
                                  kiosk.institution_id,
                                ) ?? "Institution kiosk"}
                              </p>
                            )}

                          </div>

                        </div>

                      </td>

                      {/* TYPE */}

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
                            kiosk.kiosk_type ===
                            "institution"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
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

              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50/80">

                  <td
                    colSpan={2}
                    className="px-6 py-4 text-sm font-bold text-brand-dark"
                  >
                    {scopeLabel}
                  </td>

                  <td className="px-6 py-4 text-right text-sm font-bold text-brand-dark">
                    {formatCurrency(
                      kioskTotals.revenue,
                    )}
                  </td>

                  <td className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    {formatNumber(
                      kioskTotals.sheets,
                    )}
                  </td>

                  <td className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    {formatNumber(
                      kioskTotals.sessions,
                    )}
                  </td>

                </tr>
              </tfoot>

            </table>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

            <Building2 className="h-10 w-10 text-gray-300" />

            <h3 className="mt-3 text-sm font-semibold text-brand-dark">
              No kiosks found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              No kiosks match{" "}
              <span className="font-semibold text-brand-dark">
                {scopeLabel}
              </span>{" "}
              for {activePeriod.label}. Try another
              scope or period.
            </p>

          </div>
        )}

      </div>

    </div>
  );
}