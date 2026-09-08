import {
  ArrowLeft,
  Wallet,
  Loader2,
  CreditCard,
  Monitor,
  Plus,
  IndianRupee,
  Building2,
  Bluetooth,
  MapPin,
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
  getMachines,
  getMachineBalance,
  rechargeMachine,
} from "../../../api/machineApi";

import type {
  RechargeMachine,
  MachineBalance,
} from "../../../types/machine";

// ==========================================
// COMPONENT
// ==========================================

export default function RechargeMachinePage() {
  const navigate = useNavigate();

  const { machineId } = useParams<{
    machineId: string;
  }>();

  // ==========================================
  // STATE
  // ==========================================

  const [machine, setMachine] =
    useState<RechargeMachine | null>(null);

  const [machineBalance, setMachineBalance] =
    useState<MachineBalance | null>(null);

  const [amount, setAmount] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  // ==========================================
  // GET CURRENT BALANCE
  // ==========================================

  const getCurrentBalance = () => {
    if (machineBalance?.balance !== undefined) {
      return Number(machineBalance.balance);
    }

    if (machine?.balance !== undefined) {
      return Number(machine.balance);
    }

    if (machine?.initial_balance !== undefined) {
      return Number(machine.initial_balance);
    }

    return 0;
  };

  // ==========================================
  // LOAD MACHINE
  // ==========================================

  const loadMachine = async () => {
    if (!machineId) {
      toast.error("Machine ID is missing");

      navigate("/sudo/machines");

      return;
    }

    try {
      setIsLoading(true);

      // ========================================
      // GET ALL MACHINES
      // ========================================

      const machines = await getMachines();

      // ========================================
      // FIND CURRENT MACHINE
      // ========================================

      const selectedMachine =
        machines.find(
          (item) =>
            item.id === machineId,
        ) ?? null;

      if (!selectedMachine) {
        setMachine(null);

        return;
      }

      setMachine(selectedMachine);

      // ========================================
      // GET LATEST MACHINE BALANCE
      // ========================================

      try {
        const balanceData =
          await getMachineBalance(machineId);

        setMachineBalance(balanceData);
      } catch (balanceError) {
        console.error(
          "Failed to load machine balance:",
          balanceError,
        );

        // Don't stop the entire page
        // if balance endpoint fails
        setMachineBalance(null);
      }
    } catch (error) {
      console.error(
        "Failed to load machine:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to load machine";

      toast.error(message);

      setMachine(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    void loadMachine();
  }, [machineId]);

  // ==========================================
  // RECHARGE MACHINE
  // ==========================================

  const handleRecharge = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!machineId) {
      toast.error("Machine ID is missing");

      return;
    }

    // ========================================
    // VALIDATE EMPTY
    // ========================================

    if (!amount.trim()) {
      toast.error(
        "Please enter recharge amount",
      );

      return;
    }

    const rechargeAmount =
      Number(amount);

    // ========================================
    // VALIDATE NUMBER
    // ========================================

    if (
      Number.isNaN(rechargeAmount) ||
      rechargeAmount <= 0
    ) {
      toast.error(
        "Please enter a valid amount",
      );

      return;
    }

    try {
      setIsSubmitting(true);

      // ========================================
      // API CALL
      // POST /machines/:id/recharge
      //
      // Payload:
      // {
      //   amount: 2000
      // }
      // ========================================

      await rechargeMachine(
        machineId,
        {
          amount: rechargeAmount,
        },
      );

      // ========================================
      // SUCCESS
      // ========================================

      toast.success(
        `Machine recharged successfully with ₹${rechargeAmount.toLocaleString(
          "en-IN",
        )}`,
      );

      setAmount("");

      // ========================================
      // REFRESH MACHINE DATA
      // ========================================

      await loadMachine();
    } catch (error) {
      console.error(
        "Failed to recharge machine:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to recharge machine";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // QUICK AMOUNT
  // ==========================================

  const handleQuickAmount = (
    value: number,
  ) => {
    setAmount(value.toString());
  };

  // ==========================================
  // FORMAT CURRENCY
  // ==========================================

  const formatCurrency = (
    value: number,
  ) => {
    return value.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    );
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

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

  // ==========================================
  // MACHINE NOT FOUND
  // ==========================================

  if (!machine) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
          <Monitor className="h-9 w-9 text-red-500" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Machine not found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            The requested recharge machine could
            not be found.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/sudo/machines")
          }
          className="rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Back to Machines
        </button>
      </div>
    );
  }

  // ==========================================
  // CALCULATIONS
  // ==========================================

  const currentBalance =
    getCurrentBalance();

  const rechargeAmount =
    Number(amount) || 0;

  const newBalance =
    currentBalance + rechargeAmount;

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="mb-8">
        <button
          type="button"
          onClick={() =>
            navigate(
              `/sudo/machines/${machineId}`,
            )
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-brand-purple"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Machine Details
        </button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple/10">
                <Wallet className="h-5 w-5 text-brand-purple" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900">
                Recharge Machine
              </h1>
            </div>

            <p className="text-sm text-gray-500">
              Add balance to this RFID recharge
              machine.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================
          CONTENT GRID
      ====================================== */}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">

        {/* ====================================
            MACHINE INFORMATION
        ==================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* HEADER */}

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <Monitor className="h-5 w-5 text-brand-purple" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                Machine Information
              </h2>

              <p className="text-xs text-gray-500">
                Current machine details
              </p>
            </div>
          </div>

          {/* MACHINE DETAILS */}

          <div className="space-y-5">

            {/* INSTITUTION */}

            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 text-gray-400" />

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Institution
                </p>

                <p className="font-semibold text-gray-900">
                  {machine.institution_name ||
                    "Not specified"}
                </p>
              </div>
            </div>

            {/* MACHINE ID */}

            <div className="flex items-start gap-3">
              <Monitor className="mt-0.5 h-4 w-4 text-gray-400" />

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Machine ID
                </p>

                <p className="break-all font-mono text-sm font-medium text-gray-700">
                  {machine.id}
                </p>
              </div>
            </div>

            {/* BLOCK */}

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Machine Block
                </p>

                <p className="text-sm font-medium text-gray-700">
                  {machine.recharge_machine_block ||
                    "Not specified"}
                </p>
              </div>
            </div>

            {/* BLE ID */}

            <div className="flex items-start gap-3">
              <Bluetooth className="mt-0.5 h-4 w-4 text-gray-400" />

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  BLE ID
                </p>

                <p className="break-all font-mono text-sm font-medium text-gray-700">
                  {machine.ble_id ||
                    "Not specified"}
                </p>
              </div>
            </div>

            {/* STATUS */}

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Status
              </p>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  machine.status === "active"
                    ? "bg-green-50 text-green-600"
                    : machine.status === "maintenance"
                      ? "bg-yellow-50 text-yellow-600"
                      : machine.status === "blocked"
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-100 text-gray-600"
                }`}
              >
                {machine.status ||
                  "Unknown"}
              </span>
            </div>
          </div>

          {/* ====================================
              CURRENT BALANCE
          ==================================== */}

          <div className="mt-8 rounded-2xl bg-brand-purple p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">
                  Current Balance
                </p>

                <div className="mt-2 flex items-center gap-1">
                  <IndianRupee className="h-5 w-5" />

                  <span className="text-3xl font-bold">
                    {formatCurrency(
                      currentBalance,
                    )}
                  </span>
                </div>
              </div>

              <Wallet className="h-10 w-10 text-white/50" />
            </div>
          </div>
        </div>

        {/* ====================================
            RECHARGE FORM
        ==================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* HEADER */}

          <div className="mb-7">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <Plus className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  Add Balance
                </h2>

                <p className="text-xs text-gray-500">
                  Enter the amount to recharge
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}

          <form
            onSubmit={handleRecharge}
            className="space-y-6"
          >
            {/* ==================================
                AMOUNT INPUT
            ================================== */}

            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Recharge Amount
              </label>

              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value,
                    )
                  }
                  placeholder="Enter amount"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-gray-200 py-4 pl-12 pr-4 text-lg font-semibold text-gray-900 outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* ==================================
                QUICK AMOUNTS
            ================================== */}

            <div>
              <p className="mb-3 text-sm font-semibold text-gray-700">
                Quick Select
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  100,
                  500,
                  1000,
                  2000,
                  5000,
                  10000,
                ].map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleQuickAmount(value)
                    }
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      Number(amount) === value
                        ? "border-brand-purple bg-brand-purple text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-brand-purple hover:text-brand-purple"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    ₹
                    {value.toLocaleString(
                      "en-IN",
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ==================================
                RECHARGE SUMMARY
            ================================== */}

            {amount &&
              rechargeAmount > 0 && (
                <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                  {/* CURRENT */}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Current Balance
                    </span>

                    <span className="font-semibold text-gray-900">
                      ₹
                      {formatCurrency(
                        currentBalance,
                      )}
                    </span>
                  </div>

                  <div className="my-3 border-t border-purple-100" />

                  {/* RECHARGE */}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Recharge Amount
                    </span>

                    <span className="font-semibold text-green-600">
                      + ₹
                      {formatCurrency(
                        rechargeAmount,
                      )}
                    </span>
                  </div>

                  <div className="my-3 border-t border-purple-100" />

                  {/* NEW BALANCE */}

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      New Balance
                    </span>

                    <span className="text-lg font-bold text-brand-purple">
                      ₹
                      {formatCurrency(
                        newBalance,
                      )}
                    </span>
                  </div>
                </div>
              )}

            {/* ==================================
                ACTIONS
            ================================== */}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  navigate(
                    `/sudo/machines/${machineId}`,
                  )
                }
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !amount ||
                  rechargeAmount <= 0
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Recharging...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />

                    Recharge Machine
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}