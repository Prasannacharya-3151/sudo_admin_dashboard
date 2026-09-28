import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Eye,
  FileText,
  Filter,
  Loader2,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  WalletCards,
  X,
} from "lucide-react";

import {
  getPrintHistory,
} from "../../../api/printHistoryApi";

import type {
  PrintHistoryFilters,
  PrintHistorySession,
} from "../../../types/sudoPrintHistory";

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
  return new Intl.NumberFormat(
    "en-IN",
  ).format(value);
};

const formatDateTime = (
  value: string | null,
): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
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

const formatDateOnly = (
  value: string,
): string => {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toLowerCase();

  let className =
    "bg-gray-100 text-gray-600";

  if (
    normalized === "printed" ||
    normalized === "completed"
  ) {
    className =
      "bg-green-50 text-green-700";
  }

  if (
    normalized === "printing" ||
    normalized === "queued"
  ) {
    className =
      "bg-yellow-50 text-yellow-700";
  }

  if (
    normalized === "failed" ||
    normalized === "cancelled" ||
    normalized === "killed"
  ) {
    className =
      "bg-red-50 text-red-600";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${className}`}
    >
      {status || "Unknown"}
    </span>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function PrintHistory() {
  // ========================================
  // DATA
  // ========================================

  const [sessions, setSessions] =
    useState<PrintHistorySession[]>(
      [],
    );

  const [total, setTotal] =
    useState(0);

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
    useState<string | null>(
      null,
    );

  // ========================================
  // FILTERS
  // ========================================

  const [kioskId, setKioskId] =
    useState("");

  const [institutionId, setInstitutionId] =
    useState("");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [printMode, setPrintMode] =
    useState<
      "" | "BW" | "COLOR"
    >("");

  const [printingSide, setPrintingSide] =
    useState<
      "" | "SIMPLEX" | "DUPLEX"
    >("");

  const [onlyPrinted, setOnlyPrinted] =
    useState(false);

  // ========================================
  // PAGINATION
  // ========================================

  const [page, setPage] =
    useState(1);

  const pageSize = 20;

  // ========================================
  // VIEW MODAL
  // ========================================

  const [
    selectedSession,
    setSelectedSession,
  ] = useState<
    PrintHistorySession | null
  >(null);

  // ========================================
  // FETCH DATA
  // ========================================

  const fetchPrintHistory =
    async (
      showRefreshLoader = false,
      requestedPage = page,
    ) => {
      try {
        setError(null);

        if (showRefreshLoader) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const filters: PrintHistoryFilters =
          {
            kiosk_id:
              kioskId.trim() ||
              undefined,

            institution_id:
              institutionId.trim() ||
              undefined,

            only_printed:
              onlyPrinted ||
              undefined,

            print_mode:
              printMode ||
              undefined,

            printing_side:
              printingSide ||
              undefined,

            from:
              fromDate ||
              undefined,

            to:
              toDate ||
              undefined,

            page: requestedPage,

            page_size: pageSize,
          };

        const response =
          await getPrintHistory(
            filters,
          );

        setSessions(
          response.data.data ??
            [],
        );

        setTotal(
          response.data.total ??
            0,
        );

        setPage(
          response.data.page ??
            requestedPage,
        );

        setSelectedSession(
          null,
        );
      } catch (err) {
        console.error(
          "Failed to load print history:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load print history",
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
    void fetchPrintHistory();
  }, []);

  // ========================================
  // TOTAL PAGES
  // ========================================

  const totalPages =
    useMemo(() => {
      return Math.max(
        1,
        Math.ceil(
          total / pageSize,
        ),
      );
    }, [total]);

  // ========================================
  // APPLY FILTERS
  // ========================================

  const handleApplyFilters =
    () => {
      setPage(1);

      void fetchPrintHistory(
        false,
        1,
      );
    };

  // ========================================
  // CLEAR FILTERS
  // ========================================

  const handleClearFilters =
    () => {
      setKioskId("");
      setInstitutionId("");
      setFromDate("");
      setToDate("");
      setPrintMode("");
      setPrintingSide("");
      setOnlyPrinted(false);

      setPage(1);

      void getPrintHistory({
        page: 1,
        page_size: pageSize,
      })
        .then((response) => {
          setSessions(
            response.data.data ??
              [],
          );

          setTotal(
            response.data.total ??
              0,
          );

          setError(null);

          setSelectedSession(
            null,
          );
        })
        .catch((err) => {
          console.error(
            "Failed to clear print history filters:",
            err,
          );

          setError(
            err instanceof Error
              ? err.message
              : "Failed to load print history",
          );
        });
    };

  // ========================================
  // PAGE CHANGE
  // ========================================

  const handlePageChange =
    (nextPage: number) => {
      if (
        nextPage < 1 ||
        nextPage > totalPages ||
        nextPage === page
      ) {
        return;
      }

      setPage(nextPage);

      void fetchPrintHistory(
        false,
        nextPage,
      );
    };

  // ========================================
  // PAGE NUMBERS
  // ========================================

  const pageNumbers =
    useMemo(() => {
      const pages: number[] = [];

      const start = Math.max(
        1,
        page - 2,
      );

      const end = Math.min(
        totalPages,
        page + 2,
      );

      for (
        let current = start;
        current <= end;
        current += 1
      ) {
        pages.push(current);
      }

      return pages;
    }, [
      page,
      totalPages,
    ]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      <div className="space-y-6 p-6">
        {/* ======================================
            HEADER
        ====================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-brand-dark">
                  Print History
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  View and analyze
                  platform printing
                  sessions.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void fetchPrintHistory(
                true,
              )
            }
            disabled={
              isLoading ||
              isRefreshing
            }
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
            FILTER CARD
        ====================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-brand-purple" />

            <h2 className="text-lg font-bold text-brand-dark">
              Filters
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* KIOSK ID */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kiosk ID
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={kioskId}
                  onChange={(event) =>
                    setKioskId(
                      event.target.value,
                    )
                  }
                  placeholder="Enter kiosk ID"
                  className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                />
              </div>
            </div>

            {/* INSTITUTION ID */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Institution ID
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={
                    institutionId
                  }
                  onChange={(event) =>
                    setInstitutionId(
                      event.target.value,
                    )
                  }
                  placeholder="Enter institution ID"
                  className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                />
              </div>
            </div>

            {/* FROM */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                From
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) =>
                    setFromDate(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                />
              </div>
            </div>

            {/* TO */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                To
              </label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="date"
                  value={toDate}
                  onChange={(event) =>
                    setToDate(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                />
              </div>
            </div>

            {/* PRINT MODE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Print Mode
              </label>

              <select
                value={printMode}
                onChange={(event) =>
                  setPrintMode(
                    event.target
                      .value as
                      | ""
                      | "BW"
                      | "COLOR",
                  )
                }
                className="w-full rounded-full border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
              >
                <option value="">
                  All Modes
                </option>

                <option value="BW">
                  Black & White
                </option>

                <option value="COLOR">
                  Color
                </option>
              </select>
            </div>

            {/* PRINTING SIDE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Printing Side
              </label>

              <select
                value={printingSide}
                onChange={(event) =>
                  setPrintingSide(
                    event.target
                      .value as
                      | ""
                      | "SIMPLEX"
                      | "DUPLEX",
                  )
                }
                className="w-full rounded-full border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
              >
                <option value="">
                  All Sides
                </option>

                <option value="SIMPLEX">
                  Simplex
                </option>

                <option value="DUPLEX">
                  Duplex
                </option>
              </select>
            </div>

            {/* ONLY PRINTED */}

            <div className="flex items-end">
              <label className="flex h-[42px] w-full cursor-pointer items-center gap-3 rounded-full border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={
                    onlyPrinted
                  }
                  onChange={(event) =>
                    setOnlyPrinted(
                      event.target
                        .checked,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
                />

                Only printed
                sessions
              </label>
            </div>

            {/* BUTTONS */}

            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={
                  handleApplyFilters
                }
                className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-full bg-brand-purple px-4 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Filter className="h-4 w-4" />

                Apply
              </button>

              <button
                type="button"
                onClick={
                  handleClearFilters
                }
                className="flex h-[42px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />

                Clear
              </button>
            </div>
          </div>
        </div>

        {/* ======================================
            ERROR
        ====================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ======================================
            RESULTS
        ====================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* HEADER */}

          <div className="flex flex-col gap-2 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                Print Sessions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {formatNumber(
                  total,
                )}{" "}
                total sessions
              </p>
            </div>

            <div className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500">
              Page {page} of{" "}
              {totalPages}
            </div>
          </div>

          {/* LOADING */}

          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />

                <p className="text-sm text-gray-500">
                  Loading print
                  history...
                </p>
              </div>
            </div>
          ) : sessions.length ===
            0 ? (
            /* EMPTY */

            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                <Printer className="h-7 w-7 text-gray-300" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-brand-dark">
                No print
                sessions found
              </h3>

              <p className="mt-1 max-w-md text-sm text-gray-500">
                No sessions match
                the selected
                filters.
              </p>
            </div>
          ) : (
            /* TABLE */

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Kiosk
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Documents
                    </th>

                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Sheets
                    </th>

                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Amount
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Payment
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Created
                    </th>

                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sessions.map(
                    (session) => (
                      <SessionRow
                        key={
                          session.session_id
                        }
                        session={
                          session
                        }
                        onView={() =>
                          setSelectedSession(
                            session,
                          )
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}

          {!isLoading &&
            sessions.length >
              0 && (
              <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {(page - 1) *
                      pageSize +
                      1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-700">
                    {Math.min(
                      page *
                        pageSize,
                      total,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {formatNumber(
                      total,
                    )}
                  </span>
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={
                      page === 1
                    }
                    onClick={() =>
                      handlePageChange(
                        page - 1,
                      )
                    }
                    className="rounded-full border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {pageNumbers.map(
                    (
                      pageNumber,
                    ) => (
                      <button
                        key={
                          pageNumber
                        }
                        type="button"
                        onClick={() =>
                          handlePageChange(
                            pageNumber,
                          )
                        }
                        className={`h-9 min-w-9 rounded-full px-3 text-sm font-semibold transition ${
                          pageNumber ===
                          page
                            ? "bg-brand-purple text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {
                          pageNumber
                        }
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    disabled={
                      page ===
                      totalPages
                    }
                    onClick={() =>
                      handlePageChange(
                        page + 1,
                      )
                    }
                    className="rounded-full border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* ======================================
          VIEW MODAL
      ====================================== */}

      {selectedSession && (
        <SessionDetailsModal
          session={
            selectedSession
          }
          onClose={() =>
            setSelectedSession(
              null,
            )
          }
        />
      )}
    </>
  );
}

