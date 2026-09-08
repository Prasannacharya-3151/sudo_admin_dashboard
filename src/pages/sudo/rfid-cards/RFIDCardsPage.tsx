import {
  CreditCard,
  Search,
  Eye,
  Loader2,
  RefreshCw,
  Wallet,
  CircleDot,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import {
  getRFIDCards,
} from "../../../api/machineApi";

import type {
  RFIDCard,
} from "../../../types/machine";

// ==========================================
// COMPONENT
// ==========================================

export default function RFIDCardsPage() {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [cards, setCards] =
    useState<RFIDCard[]>([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  // ==========================================
  // LOAD RFID CARDS
  // ==========================================

  const loadCards = async (
    showRefreshLoader = false,
  ) => {
    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data =
        await getRFIDCards();

      setCards(data);
    } catch (error) {
      console.error(
        "Failed to load RFID cards:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load RFID cards";

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
    void loadCards();
  }, []);

  // ==========================================
  // FILTERED CARDS
  // ==========================================

  const filteredCards = useMemo(() => {
    const query =
      searchQuery.toLowerCase().trim();

    if (!query) {
      return cards;
    }

    return cards.filter((card) => {
      return (
        card.card_uuid
          ?.toLowerCase()
          .includes(query) ||
        card.machine_id
          ?.toLowerCase()
          .includes(query) ||
        card.status
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [cards, searchQuery]);

  // ==========================================
  // STATUS BADGE
  // ==========================================

  const getStatusStyle = (
    status?: string,
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "active":
        return "bg-green-50 text-green-600 border-green-100";

      case "blocked":
        return "bg-red-50 text-red-600 border-red-100";

      case "inactive":
        return "bg-gray-100 text-gray-600 border-gray-200";

      default:
        return "bg-yellow-50 text-yellow-600 border-yellow-100";
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
            Loading RFID cards...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="w-full">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple/10">
              <CreditCard className="h-5 w-5 text-brand-purple" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                RFID Cards
              </h1>

              <p className="text-sm text-gray-500">
                Manage RFID cards and monitor balances.
              </p>
            </div>
          </div>
        </div>

        {/* REFRESH */}

        <button
          type="button"
          onClick={() =>
            void loadCards(true)
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

      {/* ======================================
          STATS
      ====================================== */}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* TOTAL */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Cards
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {cards.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple/10">
              <CreditCard className="h-5 w-5 text-brand-purple" />
            </div>
          </div>
        </div>

        {/* ACTIVE */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Active Cards
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {
                  cards.filter(
                    (card) =>
                      card.status?.toLowerCase() ===
                      "active",
                  ).length
                }
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
              <CircleDot className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* BLOCKED */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Blocked Cards
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {
                  cards.filter(
                    (card) =>
                      card.status?.toLowerCase() ===
                      "blocked",
                  ).length
                }
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
              <CreditCard className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        {/* TOTAL BALANCE */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Balance
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                ₹
                {cards
                  .reduce(
                    (total, card) =>
                      total +
                      Number(
                        card.balance || 0,
                      ),
                    0,
                  )
                  .toLocaleString("en-IN")}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50">
              <Wallet className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================
          SEARCH
      ====================================== */}

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value,
              )
            }
            placeholder="Search by card UUID, machine or status..."
            className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10"
          />
        </div>
      </div>

      {/* ======================================
          RFID CARDS TABLE
      ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* TABLE HEADER */}

        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-bold text-gray-900">
            All RFID Cards
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {filteredCards.length} card
            {filteredCards.length !== 1
              ? "s"
              : ""}{" "}
            found
          </p>
        </div>

        {/* EMPTY STATE */}

        {filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <CreditCard className="h-7 w-7 text-gray-400" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              No RFID cards found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try changing your search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Card UUID
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Machine ID
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Balance
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Created
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCards.map(
                  (card) => (
                    <tr
                      key={
                        card.id ||
                        card.card_uuid
                      }
                      className="border-b border-gray-50 transition last:border-0 hover:bg-gray-50/70"
                    >
                      {/* CARD UUID */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-purple/10">
                            <CreditCard className="h-4 w-4 text-brand-purple" />
                          </div>

                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {card.card_uuid}
                          </span>
                        </div>
                      </td>

                      {/* MACHINE */}

                      <td className="px-6 py-5">
                        <span className="font-mono text-sm text-gray-600">
                          {card.machine_id ||
                            "—"}
                        </span>
                      </td>

                      {/* BALANCE */}

                      <td className="px-6 py-5">
                        <span className="font-semibold text-gray-900">
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
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                            card.status,
                          )}`}
                        >
                          {card.status ||
                            "Unknown"}
                        </span>
                      </td>

                      {/* CREATED */}

                      <td className="px-6 py-5">
                        <span className="text-sm text-gray-500">
                          {card.created_at
                            ? new Date(
                                card.created_at,
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </span>
                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/sudo/rfid-cards/${encodeURIComponent(
                                card.card_uuid,
                              )}`,
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-brand-purple/20 px-4 py-2 text-sm font-semibold text-brand-purple transition hover:bg-brand-purple hover:text-white"
                        >
                          <Eye className="h-4 w-4" />

                          View
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}