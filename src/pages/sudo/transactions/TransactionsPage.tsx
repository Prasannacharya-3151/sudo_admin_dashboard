import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CreditCard,
  Loader2,
  ReceiptText,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "sonner";

import {
  getInstitutionMembers,
  getRFIDCards,
  getRFIDHistory,
} from "../../../api/machineApi";

import { getInstitutions } from "../../../api/institutionApi";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import type { Institution } from "../../../types/institution";

import type {
  RFIDCard,
  RFIDTransaction,
} from "../../../types/machine";

// ==========================================
// TRANSACTION TYPE LABEL
// ==========================================

const getTransactionTypeLabel = (
  type?: string,
): string => {
  if (!type) return "Unknown";

  return type
    .replace(/\_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
};

// ==========================================
// TRANSACTION TYPE STYLE
// ==========================================

const getTransactionTypeStyle = (
  type?: string,
): string => {
  switch (type?.toLowerCase()) {
    case "credit":
    case "recharge":
      return "bg-green-100 text-green-700 border-green-200";

    case "debit":
    case "payment":
    case "spend":
      return "bg-red-100 text-red-700 border-red-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

// ==========================================
// TRANSACTION ICON
// ==========================================

const TransactionIcon = ({
  type,
}: {
  type?: string;
}) => {
  const normalizedType =
    type?.toLowerCase();

  if (
    normalizedType === "credit" ||
    normalizedType === "recharge"
  ) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
        <ArrowDownLeft className="h-4 w-4" />
      </div>
    );
  }

  if (
    normalizedType === "debit" ||
    normalizedType === "payment" ||
    normalizedType === "spend"
  ) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
        <ArrowUpRight className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
      <ReceiptText className="h-4 w-4" />
    </div>
  );
};

// ==========================================
// COMPONENT
// ==========================================

