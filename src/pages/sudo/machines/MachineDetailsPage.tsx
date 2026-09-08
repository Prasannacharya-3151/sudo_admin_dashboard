import {
  ArrowLeft,
  Building2,
  Calendar,
  CircleDollarSign,
  Cpu,
  CreditCard,
  Loader2,
  MapPin,
  Pencil,
  RefreshCcw,
  Trash2,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
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
  deleteMachine,
  getMachineBalance,
  getMachines,
} from "../../../api/machineApi";

import type {
  MachineBalance,
  RechargeMachine,
} from "../../../types/machine";

// ==========================================
// STATUS CONFIG
// ==========================================

const getStatusConfig = (status?: string) => {
  const normalizedStatus = status?.toLowerCase();

  switch (normalizedStatus) {
    case "active":
      return {
        label: "Active",
        className:
          "bg-green-50 text-green-700 border-green-200",
      };

    case "inactive":
      return {
        label: "Inactive",
        className:
          "bg-gray-100 text-gray-700 border-gray-200",
      };

    case "maintenance":
      return {
        label: "Maintenance",
        className:
          "bg-yellow-50 text-yellow-700 border-yellow-200",
      };

    case "blocked":
      return {
        label: "Blocked",
        className:
          "bg-red-50 text-red-700 border-red-200",
      };

    default:
      return {
        label: status || "Unknown",
        className:
          "bg-gray-100 text-gray-600 border-gray-200",
      };
  }
};

// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (date?: string) => {
  if (!date) return "Not available";

  try {
    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    );
  } catch {
    return date;
  }
};

// ==========================================
// FORMAT CURRENCY
// ==========================================

const formatCurrency = (amount?: number) => {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(amount || 0);
};

// ==========================================
// COMPONENT
// ==========================================

