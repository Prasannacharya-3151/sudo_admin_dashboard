import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Monitor,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  MapPin,
  CircleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { deleteKiosk, getKiosks } from "../../../api/kioskApi";
import { useSudoAuth } from "../../../context/SudoAuthContext";

import type { Kiosk, KioskType } from "../../../types/kiosk";

// ==========================================
// TYPE FILTER OPTIONS
// ==========================================

const typeOptions: { label: string; value: "all" | KioskType }[] = [
  { label: "All Types", value: "all" },
  { label: "Institution", value: "institution" },
  { label: "Public", value: "public" },
];

// ==========================================
// PAIRED FILTER OPTIONS
// ==========================================

const pairedOptions: { label: string; value: "all" | "paired" | "unpaired" }[] = [
  { label: "All Pairing", value: "all" },
  { label: "Paired", value: "paired" },
  { label: "Unpaired", value: "unpaired" },
];

// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (date?: string | null) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

// ==========================================
// COMPONENT
// ==========================================

export default function KiosksPage() {
  const navigate = useNavigate();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATES
  // ==========================================

  const [kiosks, setKiosks] = useState<Kiosk[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<"all" | KioskType>("all");

  const [pairedFilter, setPairedFilter] =
    useState<"all" | "paired" | "unpaired">("all");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ==========================================
  // FETCH KIOSKS
  // ==========================================
  // NOTE: GET /sudo-admin/kiosks isn't built yet. getKiosks() falls
  // back to the public GET /kiosk/ endpoint (no auth needed) and
  // filters client-side, so this call doesn't need accessToken.

  const fetchKiosks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getKiosks();

      setKiosks(data);
    } catch (error) {
      console.error("Failed to fetch kiosks:", error);

      const message =
        error instanceof Error ? error.message : "Failed to load kiosks";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKiosks();
  }, [fetchKiosks]);

  // ==========================================
  // FILTERED KIOSKS
  // ==========================================

  const filteredKiosks = useMemo(() => {
    return kiosks.filter((kiosk) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        kiosk.name.toLowerCase().includes(searchValue) ||
        kiosk.pairing_code.toLowerCase().includes(searchValue) ||
        kiosk.city.toLowerCase().includes(searchValue) ||
        kiosk.state.toLowerCase().includes(searchValue) ||
        kiosk.country.toLowerCase().includes(searchValue);

      const matchesType =
        typeFilter === "all" || kiosk.kiosk_type === typeFilter;

      const isPaired = kiosk.paired_at !== null;

      const matchesPaired =
        pairedFilter === "all" ||
        (pairedFilter === "paired" && isPaired) ||
        (pairedFilter === "unpaired" && !isPaired);

      return matchesSearch && matchesType && matchesPaired;
    });
  }, [kiosks, search, typeFilter, pairedFilter]);

  // ==========================================
  // DELETE KIOSK
  // ==========================================
  // NOTE: DELETE /sudo-admin/kiosks/{kioskId} isn't built on the
  // backend yet — this will 404 until it ships.

  const handleDelete = async (kiosk: Kiosk) => {
    if (!accessToken) {
      toast.error("Authentication token not found");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${kiosk.name}"?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(kiosk.id);

      await deleteKiosk(accessToken, kiosk.id);

      setKiosks((previous) =>
        previous.filter((item) => item.id !== kiosk.id),
      );

      toast.success("Kiosk deleted successfully");
    } catch (error) {
      console.error("Failed to delete kiosk:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to delete kiosk",
      );
    } finally {
      setDeletingId(null);
      setOpenMenuId(null);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
          <p className="text-sm font-medium text-gray-500">
            Loading kiosks...
          </p>
        </div>
      </div>
    );
  }

  const pairedCount = kiosks.filter((kiosk) => kiosk.paired_at !== null).length;

  const institutionCount = kiosks.filter(
    (kiosk) => kiosk.kiosk_type === "institution",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kiosks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor all PrintPoint kiosks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/sudo/kiosks/create")}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-5 w-5" />
          Add Kiosk
        </button>
      </div>

      {/* ======================================
          STATS
      ====================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Kiosks</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {kiosks.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Institution</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {institutionCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Public</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {kiosks.length - institutionCount}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Paired</p>
          <p className="mt-2 text-3xl font-bold text-brand-purple">
            {pairedCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row">
        {/* SEARCH */}

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by kiosk name, pairing code, or location..."
            className="w-full rounded-full border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-purple"
          />
        </div>

        {/* TYPE FILTER */}

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value as "all" | KioskType)
          }
          className="rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-brand-purple"
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* PAIRED FILTER */}

        <select
          value={pairedFilter}
          onChange={(event) =>
            setPairedFilter(
              event.target.value as "all" | "paired" | "unpaired",
            )
          }
          className="rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-brand-purple"
        >
          {pairedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* REFRESH */}

        <button
          type="button"
          onClick={() => void fetchKiosks()}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* ======================================
          ERROR STATE
      ====================================== */}

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 p-5">
          <div className="flex items-center gap-3">
            <CircleAlert className="h-5 w-5 text-red-600" />

            <div>
              <p className="font-semibold text-red-700">
                Failed to load kiosks
              </p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void fetchKiosks()}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================
          EMPTY STATE
      ====================================== */}

      {!error && filteredKiosks.length === 0 && (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
            <Monitor className="h-8 w-8 text-brand-purple" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-gray-900">
            {kiosks.length === 0 ? "No kiosks found" : "No matching kiosks"}
          </h3>

          <p className="mt-2 max-w-md text-sm text-gray-500">
            {kiosks.length === 0
              ? "Start by adding your first PrintPoint kiosk."
              : "Try changing your search or filter criteria."}
          </p>

          {kiosks.length === 0 && (
            <button
              type="button"
              onClick={() => navigate("/sudo/kiosks/create")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-5 w-5" />
              Add Kiosk
            </button>
          )}
        </div>
      )}

      {/* ======================================
          KIOSK TABLE
      ====================================== */}

      {!error && filteredKiosks.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Kiosk
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pairing
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredKiosks.map((kiosk) => {
                  const isPaired = kiosk.paired_at !== null;

                  return (
                    <tr
                      key={kiosk.id}
                      className="transition hover:bg-gray-50/70"
                    >
                      {/* KIOSK */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                            <Monitor className="h-5 w-5 text-brand-purple" />
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {kiosk.name}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-gray-500">
                              {kiosk.pairing_code}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* TYPE */}

                      <td className="px-6 py-5">
                        <span className="capitalize text-sm font-medium text-gray-700">
                          {kiosk.kiosk_type}
                        </span>
                      </td>

                      {/* LOCATION */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>
                            {kiosk.city}, {kiosk.state}
                          </span>
                        </div>
                      </td>

                      {/* PAIRING */}

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            isPaired
                              ? "bg-purple-50 text-brand-purple"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isPaired ? "Paired" : "Unpaired"}
                        </span>
                      </td>

                      {/* CREATED */}

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDate(kiosk.created_at)}
                      </td>

                      {/* ACTIONS */}

                      <td className="relative px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === kiosk.id ? null : kiosk.id,
                            )
                          }
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {openMenuId === kiosk.id && (
                          <div className="absolute right-6 top-14 z-20 w-44 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                            {/* VIEW */}

                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/sudo/kiosks/${kiosk.id}`)
                              }
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/sudo/kiosks/${kiosk.id}/edit`)
                              }
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit Kiosk
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              disabled={deletingId === kiosk.id}
                              onClick={() => void handleDelete(kiosk)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === kiosk.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}

          <div className="border-t border-gray-100 px-6 py-4">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredKiosks.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {kiosks.length}
              </span>{" "}
              kiosks
            </p>
          </div>
        </div>
      )}
    </div>
  );
}