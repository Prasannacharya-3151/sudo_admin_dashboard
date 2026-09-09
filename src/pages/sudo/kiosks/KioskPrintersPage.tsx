import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
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
  getKioskPrinters,
  removeKioskPrinter,
} from "../../../api/kioskApi";

import type { AddKioskPrinterPayload, KioskPrinter } from "../../../types/kiosk";

// ==========================================
// EMPTY FORM
// ==========================================

const emptyPrinterForm: AddKioskPrinterPayload = {
  manufacturer: "",
  model: "",
  serial_number: "",
};

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

export default function KioskPrintersPage() {
  const navigate = useNavigate();

  const { kioskId } = useParams<{ kioskId: string }>();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [printers, setPrinters] = useState<KioskPrinter[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] =
    useState<AddKioskPrinterPayload>(emptyPrinterForm);

  // ==========================================
  // LOAD PRINTERS
  // ==========================================

  const loadPrinters = useCallback(async () => {
    if (!kioskId) {
      toast.error("Kiosk ID is missing");
      navigate("/sudo/kiosks");
      return;
    }

    if (!accessToken) {
      toast.error("Authentication required");
      navigate("/sudo/login");
      return;
    }

    try {
      setIsLoading(true);

      const data = await getKioskPrinters(accessToken, kioskId);

      setPrinters(data);
    } catch (error) {
      console.error("Failed to load printers:", error);

      const message =
        error instanceof Error ? error.message : "Failed to load printers";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [kioskId, accessToken, navigate]);

  useEffect(() => {
    void loadPrinters();
  }, [loadPrinters]);

  // ==========================================
  // OPEN / CLOSE CREATE FORM
  // ==========================================

  const handleOpenCreate = () => {
    setFormData(emptyPrinterForm);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setFormData(emptyPrinterForm);
  };

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (
    field: keyof AddKioskPrinterPayload,
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================
  // CREATE — new printer automatically becomes
  // the default printer (server-decided, per spec)
  // ==========================================

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!kioskId || !accessToken) {
      toast.error("Authentication information missing");
      return;
    }

    if (
      !formData.manufacturer.trim() ||
      !formData.model.trim() ||
      !formData.serial_number.trim()
    ) {
      toast.error("Manufacturer, model, and serial number are all required");
      return;
    }

    try {
      setIsSubmitting(true);

      const newPrinter = await addKioskPrinter(accessToken, kioskId, {
        manufacturer: formData.manufacturer.trim(),
        model: formData.model.trim(),
        serial_number: formData.serial_number.trim(),
      });

      setPrinters((previous) => {
        // newPrinter becomes the default automatically — reflect that
        // by clearing is_default on the rest of the local list
        const updated = previous.map((printer) => ({
          ...printer,
          is_default: false,
        }));

        return [...updated, newPrinter];
      });

      toast.success("Printer added successfully");

      handleCloseForm();
    } catch (error) {
      console.error("Failed to add printer:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to add printer",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // REMOVE PRINTER
  // ==========================================

  const handleRemove = async (printerId: string) => {
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
      setRemovingId(printerId);

      await removeKioskPrinter(accessToken, kioskId, printerId);

      setPrinters((previous) =>
        previous.filter((printer) => printer.id !== printerId),
      );

      toast.success("Printer removed successfully");
    } catch (error) {
      console.error("Failed to remove printer:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to remove printer",
      );
    } finally {
      setRemovingId(null);
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
          <p className="text-sm text-gray-500">Loading printers...</p>
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
            onClick={() => navigate(`/sudo/kiosks/${kioskId}`)}
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
              Manage printers connected to this kiosk. The most recently added
              printer automatically becomes the default.
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
              Add a printer to start configuring printing services for this
              kiosk.
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
                        {printer.manufacturer} {printer.model}
                      </h3>

                      {printer.is_default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                          <Star className="h-3 w-3" />
                          Default
                        </span>
                      )}

                      {printer.removed_at && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                          Removed
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      Serial: {printer.serial_number}
                    </p>

                    <p className="mt-2 text-xs font-medium text-gray-400">
                      Installed: {formatDate(printer.installed_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRemove(printer.id)}
                    disabled={removingId === printer.id}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {removingId === printer.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL — no edit modal: there is no update-printer endpoint */}

      {showCreateForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Add Printer
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
                    Manufacturer *
                  </label>

                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(event) =>
                      handleChange("manufacturer", event.target.value)
                    }
                    placeholder="HP"
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Model *
                  </label>

                  <input
                    type="text"
                    value={formData.model}
                    onChange={(event) =>
                      handleChange("model", event.target.value)
                    }
                    placeholder="LaserJet Pro M404dn"
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Serial Number *
                  </label>

                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(event) =>
                      handleChange("serial_number", event.target.value)
                    }
                    placeholder="SN-00123456"
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                  />
                </div>

                <p className="rounded-xl bg-purple-50 p-3 text-xs leading-5 text-brand-purple">
                  This printer will automatically become the default printer
                  for this kiosk once added.
                </p>
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

                  {isSubmitting ? "Saving..." : "Add Printer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}