export default function MachineDetailsPage() {
  const navigate = useNavigate();

  const { machineId } = useParams<{
    machineId: string;
  }>();

  // ========================================
  // STATES
  // ========================================

  const [machine, setMachine] =
    useState<RechargeMachine | null>(null);

  const [balanceData, setBalanceData] =
    useState<MachineBalance | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  // ========================================
  // LOAD MACHINE
  // ========================================

  const loadMachine = async (
    showRefreshLoader = false,
  ) => {
    if (!machineId) {
      toast.error("Machine ID is missing");

      navigate("/sudo/machines");

      return;
    }

    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // ====================================
      // GET ALL MACHINES
      //
      // Your API documentation currently
      // provides GET /machines
      // but not GET /machines/:id
      //
      // So we find the machine locally.
      // ====================================

      const machines =
        await getMachines();

      const selectedMachine =
        machines.find(
          (item) =>
            item.id === machineId ||
            item.ble_id === machineId,
        );

      if (!selectedMachine) {
        throw new Error(
          "Machine not found",
        );
      }

      setMachine(selectedMachine);

      // ====================================
      // GET MACHINE BALANCE
      //
      // GET /machines/:id/balance
      // ====================================

      try {
        const balance =
          await getMachineBalance(
            selectedMachine.id,
          );

        setBalanceData(balance);
      } catch (balanceError) {
        console.error(
          "Balance fetch error:",
          balanceError,
        );

        // Do not fail entire page if
        // balance endpoint fails
        setBalanceData(null);
      }
    } catch (error) {
      console.error(
        "Machine details error:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load machine details";

      toast.error(message);

      setMachine(null);
    } finally {
      setIsLoading(false);

      setIsRefreshing(false);
    }
  };

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    loadMachine();
  }, [machineId]);

  // ========================================
  // DELETE MACHINE
  // ========================================

  const handleDelete = async () => {
    if (!machine) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this machine?\n\nBLE ID: ${machine.ble_id || "N/A"}\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);

      await deleteMachine(machine.id);

      toast.success(
        "Machine deleted successfully",
      );

      navigate("/sudo/machines");
    } catch (error) {
      console.error(
        "Delete machine error:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete machine";

      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // ========================================
  // LOADING STATE
  // ========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-purple" />

          <p className="text-sm font-medium text-gray-500">
            Loading machine details...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // NOT FOUND STATE
  // ========================================

  if (!machine) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            Machine Not Found
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            The machine you are looking for
            could not be found or may have
            been removed.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/sudo/machines")
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Machines
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // STATUS
  // ========================================

  const statusConfig =
    getStatusConfig(machine.status);

  // ========================================
  // CURRENT BALANCE
  // ========================================

  const currentBalance =
    balanceData?.balance ??
    machine.balance ??
    machine.initial_balance ??
    0;

  // ========================================
  // UI
  // ========================================

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      {/* ==================================== */}
      {/* HEADER */}
      {/* ==================================== */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <button
            type="button"
            onClick={() =>
              navigate("/sudo/machines")
            }
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-purple"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Machines
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Machine Details
            </h1>

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusConfig.className}`}
            >
              {machine.status === "active" && (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}

              {statusConfig.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            View and manage recharge machine
            information.
          </p>
        </div>

        {/* ACTIONS */}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => loadMachine(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
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
                `/sudo/machines/${machine.id}/recharge`,
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Wallet className="h-4 w-4" />

            Recharge Machine
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            {isDeleting
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>
      </div>

      {/* ==================================== */}
      {/* BALANCE CARD */}
      {/* ==================================== */}

      <div className="overflow-hidden rounded-2xl bg-brand-purple p-6 shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-white/70">
              <Wallet className="h-5 w-5" />

              <span className="text-sm font-medium">
                Current Machine Balance
              </span>
            </div>

            <h2 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
              {formatCurrency(currentBalance)}
            </h2>

            <p className="mt-3 text-sm text-white/70">
              Available balance for recharge
              operations
            </p>
          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <CircleDollarSign className="h-10 w-10 text-white" />
          </div>
        </div>
      </div>

      {/* ==================================== */}
      {/* DETAILS GRID */}
      {/* ==================================== */}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ================================== */}
        {/* MACHINE INFORMATION */}
        {/* ================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
              <Cpu className="h-5 w-5 text-brand-purple" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Machine Information
              </h2>

              <p className="text-sm text-gray-500">
                Recharge machine configuration
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* MACHINE ID */}

            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <Cpu className="h-4 w-4 text-gray-400" />

                <span className="text-sm text-gray-500">
                  Machine ID
                </span>
              </div>

              <span className="max-w-[60%] break-all text-right text-sm font-semibold text-gray-900">
                {machine.id}
              </span>
            </div>

            {/* BLE ID */}

            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-gray-400" />

                <span className="text-sm text-gray-500">
                  BLE ID
                </span>
              </div>

              <span className="max-w-[60%] break-all text-right text-sm font-semibold text-gray-900">
                {machine.ble_id || "Not available"}
              </span>
            </div>

            {/* MACHINE BLOCK */}

            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />

                <span className="text-sm text-gray-500">
                  Machine Block
                </span>
              </div>

              <span className="max-w-[60%] text-right text-sm font-semibold text-gray-900">
                {machine.recharge_machine_block ||
                  "Not available"}
              </span>
            </div>

            {/* STATUS */}

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400" />

                <span className="text-sm text-gray-500">
                  Status
                </span>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusConfig.className}`}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* ================================== */}
        {/* INSTITUTION INFORMATION */}
        {/* ================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Institution Information
              </h2>

              <p className="text-sm text-gray-500">
                Associated institution details
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* INSTITUTION ID */}

            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-gray-400" />

                <span className="text-sm text-gray-500">
                  Institution ID
                </span>
              </div>

              <span className="max-w-[60%] break-all text-right text-sm font-semibold text-gray-900">
                {machine.institution_id ||
                  "Not available"}
              </span>
            </div>

            {/* INSTITUTION NAME */}

            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-gray-400" />

                <span className="text-sm text-gray-500">
                  Institution Name
                </span>
              </div>

              <span className="max-w-[60%] text-right text-sm font-semibold text-gray-900">
                {machine.institution_name ||
                  "Not available"}
              </span>
            </div>

            {/* INITIAL BALANCE */}

            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-4 w-4 text-gray-400" />

                <span className="text-sm text-gray-500">
                  Initial Balance
                </span>
              </div>

              <span className="text-right text-sm font-semibold text-gray-900">
                {formatCurrency(
                  machine.initial_balance,
                )}
              </span>
            </div>

            {/* CREATED AT */}

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />

                <span className="text-sm text-gray-500">
                  Created At
                </span>
              </div>

              <span className="max-w-[60%] text-right text-sm font-semibold text-gray-900">
                {formatDate(machine.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================== */}
      {/* MACHINE FINANCIAL OVERVIEW */}
      {/* ==================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>

          <div>
            <h2 className="font-bold text-gray-900">
              Financial Overview
            </h2>

            <p className="text-sm text-gray-500">
              Machine balance information
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* INITIAL BALANCE */}

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <p className="text-sm font-medium text-gray-500">
              Initial Balance
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(
                machine.initial_balance,
              )}
            </p>
          </div>

          {/* CURRENT BALANCE */}

          <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
            <p className="text-sm font-medium text-purple-600">
              Current Balance
            </p>

            <p className="mt-2 text-2xl font-bold text-brand-purple">
              {formatCurrency(currentBalance)}
            </p>
          </div>

          {/* UPDATED AT */}

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <p className="text-sm font-medium text-gray-500">
              Last Updated
            </p>

            <p className="mt-2 text-sm font-semibold text-gray-900">
              {formatDate(
                balanceData?.updated_at ||
                  machine.updated_at,
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ==================================== */}
      {/* QUICK ACTION */}
      {/* ==================================== */}

      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Need to recharge this machine?
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Add balance to this recharge
              machine for RFID operations.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/sudo/machines/${machine.id}/recharge`,
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Wallet className="h-4 w-4" />

            Recharge Machine
          </button>
        </div>
      </div>
    </div>
  );
}