import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BarChart3,
  Building2,
  FileText,
  Layers,
  Loader2,
  Palette,
  Printer,
  RefreshCw,
} from "lucide-react";

import {
  getSudoSheetUsageOverall,
  getSudoSheetUsageToday,
} from "../../../api/analyticsApi";
import { getInstitutions } from "../../../api/institutionApi";
import { useSudoAuth } from "../../../context/SudoAuthContext";

import type {
  SheetUsageBreakdown,
  SudoSheetUsageResponse,
} from "../../../types/sudoAnalytics";
import type { Institution } from "../../../types/institution";

// ==========================================
// HELPERS
// ==========================================

type UsagePeriod = "today" | "overall";

const periodOptions: Array<{
  value: UsagePeriod;
  label: string;
}> = [
  { value: "today", label: "Today" },
  { value: "overall", label: "Overall" },
];

const formatNumber = (
  value: number,
): string => {
  return new Intl.NumberFormat("en-IN").format(
    value,
  );
};

const getShare = (
  value: number,
  total: number,
): number => {
  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, (value / total) * 100),
  );
};

// ==========================================
// BREAKDOWN CARD
// ==========================================

function BreakdownCard({
  title,
  data,
  barClassName,
  caption,
  icon: Icon,
  iconContainerClassName,
  iconClassName,
}: {
  title: string;
  data: SheetUsageBreakdown;
  barClassName: string;
  caption: string;
  icon: React.ElementType;
  iconContainerClassName: string;
  iconClassName: string;
}) {
  const simplexShare = getShare(
    data.simplex_sheets,
    data.total_sheets,
  );

  const duplexShare = getShare(
    data.duplex_sheets,
    data.total_sheets,
  );

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-bold text-brand-dark">
            {formatNumber(data.total_sheets)}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {caption}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconContainerClassName}`}
        >
          <Icon
            className={`h-5 w-5 ${iconClassName}`}
          />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-gray-700">
              Simplex
            </span>

            <span className="font-semibold text-brand-dark">
              {formatNumber(data.simplex_sheets)}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${barClassName}`}
              style={{
                width: `${simplexShare}%`,
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-gray-700">
              Duplex
            </span>

            <span className="font-semibold text-brand-dark">
              {formatNumber(data.duplex_sheets)}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${barClassName}`}
              style={{
                width: `${duplexShare}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function SheetUsage() {
  const { accessToken } = useSudoAuth();

  // ========================================
  // PERIOD
  // ========================================

  const [period, setPeriod] =
    useState<UsagePeriod>("today");

  const requestIdRef = useRef(0);

  // ========================================
  // DATA
  // ========================================

  const [usage, setUsage] =
    useState<SudoSheetUsageResponse | null>(
      null,
    );

  const [institutions, setInstitutions] =
    useState<Institution[]>([]);

  // ========================================
  // LOADING
  // ========================================

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  // ========================================
  // ERROR
  // ========================================

  const [error, setError] =
    useState<string | null>(null);

  // ========================================
  // FETCH SHEET USAGE
  // ========================================

  const fetchSheetUsage = async (
    showRefreshLoader = false,
    requestedPeriod: UsagePeriod = period,
  ) => {
    const requestId =
      requestIdRef.current + 1;

    requestIdRef.current = requestId;

    try {
      setError(null);

      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data =
        requestedPeriod === "today"
          ? await getSudoSheetUsageToday()
          : await getSudoSheetUsageOverall();

      if (
        requestIdRef.current !== requestId
      ) {
        return;
      }

      setUsage(data);
    } catch (err) {
      console.error(
        "Failed to load printed sheet usage:",
        err,
      );

      if (
        requestIdRef.current !== requestId
      ) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load printed sheet usage",
      );
    } finally {
      if (
        requestIdRef.current === requestId
      ) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    void fetchSheetUsage();
  }, []);

  // ========================================
  // PERIOD CHANGE
  // ========================================

  const handlePeriodChange = (
    nextPeriod: UsagePeriod,
  ) => {
    if (nextPeriod === period) {
      return;
    }

    setPeriod(nextPeriod);

    void fetchSheetUsage(true, nextPeriod);
  };

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
      } catch (err) {
        console.error(
          "Failed to load institutions:",
          err,
        );
      }
    };

    void loadInstitutions();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // ========================================
  // DERIVED DATA
  // ========================================

  const institutionNameById =
    useMemo(() => {
      return new Map(
        institutions.map(
          (institution) => [
            institution.id,
            institution.name,
          ],
        ),
      );
    }, [institutions]);

  const kioskRows = useMemo(() => {
    return [...(usage?.by_kiosk ?? [])].sort(
      (a, b) =>
        b.total_sheets - a.total_sheets ||
        a.kiosk_name.localeCompare(
          b.kiosk_name,
        ),
    );
  }, [usage]);

  const isTodayPeriod =
    period === "today";

  const periodCaption = isTodayPeriod
    ? "today · UTC"
    : "all time";

  const periodNoun = isTodayPeriod
    ? "today"
    : "all time";

  const breakdownCaption = isTodayPeriod
    ? "sheets printed today"
    : "sheets printed all time";

  // ========================================
  // LOADING STATE
  // ========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />

          <p className="text-sm text-gray-500">
            Loading sheet usage...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // FULL ERROR
  // ========================================

  if (error && !usage) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-700">
            Unable to load sheet usage
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void fetchSheetUsage()
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
    <div className="space-y-6">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">
            Printed Sheet Usage
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isTodayPeriod
              ? "Today's physical sheet usage, split by print mode and printing side."
              : "All-time physical sheet usage, split by print mode and printing side."}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void fetchSheetUsage(true)
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Usage period
            </label>

            <div
              role="group"
              aria-label="Sheet usage period"
              className="inline-flex rounded-xl bg-gray-100 p-1"
            >
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={
                    period === option.value
                  }
                  onClick={() =>
                    handlePeriodChange(
                      option.value,
                    )
                  }
                  className={`h-9 rounded-lg px-4 text-sm font-semibold transition ${
                    period === option.value
                      ? "bg-white text-brand-purple shadow-sm"
                      : "text-gray-500 hover:text-brand-dark"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <p className="mt-2 text-xs text-gray-500">
              {isTodayPeriod
                ? "Current-day usage in UTC."
                : "Lifetime totals across all completed print jobs."}
            </p>
          </div>

          <div className="rounded-xl bg-purple-50 px-4 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-500">
              Viewing
            </p>

            <p className="mt-0.5 text-sm font-bold text-brand-purple">
              {isTodayPeriod
                ? "Today · UTC"
                : "Overall · all time"}
            </p>

            <p className="mt-0.5 text-[11px] font-medium text-purple-500">
              {kioskRows.length} kiosk
              {kioskRows.length === 1
                ? ""
                : "s"}
            </p>
          </div>
        </div>
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
          SUMMARY CARDS
      ====================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Sheets
              </p>

              <h2 className="mt-2 text-3xl font-bold text-brand-dark">
                {formatNumber(
                  usage?.total_sheets ?? 0,
                )}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">
              <Layers className="h-5 w-5 text-brand-purple" />
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Black &amp; white + color ·{" "}
            {periodCaption}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Black &amp; White
              </p>

              <h2 className="mt-2 text-3xl font-bold text-brand-dark">
                {formatNumber(
                  usage?.bw.total_sheets ?? 0,
                )}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            {formatNumber(
              usage?.bw.simplex_sheets ?? 0,
            )}{" "}
            simplex ·{" "}
            {formatNumber(
              usage?.bw.duplex_sheets ?? 0,
            )}{" "}
            duplex · {periodNoun}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Color
              </p>

              <h2 className="mt-2 text-3xl font-bold text-brand-dark">
                {formatNumber(
                  usage?.color.total_sheets ?? 0,
                )}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Palette className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            {formatNumber(
              usage?.color.simplex_sheets ?? 0,
            )}{" "}
            simplex ·{" "}
            {formatNumber(
              usage?.color.duplex_sheets ?? 0,
            )}{" "}
            duplex · {periodNoun}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Finished Sessions
              </p>

              <h2 className="mt-2 text-3xl font-bold text-brand-dark">
                {formatNumber(
                  usage?.sessions ?? 0,
                )}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <Printer className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Finished print sessions ·{" "}
            {periodCaption}
          </p>
        </div>
      </div>

      {/* ======================================
          MODE BREAKDOWN
      ====================================== */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownCard
          title="Black & White Usage"
          data={
            usage?.bw ?? {
              simplex_sheets: 0,
              duplex_sheets: 0,
              total_sheets: 0,
            }
          }
          barClassName="bg-gray-700"
          caption={breakdownCaption}
          icon={FileText}
          iconContainerClassName="bg-gray-100"
          iconClassName="text-gray-600"
        />

        <BreakdownCard
          title="Color Usage"
          data={
            usage?.color ?? {
              simplex_sheets: 0,
              duplex_sheets: 0,
              total_sheets: 0,
            }
          }
          barClassName="bg-brand-purple"
          caption={breakdownCaption}
          icon={Palette}
          iconContainerClassName="bg-blue-50"
          iconClassName="text-blue-600"
        />
      </div>

      {/* ======================================
          USAGE BY KIOSK
      ====================================== */}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-lg font-bold text-brand-dark">
            Usage by Kiosk
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Physical sheets printed{" "}
            {isTodayPeriod
              ? "today"
              : "across all time"}{" "}
            at each kiosk, ordered by total
            sheets. Every kiosk is included, even
            with zero usage.
          </p>
        </div>

        {kioskRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th
                    rowSpan={2}
                    className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Kiosk
                  </th>

                  <th
                    rowSpan={2}
                    className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Type
                  </th>

                  <th
                    colSpan={3}
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Black &amp; White
                  </th>

                  <th
                    colSpan={3}
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Color
                  </th>

                  <th
                    rowSpan={2}
                    className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Total
                  </th>

                  <th
                    rowSpan={2}
                    className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    Sessions
                  </th>
                </tr>

                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Simplex
                  </th>

                  <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Duplex
                  </th>

                  <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Total
                  </th>

                  <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Simplex
                  </th>

                  <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Duplex
                  </th>

                  <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {kioskRows.map((kiosk) => (
                  <tr
                    key={kiosk.kiosk_id}
                    className="border-b border-gray-50 transition hover:bg-gray-50/70"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                          <Building2 className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="font-semibold text-brand-dark">
                            {kiosk.kiosk_name}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
                            {kiosk.institution_id
                              ? institutionNameById.get(
                                  kiosk.institution_id,
                                ) ??
                                "Institution kiosk"
                              : "Public kiosk"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          kiosk.kiosk_type ===
                          "institution"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {kiosk.kiosk_type || "Kiosk"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {formatNumber(
                        kiosk.bw.simplex_sheets,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {formatNumber(
                        kiosk.bw.duplex_sheets,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-semibold text-brand-dark">
                      {formatNumber(
                        kiosk.bw.total_sheets,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {formatNumber(
                        kiosk.color.simplex_sheets,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {formatNumber(
                        kiosk.color.duplex_sheets,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-semibold text-brand-dark">
                      {formatNumber(
                        kiosk.color.total_sheets,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-bold text-brand-dark">
                      {formatNumber(
                        kiosk.total_sheets,
                      )}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {formatNumber(
                        kiosk.sessions,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50/80">
                  <td
                    colSpan={2}
                    className="px-4 py-4 text-sm font-bold text-brand-dark"
                  >
                    Platform total
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    {formatNumber(
                      usage?.bw.simplex_sheets ?? 0,
                    )}
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    {formatNumber(
                      usage?.bw.duplex_sheets ?? 0,
                    )}
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-bold text-brand-dark">
                    {formatNumber(
                      usage?.bw.total_sheets ?? 0,
                    )}
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    {formatNumber(
                      usage?.color
                        .simplex_sheets ?? 0,
                    )}
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    {formatNumber(
                      usage?.color.duplex_sheets ??
                        0,
                    )}
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-bold text-brand-dark">
                    {formatNumber(
                      usage?.color.total_sheets ??
                        0,
                    )}
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-bold text-brand-dark">
                    {formatNumber(
                      usage?.total_sheets ?? 0,
                    )}
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    {formatNumber(
                      usage?.sessions ?? 0,
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Layers className="h-10 w-10 text-gray-300" />

            <h3 className="mt-3 text-sm font-semibold text-brand-dark">
              {isTodayPeriod
                ? "No sheet usage today"
                : "No sheet usage recorded"}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Usage will appear here after a print
              job finishes successfully.
            </p>
          </div>
        )}
      </div>

      {/* ======================================
          COUNTING NOTE
      ====================================== */}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50">
            <BarChart3 className="h-5 w-5 text-brand-purple" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-brand-dark">
              How sheets are counted
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Only successfully printed jobs count.
              Paper ranges, N-up layouts, copies,
              and duplex halving are included, and
              sheets are attributed to the kiosk
              that physically printed them.{" "}
              {isTodayPeriod
                ? "All values are for today in UTC."
                : "Overall totals include every completed print job."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