export default function TransactionsPage() {
  const { accessToken } = useSudoAuth();

  // ==========================================
  // TRANSACTION STATE
  // ==========================================

  const [transactions, setTransactions] =
    useState<RFIDTransaction[]>([]);

  const [rfidCards, setRfidCards] =
    useState<RFIDCard[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // ==========================================
  // INSTITUTION FILTER STATE
  // ==========================================

  const [institutions, setInstitutions] =
    useState<Institution[]>([]);

  const [
    selectedInstitution,
    setSelectedInstitution,
  ] = useState("");

  const [
    isLoadingInstitutions,
    setIsLoadingInstitutions,
  ] = useState(true);

  const [
    isLoadingInstitutionMembers,
    setIsLoadingInstitutionMembers,
  ] = useState(false);

  /**
   * Card UUIDs belonging to the selected
   * institution.
   */
  const [
    institutionCardUuids,
    setInstitutionCardUuids,
  ] = useState<Set<string>>(
    new Set(),
  );

  // ==========================================
  // OTHER FILTERS
  // ==========================================

  const [searchQuery, setSearchQuery] =
    useState("");

  const [transactionType, setTransactionType] =
    useState("all");

  // ==========================================
  // LOAD TRANSACTIONS + RFID CARDS
  // ==========================================

  const fetchTransactions =
    useCallback(async () => {
      try {
        setError(null);

        /**
         * We need both APIs:
         *
         * /rfid/history
         *       ↓
         * transactions
         *
         * /rfid/cards
         *       ↓
         * card_uuid <-> student
         */

        const [
          transactionData,
          cardData,
        ] = await Promise.all([
          getRFIDHistory(),
          getRFIDCards(),
        ]);

        setTransactions(
          Array.isArray(transactionData)
            ? transactionData
            : [],
        );

        setRfidCards(
          Array.isArray(cardData)
            ? cardData
            : [],
        );
      } catch (error) {
        console.error(
          "Failed to fetch transactions:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load transactions";

        setError(message);

        toast.error(
          "Failed to load transactions",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }, []);

  // ==========================================
  // LOAD INSTITUTIONS
  // ==========================================

  async function loadInstitutions(
    token: string,
  ) {
    try {
      setIsLoadingInstitutions(true);

      const data =
        await getInstitutions(token);

      setInstitutions(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (error) {
      console.error(
        "Failed to load institutions:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load institutions",
      );
    } finally {
      setIsLoadingInstitutions(false);
    }
  }

  // ==========================================
  // INITIAL LOAD - INSTITUTIONS
  // ==========================================

  useEffect(() => {
    if (!accessToken) {
      setIsLoadingInstitutions(false);
      return;
    }

    void loadInstitutions(accessToken);

    /**
     * IMPORTANT:
     *
     * accessToken intentionally NOT included.
     *
     * SudoAuth may rotate the token in the
     * background.
     *
     * Token rotation must NOT cause:
     *
     * GET /sudo-admin/institutions
     *
     * again.
     *
     * The institution list remains in state.
     *
     * eslint-disable-next-line react-hooks/exhaustive-deps
     */
  }, []);

  // ==========================================
  // INITIAL TRANSACTION LOAD
  // ==========================================

  useEffect(() => {
    void fetchTransactions();

    /**
     * fetchTransactions has an empty dependency
     * array, so this runs once when the page
     * mounts.
     *
     * Token rotation does not trigger this.
     */
  }, [fetchTransactions]);

  // ==========================================
  // LOAD STUDENTS FOR SELECTED INSTITUTION
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadInstitutionCards =
      async () => {
        /**
         * No institution selected.
         *
         * Show all transactions.
         */

        if (!selectedInstitution) {
          setInstitutionCardUuids(
            new Set(),
          );

          setIsLoadingInstitutionMembers(
            false,
          );

          return;
        }

        try {
          setIsLoadingInstitutionMembers(
            true,
          );

          /**
           * GET
           *
           * /institutions/members
           * ?institution_id=xxxxx
           */

          const response =
            await getInstitutionMembers(
              selectedInstitution,
            );

          if (cancelled) {
            return;
          }

          const students =
            response.students ?? [];

          // ====================================
          // BUILD STUDENT IDENTIFIER SET
          // ====================================

          /**
           * We compare using BOTH:
           *
           * std_id
           * std_reg
           *
           * because RFID card data may contain
           * either one.
           */

          const studentIdentifiers =
            new Set<string>();

          for (const student of students) {
            if (
              student.std_id?.trim()
            ) {
              studentIdentifiers.add(
                student.std_id
                  .trim()
                  .toLowerCase(),
              );
            }

            if (
              student.std_reg?.trim()
            ) {
              studentIdentifiers.add(
                student.std_reg
                  .trim()
                  .toLowerCase(),
              );
            }
          }

          // ====================================
          // FIND RFID CARDS
          // ====================================

          const cardUuids =
            new Set<string>();

          for (const card of rfidCards) {
            const cardStdId =
              card.std_id
                ?.trim()
                .toLowerCase();

            const cardStdReg =
              card.std_reg
                ?.trim()
                .toLowerCase();

            const matchesStudent =
              Boolean(
                (
                  cardStdId &&
                  studentIdentifiers.has(
                    cardStdId,
                  )
                ) ||
                  (
                    cardStdReg &&
                    studentIdentifiers.has(
                      cardStdReg,
                    )
                  ),
              );

            if (
              matchesStudent &&
              card.card_uuid
            ) {
              cardUuids.add(
                card.card_uuid
                  .trim()
                  .toLowerCase(),
              );
            }
          }

          setInstitutionCardUuids(
            cardUuids,
          );
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            "Failed to load institution members:",
            error,
          );

          setInstitutionCardUuids(
            new Set(),
          );

          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load institution students",
          );
        } finally {
          if (!cancelled) {
            setIsLoadingInstitutionMembers(
              false,
            );
          }
        }
      };

    void loadInstitutionCards();

    return () => {
      cancelled = true;
    };
  }, [
    selectedInstitution,
    rfidCards,
  ]);

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh =
    async () => {
      if (isRefreshing) {
        return;
      }

      setIsRefreshing(true);

      await fetchTransactions();
    };

  // ==========================================
  // FILTER TRANSACTIONS
  // ==========================================

  const filteredTransactions =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {
          // ==================================
          // SEARCH FILTER
          // ==================================

          const matchesSearch =
            !query ||
            transaction.card_uuid
              ?.toLowerCase()
              .includes(query) ||
            transaction.session_id
              ?.toLowerCase()
              .includes(query) ||
            transaction.txn_type
              ?.toLowerCase()
              .includes(query) ||
            transaction.location
              ?.toLowerCase()
              .includes(query);

          // ==================================
          // TRANSACTION TYPE FILTER
          // ==================================

          const matchesType =
            transactionType ===
              "all" ||
            transaction.txn_type
              ?.toLowerCase() ===
              transactionType.toLowerCase();

          // ==================================
          // INSTITUTION FILTER
          // ==================================

          /**
           * No institution selected:
           * show everything.
           *
           * Institution selected:
           * transaction.card_uuid must exist
           * in institutionCardUuids.
           */

          const matchesInstitution =
            !selectedInstitution ||
            (
              transaction.card_uuid &&
              institutionCardUuids.has(
                transaction.card_uuid
                  .trim()
                  .toLowerCase(),
              )
            );

          return (
            matchesSearch &&
            matchesType &&
            matchesInstitution
          );
        },
      );
    }, [
      transactions,
      searchQuery,
      transactionType,
      selectedInstitution,
      institutionCardUuids,
    ]);

  // ==========================================
  // STATISTICS
  // ==========================================

  /**
   * These remain platform-wide.
   *
   * We are not changing the existing
   * dashboard statistics behavior.
   */

  const statistics =
    useMemo(() => {
      const totalTransactions =
        transactions.length;

      const totalCredit =
        transactions
          .filter((transaction) => {
            const type =
              transaction.txn_type
                ?.toLowerCase();

            return (
              type === "credit" ||
              type === "recharge"
            );
          })
          .reduce(
            (
              total,
              transaction,
            ) =>
              total +
              Number(
                transaction.amount || 0,
              ),
            0,
          );

      const totalDebit =
        transactions
          .filter((transaction) => {
            const type =
              transaction.txn_type
                ?.toLowerCase();

            return (
              type === "debit" ||
              type === "payment" ||
              type === "spend"
            );
          })
          .reduce(
            (
              total,
              transaction,
            ) =>
              total +
              Number(
                transaction.amount || 0,
              ),
            0,
          );

      return {
        totalTransactions,
        totalCredit,
        totalDebit,
      };
    }, [transactions]);

  // ==========================================
  // FORMAT CURRENCY
  // ==========================================

  const formatCurrency = (
    amount?: number | string,
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      },
    ).format(
      Number(amount || 0),
    );
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (
    date?: string,
  ) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime(),
      )
    ) {
      return date;
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(parsedDate);
  };

  // ==========================================
  // AMOUNT STYLE
  // ==========================================

  const getAmountStyle = (
    type?: string,
  ) => {
    const normalizedType =
      type?.toLowerCase();

    if (
      normalizedType === "credit" ||
      normalizedType === "recharge"
    ) {
      return "text-green-600";
    }

    if (
      normalizedType === "debit" ||
      normalizedType === "payment" ||
      normalizedType === "spend"
    ) {
      return "text-red-600";
    }

    return "text-gray-900";
  };

  // ==========================================
  // AMOUNT PREFIX
  // ==========================================

  const getAmountPrefix = (
    type?: string,
  ) => {
    const normalizedType =
      type?.toLowerCase();

    if (
      normalizedType === "credit" ||
      normalizedType === "recharge"
    ) {
      return "+";
    }

    if (
      normalizedType === "debit" ||
      normalizedType === "payment" ||
      normalizedType === "spend"
    ) {
      return "-";
    }

    return "";
  };

  // ==========================================
  // SELECTED INSTITUTION NAME
  // ==========================================

  const selectedInstitutionName =
    institutions.find(
      (institution) =>
        institution.id ===
        selectedInstitution,
    )?.name;

  // ==========================================
  // INITIAL LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-purple" />

          <p className="text-sm font-medium text-gray-500">
            Loading transactions...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-5">

      {/* ====================================== */}
      {/* PAGE HEADER */}
      {/* ====================================== */}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transactions
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor all RFID card transactions
            across the platform.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isRefreshing
                ? "animate-spin"
                : ""
            }`}
          />

          {isRefreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* ====================================== */}
      {/* STATISTICS */}
      {/* ====================================== */}

      <div className="grid gap-4 md:grid-cols-3">

        {/* TOTAL */}

        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Transactions
            </p>

            <h3 className="mt-2 text-2xl font-bold text-gray-900">
              {statistics.totalTransactions}
            </h3>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
            <ReceiptText className="h-5 w-5" />
          </div>
        </div>

        {/* CREDIT */}

        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Credit
            </p>

            <h3 className="mt-2 text-2xl font-bold text-green-600">
              {formatCurrency(
                statistics.totalCredit,
              )}
            </h3>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </div>

        {/* DEBIT */}

        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Debit
            </p>

            <h3 className="mt-2 text-2xl font-bold text-red-600">
              {formatCurrency(
                statistics.totalDebit,
              )}
            </h3>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* ERROR */}
      {/* ====================================== */}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-full px-3 py-1 text-sm font-semibold text-red-600 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ====================================== */}
      {/* FILTERS */}
      {/* ====================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

          {/* SEARCH */}

          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value,
                )
              }
              placeholder="Search card, session or transaction..."
              className="w-full rounded-full border border-gray-200 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
            />
          </div>

          {/* DROPDOWNS */}

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">

            {/* ================================= */}
            {/* INSTITUTION FILTER */}
            {/* ================================= */}

            <div className="relative flex-1 sm:min-w-[230px]">
              <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <select
                value={
                  selectedInstitution
                }
                onChange={(event) => {
                  setSelectedInstitution(
                    event.target.value,
                  );
                }}
                disabled={
                  isLoadingInstitutions ||
                  isLoadingInstitutionMembers
                }
                className="w-full appearance-none rounded-full border border-gray-200 bg-white py-2.5 pl-11 pr-10 text-sm font-medium outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {isLoadingInstitutions
                    ? "Loading institutions..."
                    : "All Institutions"}
                </option>

                {institutions.map(
                  (institution) => (
                    <option
                      key={institution.id}
                      value={institution.id}
                    >
                      {institution.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* ================================= */}
            {/* TRANSACTION TYPE */}
            {/* ================================= */}

            <select
              value={transactionType}
              onChange={(event) =>
                setTransactionType(
                  event.target.value,
                )
              }
              className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
            >
              <option value="all">
                All Transactions
              </option>

              <option value="spend">
                Spend
              </option>

              <option value="credit">
                Credit
              </option>

              <option value="debit">
                Debit
              </option>

              <option value="recharge">
                Recharge
              </option>

              <option value="payment">
                Payment
              </option>
            </select>
          </div>
        </div>

        {/* SELECTED INSTITUTION INFO */}

        {selectedInstitution && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Building2 className="h-3.5 w-3.5 text-brand-purple" />

            <span>
              Showing transactions for{" "}
              <span className="font-semibold text-gray-700">
                {selectedInstitutionName ??
                  "selected institution"}
              </span>
            </span>

            {isLoadingInstitutionMembers && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-purple" />
            )}
          </div>
        )}
      </div>

      {/* ====================================== */}
      {/* TRANSACTION TABLE */}
      {/* ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* TABLE HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Transaction History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredTransactions.length}{" "}
              transaction
              {filteredTransactions.length !==
              1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <Wallet className="h-5 w-5 text-gray-400" />
        </div>

        {/* ==================================== */}
        {/* DESKTOP TABLE */}
        {/* ==================================== */}

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Transaction
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  RFID Card
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Type
                </th>

                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Amount
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Balance After
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Location
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <ReceiptText className="h-10 w-10 text-gray-300" />

                      <h3 className="mt-4 text-base font-semibold text-gray-700">
                        No transactions found
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {selectedInstitution
                          ? "No RFID transactions belong to this institution."
                          : "Transactions will appear here once RFID activity occurs."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(
                  (
                    transaction,
                    index,
                  ) => {
                    const transactionKey =
                      transaction.session_id ||
                      `${transaction.card_uuid}-${transaction.created_at}-${index}`;

                    return (
                      <tr
                        key={transactionKey}
                        className="transition hover:bg-gray-50"
                      >
                        {/* TRANSACTION */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <TransactionIcon
                              type={
                                transaction.txn_type
                              }
                            />

                            <p className="font-semibold text-gray-900">
                              {getTransactionTypeLabel(
                                transaction.txn_type,
                              )}
                            </p>
                          </div>
                        </td>

                        {/* RFID CARD */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />

                            <span className="font-medium text-gray-700">
                              {transaction.card_uuid ||
                                "-"}
                            </span>
                          </div>
                        </td>

                        {/* TYPE */}

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getTransactionTypeStyle(
                              transaction.txn_type,
                            )}`}
                          >
                            {getTransactionTypeLabel(
                              transaction.txn_type,
                            )}
                          </span>
                        </td>

                        {/* AMOUNT */}

                        <td className="px-6 py-4 text-right">
                          <span
                            className={`font-bold ${getAmountStyle(
                              transaction.txn_type,
                            )}`}
                          >
                            {getAmountPrefix(
                              transaction.txn_type,
                            )}

                            {formatCurrency(
                              transaction.amount,
                            )}
                          </span>
                        </td>

                        {/* BALANCE */}

                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-700">
                            {formatCurrency(
                              transaction.wallet_bal_after,
                            )}
                          </span>
                        </td>

                        {/* LOCATION */}

                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {transaction.location ||
                              "-"}
                          </span>
                        </td>

                        {/* DATE */}

                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {formatDate(
                              transaction.created_at,
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>

        {/* ==================================== */}
        {/* MOBILE CARDS */}
        {/* ==================================== */}

        <div className="divide-y divide-gray-100 lg:hidden">
          {filteredTransactions.length ===
          0 ? (
            <div className="px-6 py-16 text-center">
              <ReceiptText className="mx-auto h-10 w-10 text-gray-300" />

              <h3 className="mt-4 text-base font-semibold text-gray-700">
                No transactions found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {selectedInstitution
                  ? "No RFID transactions belong to this institution."
                  : "Transactions will appear here once RFID activity occurs."}
              </p>
            </div>
          ) : (
            filteredTransactions.map(
              (
                transaction,
                index,
              ) => {
                const transactionKey =
                  transaction.session_id ||
                  `${transaction.card_uuid}-${transaction.created_at}-${index}`;

                return (
                  <div
                    key={transactionKey}
                    className="space-y-3 p-4"
                  >
                    {/* TOP */}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <TransactionIcon
                          type={
                            transaction.txn_type
                          }
                        />

                        <div>
                          <p className="font-semibold text-gray-900">
                            {getTransactionTypeLabel(
                              transaction.txn_type,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(
                              transaction.created_at,
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`font-bold ${getAmountStyle(
                          transaction.txn_type,
                        )}`}
                      >
                        {getAmountPrefix(
                          transaction.txn_type,
                        )}

                        {formatCurrency(
                          transaction.amount,
                        )}
                      </span>
                    </div>

                    {/* DETAILS */}

                    <div className="grid grid-cols-2 gap-3 text-sm">

                      {/* RFID CARD */}

                      <div>
                        <p className="text-xs text-gray-400">
                          RFID Card
                        </p>

                        <p className="mt-1 font-medium text-gray-700">
                          {transaction.card_uuid ||
                            "-"}
                        </p>
                      </div>

                      {/* SESSION */}

                      <div>
                        <p className="text-xs text-gray-400">
                          Session ID
                        </p>

                        <p className="mt-1 truncate font-medium text-gray-700">
                          {transaction.session_id ||
                            "-"}
                        </p>
                      </div>

                      {/* BALANCE */}

                      <div>
                        <p className="text-xs text-gray-400">
                          Balance After
                        </p>

                        <p className="mt-1 font-medium text-gray-700">
                          {formatCurrency(
                            transaction.wallet_bal_after,
                          )}
                        </p>
                      </div>

                      {/* LOCATION */}

                      <div>
                        <p className="text-xs text-gray-400">
                          Location
                        </p>

                        <p className="mt-1 font-medium text-gray-700">
                          {transaction.location ||
                            "-"}
                        </p>
                      </div>
                    </div>

                    {/* TYPE BADGE */}

                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getTransactionTypeStyle(
                        transaction.txn_type,
                      )}`}
                    >
                      {getTransactionTypeLabel(
                        transaction.txn_type,
                      )}
                    </span>
                  </div>
                );
              },
            )
          )}
        </div>
      </div>
    </div>
  );
}