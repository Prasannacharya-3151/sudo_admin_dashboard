import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

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
  Building2,
  CircleAlert,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  deleteKiosk,
  getKiosks,
} from "../../../api/kioskApi";

import {
  useSudoAuth,
} from "../../../context/SudoAuthContext";

import type {
  Kiosk,
  KioskStatus,
} from "../../../types/kiosk";


// ==========================================
// STATUS OPTIONS
// ==========================================

const statusOptions: {
  label: string;
  value: "all" | KioskStatus;
}[] = [
  {
    label: "All Status",
    value: "all",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Inactive",
    value: "inactive",
  },
  {
    label: "Maintenance",
    value: "maintenance",
  },
  {
    label: "Suspended",
    value: "suspended",
  },
];


// ==========================================
// STATUS STYLES
// ==========================================

const getStatusStyles = (
  status: KioskStatus,
) => {
  switch (status) {
    case "active":
      return "bg-green-50 text-green-700 ring-green-600/20";

    case "inactive":
      return "bg-gray-100 text-gray-700 ring-gray-600/20";

    case "maintenance":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "suspended":
      return "bg-red-50 text-red-700 ring-red-600/20";

    default:
      return "bg-gray-100 text-gray-700";
  }
};


// ==========================================
// PAIRING STATUS STYLES
// ==========================================

const getPairingStyles = (
  status?: string,
) => {
  switch (status) {
    case "paired":
      return "bg-purple-50 text-brand-purple";

    case "pending":
      return "bg-yellow-50 text-yellow-700";

    case "unpaired":
      return "bg-gray-100 text-gray-600";

    default:
      return "bg-gray-100 text-gray-600";
  }
};


// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (
  date?: string,
) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(date),
  );
};


// ==========================================
// COMPONENT
// ==========================================