// ==========================================
// VIEW SESSION MODAL
// ==========================================

function SessionDetailsModal({
  session,
  onClose,
}: {
  session: PrintHistorySession;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape"
      ) {
        onClose();
      }
    };

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-session-view-title"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="print-session-view-title"
                className="text-lg font-bold text-brand-dark"
              >
                Print Session
                Details
              </h2>

              <StatusBadge
                status={
                  session.status ||
                  session.job_status
                }
              />
            </div>

            <p className="mt-1 max-w-2xl truncate text-sm text-gray-500">
              {
                session.session_id
              }
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            aria-label="Close session details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}

        <div className="min-h-0 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* SESSION INFO */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryItem
                label="Session Status"
                value={
                  session.status
                }
              />

              <SummaryItem
                label="Job Status"
                value={
                  session.job_status
                }
              />

              <SummaryItem
                label="Session Type"
                value={session.session_type.replace(
                  /_/g,
                  " ",
                )}
              />

              <SummaryItem
                label="Kiosk"
                value={
                  session.kiosk_name
                }
              />

              <SummaryItem
                label="RFID Card"
                value={
                  session.rfid_id ||
                  "—"
                }
              />

              <SummaryItem
                label="Total Paid"
                value={formatCurrency(
                  session
                    .payment_summary
                    ?.total_paid ??
                    session.total_amount,
                )}
              />

              <SummaryItem
                label="Transactions"
                value={
                  session
                    .payment_summary
                    ?.transaction_ids
                    ?.length
                    ? String(
                        session
                          .payment_summary
                          .transaction_ids
                          .length,
                      )
                    : "0"
                }
              />

              <SummaryItem
                label="Documents"
                value={String(
                  session.documents
                    .length,
                )}
              />

              <SummaryItem
                label="Sheets"
                value={formatNumber(
                  session.total_sheets,
                )}
              />

              <SummaryItem
                label="Amount"
                value={formatCurrency(
                  session.total_amount,
                )}
              />

              <SummaryItem
                label="Payment Method"
                value={
                  session
                    .payment_summary
                    ?.method ||
                  "—"
                }
              />

              <SummaryItem
                label="Created"
                value={formatDateTime(
                  session.created_at,
                )}
              />

              <SummaryItem
                label="Completed"
                value={formatDateTime(
                  session.completed_at ??
                    null,
                )}
              />
            </div>

            {/* DOCUMENTS */}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-purple" />

                <h3 className="text-sm font-bold text-brand-dark">
                  Documents
                </h3>

                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                  {
                    session
                      .documents
                      .length
                  }
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {session.documents
                  .length ===
                0 ? (
                  <div className="flex items-center gap-3 px-4 py-6 text-sm text-gray-500">
                    <FileText className="h-4 w-4 text-gray-300" />

                    No documents in
                    this session.
                  </div>
                ) : (
                  session.documents.map(
                    (
                      document,
                      index,
                    ) => (
                      <div
                        key={
                          document.document_id
                        }
                        className={`p-4 ${
                          index !==
                          session
                            .documents
                            .length -
                            1
                            ? "border-b border-gray-100"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          {/* FILE */}

                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                              <FileText className="h-5 w-5 text-gray-500" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-brand-dark">
                                {
                                  document.filename
                                }
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {
                                  document.document_type
                                }{" "}
                                •{" "}
                                {
                                  document.paper_size
                                }
                              </p>
                            </div>
                          </div>

                          {/* CONFIG */}

                          <div className="flex flex-wrap items-center gap-2">
                            <ConfigBadge
                              label={
                                document.print_mode
                              }
                            />

                            <ConfigBadge
                              label={
                                document.printing_side
                              }
                            />

                            <ConfigBadge
                              label={
                                document.orientation
                              }
                            />

                            <ConfigBadge
                              label={`${document.copies} ${
                                document.copies ===
                                1
                                  ? "copy"
                                  : "copies"
                              }`}
                            />

                            <ConfigBadge
                              label={`${document.sheets_required} ${
                                document.sheets_required ===
                                1
                                  ? "sheet"
                                  : "sheets"
                              }`}
                            />
                          </div>

                          {/* PRICE */}

                          <div className="shrink-0 text-left xl:text-right">
                            <p className="text-sm font-bold text-brand-dark">
                              {formatCurrency(
                                document.calculated_price,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {
                                document.printable_pages
                              }{" "}
                              printable
                              pages
                            </p>
                          </div>
                        </div>

                        {/* META */}

                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                          <span>
                            Page count:{" "}
                            <strong className="text-gray-700">
                              {
                                document.page_count
                              }
                            </strong>
                          </span>

                          <span>
                            Layout:{" "}
                            <strong className="text-gray-700">
                              {
                                document.page_layout
                              }
                            </strong>
                          </span>

                          <span>
                            Printed:{" "}
                            <strong className="text-gray-700">
                              {formatDateTime(
                                document.printed_at,
                              )}
                            </strong>
                          </span>

                          <StatusBadge
                            status={
                              document.status
                            }
                          />
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex items-center justify-end border-t border-gray-100 bg-gray-50/60 px-6 py-4">
          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-full bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SESSION ROW
// ==========================================

function SessionRow({
  session,
  onView,
}: {
  session: PrintHistorySession;
  onView: () => void;
}) {
  return (
    <>
      {/* MAIN ROW */}

      <tr className="border-b border-gray-50 transition hover:bg-gray-50/70">
      
      

        <td className="px-4 py-4">
          <div>
            <p className="font-semibold text-brand-dark">
              {
                session.kiosk_name
              }
            </p>
          </div>
        </td>

        {/* DOCUMENTS */}

        <td className="px-4 py-4">
          <div className="flex items-center gap-2">

            <span className="text-sm font-semibold text-gray-700">
              {
                session
                  .documents
                  .length
              }
            </span>
          </div>
        </td>

        {/* SHEETS */}

        <td className="px-4 py-4 text-right">
          <span className="font-semibold text-brand-dark">
            {formatNumber(
              session.total_sheets,
            )}
          </span>
        </td>

        {/* AMOUNT */}

        <td className="px-4 py-4 text-right">
          <span className="font-semibold text-brand-dark">
            {formatCurrency(
              session.total_amount,
            )}
          </span>
        </td>

        {/* PAYMENT */}

        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <WalletCards className="h-4 w-4 text-gray-400" />

            <span className="text-sm font-medium uppercase text-gray-600">
              {
                session
                  .payment_summary
                  ?.method ||
                "—"
              }
            </span>
          </div>
        </td>

        {/* STATUS */}

        <td className="px-4 py-4">
          <StatusBadge
            status={
              session.status ||
              session.job_status
            }
          />
        </td>

        {/* CREATED */}

        <td className="px-4 py-4">
          <div>
            <p className="whitespace-nowrap text-sm font-medium text-gray-600">
              {formatDateTime(
                session.created_at,
              )}
            </p>
          </div>
        </td>

        {/* VIEW */}

        <td className="px-4 py-4 text-right">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-brand-purple/30 hover:bg-brand-purple/5 hover:text-brand-purple"
          >
            <Eye className="h-4 w-4" />

            View
          </button>
        </td>
      </tr>

    </>
  );
}

// ==========================================
// SUMMARY ITEM
// ==========================================

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
      <p className="text-xs font-medium text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold capitalize text-brand-dark">
        {value || "—"}
      </p>
    </div>
  );
}

// ==========================================
// CONFIG BADGE
// ==========================================

function ConfigBadge({
  label,
}: {
  label: string;
}) {
  return (
    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium uppercase text-gray-600">
      {label}
    </span>
  );
}