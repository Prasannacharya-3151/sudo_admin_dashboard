import {
  CreditCard,
  Eye,
  Search,
  Users,
  Wallet,
  Ban,
  CheckCircle2,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useNavigate } from "react-router-dom";

import { toast } from "sonner";

import { getRFIDCards } from "../../../api/machineApi";

import type { RFIDCard } from "../../../types/machine";

export default function RFIDCardsPage() {
  const navigate = useNavigate();

  const [cards, setCards] = useState<RFIDCard[]>(
    [],
  );

  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function loadCards() {
    try {
      setLoading(true);
      setError(null);

      const data = await getRFIDCards();

      setCards(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load RFID cards";

      setError(message);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCards();
  }, []);

  const filteredCards = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return cards;
    }

    return cards.filter((card) =>
      [
        card.card_uuid,
        card.std_name,
        card.std_reg,
        card.std_id,
        card.group,
        card.status,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field)
            .toLowerCase()
            .includes(value),
        ),
    );
  }, [cards, search]);

  const totalBalance = useMemo(() => {
    return cards.reduce((total, card) => {
      return (
        total +
        Number(
          card.balance ??
            card.wallet_bal ??
            0,
        )
      );
    }, 0);
  }, [cards]);

  const activeCards = cards.filter(
    (card) =>
      String(card.status).toLowerCase() ===
      "active",
  ).length;

  const blockedCards = cards.filter(
    (card) =>
      String(card.status).toLowerCase() ===
      "blocked",
  ).length;

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

    return new Date(value).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  }

  function statusClass(
    status?: string,
  ) {
    switch (
      String(status).toLowerCase()
    ) {
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

  function StatCard({
    title,
    value,
    icon,
  }: {
    title: string;
    value: string | number;
    icon: ReactNode;
  }) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              {title}
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {value}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            {icon}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          RFID Cards
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage RFID cards and student wallets.
        </p>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Cards"
          value={cards.length}
          icon={<CreditCard size={21} />}
        />

        <StatCard
          title="Active Cards"
          value={activeCards}
          icon={<CheckCircle2 size={21} />}
        />

        <StatCard
          title="Blocked Cards"
          value={blockedCards}
          icon={<Ban size={21} />}
        />

        <StatCard
          title="Total Balance"
          value={formatCurrency(
            totalBalance,
          )}
          icon={<Wallet size={21} />}
        />
      </div>

      {/* SEARCH */}

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search student, register number, card UUID..."
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-purple-500 focus:bg-white"
          />
        </div>
      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm text-gray-500">
              Loading RFID cards...
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <p className="text-sm text-red-500">
              {error}
            </p>

            <button
              onClick={() => void loadCards()}
              className="rounded-full bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <Users
              size={36}
              className="text-gray-300"
            />

            <p className="mt-3 text-sm text-gray-500">
              No RFID cards found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Student
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Register No.
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Card UUID
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Group
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Balance
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Created
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCards.map((card) => (
                  <tr
                    key={card.card_uuid}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {card.std_name ||
                            "Unknown Student"}
                        </p>

                        {card.std_id && (
                          <p className="mt-1 text-xs text-gray-400">
                            ID: {card.std_id}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {card.std_reg || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <code className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-700">
                        {card.card_uuid}
                      </code>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {card.group || "—"}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        card.balance ??
                          card.wallet_bal,
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${statusClass(
                          card.status,
                        )}`}
                      >
                        {card.status ||
                          "Unknown"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500">
                      {formatDate(
                        card.created_at,
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() =>
                          navigate(
                            `/sudo/rfid-cards/${encodeURIComponent(
                              card.card_uuid,
                            )}`,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}