export default function KiosksPage() {

  const navigate = useNavigate();

  const {
    accessToken,
  } = useSudoAuth();


  // ==========================================
  // STATES
  // ==========================================

  const [
    kiosks,
    setKiosks,
  ] = useState<Kiosk[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "all" | KioskStatus
  >("all");

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(
    null,
  );

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null,
  );


  // ==========================================
  // FETCH KIOSKS
  // ==========================================

  const fetchKiosks =
    useCallback(async () => {

      if (!accessToken) {
        setError(
          "Authentication token not found",
        );

        setIsLoading(false);

        return;
      }

      try {

        setIsLoading(true);

        setError(null);

        const data =
          await getKiosks(
            accessToken,
          );

        setKiosks(data);

      } catch (error) {

        console.error(
          "Failed to fetch kiosks:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load kiosks";

        setError(message);

      } finally {

        setIsLoading(false);

      }

    }, [accessToken]);


  // ==========================================
  // INITIAL FETCH
  // ==========================================

  useEffect(() => {

    void fetchKiosks();

  }, [fetchKiosks]);


  // ==========================================
  // FILTERED KIOSKS
  // ==========================================

  const filteredKiosks =
    useMemo(() => {

      return kiosks.filter(
        (kiosk) => {

          const searchValue =
            search
              .trim()
              .toLowerCase();

          const matchesSearch =
            !searchValue ||
            kiosk.name
              .toLowerCase()
              .includes(searchValue) ||
            kiosk.code
              .toLowerCase()
              .includes(searchValue) ||
            kiosk.location
              ?.toLowerCase()
              .includes(searchValue);

          const matchesStatus =
            statusFilter === "all" ||
            kiosk.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );

        },
      );

    }, [
      kiosks,
      search,
      statusFilter,
    ]);


  // ==========================================
  // DELETE KIOSK
  // ==========================================

  const handleDelete =
    async (
      kiosk: Kiosk,
    ) => {

      if (!accessToken) {

        toast.error(
          "Authentication token not found",
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${kiosk.name}"?`,
        );

      if (!confirmed) return;

      try {

        setDeletingId(
          kiosk.id,
        );

        await deleteKiosk(
          accessToken,
          kiosk.id,
        );

        setKiosks(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !==
                kiosk.id,
            ),
        );

        toast.success(
          "Kiosk deleted successfully",
        );

      } catch (error) {

        console.error(
          "Failed to delete kiosk:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to delete kiosk",
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

  return (

    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kiosks
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor all PrintPoint kiosks.
          </p>
        </div>


        <button
          type="button"
          onClick={() =>
            navigate(
              "/sudo/kiosks/create",
            )
          }
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
          <p className="text-sm font-medium text-gray-500">
            Total Kiosks
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {kiosks.length}
          </p>
        </div>


        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

          <p className="text-sm font-medium text-gray-500">
            Active
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600">

            {
              kiosks.filter(
                (kiosk) =>
                  kiosk.status ===
                  "active",
              ).length
            }

          </p>

        </div>


        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Maintenance
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-600">
            {
              kiosks.filter(
                (kiosk) =>
                  kiosk.status ===
                  "maintenance",
              ).length
            }

          </p>

        </div>


        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

          <p className="text-sm font-medium text-gray-500">
            Paired
          </p>

          <p className="mt-2 text-3xl font-bold text-brand-purple">

            {
              kiosks.filter(
                (kiosk) =>
                  kiosk.pairing_status ===
                  "paired",
              ).length
            }
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
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search by kiosk name, code or location..."
            className="w-full rounded-full border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-purple "
          />

        </div>


        {/* STATUS FILTER */}

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target
                .value as
                | "all"
                | KioskStatus,
            )
          }
          className="rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-brand-purple"
        >

          {statusOptions.map(
            (status) => (

              <option
                key={status.value}
                value={status.value}
              >

                {status.label}

              </option>

            ),
          )}

        </select>


        {/* REFRESH */}

        <button
          type="button"
          onClick={() =>
            void fetchKiosks()
          }
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

              <p className="mt-1 text-sm text-red-600">

                {error}

              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={() =>
              void fetchKiosks()
            }
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>

      )}


      {/* ======================================
          EMPTY STATE
      ====================================== */}

      {!error &&
        filteredKiosks.length === 0 && (

          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">

              <Monitor className="h-8 w-8 text-brand-purple" />

            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">

              {kiosks.length === 0
                ? "No kiosks found"
                : "No matching kiosks"}

            </h3>

            <p className="mt-2 max-w-md text-sm text-gray-500">

              {kiosks.length === 0
                ? "Start by adding your first PrintPoint kiosk."
                : "Try changing your search or filter criteria."}

            </p>


            {kiosks.length === 0 && (

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/sudo/kiosks/create",
                  )
                }
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

      {!error &&
        filteredKiosks.length > 0 && (

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">


            {/* TABLE */}

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

                      Status

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

                  {filteredKiosks.map(
                    (kiosk) => (

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

                                {kiosk.code}

                              </p>

                            </div>

                          </div>

                        </td>


                        {/* TYPE */}

                        <td className="px-6 py-5">

                          <span className="capitalize text-sm font-medium text-gray-700">

                            {kiosk.type}

                          </span>

                        </td>


                        {/* LOCATION */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-2 text-sm text-gray-600">

                            {kiosk.location ? (

                              <>
                                <MapPin className="h-4 w-4 text-gray-400" />

                                <span>

                                  {kiosk.location}

                                </span>

                              </>

                            ) : kiosk.institution_id ? (

                              <>
                                <Building2 className="h-4 w-4 text-gray-400" />

                                <span>

                                  Institution Kiosk

                                </span>

                              </>

                            ) : (

                              "-"

                            )}

                          </div>

                        </td>


                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusStyles(
                              kiosk.status,
                            )}`}
                          >

                            {kiosk.status}

                          </span>

                        </td>


                        {/* PAIRING */}

                        <td className="px-6 py-5">

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getPairingStyles(
                              kiosk.pairing_status,
                            )}`}
                          >

                            {kiosk.pairing_status ||
                              "unknown"}

                          </span>

                        </td>


                        {/* CREATED */}

                        <td className="px-6 py-5 text-sm text-gray-600">

                          {formatDate(
                            kiosk.created_at,
                          )}

                        </td>


                        {/* ACTIONS */}

                        <td className="relative px-6 py-5 text-right">

                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId ===
                                  kiosk.id
                                  ? null
                                  : kiosk.id,
                              )
                            }
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                          >

                            <MoreVertical className="h-5 w-5" />

                          </button>


                          {openMenuId ===
                            kiosk.id && (

                            <div className="absolute right-6 top-14 z-20 w-44 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">

                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/sudo/kiosks/${kiosk.id}`,
                                  )
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
                                  navigate(
                                    `/sudo/kiosks/${kiosk.id}/edit`,
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                              >

                                <Pencil className="h-4 w-4" />

                                Edit Kiosk

                              </button>


                              {/* DELETE */}

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  kiosk.id
                                }
                                onClick={() =>
                                  void handleDelete(
                                    kiosk,
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >

                                {deletingId ===
                                kiosk.id ? (

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

                    ),
                  )}

                </tbody>

              </table>

            </div>


            {/* FOOTER */}

            <div className="border-t border-gray-100 px-6 py-4">

              <p className="text-sm text-gray-500">

                Showing{" "}

                <span className="font-semibold text-gray-900">

                  {filteredKiosks.length}

                </span>

                {" "}of{" "}

                <span className="font-semibold text-gray-900">

                  {kiosks.length}

                </span>

                {" "}kiosks

              </p>

            </div>

          </div>

        )}

    </div>

  );

}