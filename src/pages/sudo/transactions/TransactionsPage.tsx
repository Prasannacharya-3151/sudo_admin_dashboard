import {
  ArrowDownLeft,
  ArrowUpRight,
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

import { getRFIDHistory } from "../../../api/machineApi";

import type {
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
    .replace(/_/g, " ")
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
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
        <ArrowDownLeft className="h-5 w-5" />
      </div>
    );
  }

  if (
    normalizedType === "debit" ||
    normalizedType === "payment"
  ) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <ArrowUpRight className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
      <ReceiptText className="h-5 w-5" />
    </div>
  );
};

// ==========================================
// COMPONENT
// ==========================================

export default function TransactionsPage() {
  // ==========================================
  // STATE
  // ==========================================

  const [transactions, setTransactions] =
    useState<RFIDTransaction[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [transactionType, setTransactionType] =
    useState("all");

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  // ==========================================
  // FETCH TRANSACTIONS
  // ==========================================

  const fetchTransactions =
    useCallback(async () => {
      try {
        setError(null);

        const data =
          await getRFIDHistory();

        setTransactions(
          Array.isArray(data)
            ? data
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
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    await fetchTransactions();
  };

  // ==========================================
  // FILTERED TRANSACTIONS
  // ==========================================

  const filteredTransactions =
    useMemo(() => {
      return transactions.filter(
        (transaction) => {
          const query =
            searchQuery.toLowerCase();

          const matchesSearch =
            !searchQuery ||
            transaction.card_uuid
              ?.toLowerCase()
              .includes(query) ||
            transaction.machine_id
              ?.toLowerCase()
              .includes(query) ||
            transaction.description
              ?.toLowerCase()
              .includes(query) ||
            transaction.transaction_type
              ?.toLowerCase()
              .includes(query) ||
            transaction.id
              ?.toLowerCase()
              .includes(query);

          const matchesType =
            transactionType === "all" ||
            transaction.transaction_type
              ?.toLowerCase() ===
              transactionType.toLowerCase();

          return (
            matchesSearch &&
            matchesType
          );
        },
      );
    }, [
      transactions,
      searchQuery,
      transactionType,
    ]);

  // ==========================================
  // STATISTICS
  // ==========================================

  const statistics = useMemo(() => {
    const totalTransactions =
      transactions.length;

    const totalCredit =
      transactions
        .filter((transaction) => {
          const type =
            transaction.transaction_type?.toLowerCase();

          return (
            type === "credit" ||
            type === "recharge"
          );
        })
        .reduce(
          (total, transaction) =>
            total +
            Number(transaction.amount || 0),
          0,
        );

    const totalDebit =
      transactions
        .filter((transaction) => {
          const type =
            transaction.transaction_type?.toLowerCase();

          return (
            type === "debit" ||
            type === "payment"
          );
        })
        .reduce(
          (total, transaction) =>
            total +
            Number(transaction.amount || 0),
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
    amount?: number,
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      },
    ).format(Number(amount || 0));
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (
    date?: string,
  ) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
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
  // GET AMOUNT STYLE
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
      normalizedType === "payment"
    ) {
      return "text-red-600";
    }

    return "text-gray-900";
  };

  // ==========================================
  // GET AMOUNT PREFIX
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
      normalizedType === "payment"
    ) {
      return "-";
    }

    return "";
  };

  // ==========================================
  // LOADING
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
  // COMPONENT UI
  // ==========================================

  return (
    <div className="space-y-6">

      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* ======================================
          STATISTICS
      ====================================== */}

      <div className="grid gap-5 md:grid-cols-3">

        {/* TOTAL TRANSACTIONS */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Transactions
              </p>

              <h3 className="mt-2 text-3xl font-bold text-gray-900">
                {statistics.totalTransactions}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
              <ReceiptText className="h-6 w-6" />
            </div>

          </div>

        </div>

        {/* TOTAL CREDIT */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

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

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <ArrowDownLeft className="h-6 w-6" />
            </div>

          </div>

        </div>

        {/* TOTAL DEBIT */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

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

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <ArrowUpRight className="h-6 w-6" />
            </div>

          </div>

        </div>

      </div>

      {/* ======================================
          ERROR STATE
      ====================================== */}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4">

          <p className="text-sm font-medium text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            className="text-sm font-semibold text-red-600 underline"
          >
            Try Again
          </button>

        </div>
      )}

      {/* ======================================
          FILTER SECTION
      ====================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* SEARCH */}

          <div className="relative w-full lg:max-w-md">

            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value,
                )
              }
              placeholder="Search card, machine or transaction..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
            />

          </div>

          {/* TYPE FILTER */}

          <select
            value={transactionType}
            onChange={(event) =>
              setTransactionType(
                event.target.value,
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
          >
            <option value="all">
              All Transactions
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

      {/* ======================================
          TRANSACTIONS TABLE
      ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* TABLE HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Transaction History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredTransactions.length}{" "}
              transaction
              {filteredTransactions.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <Wallet className="h-6 w-6 text-gray-400" />

        </div>

        {/* DESKTOP TABLE */}

        <div className="hidden overflow-x-auto lg:block">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Transaction
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  RFID Card
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Machine
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Type
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Amount
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {filteredTransactions.length === 0 ? (

                <tr>

                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center"
                  >

                    <div className="flex flex-col items-center">

                      <ReceiptText className="h-10 w-10 text-gray-300" />

                      <h3 className="mt-4 text-base font-semibold text-gray-700">
                        No transactions found
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Transactions will appear here
                        once RFID activity occurs.
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
                      transaction.id ||
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
                                transaction.transaction_type
                              }
                            />

                            <div>

                              <p className="font-semibold text-gray-900">
                                {transaction.description ||
                                  "RFID Transaction"}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                ID:{" "}
                                {transaction.id ||
                                  "-"}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* CARD */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2">

                            <CreditCard className="h-4 w-4 text-gray-400" />

                            <span className="font-medium text-gray-700">
                              {transaction.card_uuid ||
                                "-"}
                            </span>

                          </div>

                        </td>

                        {/* MACHINE */}

                        <td className="px-6 py-4">

                          <span className="font-medium text-gray-700">
                            {transaction.machine_id ||
                              "-"}
                          </span>

                        </td>

                        {/* TYPE */}

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getTransactionTypeStyle(
                              transaction.transaction_type,
                            )}`}
                          >
                            {getTransactionTypeLabel(
                              transaction.transaction_type,
                            )}
                          </span>

                        </td>

                        {/* AMOUNT */}

                        <td className="px-6 py-4 text-right">

                          <span
                            className={`font-bold ${getAmountStyle(
                              transaction.transaction_type,
                            )}`}
                          >
                            {getAmountPrefix(
                              transaction.transaction_type,
                            )}
                            {formatCurrency(
                              transaction.amount,
                            )}
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

        {/* ====================================
            MOBILE TRANSACTION CARDS
        ==================================== */}

        <div className="divide-y divide-gray-100 lg:hidden">

          {filteredTransactions.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <ReceiptText className="mx-auto h-10 w-10 text-gray-300" />

              <h3 className="mt-4 text-base font-semibold text-gray-700">
                No transactions found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Transactions will appear here once
                RFID activity occurs.
              </p>

            </div>

          ) : (

            filteredTransactions.map(
              (
                transaction,
                index,
              ) => {

                const transactionKey =
                  transaction.id ||
                  `${transaction.card_uuid}-${transaction.created_at}-${index}`;

                return (

                  <div
                    key={transactionKey}
                    className="space-y-4 p-5"
                  >

                    {/* TOP */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex items-center gap-3">

                        <TransactionIcon
                          type={
                            transaction.transaction_type
                          }
                        />

                        <div>

                          <p className="font-semibold text-gray-900">
                            {transaction.description ||
                              "RFID Transaction"}
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
                          transaction.transaction_type,
                        )}`}
                      >
                        {getAmountPrefix(
                          transaction.transaction_type,
                        )}
                        {formatCurrency(
                          transaction.amount,
                        )}
                      </span>

                    </div>

                    {/* DETAILS */}

                    <div className="grid grid-cols-2 gap-3 text-sm">

                      <div>

                        <p className="text-xs text-gray-400">
                          RFID Card
                        </p>

                        <p className="mt-1 font-medium text-gray-700">
                          {transaction.card_uuid ||
                            "-"}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs text-gray-400">
                          Machine
                        </p>

                        <p className="mt-1 font-medium text-gray-700">
                          {transaction.machine_id ||
                            "-"}
                        </p>

                      </div>

                    </div>

                    {/* TYPE */}

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getTransactionTypeStyle(
                        transaction.transaction_type,
                      )}`}
                    >
                      {getTransactionTypeLabel(
                        transaction.transaction_type,
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