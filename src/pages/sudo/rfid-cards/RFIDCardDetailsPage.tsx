import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  CreditCard,
  Trash2,
  Wallet,
  RefreshCw,
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
  RFIDTransaction,
} from "../../../types/machine";

export default function RFIDCardDetailsPage() {
  const navigate = useNavigate();

  const { cardUuid } = useParams<{
    cardUuid: string;
  }>();

  const [card, setCard] =
    useState<RFIDCardDetails | null>(
      null,
    );

  const [transactions, setTransactions] =
    useState<RFIDTransaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function loadCard() {
    if (!cardUuid) return;

    try {
      setLoading(true);
      setError(null);

      const [
        cardData,
        historyData,
      ] = await Promise.all([
        getRFIDCardById(cardUuid),
        getRFIDCardHistory(cardUuid),
      ]);

      setCard(cardData);
      setTransactions(historyData);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load RFID card";

      setError(message);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCard();
  }, [cardUuid]);

  function formatCurrency(
    value: string | number | undefined,
  ) {
    return `₹${Number(value ?? 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}`;
  }

  function formatDate(
    value?: string,
  ) {
    if (!value) return "—";

    return new Date(value).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  }

  function normalizeStatus(
    value?: string,
  ) {
    return String(value ?? "")
      .trim()
      .toLowerCase();
  }

  function statusClass(
    status?: string,
  ) {
    switch (normalizeStatus(status)) {
      case "active":
        return "bg-emerald-50 text-emerald-700";

      case "blocked":
        return "bg-red-50 text-red-700";

      case "inactive":
        return "bg-gray-100 text-gray-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  function transactionAmount(
    transaction: RFIDTransaction,
  ) {
    const amount =
      Number(transaction.amount ?? 0);

    const type =
      String(transaction.txn_type)
        .toLowerCase();

    const isPositive =
      type === "recharge" ||
      type === "credit";

    return {
      value: amount,
      positive: isPositive,
    };
  }

  async function handleStatusChange(
    status:
      | "active"
      | "inactive"
      | "blocked",
  ) {
    if (!cardUuid) return;

    try {
      setUpdatingStatus(true);

      await updateRFIDCardStatus(
        cardUuid,
        {
          status,
        },
      );

      toast.success(
        `Card ${status} successfully`,
      );

      await loadCard();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update card status",
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    if (!cardUuid) return;

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this RFID card?",
      );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await deleteRFIDCard(cardUuid);

      toast.success(
        "RFID card deleted successfully",
      );

      navigate("/sudo/rfid-cards");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to delete RFID card",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <RefreshCw
            size={18}
            className="animate-spin"
          />

          Loading RFID card...
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-500">
          {error ||
            "RFID card not found"}
        </p>

        <button
          onClick={() =>
            navigate(
              "/sudo/rfid-cards",
            )
          }
          className="rounded-full bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          Back to RFID Cards
        </button>
      </div>
    );
  }

  const currentStatus =
    normalizeStatus(
      card.wallet_status ??
        card.status,
    );

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() =>
              navigate(
                "/sudo/rfid-cards",
              )
            }
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              RFID Card Details
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {card.card_uuid}
            </p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={16} />

          {deleting
            ? "Deleting..."
            : "Delete Card"}
        </button>
      </div>

      {/* TOP CARDS */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* WALLET */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Wallet Balance
              </p>

              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {formatCurrency(
                  card.wallet_bal ??
                    card.balance,
                )}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Wallet size={21} />
            </div>
          </div>
        </div>

        {/* CARD */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Card UUID
              </p>

              <p className="mt-2 break-all font-mono text-lg font-semibold text-gray-900">
                {card.card_uuid}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CreditCard size={21} />
            </div>
          </div>
        </div>

        {/* STATUS */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Card Status
              </p>

              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${statusClass(
                  card.wallet_status ??
                    card.status,
                )}`}
              >
                {card.wallet_status ??
                  card.status ??
                  "Unknown"}
              </span>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2
                size={21}
              />
            </div>
          </div>
        </div>
      </div>

      {/* STUDENT INFORMATION */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">
              Student Information
            </h2>

            <p className="text-sm text-gray-500">
              Student details linked with this RFID card.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Student Name
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {card.std_name || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Register Number
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {card.std_reg || "—"}
            </p>
          </div>


          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Combination
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {card.combination || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Created At
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatDate(
                card.created_at,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Updated At
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatDate(
                card.updated_at,
              )}
            </p>
          </div>
        </div>
      </div>

      {/* STATUS MANAGEMENT */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900">
            Card Status Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Change the current state of this RFID card.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            disabled={
              updatingStatus ||
              currentStatus ===
                "active"
            }
            onClick={() =>
              void handleStatusChange(
                "active",
              )
            }
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            Activate
          </button>

          <button
            disabled={
              updatingStatus ||
              currentStatus ===
                "inactive"
            }
            onClick={() =>
              void handleStatusChange(
                "inactive",
              )
            }
            className="inline-flex items-center gap-2 rounded-full bg-gray-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Inactivate
          </button>

          <button
            disabled={
              updatingStatus ||
              currentStatus ===
                "blocked"
            }
            onClick={() =>
              void handleStatusChange(
                "blocked",
              )
            }
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Ban size={16} />
            Block
          </button>
        </div>
      </div>

      {/* TRANSACTION HISTORY */}

      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900">
            Transaction History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Wallet transactions associated with this card.
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <p className="text-sm text-gray-500">
              No transactions found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Transaction
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Balance After
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Location
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {transactions.map(
                  (
                    transaction,
                    index,
                  ) => {
                    const amount =
                      transactionAmount(
                        transaction,
                      );

                    return (
                      <tr
                        key={`${transaction.session_id}-${index}`}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium capitalize text-gray-700">
                            {
                              transaction.txn_type
                            }
                          </span>
                        </td>


                        <td
                          className={`px-6 py-4 text-sm font-semibold ${
                            amount.positive
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {amount.positive
                            ? "+"
                            : "-"}
                          {formatCurrency(
                            amount.value,
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(
                            transaction.wallet_bal_after,
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {transaction.location ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(
                            transaction.created_at,
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}