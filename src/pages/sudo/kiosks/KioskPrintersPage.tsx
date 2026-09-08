import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Check,
  Edit3,
  Loader2,
  Plus,
  Printer,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import {
  addKioskPrinter,
  deleteKioskPrinter,
  getKioskPrinters,
  updateKioskPrinter,
} from "../../../api/kioskApi";

import type {
  AddKioskPrinterPayload,
  KioskPrinter,
  UpdateKioskPrinterPayload,
} from "../../../types/kiosk";

// ==========================================
// EMPTY FORM
// ==========================================

const emptyPrinterForm: AddKioskPrinterPayload = {
  name: "",
  model: "",
  is_default: false,
};

// ==========================================
// COMPONENT
// ==========================================

export default function KioskPrintersPage() {
  const navigate = useNavigate();

  const { kioskId } = useParams<{
    kioskId: string;
  }>();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [printers, setPrinters] =
    useState<KioskPrinter[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [editingPrinter, setEditingPrinter] =
    useState<KioskPrinter | null>(null);

  const [formData, setFormData] =
    useState<AddKioskPrinterPayload>(
      emptyPrinterForm,
    );

  // ==========================================
  // LOAD PRINTERS
  // ==========================================

  const loadPrinters = useCallback(
    async () => {
      if (!kioskId || !accessToken) {
        return;
      }

      try {
        setIsLoading(true);

        // FIX: accessToken first, kioskId second —
        // matches getKioskPrinters(accessToken, kioskId) signature
        const data =
          await getKioskPrinters(
            accessToken,
            kioskId,
          );

        setPrinters(data);
      } catch (error) {
        console.error(
          "Failed to load printers:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load printers";

        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [kioskId, accessToken],
  );

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    void loadPrinters();
  }, [loadPrinters]);

  // ==========================================
  // OPEN CREATE
  // ==========================================

  const handleOpenCreate = () => {
    setEditingPrinter(null);

    setFormData(emptyPrinterForm);

    setShowCreateForm(true);
  };

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const handleOpenEdit = (
    printer: KioskPrinter,
  ) => {
    setEditingPrinter(printer);

    setFormData({
      name: printer.name,
      model: printer.model ?? "",
      is_default:
        printer.is_default ?? false,
    });

    setShowCreateForm(true);
  };

  // ==========================================
  // CLOSE FORM
  // ==========================================

  const handleCloseForm = () => {
    setShowCreateForm(false);

    setEditingPrinter(null);

    setFormData(emptyPrinterForm);
  };

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (
    field: keyof AddKioskPrinterPayload,
    value: string | boolean,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!kioskId || !accessToken) {
      toast.error(
        "Authentication information missing",
      );

      return;
    }

    if (!formData.name.trim()) {
      toast.error(
        "Printer name is required",
      );

      return;
    }

    try {
      setIsSubmitting(true);

      if (editingPrinter) {
        const payload: UpdateKioskPrinterPayload =
          {
            name: formData.name.trim(),
            model:
              formData.model?.trim() ||
              undefined,
            is_default:
              formData.is_default,
          };

        // FIX: accessToken first, then kioskId, printerId, payload —
        // matches updateKioskPrinter(accessToken, kioskId, printerId, payload)
        const updatedPrinter =
          await updateKioskPrinter(
            accessToken,
            kioskId,
            editingPrinter.id,
            payload,
          );

        setPrinters((previous) =>
          previous.map((printer) =>
            printer.id === editingPrinter.id
              ? updatedPrinter
              : updatedPrinter.is_default
                ? {
                    ...printer,
                    is_default: false,
                  }
                : printer,
          ),
        );

        toast.success(
          "Printer updated successfully",
        );
      } else {
        // FIX: accessToken first, then kioskId, then payload —
        // matches addKioskPrinter(accessToken, kioskId, payload)
        const newPrinter =
          await addKioskPrinter(
            accessToken,
            kioskId,
            {
              name:
                formData.name.trim(),
              model:
                formData.model?.trim() ||
                undefined,
              is_default:
                formData.is_default,
            },
          );

        setPrinters((previous) => {
          const updated = formData.is_default
            ? previous.map((printer) => ({
                ...printer,
                is_default: false,
              }))
            : previous;

          return [
            ...updated,
            newPrinter,
          ];
        });

        toast.success(
          "Printer added successfully",
        );
      }

      handleCloseForm();
    } catch (error) {
      console.error(
        "Printer operation failed:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Printer operation failed";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // DELETE PRINTER
  // ==========================================

  const handleDelete = async (
    printerId: string,
  ) => {
    if (!kioskId || !accessToken) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this printer?",
    );

    if (!confirmed) {
      return;
    }

    try {
      // FIX: accessToken first, then kioskId, then printerId —
      // matches deleteKioskPrinter(accessToken, kioskId, printerId)
      await deleteKioskPrinter(
        accessToken,
        kioskId,
        printerId,
      );

      setPrinters((previous) =>
        previous.filter(
          (printer) =>
            printer.id !== printerId,
        ),
      );

      toast.success(
        "Printer removed successfully",
      );
    } catch (error) {
      console.error(
        "Failed to delete printer:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove printer",
      );
    }
  };

  // ==========================================
  // SET DEFAULT
  // ==========================================

  const handleSetDefault = async (
    printer: KioskPrinter,
  ) => {
    if (!kioskId || !accessToken) {
      return;
    }

    if (printer.is_default) {
      return;
    }

    try {
      // FIX: accessToken first, then kioskId, printerId, payload —
      // matches updateKioskPrinter(accessToken, kioskId, printerId, payload)
      const updatedPrinter =
        await updateKioskPrinter(
          accessToken,
          kioskId,
          printer.id,
          {
            is_default: true,
          },
        );

      setPrinters((previous) =>
        previous.map((item) =>
          item.id === printer.id
            ? updatedPrinter
            : {
                ...item,
                is_default: false,
              },
        ),
      );

      toast.success(
        "Default printer updated",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update default printer",
      );
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">

        <div className="flex flex-col items-center gap-4">

          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />

          <p className="text-sm text-gray-500">
            Loading printers...
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-4">

          <button
            type="button"
            onClick={() =>
              navigate(`/sudo/kiosks/${kioskId}`)
            }
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-brand-purple"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>

            <div className="flex items-center gap-2">

              <Printer className="h-6 w-6 text-brand-purple" />

              <h1 className="text-2xl font-bold text-gray-900">
                Kiosk Printers
              </h1>

            </div>

            <p className="mt-2 text-sm text-gray-500">
              Manage printers connected to this kiosk.
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />

          Add Printer
        </button>

      </div>

      {/* PRINTER LIST */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        {printers.length === 0 ? (

          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">

              <Printer className="h-7 w-7 text-gray-400" />

            </div>

            <h2 className="mt-5 text-lg font-bold text-gray-900">
              No printers configured
            </h2>

            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Add a printer to start configuring printing services for this kiosk.
            </p>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />

              Add Printer
            </button>

          </div>

        ) : (

          <div className="divide-y divide-gray-100">

            {printers.map((printer) => (

              <div
                key={printer.id}
                className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between"
              >

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-brand-purple">

                    <Printer className="h-5 w-5" />

                  </div>

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="font-semibold text-gray-900">
                        {printer.name}
                      </h3>

                      {printer.is_default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                          <Star className="h-3 w-3" />
                          Default
                        </span>
                      )}

                    </div>

                    {printer.model && (
                      <p className="mt-1 text-sm text-gray-500">
                        {printer.model}
                      </p>
                    )}

                    <p className="mt-2 text-xs font-medium text-gray-400">
                      Status:{" "}
                      {printer.status ?? "active"}
                    </p>

                  </div>

                </div>

                <div className="flex flex-wrap gap-2">

                  {!printer.is_default && (

                    <button
                      type="button"
                      onClick={() =>
                        handleSetDefault(printer)
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Star className="h-4 w-4" />

                      Set Default
                    </button>

                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleOpenEdit(printer)
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(printer.id)
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* CREATE / EDIT MODAL */}

      {showCreateForm && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  {editingPrinter
                    ? "Edit Printer"
                    : "Add Printer"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Configure printer information.
                </p>

              </div>

              <button
                type="button"
                onClick={handleCloseForm}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit}>

              <div className="space-y-5 p-6">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Printer Name *
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      handleChange(
                        "name",
                        event.target.value,
                      )
                    }
                    placeholder="HP LaserJet Pro"
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Printer Model
                  </label>

                  <input
                    type="text"
                    value={formData.model ?? ""}
                    onChange={(event) =>
                      handleChange(
                        "model",
                        event.target.value,
                      )
                    }
                    placeholder="M404dn"
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                  />

                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-4">

                  <div>

                    <p className="text-sm font-semibold text-gray-900">
                      Default Printer
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Use this printer as the primary kiosk printer.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleChange(
                        "is_default",
                        !formData.is_default,
                      )
                    }
                    className={`relative flex h-7 w-12 items-center rounded-full transition ${
                      formData.is_default
                        ? "bg-brand-purple"
                        : "bg-gray-200"
                    }`}
                  >

                    <span
                      className={`absolute flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition ${
                        formData.is_default
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    >
                      {formData.is_default && (
                        <Check className="h-3 w-3 text-brand-purple" />
                      )}
                    </span>

                  </button>

                </label>

              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-5">

                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={isSubmitting}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {isSubmitting
                    ? "Saving..."
                    : editingPrinter
                      ? "Update Printer"
                      : "Add Printer"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}