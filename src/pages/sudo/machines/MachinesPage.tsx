import {
  Cpu,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Building2,
  Wallet,
  Loader2,
  AlertCircle,
  Bluetooth,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import {
  deleteMachine,
  getMachines,
} from "../../../api/machineApi";

import { getMachineBalanceValue } from "../../../utils/machineBalance";

import type {
  RechargeMachine,
} from "../../../types/machine";

export default function MachinesPage() {
  const navigate = useNavigate();

  const [machines, setMachines] =
    useState<RechargeMachine[]>([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const fetchMachines = useCallback(
    async (showRefreshLoader = false) => {
      try {
        setError(null);

        if (showRefreshLoader) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const data = await getMachines();

        setMachines(
          Array.isArray(data)
            ? data
            : [],
        );
      } catch (error) {
        console.error(
          "Failed to fetch machines:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load machines";

        setError(message);

        toast.error(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchMachines();
  }, [fetchMachines]);

  const filteredMachines = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return machines;
    }

    return machines.filter((machine) => {
      return (
        machine.institution_name
          ?.toLowerCase()
          .includes(query) ||

        machine.institution_id
          ?.toLowerCase()
          .includes(query) ||

        machine.recharge_machine_block
          ?.toLowerCase()
          .includes(query) ||

        machine.ble_id
          ?.toLowerCase()
          .includes(query) ||

        machine.id
          ?.toLowerCase()
          .includes(query) ||

        machine.status
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [
    machines,
    searchQuery,
  ]);

  const handleDeleteMachine = async (
    machine: RechargeMachine,
  ) => {
    if (!machine.id) {
      toast.error(
        "Machine ID is missing",
      );

      return;
    }

    const machineName =
      machine.recharge_machine_block ||
      machine.ble_id ||
      "this machine";

    const confirmed = window.confirm(
      `Are you sure you want to delete "${machineName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(machine.id);

      await deleteMachine(machine.id);

      setMachines((previousMachines) =>
        previousMachines.filter(
          (item) =>
            item.id !== machine.id,
        ),
      );

      toast.success(
        "Machine deleted successfully",
      );
    } catch (error) {
      console.error(
        "Failed to delete machine:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete machine";

      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (
    amount?: number,
  ) => {
    if (
      amount === undefined ||
      amount === null
    ) {
      return "—";
    }

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      },
    ).format(amount);
  };

  const getStatusClass = (
    status?: string,
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "active":
        return "bg-green-50 text-green-700 ring-green-600/20";

      case "inactive":
        return "bg-gray-100 text-gray-600 ring-gray-500/20";

      case "maintenance":
        return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";

      case "blocked":
        return "bg-red-50 text-red-700 ring-red-600/20";

      default:
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-purple" />

          <p className="text-sm font-medium text-gray-500">
            Loading RFID machines...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple/10">
              <Cpu className="h-6 w-6 text-brand-purple" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                RFID Machines
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage RFID recharge machines
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              void fetchMachines(true)
            }
            disabled={isRefreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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

          <button
            type="button"
            onClick={() =>
              navigate(
                "/sudo/machines/create",
              )
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />

            Add Machine
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Machines
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {machines.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple/10">
              <Cpu className="h-5 w-5 text-brand-purple" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Active Machines
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {
                  machines.filter(
                    (machine) =>
                      machine.status
                        ?.toLowerCase() ===
                      "active",
                  ).length
                }
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Balance
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(
                  machines.reduce(
                    (
                      total,
                      machine,
                    ) =>
                      total +
                      getMachineBalanceValue(
                        machine,
                      ),
                    0,
                  ),
                )}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50">
              <Wallet className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-semibold text-red-700">
                Failed to load machines
              </p>

              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void fetchMachines()
            }
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              All Machines
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredMachines.length} machine
              {filteredMachines.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>

          <div className="relative w-full lg:w-[360px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value,
                )
              }
              placeholder="Search institution, block or BLE ID..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
            />
          </div>
        </div>

        {filteredMachines.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <Cpu className="h-8 w-8 text-gray-400" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              {searchQuery
                ? "No machines found"
                : "No RFID machines yet"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-gray-500">
              {searchQuery
                ? "Try changing your search query."
                : "Create your first RFID recharge machine to start managing the system."}
            </p>

            {!searchQuery && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/sudo/machines/create",
                  )
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />

                Add Machine
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Institution
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Machine Block
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      BLE ID
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Balance
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredMachines.map(
                    (machine) => {
                      return (
                        <tr
                          key={machine.id}
                          className="transition hover:bg-gray-50/70"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10">
                                <Building2 className="h-5 w-5 text-brand-purple" />
                              </div>

                              <div>
                                <p className="font-semibold text-gray-900">
                                  {machine.institution_name ||
                                    "Not specified"}
                                </p>

                                <p className="mt-1 text-xs font-mono text-gray-500">
                                  {machine.institution_id ||
                                    "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4 text-gray-400" />

                              <span className="text-sm font-medium text-gray-700">
                                {machine.recharge_machine_block ||
                                  "—"}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <Bluetooth className="h-4 w-4 text-gray-400" />

                              <span className="font-mono text-sm text-gray-600">
                                {machine.ble_id ||
                                  "—"}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-gray-400" />

                              <span className="font-semibold text-gray-900">
                                {formatCurrency(
                                  getMachineBalanceValue(
                                    machine,
                                  ),
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusClass(
                                machine.status,
                              )}`}
                            >
                              {machine.status ||
                                "Unknown"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/sudo/machines/${machine.id}`,
                                  )
                                }
                                title="View Machine"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-brand-purple hover:bg-brand-purple/5 hover:text-brand-purple"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  machine.id
                                }
                                onClick={() =>
                                  void handleDeleteMachine(
                                    machine,
                                  )
                                }
                                title="Delete Machine"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId ===
                                machine.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-100 lg:hidden">
              {filteredMachines.map(
                (machine) => (
                  <div
                    key={machine.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10">
                          <Cpu className="h-5 w-5 text-brand-purple" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-gray-900">
                            {machine.recharge_machine_block ||
                              "RFID Machine"}
                          </h3>

                          <p className="mt-1 truncate text-xs text-gray-500">
                            {machine.institution_name ||
                              "Institution not specified"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusClass(
                          machine.status,
                        )}`}
                      >
                        {machine.status ||
                          "Unknown"}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">
                          BLE ID
                        </p>

                        <div className="mt-1 flex items-center gap-1 text-sm font-medium text-gray-800">
                          <Bluetooth className="h-3.5 w-3.5 text-gray-400" />

                          {machine.ble_id ||
                            "—"}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Balance
                        </p>

                        <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-gray-900">
                          <Wallet className="h-3.5 w-3.5 text-gray-400" />

                          {formatCurrency(
                            getMachineBalanceValue(
                              machine,
                            ),
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/sudo/machines/${machine.id}`,
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />

                        View
                      </button>

                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          machine.id
                        }
                        onClick={() =>
                          void handleDeleteMachine(
                            machine,
                          )
                        }
                        className="flex items-center justify-center rounded-xl border border-red-100 px-4 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId ===
                        machine.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}