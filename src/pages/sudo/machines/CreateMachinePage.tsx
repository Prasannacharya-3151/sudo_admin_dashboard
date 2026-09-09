import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  Cpu,
  Loader2,
  MapPin,
  Save,
  Wallet,
} from "lucide-react";

import { toast } from "sonner";

import { createMachine } from "../../../api/machineApi";
import { getInstitutions } from "../../../api/institutionApi";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import type { CreateMachinePayload } from "../../../types/machine";
import type { Institution } from "../../../types/institution";

export default function CreateMachinePage() {
  const navigate = useNavigate();
  const { accessToken } = useSudoAuth();

  const [formData, setFormData] = useState({
    institution_id: "",
    institution_name: "",
    recharge_machine_block: "",
    ble_id: "",
    initial_balance: "",
  });

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoadingInstitutions, setIsLoadingInstitutions] =
    useState(true);

  const [institutionDropdownOpen, setInstitutionDropdownOpen] =
    useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInstitutions = async () => {
      if (!accessToken) {
        setIsLoadingInstitutions(false);
        return;
      }

      try {
        setIsLoadingInstitutions(true);

        const result = await getInstitutions(accessToken);

        setInstitutions(result);
      } catch (error) {
        console.error(
          "Failed to fetch institutions:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load institutions";

        toast.error(message);
      } finally {
        setIsLoadingInstitutions(false);
      }
    };

    fetchInstitutions();
  }, [accessToken]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleBalanceChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;

    if (value === "") {
      setFormData((previous) => ({
        ...previous,
        initial_balance: "",
      }));

      return;
    }

    if (!/^\d+$/.test(value)) {
      return;
    }

    const cleanedValue = value.replace(/^0+/, "");

    setFormData((previous) => ({
      ...previous,
      initial_balance: cleanedValue,
    }));
  };

  const handleBalanceKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    const invalidKeys = [
      "-",
      "+",
      "e",
      "E",
      ".",
    ];

    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
    }
  };

  const handleInstitutionSelect = (
    institution: Institution,
  ) => {
    setFormData((previous) => ({
      ...previous,
      institution_id: institution.id,
      institution_name: institution.name,
    }));

    setInstitutionDropdownOpen(false);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!formData.institution_id) {
      toast.error("Please select an institution");
      return;
    }

    if (!formData.recharge_machine_block.trim()) {
      toast.error("Recharge machine block is required");
      return;
    }

    if (!formData.ble_id.trim()) {
      toast.error("BLE ID is required");
      return;
    }

    if (!formData.initial_balance.trim()) {
      toast.error("Initial balance is required");
      return;
    }

    const balance = Number(formData.initial_balance);

    if (!Number.isFinite(balance)) {
      toast.error("Please enter a valid initial balance");
      return;
    }

    if (balance <= 0) {
      toast.error(
        "Initial balance must be greater than 0",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreateMachinePayload = {
        institution_id: formData.institution_id,
        institution_name: formData.institution_name,
        recharge_machine_block:
          formData.recharge_machine_block.trim(),
        ble_id: formData.ble_id.trim(),
        initial_balance: balance,
      };

      await createMachine(payload);

      toast.success(
        "Recharge machine created successfully",
      );

      navigate("/sudo/machines");
    } catch (error) {
      console.error(
        "Create machine error:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to create machine";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/sudo/machines");
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8">
        <button
          type="button"
          onClick={handleCancel}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-purple"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Machines
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
            <Cpu className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create Recharge Machine
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Register a new RFID recharge machine in
              the system.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Machine Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the required information to register
            the machine.
          </p>
        </div>

        <div className="space-y-6 p-6">
          <div className="relative">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Institution
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <button
              type="button"
              disabled={
                isSubmitting ||
                isLoadingInstitutions
              }
              onClick={() =>
                setInstitutionDropdownOpen(
                  (previous) => !previous,
                )
              }
              className="flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-left text-sm transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 shrink-0 text-gray-400" />

                {isLoadingInstitutions ? (
                  <span className="text-gray-400">
                    Loading institutions...
                  </span>
                ) : formData.institution_name ? (
                  <span className="font-medium text-gray-900">
                    {formData.institution_name}
                  </span>
                ) : (
                  <span className="text-gray-400">
                    Select institution
                  </span>
                )}
              </div>

              {isLoadingInstitutions ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : (
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 transition ${
                    institutionDropdownOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              )}
            </button>

            {institutionDropdownOpen && (
              <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                {institutions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No institutions found
                  </div>
                ) : (
                  institutions.map(
                    (institution) => {
                      const isSelected =
                        formData.institution_id ===
                        institution.id;

                      return (
                        <button
                          key={institution.id}
                          type="button"
                          onClick={() =>
                            handleInstitutionSelect(
                              institution,
                            )
                          }
                          className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition ${
                            isSelected
                              ? "bg-brand-purple/10 text-brand-purple"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4" />

                            <span>
                              {institution.name}
                            </span>
                          </div>

                          {isSelected && (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                      );
                    },
                  )
                )}
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Select the institution where the recharge
              machine will be installed.
            </p>

            <input
              type="hidden"
              value={formData.institution_id}
              readOnly
            />
          </div>

          <div>
            <label
              htmlFor="recharge_machine_block"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Recharge Machine Block
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                id="recharge_machine_block"
                name="recharge_machine_block"
                type="text"
                value={
                  formData.recharge_machine_block
                }
                onChange={handleChange}
                placeholder="Example: Block A"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Specify the physical block where the
              recharge machine is installed.
            </p>
          </div>

          <div>
            <label
              htmlFor="ble_id"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              BLE ID
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              <Cpu className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                id="ble_id"
                name="ble_id"
                type="text"
                value={formData.ble_id}
                onChange={handleChange}
                placeholder="Example: BLE-001"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Enter the unique Bluetooth Low Energy
              identifier.
            </p>
          </div>

          <div>
            <label
              htmlFor="initial_balance"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Initial Balance
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              <Wallet className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

              <input
                id="initial_balance"
                name="initial_balance"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={formData.initial_balance}
                onChange={handleBalanceChange}
                onKeyDown={handleBalanceKeyDown}
                placeholder="Enter initial balance"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Enter a valid positive initial balance
              greater than 0.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingInstitutions
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-purple px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Machine
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}