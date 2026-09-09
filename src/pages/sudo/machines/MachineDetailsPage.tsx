import {
  ArrowLeft,
  Building2,
  Calendar,
  CircleDollarSign,
  Cpu,
  CreditCard,
  Loader2,
  MapPin,
  RefreshCcw,
  Trash2,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users as UsersIcon,
  UserPlus,
  Mail,
  X,
  Lock,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
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

import {
  deleteUser,
  getUsers,
  signupUser,
} from "../../../api/userApi";

import { getMachineBalanceValue } from "../../../utils/machineBalance";

import type {
  MachineBalance,
  RechargeMachine,
} from "../../../types/machine";
import type {
  SignupUserPayload,
  WardenUser,
} from "../../../types/user";

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

const formatDate = (date?: string) => {
  if (!date) return "Not available";

  try {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return date;
  }
};

const formatCurrency = (amount?: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export default function MachineDetailsPage() {
  const navigate = useNavigate();

  const { machineId } = useParams<{
    machineId: string;
  }>();

  // ==========================================
  // MACHINE STATE
  // ==========================================

  const [machine, setMachine] =
    useState<RechargeMachine | null>(null);

  const [balanceData, setBalanceData] =
    useState<MachineBalance | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  // ==========================================
  // WARDENS FOR THIS MACHINE'S INSTITUTION
  // ==========================================

  const [users, setUsers] = useState<WardenUser[]>([]);

  const [isLoadingUsers, setIsLoadingUsers] =
    useState(true);

  const [deletingUserId, setDeletingUserId] =
    useState<string | null>(null);

  // ==========================================
  // ADD WARDEN MODAL
  // ==========================================

  const [isWardenModalOpen, setIsWardenModalOpen] =
    useState(false);

  const [wardenFormData, setWardenFormData] = useState({
    email: "",
    password: "",
  });

  const [isCreatingWarden, setIsCreatingWarden] =
    useState(false);

  // ==========================================
  // LOAD MACHINE
  // ==========================================

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

      const machines = await getMachines();

      const selectedMachine = machines.find(
        (item) =>
          item.id === machineId ||
          item.ble_id === machineId,
      );

      if (!selectedMachine) {
        throw new Error("Machine not found");
      }

      setMachine(selectedMachine);

      try {
        const balance = await getMachineBalance(
          selectedMachine.id,
        );

        setBalanceData(balance);
      } catch (balanceError) {
        console.error(
          "Balance fetch error:",
          balanceError,
        );

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

  useEffect(() => {
    loadMachine();
  }, [machineId]);

  // ==========================================
  // LOAD WARDENS (all users, filtered by institution)
  // ==========================================

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);

      const data = await getUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch wardens:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load wardens";

      toast.error(message);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // ==========================================
  // WARDENS SCOPED TO THIS MACHINE'S INSTITUTION
  // ==========================================

  const institutionWardens = useMemo(() => {
    if (!machine) return [];

    return users.filter(
      (user) =>
        user.institution_id === machine.institution_id,
    );
  }, [users, machine]);

  // ==========================================
  // DELETE MACHINE
  // ==========================================

  const handleDelete = async () => {
    if (!machine) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete this machine?\n\nBLE ID: ${
        machine.ble_id || "N/A"
      }\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);

      await deleteMachine(machine.id);

      toast.success("Machine deleted successfully");

      navigate("/sudo/machines");
    } catch (error) {
      console.error("Delete machine error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete machine";

      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // DELETE WARDEN
  // ==========================================

  const handleDeleteUser = async (user: WardenUser) => {
    if (!user.id) {
      toast.error("User ID is missing");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${user.email}"?`,
    );

    if (!confirmed) return;

    try {
      setDeletingUserId(user.id);

      await deleteUser(user.id);

      setUsers((previousUsers) =>
        previousUsers.filter(
          (item) => item.id !== user.id,
        ),
      );

      toast.success("Warden deleted successfully");
    } catch (error) {
      console.error("Failed to delete user:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete warden";

      toast.error(message);
    } finally {
      setDeletingUserId(null);
    }
  };

  // ==========================================
  // OPEN / CLOSE WARDEN MODAL
  // ==========================================

  const openWardenModal = () => {
    setWardenFormData({ email: "", password: "" });
    setIsWardenModalOpen(true);
  };

  const closeWardenModal = () => {
    if (isCreatingWarden) return;
    setIsWardenModalOpen(false);
  };

  const handleWardenChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    setWardenFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // CREATE WARDEN (pre-scoped to this machine's institution)
  // ==========================================

  const handleCreateWarden = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!machine) return;

    if (!wardenFormData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(wardenFormData.email.trim())) {
      toast.error("Please enter a valid email");
      return;
    }

    if (!wardenFormData.password.trim()) {
      toast.error("Password is required");
      return;
    }

    if (wardenFormData.password.trim().length < 6) {
      toast.error(
        "Password must be at least 6 characters",
      );
      return;
    }

    try {
      setIsCreatingWarden(true);

      const payload: SignupUserPayload = {
        institution_id: machine.institution_id,
        institution_name: machine.institution_name,
        email: wardenFormData.email.trim(),
        password: wardenFormData.password,
      };

      await signupUser(payload);

      toast.success("Warden account created successfully");

      setIsWardenModalOpen(false);

      await fetchUsers();
    } catch (error) {
      console.error("Create warden error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to create warden";

      toast.error(message);
    } finally {
      setIsCreatingWarden(false);
    }
  };

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
            The machine you are looking for could not be
            found or may have been removed.
          </p>

          <button
            type="button"
            onClick={() => navigate("/sudo/machines")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Machines
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(machine.status);

  const currentBalance = getMachineBalanceValue(
    machine,
    balanceData,
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <button
            type="button"
            onClick={() => navigate("/sudo/machines")}
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
            View and manage recharge machine information.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => loadMachine(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              className={`h-4 w-4 ${
                isRefreshing ? "animate-spin" : ""
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

            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

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
              Available balance for recharge operations
            </p>
          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <CircleDollarSign className="h-10 w-10 text-white" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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

            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-4 w-4 text-gray-400" />

                <span className="text-sm text-gray-500">
                  Current Balance
                </span>
              </div>

              <span className="text-right text-sm font-semibold text-gray-900">
                {formatCurrency(currentBalance)}
              </span>
            </div>

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

      {/* ======================================
          WARDENS FOR THIS INSTITUTION
      ====================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <UsersIcon className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Wardens
              </h2>

              <p className="text-sm text-gray-500">
                Warden accounts for{" "}
                {machine.institution_name ||
                  "this institution"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openWardenModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Add Warden
          </button>
        </div>

        {isLoadingUsers ? (
          <div className="flex min-h-[140px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
          </div>
        ) : institutionWardens.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <UsersIcon className="h-6 w-6 text-gray-400" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-gray-900">
              No wardens yet
            </h3>

            <p className="mt-1 max-w-sm text-xs text-gray-500">
              Create a warden account for this
              institution to manage this machine.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {institutionWardens.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10">
                    <Mail className="h-4 w-4 text-brand-purple" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {user.email}
                    </p>

                    <p className="mt-0.5 truncate font-mono text-xs text-gray-400">
                      {user.id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={deletingUserId === user.id}
                  onClick={() =>
                    void handleDeleteUser(user)
                  }
                  title="Delete Warden"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingUserId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
            <p className="text-sm font-medium text-purple-600">
              Current Balance
            </p>

            <p className="mt-2 text-2xl font-bold text-brand-purple">
              {formatCurrency(currentBalance)}
            </p>
          </div>

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

      <div className="rounded-2xl border border-purple-100 bg-purple-50 p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Need to recharge this machine?
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              Add balance to this recharge machine for
              RFID operations.
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

      {/* ======================================
          ADD WARDEN MODAL
      ====================================== */}

      {isWardenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
                  <UserPlus className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Add Warden
                  </h2>

                  <p className="text-xs text-gray-500">
                    For {machine.institution_name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeWardenModal}
                disabled={isCreatingWarden}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateWarden}
              className="space-y-5 px-6 py-6"
            >
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <Building2 className="h-5 w-5 text-gray-400" />

                <div>
                  <p className="text-xs text-gray-500">
                    Institution
                  </p>

                  <p className="text-sm font-semibold text-gray-900">
                    {machine.institution_name}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="warden-email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                  <input
                    id="warden-email"
                    name="email"
                    type="email"
                    value={wardenFormData.email}
                    onChange={handleWardenChange}
                    placeholder="warden@college.com"
                    disabled={isCreatingWarden}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="warden-password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Password
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                  <input
                    id="warden-password"
                    name="password"
                    type="password"
                    value={wardenFormData.password}
                    onChange={handleWardenChange}
                    placeholder="Enter password"
                    disabled={isCreatingWarden}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                  />
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  At least 6 characters.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeWardenModal}
                  disabled={isCreatingWarden}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreatingWarden}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-purple px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingWarden ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create Warden
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}