import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import {
  createInstitution,
  createInstitutionAdmin,
  deleteInstitution,
  getInstitutions,
  updateInstitution,
} from "../../../api/institutionApi";

import type {
  CreateInstitutionPayload,
  Institution,
  InstitutionStatus,
  UpdateInstitutionPayload,
} from "../../../types/institution";

// ==========================================
// STATUS STYLES
// ==========================================

const statusStyles: Record<
  InstitutionStatus,
  string
> = {
  onboarding:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",

  active:
    "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",

  suspended:
    "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",

  inactive:
    "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200",
};

const statusDot: Record<
  InstitutionStatus,
  string
> = {
  onboarding: "bg-amber-500",
  active: "bg-emerald-500",
  suspended: "bg-red-500",
  inactive: "bg-gray-400",
};

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({
  status,
}: {
  status: InstitutionStatus;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`}
      />

      {status}
    </span>
  );
}

// ==========================================
// ACTIONS MENU
// ==========================================

interface ActionsMenuProps {
  institution: Institution;
  busy: boolean;
  onView: (institution: Institution) => void;
  onEdit: (institution: Institution) => void;
  onToggleStatus: (institution: Institution) => void;
  onDelete: (institution: Institution) => void;
}

function ActionsMenu({
  institution,
  busy,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: ActionsMenuProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [isOpen]);

  const isActive =
    institution.status === "active";

  const runAction = (
    action: () => void,
  ) => {
    setIsOpen(false);
    action();
  };

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          setIsOpen((value) => !value)
        }
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Institution actions"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreHorizontal className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
          <button
            type="button"
            onClick={() =>
              runAction(() =>
                onView(institution),
              )
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Eye className="h-4 w-4 text-gray-400" />
            View details
          </button>

          <button
            type="button"
            onClick={() =>
              runAction(() =>
                onEdit(institution),
              )
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4 text-gray-400" />
            Edit institution
          </button>

          <button
            type="button"
            onClick={() =>
              runAction(() =>
                onToggleStatus(institution),
              )
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Power className="h-4 w-4 text-gray-400" />

            {isActive
              ? "Suspend institution"
              : "Activate institution"}
          </button>

          <div className="my-1 border-t border-gray-100" />

          <button
            type="button"
            onClick={() =>
              runAction(() =>
                onDelete(institution),
              )
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete institution
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// CONFIRM DIALOG
// ==========================================

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {message}
            </p>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700"
                : "bg-brand-purple hover:opacity-90"
            }`}
          >
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// INPUT COMPONENT
// ==========================================

function FormInput({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  defaultValue,
  className = "",
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
  minLength?: number;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        required={required}
        type={type}
        name={name}
        defaultValue={defaultValue}
        minLength={minLength}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-purple-50"
      />
    </div>
  );
}

// ==========================================
// CREATE INSTITUTION MODAL
// ==========================================

interface CreateInstitutionModalProps {
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
}

function CreateInstitutionModal({
  isCreating,
  onClose,
  onSubmit,
}: CreateInstitutionModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create Institution
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Create the institution and its first administrator.
              </p>
            </div>

            <button
              type="button"
              disabled={isCreating}
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-7 p-6"
        >
          <section>
            <div className="mb-4">
              <h3 className="font-bold text-gray-900">
                Institution Details
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Basic information for the institution.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                label="Institution Name"
                name="institutionName"
                placeholder="ABC College"
                required
              />

              <FormInput
                label="Institution Code"
                name="institutionCode"
                placeholder="ABC001"
                required
              />

              <FormInput
                label="Contact Email"
                name="contactEmail"
                type="email"
                placeholder="admin@college.com"
                required
              />

              <FormInput
                label="Contact Phone"
                name="contactPhone"
                placeholder="+91 98765 43210"
              />

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Initial Status
                </label>

                <select
                  name="status"
                  defaultValue="onboarding"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-purple-50"
                >
                  <option value="onboarding">
                    Onboarding
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="suspended">
                    Suspended
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-100 pt-7">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
                <Users className="h-4 w-4 text-brand-purple" />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  Institution Administrator
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  The first admin account for this institution.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                label="Administrator Name"
                name="adminName"
                placeholder="John Doe"
                required
              />

              <FormInput
                label="Administrator Email"
                name="adminEmail"
                type="email"
                placeholder="john@college.com"
                required
              />

              <FormInput
                label="Administrator Password"
                name="adminPassword"
                type="password"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                className="sm:col-span-2"
              />
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              type="button"
              disabled={isCreating}
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isCreating && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {isCreating
                ? "Creating..."
                : "Create Institution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// EDIT INSTITUTION MODAL
// ==========================================

function EditInstitutionModal({
  institution,
  isSaving,
  onClose,
  onSubmit,
}: {
  institution: Institution;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Edit Institution
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update institution information.
            </p>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-7 space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput
              label="Institution Name"
              name="name"
              placeholder="Institution name"
              required
              defaultValue={institution.name}
            />

            <FormInput
              label="Institution Code"
              name="code"
              placeholder="Institution code"
              required
              defaultValue={institution.code}
            />

            <FormInput
              label="Contact Email"
              name="contact_email"
              type="email"
              placeholder="Contact email"
              required
              defaultValue={institution.contact_email}
            />

            <FormInput
              label="Contact Phone"
              name="contact_phone"
              placeholder="Contact phone"
              defaultValue={
                institution.contact_phone ?? ""
              }
            />

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Status
              </label>

              <select
                name="status"
                defaultValue={institution.status}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-purple-50"
              >
                <option value="onboarding">
                  Onboarding
                </option>

                <option value="active">
                  Active
                </option>

                <option value="suspended">
                  Suspended
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isSaving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {isSaving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// SUMMARY CARD
// ==========================================

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-brand-purple">
          {icon}
        </div>

        <span className="text-2xl font-bold text-gray-900">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-gray-500">
        {label}
      </p>
    </div>
  );
}

// ==========================================
// PENDING ACTION
// ==========================================

type PendingAction =
  | {
      type: "toggle";
      institution: Institution;
    }
  | {
      type: "delete";
      institution: Institution;
    }
  | null;

// ==========================================
// MAIN PAGE
// ==========================================

export default function InstitutionsPage() {
  const navigate = useNavigate();

  const { accessToken } =
    useSudoAuth();

  const [
    institutions,
    setInstitutions,
  ] = useState<Institution[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    isCreateOpen,
    setIsCreateOpen,
  ] = useState(false);

  const [
    isCreating,
    setIsCreating,
  ] = useState(false);

  const [
    editingInstitution,
    setEditingInstitution,
  ] = useState<Institution | null>(
    null,
  );

  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const [
    pendingAction,
    setPendingAction,
  ] = useState<PendingAction>(null);

  const [
    isActionLoading,
    setIsActionLoading,
  ] = useState(false);

  const [
    busyId,
    setBusyId,
  ] = useState<string | null>(null);

  // ==========================================
  // LOAD INSTITUTIONS
  // ==========================================

  const loadInstitutions = async () => {
    if (!accessToken) {
      return;
    }

    try {
      setIsLoading(true);

      const data =
        await getInstitutions(
          accessToken,
        );

      setInstitutions(data);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load institutions",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInstitutions();
  }, [accessToken]);

  // ==========================================
  // CREATE
  // ==========================================

  const handleCreateInstitution = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!accessToken) {
      toast.error(
        "Unauthorized. Please login again.",
      );
      return;
    }

    const formData =
      new FormData(
        event.currentTarget,
      );

    const institutionPayload: CreateInstitutionPayload = {
      name: String(
        formData.get("institutionName") || "",
      ).trim(),

      code: String(
        formData.get("institutionCode") || "",
      ).trim(),

      status:
        formData.get("status") as InstitutionStatus,

      contact_email: String(
        formData.get("contactEmail") || "",
      ).trim(),

      contact_phone: String(
        formData.get("contactPhone") || "",
      ).trim(),
    };

    const adminName = String(
      formData.get("adminName") || "",
    ).trim();

    const adminEmail = String(
      formData.get("adminEmail") || "",
    ).trim();

    const adminPassword = String(
      formData.get("adminPassword") || "",
    );

    try {
      setIsCreating(true);

      const institution =
        await createInstitution(
          institutionPayload,
          accessToken,
        );

      try {
        await createInstitutionAdmin(
          institution.id,
          {
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: "admin",
          },
          accessToken,
        );

        toast.success(
          "Institution and administrator created successfully",
        );
      } catch (adminError) {
        console.error(adminError);

        toast.warning(
          "Institution created, but administrator creation failed.",
        );
      }

      setIsCreateOpen(false);

      await loadInstitutions();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create institution",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !accessToken ||
      !editingInstitution
    ) {
      toast.error(
        "Unauthorized. Please login again.",
      );
      return;
    }

    const formData =
      new FormData(
        event.currentTarget,
      );

    const payload: UpdateInstitutionPayload = {
      name: String(
        formData.get("name") || "",
      ).trim(),

      code: String(
        formData.get("code") || "",
      ).trim(),

      status:
        formData.get("status") as InstitutionStatus,

      contact_email: String(
        formData.get("contact_email") || "",
      ).trim(),

      contact_phone: String(
        formData.get("contact_phone") || "",
      ).trim(),
    };

    try {
      setIsEditing(true);

      await updateInstitution(
        editingInstitution.id,
        payload,
        accessToken,
      );

      toast.success(
        "Institution updated successfully",
      );

      setEditingInstitution(null);

      await loadInstitutions();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update institution",
      );
    } finally {
      setIsEditing(false);
    }
  };

  // ==========================================
  // TOGGLE STATUS
  // ==========================================

  const handleToggleStatus = async (
    institution: Institution,
  ) => {
    if (!accessToken) {
      toast.error(
        "Unauthorized. Please login again.",
      );
      return;
    }

    const nextStatus: InstitutionStatus =
      institution.status === "active"
        ? "suspended"
        : "active";

    try {
      setIsActionLoading(true);
      setBusyId(institution.id);

      await updateInstitution(
        institution.id,
        {
          status: nextStatus,
        },
        accessToken,
      );

      toast.success(
        nextStatus === "active"
          ? "Institution activated"
          : "Institution suspended",
      );

      setPendingAction(null);

      await loadInstitutions();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update institution status",
      );
    } finally {
      setIsActionLoading(false);
      setBusyId(null);
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (
    institution: Institution,
  ) => {
    if (!accessToken) {
      toast.error(
        "Unauthorized. Please login again.",
      );
      return;
    }

    try {
      setIsActionLoading(true);
      setBusyId(institution.id);

      await deleteInstitution(
        institution.id,
        accessToken,
      );

      toast.success(
        "Institution deleted successfully",
      );

      setPendingAction(null);

      await loadInstitutions();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete institution",
      );
    } finally {
      setIsActionLoading(false);
      setBusyId(null);
    }
  };

  // ==========================================
  // FILTER
  // ==========================================

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredInstitutions =
    institutions.filter(
      (institution) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          institution.name
            .toLowerCase()
            .includes(normalizedSearch) ||
          institution.code
            .toLowerCase()
            .includes(normalizedSearch) ||
          institution.contact_email
            .toLowerCase()
            .includes(normalizedSearch)
        );
      },
    );

  const activeCount =
    institutions.filter(
      (institution) =>
        institution.status === "active",
    ).length;

  const onboardingCount =
    institutions.filter(
      (institution) =>
        institution.status === "onboarding",
    ).length;

  const suspendedCount =
    institutions.filter(
      (institution) =>
        institution.status === "suspended",
    ).length;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-7">
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">
              <Building2 className="h-5 w-5 text-brand-purple" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Institutions
              </h1>

              <p className="mt-0.5 text-sm text-gray-500">
                Manage institutions and their administrators.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsCreateOpen(true)
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Institution
        </button>
      </div>

      {/* ====================================== */}
      {/* SUMMARY */}
      {/* ====================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={
            <Building2 className="h-5 w-5" />
          }
          label="Total Institutions"
          value={institutions.length}
        />

        <SummaryCard
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          label="Active"
          value={activeCount}
        />

        <SummaryCard
          icon={
            <RefreshCw className="h-5 w-5" />
          }
          label="Onboarding"
          value={onboardingCount}
        />

        <SummaryCard
          icon={
            <Power className="h-5 w-5" />
          }
          label="Suspended"
          value={suspendedCount}
        />
      </div>

      {/* ====================================== */}
      {/* SEARCH */}
      {/* ====================================== */}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by institution, code or email..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-purple-50"
          />
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={() =>
            void loadInstitutions()
          }
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isLoading
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* ====================================== */}
      {/* TABLE */}
      {/* ====================================== */}

      <div className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
          </div>
        ) : filteredInstitutions.length ===
          0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50">
              <Building2 className="h-7 w-7 text-brand-purple" />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              No institutions found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              {search
                ? "Try a different search term."
                : "Create your first institution to get started."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={() =>
                  setIsCreateOpen(true)
                }
                className="mt-5 flex items-center gap-2 rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Add Institution
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE HEADER */}

            <div className="hidden grid-cols-[minmax(260px,1.6fr)_140px_minmax(220px,1fr)_130px_60px] items-center gap-4 border-b border-gray-100 bg-gray-50/70 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 lg:grid">
              <span>Institution</span>
              <span>Code</span>
              <span>Contact</span>
              <span>Status</span>
              <span />
            </div>

            <div className="divide-y divide-gray-100">
              {filteredInstitutions.map(
                (institution) => (
                  <div
                    key={institution.id}
                    className="group"
                  >
                    {/* DESKTOP */}

                    <div className="hidden grid-cols-[minmax(260px,1.6fr)_140px_minmax(220px,1fr)_130px_60px] items-center gap-4 px-6 py-4 transition hover:bg-gray-50 lg:grid">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/sudo/institutions/${institution.id}`,
                          )
                        }
                        className="flex min-w-0 items-center gap-3 text-left"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                          <Building2 className="h-5 w-5 text-brand-purple" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-brand-purple">
                            {institution.name}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
                            View institution details
                          </p>
                        </div>
                      </button>

                      <span className="text-sm font-medium text-gray-600">
                        {institution.code}
                      </span>

                      <span className="truncate text-sm text-gray-500">
                        {institution.contact_email}
                      </span>

                      <StatusBadge
                        status={
                          institution.status
                        }
                      />

                      <ActionsMenu
                        institution={
                          institution
                        }
                        busy={
                          busyId ===
                          institution.id
                        }
                        onView={(item) =>
                          navigate(
                            `/sudo/institutions/${item.id}`,
                          )
                        }
                        onEdit={
                          setEditingInstitution
                        }
                        onToggleStatus={(
                          item,
                        ) =>
                          setPendingAction({
                            type: "toggle",
                            institution:
                              item,
                          })
                        }
                        onDelete={(item) =>
                          setPendingAction({
                            type: "delete",
                            institution:
                              item,
                          })
                        }
                      />
                    </div>

                    {/* MOBILE / TABLET */}

                    <div className="flex items-center gap-3 px-4 py-4 lg:hidden">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/sudo/institutions/${institution.id}`,
                          )
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                          <Building2 className="h-5 w-5 text-brand-purple" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {institution.name}
                            </p>

                            <StatusBadge
                              status={
                                institution.status
                              }
                            />
                          </div>

                          <p className="mt-1 truncate text-xs text-gray-500">
                            {institution.code} ·{" "}
                            {institution.contact_email}
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                      </button>

                      <ActionsMenu
                        institution={
                          institution
                        }
                        busy={
                          busyId ===
                          institution.id
                        }
                        onView={(item) =>
                          navigate(
                            `/sudo/institutions/${item.id}`,
                          )
                        }
                        onEdit={
                          setEditingInstitution
                        }
                        onToggleStatus={(
                          item,
                        ) =>
                          setPendingAction({
                            type: "toggle",
                            institution:
                              item,
                          })
                        }
                        onDelete={(item) =>
                          setPendingAction({
                            type: "delete",
                            institution:
                              item,
                          })
                        }
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </div>

      {/* ====================================== */}
      {/* CREATE */}
      {/* ====================================== */}

      {isCreateOpen && (
        <CreateInstitutionModal
          isCreating={isCreating}
          onClose={() =>
            setIsCreateOpen(false)
          }
          onSubmit={
            handleCreateInstitution
          }
        />
      )}

      {/* ====================================== */}
      {/* EDIT */}
      {/* ====================================== */}

      {editingInstitution && (
        <EditInstitutionModal
          institution={
            editingInstitution
          }
          isSaving={isEditing}
          onClose={() =>
            setEditingInstitution(null)
          }
          onSubmit={handleEdit}
        />
      )}

      {/* ====================================== */}
      {/* TOGGLE CONFIRM */}
      {/* ====================================== */}

      {pendingAction?.type ===
        "toggle" && (
        <ConfirmDialog
          title={
            pendingAction.institution
              .status === "active"
              ? "Suspend institution?"
              : "Activate institution?"
          }
          message={`This will ${
            pendingAction.institution
              .status === "active"
              ? "suspend"
              : "activate"
          } "${pendingAction.institution.name}".`}
          confirmLabel={
            pendingAction.institution
              .status === "active"
              ? "Suspend"
              : "Activate"
          }
          isLoading={
            isActionLoading
          }
          onConfirm={() =>
            void handleToggleStatus(
              pendingAction.institution,
            )
          }
          onCancel={() =>
            setPendingAction(null)
          }
        />
      )}

      {/* ====================================== */}
      {/* DELETE CONFIRM */}
      {/* ====================================== */}

      {pendingAction?.type ===
        "delete" && (
        <ConfirmDialog
          title="Delete institution?"
          message={`This will permanently remove "${pendingAction.institution.name}" from the institution list.`}
          confirmLabel="Delete"
          isDangerous
          isLoading={
            isActionLoading
          }
          onConfirm={() =>
            void handleDelete(
              pendingAction.institution,
            )
          }
          onCancel={() =>
            setPendingAction(null)
          }
        />
      )}
    </div>
  );
}