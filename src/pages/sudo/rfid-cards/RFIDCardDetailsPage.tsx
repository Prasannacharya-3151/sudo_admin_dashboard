import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Loader2,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Ban,
  Cpu,
  Calendar,
  ReceiptText,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { toast } from "sonner";

import {
  deleteRFIDCard,
  getRFIDCardById,
  getRFIDCardHistory,
  updateRFIDCardStatus,
} from "../../../api/machineApi";

import type {
  RFIDCardDetails,
  RFIDCardStatus,
  RFIDTransaction,
} from "../../../types/machine";

// ==========================================
// COMPONENT
// ==========================================

export default function RFIDCardDetailsPage() {
  const navigate = useNavigate();

  const { cardUuid } = useParams<{
    cardUuid: string;
  }>();

  // ==========================================
  // STATE
  // ==========================================

  const [card, setCard] =
    useState<RFIDCardDetails | null>(
      null,
    );

  const [transactions, setTransactions] =
    useState<RFIDTransaction[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [isUpdatingStatus, setIsUpdatingStatus] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  // ==========================================
  // LOAD CARD
  // ==========================================

  const loadCard = async (
    showRefreshLoader = false,
  ) => {
    if (!cardUuid) {
      toast.error("Card UUID is missing");

      navigate("/sudo/rfid-cards");

      return;
    }

    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const decodedCardUuid =
        decodeURIComponent(cardUuid);

      // Load card and history together

      const [
        cardData,
        historyData,
      ] = await Promise.all([
        getRFIDCardById(
          decodedCardUuid,
        ),
        getRFIDCardHistory(
          decodedCardUuid,
        ),
      ]);

      setCard(cardData);

      // Prefer separate history endpoint.
      // If backend does not return history,
      // use transactions from card details.

      if (
        Array.isArray(historyData)
      ) {
        setTransactions(historyData);
      } else if (
        cardData.transactions
      ) {
        setTransactions(
          cardData.transactions,
        );
      }
    } catch (error) {
      console.error(
        "Failed to load RFID card:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load RFID card";

      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    void loadCard();
  }, [cardUuid]);

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const handleStatusChange = async (
    status: RFIDCardStatus,
  ) => {
    if (!cardUuid) {
      return;
    }

    try {
      setIsUpdatingStatus(true);

      const decodedCardUuid =
        decodeURIComponent(cardUuid);

      const updatedCard =
        await updateRFIDCardStatus(
          decodedCardUuid,
          {
            status,
          },
        );

      setCard(updatedCard);

      toast.success(
        `Card status updated to ${status}`,
      );

      await loadCard();
    } catch (error) {
      console.error(
        "Failed to update card status:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to update card status";

      toast.error(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ==========================================
  // DELETE CARD
  // ==========================================

  const handleDelete = async () => {
    if (!cardUuid || !card) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete RFID card "${card.card_uuid}"? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);

      await deleteRFIDCard(
        decodeURIComponent(cardUuid),
      );

      toast.success(
        "RFID card deleted successfully",
      );

      navigate("/sudo/rfid-cards", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Failed to delete RFID card:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete RFID card";

      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusStyle = (
    status?: string,
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "active":
        return {
          badge:
            "bg-green-50 text-green-600 border-green-100",
          icon: ShieldCheck,
        };

      case "blocked":
        return {
          badge:
            "bg-red-50 text-red-600 border-red-100",
          icon: Ban,
        };

      case "inactive":
        return {
          badge:
            "bg-gray-100 text-gray-600 border-gray-200",
          icon: ShieldOff,
        };

      default:
        return {
          badge:
            "bg-yellow-50 text-yellow-600 border-yellow-100",
          icon: CreditCard,
        };
    }
  };

  // ==========================================
  // TRANSACTION TYPE
  // ==========================================

  const getTransactionIcon = (
    type?: string,
  ) => {
    switch (
      type?.toLowerCase()
    ) {
      case "credit":
      case "recharge":
        return ArrowDownLeft;

      case "debit":
      case "payment":
        return ArrowUpRight;

      default:
        return ReceiptText;
    }
  };

  // ==========================================
  // TRANSACTION STYLE
  // ==========================================

  const getTransactionStyle = (
    type?: string,
  ) => {
    switch (
      type?.toLowerCase()
    ) {
      case "credit":
      case "recharge":
        return {
          icon: "bg-green-50 text-green-600",
          amount: "text-green-600",
          prefix: "+",
        };

      case "debit":
      case "payment":
        return {
          icon: "bg-red-50 text-red-600",
          amount: "text-red-600",
          prefix: "-",
        };

      default:
        return {
          icon: "bg-gray-100 text-gray-600",
          amount: "text-gray-700",
          prefix: "",
        };
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-purple" />

          <p className="text-sm font-medium text-gray-500">
            Loading RFID card details...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // NOT FOUND
  // ==========================================

  if (!card) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <CreditCard className="h-9 w-9 text-red-500" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            RFID Card not found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            The requested RFID card could
            not be found.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/sudo/rfid-cards")
          }
          className="rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Back to RFID Cards
        </button>
      </div>
    );
  }

  // ==========================================
  // STATUS CONFIG
  // ==========================================

  const statusConfig =
    getStatusStyle(card.status);

  const StatusIcon =
    statusConfig.icon;

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="mb-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/sudo/rfid-cards",
                )
              }
              className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-brand-purple"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to RFID Cards
            </button>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-purple/10">
                <CreditCard className="h-6 w-6 text-brand-purple" />
              </div>

              <div>
                <h1 className="font-mono text-xl font-bold text-gray-900 sm:text-2xl">
                  {card.card_uuid}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  RFID Card Details & Management
                </p>
              </div>
            </div>
          </div>

          {/* REFRESH */}

          <button
            type="button"
            onClick={() =>
              void loadCard(true)
            }
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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
      </div>

      {/* ======================================
          TOP CARDS
      ====================================== */}

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* ====================================
            BALANCE CARD
        ==================================== */}

        <div className="rounded-2xl bg-brand-purple p-6 text-white shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-white/70">
                Current Balance
              </p>

              <div className="mt-3 flex items-center gap-1">
                <span className="text-3xl font-bold">
                  ₹
                  {Number(
                    card.balance || 0,
                  ).toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}
                </span>
              </div>
            </div>

            <Wallet className="h-9 w-9 text-white/50" />
          </div>
        </div>

        {/* ====================================
            STATUS CARD
        ==================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Card Status
              </p>

              <span
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold capitalize ${statusConfig.badge}`}
              >
                <StatusIcon className="h-4 w-4" />

                {card.status ||
                  "Unknown"}
              </span>
            </div>

            <ShieldCheck className="h-8 w-8 text-gray-200" />
          </div>
        </div>

        {/* ====================================
            TRANSACTION COUNT
        ==================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Transactions
              </p>

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {transactions.length}
              </p>
            </div>

            <ReceiptText className="h-8 w-8 text-gray-200" />
          </div>
        </div>
      </div>

      {/* ======================================
          MAIN GRID
      ====================================== */}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.8fr]">
        {/* ====================================
            LEFT COLUMN
        ==================================== */}

        <div className="space-y-6">
          {/* ==================================
              CARD INFORMATION
          ================================== */}

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10">
                <CreditCard className="h-5 w-5 text-brand-purple" />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  Card Information
                </h2>

                <p className="text-xs text-gray-500">
                  RFID card details
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* UUID */}

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Card UUID
                </p>

                <p className="break-all font-mono text-sm font-semibold text-gray-900">
                  {card.card_uuid}
                </p>
              </div>

              {/* MACHINE */}

              <div className="flex items-start gap-3">
                <Cpu className="mt-0.5 h-4 w-4 text-gray-400" />

                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Machine ID
                  </p>

                  <p className="break-all font-mono text-sm font-medium text-gray-700">
                    {card.machine_id ||
                      "Not assigned"}
                  </p>
                </div>
              </div>

              {/* CREATED */}

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-gray-400" />

                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Created At
                  </p>

                  <p className="text-sm font-medium text-gray-700">
                    {card.created_at
                      ? new Date(
                          card.created_at,
                        ).toLocaleString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "Not available"}
                  </p>
                </div>
              </div>

              {/* UPDATED */}

              <div className="flex items-start gap-3">
                <RefreshCw className="mt-0.5 h-4 w-4 text-gray-400" />

                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Last Updated
                  </p>

                  <p className="text-sm font-medium text-gray-700">
                    {card.updated_at
                      ? new Date(
                          card.updated_at,
                        ).toLocaleString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================
              STATUS MANAGEMENT
          ================================== */}

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-gray-900">
              Card Management
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Change RFID card access status.
            </p>

            <div className="mt-5 grid gap-3">
              {/* ACTIVATE */}

              <button
                type="button"
                disabled={
                  isUpdatingStatus ||
                  card.status === "active"
                }
                onClick={() =>
                  void handleStatusChange(
                    "active",
                  )
                }
                className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />

                  Activate Card
                </span>

                {isUpdatingStatus &&
                  card.status !==
                    "active" && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
              </button>

              {/* INACTIVE */}

              <button
                type="button"
                disabled={
                  isUpdatingStatus ||
                  card.status === "inactive"
                }
                onClick={() =>
                  void handleStatusChange(
                    "inactive",
                  )
                }
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <ShieldOff className="h-4 w-4" />

                  Deactivate Card
                </span>
              </button>

              {/* BLOCK */}

              <button
                type="button"
                disabled={
                  isUpdatingStatus ||
                  card.status === "blocked"
                }
                onClick={() =>
                  void handleStatusChange(
                    "blocked",
                  )
                }
                className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Ban className="h-4 w-4" />

                  Block Card
                </span>
              </button>
            </div>
          </div>

          {/* ==================================
              DANGER ZONE
          ================================== */}

          <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
            <h2 className="font-bold text-red-700">
              Danger Zone
            </h2>

            <p className="mt-1 text-sm text-red-600/80">
              Permanently remove this RFID card
              from the system.
            </p>

            <button
              type="button"
              disabled={isDeleting}
              onClick={() =>
                void handleDelete()
              }
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />

                  Delete RFID Card
                </>
              )}
            </button>
          </div>
        </div>

        {/* ====================================
            TRANSACTION HISTORY
        ==================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10">
                  <ReceiptText className="h-5 w-5 text-brand-purple" />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900">
                    Transaction History
                  </h2>

                  <p className="text-xs text-gray-500">
                    Recent card activity
                  </p>
                </div>
              </div>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {transactions.length} Total
            </span>
          </div>

          {/* EMPTY */}

          {transactions.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <ReceiptText className="h-7 w-7 text-gray-400" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                No transactions yet
              </h3>

              <p className="mt-2 text-center text-sm text-gray-500">
                Transaction history will appear
                here when this card is used.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map(
                (
                  transaction,
                  index,
                ) => {
                  const TransactionIcon =
                    getTransactionIcon(
                      transaction.transaction_type,
                    );

                  const transactionStyle =
                    getTransactionStyle(
                      transaction.transaction_type,
                    );

                  return (
                    <div
                      key={
                        transaction.id ||
                        `${transaction.created_at}-${index}`
                      }
                      className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-gray-50/70"
                    >
                      {/* LEFT */}

                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${transactionStyle.icon}`}
                        >
                          <TransactionIcon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="capitalize font-semibold text-gray-900">
                            {transaction.transaction_type ||
                              "Transaction"}
                          </p>

                          <p className="mt-1 truncate text-sm text-gray-500">
                            {transaction.description ||
                              "RFID card transaction"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {transaction.created_at
                              ? new Date(
                                  transaction.created_at,
                                ).toLocaleString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "Date unavailable"}
                          </p>
                        </div>
                      </div>

                      {/* AMOUNT */}

                      <div className="shrink-0 text-right">
                        <p
                          className={`font-bold ${transactionStyle.amount}`}
                        >
                          {
                            transactionStyle.prefix
                          }
                          ₹
                          {Number(
                            transaction.amount ||
                              0,
                          ).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </p>

                        {transaction.machine_id && (
                          <p className="mt-1 font-mono text-xs text-gray-400">
                            {transaction.machine_id}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}