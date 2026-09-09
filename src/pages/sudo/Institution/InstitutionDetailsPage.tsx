import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Edit3,
  Loader2,
  Mail,
  Phone,
  Plus,
  Power,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import {
  createInstitutionAdmin,
  deleteInstitution,
  deleteInstitutionStaff,
  getInstitutionById,
  getInstitutionStaff,
  updateInstitution,
  updateInstitutionStaff,
} from "../../../api/institutionApi";

import type {
  CreateInstitutionAdminPayload,
  InstitutionDetails,
  InstitutionStaff,
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

function InstitutionStatusBadge({
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
// STAFF STATUS BADGE
// ==========================================

function StaffStatusBadge({
  status,
}: {
  status: InstitutionStaff["status"];
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
        status === "active"
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
          : "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "active"
            ? "bg-emerald-500"
            : "bg-gray-400"
        }`}
      />

      {status}
    </span>
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
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
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
// FORM INPUT
// ==========================================

function FormInput({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  defaultValue,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
  minLength?: number;
}) {
  return (
    <div>
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
// EDIT INSTITUTION
// ==========================================

function EditInstitutionModal({
  institution,
  isSaving,
  onClose,
  onSaved,
}: {
  institution: InstitutionDetails;
  isSaving: boolean;
  onClose: () => void;
  onSaved: (
    payload: UpdateInstitutionPayload,
  ) => Promise<void>;
}) {
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

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

    await onSaved(payload);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 py-5">
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
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
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
              defaultValue={
                institution.contact_email
              }
            />

            <FormInput
              label="Contact Phone"
              name="contact_phone"
              placeholder="Contact phone"
              defaultValue={
                institution.contact_phone ??
                ""
              }
            />

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Status
              </label>

              <select
                name="status"
                defaultValue={
                  institution.status
                }
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
// ADD ADMIN
// ==========================================

function AddAdministratorModal({
  isCreating,
  onClose,
  onCreated,
}: {
  isCreating: boolean;
  onClose: () => void;
  onCreated: (
    payload: CreateInstitutionAdminPayload,
  ) => Promise<void>;
}) {
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const formData =
      new FormData(
        event.currentTarget,
      );

    const payload: CreateInstitutionAdminPayload = {
      name: String(
        formData.get("name") || "",
      ).trim(),

      email: String(
        formData.get("email") || "",
      ).trim(),

      password: String(
        formData.get("password") || "",
      ),

      role: "admin",
    };

    await onCreated(payload);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Add Administrator
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create an administrator for this institution.
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

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-5"
        >
          <FormInput
            label="Administrator Name"
            name="name"
            placeholder="Administrator name"
            required
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            placeholder="administrator@college.com"
            required
          />

          <FormInput
            label="Password"
            name="password"
            type="password"
            placeholder="Minimum 8 characters"
            required
            minLength={8}
          />

          <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-purple" />

              <span className="text-sm font-semibold text-gray-900">
                Administrator role
              </span>
            </div>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              This account will be created with the
              administrator role.
            </p>
          </div>

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
                : "Create Administrator"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
// INFO ITEM
// ==========================================

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// PENDING ACTION
// ==========================================

type PendingAction =
  | {
      type: "institution-status";
      institution: InstitutionDetails;
    }
  | {
      type: "institution-delete";
      institution: InstitutionDetails;
    }
  | {
      type: "staff-status";
      staff: InstitutionStaff;
    }
  | {
      type: "staff-delete";
      staff: InstitutionStaff;
    }
  | null;

// ==========================================
// MAIN PAGE
// ==========================================

type ActiveTab =
  | "overview"
  | "administrators";

export default function InstitutionDetailsPage() {
  const navigate = useNavigate();

  const { institutionId } =
    useParams<{
      institutionId: string;
    }>();

  const { accessToken } =
    useSudoAuth();

  const [
    institution,
    setInstitution,
  ] = useState<InstitutionDetails | null>(
    null,
  );

  const [
    staff,
    setStaff,
  ] = useState<InstitutionStaff[]>(
    [],
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isStaffLoading,
    setIsStaffLoading,
  ] = useState(false);

  const [
    activeTab,
    setActiveTab,
  ] = useState<ActiveTab>(
    "overview",
  );

  const [
    isEditOpen,
    setIsEditOpen,
  ] = useState(false);

  const [
    isAddAdminOpen,
    setIsAddAdminOpen,
  ] = useState(false);

  const [
    isEditSaving,
    setIsEditSaving,
  ] = useState(false);

  const [
    isAdminCreating,
    setIsAdminCreating,
  ] = useState(false);

  const [
    isActionLoading,
    setIsActionLoading,
  ] = useState(false);

  const [
    pendingAction,
    setPendingAction,
  ] = useState<PendingAction>(null);

  // ==========================================
  // LOAD INSTITUTION
  // ==========================================

  const loadInstitution = async () => {
    if (
      !accessToken ||
      !institutionId
    ) {
      return;
    }

    try {
      setIsLoading(true);

      const data =
        await getInstitutionById(
          institutionId,
          accessToken,
        );

      setInstitution(data);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load institution",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // LOAD STAFF
  // ==========================================

  const loadStaff = async () => {
    if (
      !accessToken ||
      !institutionId
    ) {
      return;
    }

    try {
      setIsStaffLoading(true);

      const data =
        await getInstitutionStaff(
          institutionId,
          accessToken,
        );

      setStaff(data);
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load administrators",
      );
    } finally {
      setIsStaffLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    void loadInstitution();
  }, [
    accessToken,
    institutionId,
  ]);

  // ==========================================
  // STAFF LOAD
  // ==========================================

  useEffect(() => {
    if (
      activeTab ===
      "administrators"
    ) {
      void loadStaff();
    }
  }, [
    activeTab,
    accessToken,
    institutionId,
  ]);

  // ==========================================
  // EDIT INSTITUTION
  // ==========================================

  const handleUpdateInstitution =
    async (
      payload: UpdateInstitutionPayload,
    ) => {
      if (
        !accessToken ||
        !institution
      ) {
        toast.error(
          "Unauthorized. Please login again.",
        );
        return;
      }

      try {
        setIsEditSaving(true);

        await updateInstitution(
          institution.id,
          payload,
          accessToken,
        );

        toast.success(
          "Institution updated successfully",
        );

        setIsEditOpen(false);

        await loadInstitution();
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update institution",
        );
      } finally {
        setIsEditSaving(false);
      }
    };

  // ==========================================
  // ADD ADMIN
  // ==========================================

  const handleCreateAdmin =
    async (
      payload: CreateInstitutionAdminPayload,
    ) => {
      if (
        !accessToken ||
        !institutionId
      ) {
        toast.error(
          "Unauthorized. Please login again.",
        );
        return;
      }

      try {
        setIsAdminCreating(true);

        await createInstitutionAdmin(
          institutionId,
          payload,
          accessToken,
        );

        toast.success(
          "Administrator created successfully",
        );

        setIsAddAdminOpen(false);

        await loadStaff();
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create administrator",
        );
      } finally {
        setIsAdminCreating(false);
      }
    };

  // ==========================================
  // TOGGLE INSTITUTION
  // ==========================================

  const handleToggleInstitutionStatus =
    async (
      target: InstitutionDetails,
    ) => {
      if (!accessToken) {
        toast.error(
          "Unauthorized. Please login again.",
        );
        return;
      }

      const nextStatus: InstitutionStatus =
        target.status === "active"
          ? "suspended"
          : "active";

      try {
        setIsActionLoading(true);

        await updateInstitution(
          target.id,
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

        await loadInstitution();
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update institution status",
        );
      } finally {
        setIsActionLoading(false);
      }
    };

  // ==========================================
  // DELETE INSTITUTION
  // ==========================================

  const handleDeleteInstitution =
    async (
      target: InstitutionDetails,
    ) => {
      if (!accessToken) {
        toast.error(
          "Unauthorized. Please login again.",
        );
        return;
      }

      try {
        setIsActionLoading(true);

        await deleteInstitution(
          target.id,
          accessToken,
        );

        toast.success(
          "Institution deleted successfully",
        );

        setPendingAction(null);

        navigate(
          "/sudo/institutions",
          {
            replace: true,
          },
        );
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to delete institution",
        );
      } finally {
        setIsActionLoading(false);
      }
    };

  // ==========================================
  // TOGGLE STAFF
  // ==========================================

  const handleToggleStaffStatus =
    async (
      target: InstitutionStaff,
    ) => {
      if (
        !accessToken ||
        !institutionId
      ) {
        toast.error(
          "Unauthorized. Please login again.",
        );
        return;
      }

      const nextStatus =
        target.status === "active"
          ? "inactive"
          : "active";

      try {
        setIsActionLoading(true);

        await updateInstitutionStaff(
          institutionId,
          target.id,
          {
            status: nextStatus,
          },
          accessToken,
        );

        toast.success(
          nextStatus === "active"
            ? "Administrator activated"
            : "Administrator deactivated",
        );

        setPendingAction(null);

        await loadStaff();
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update administrator",
        );
      } finally {
        setIsActionLoading(false);
      }
    };

  // ==========================================
  // DELETE STAFF
  // ==========================================

  const handleDeleteStaff =
    async (
      target: InstitutionStaff,
    ) => {
      if (
        !accessToken ||
        !institutionId
      ) {
        toast.error(
          "Unauthorized. Please login again.",
        );
        return;
      }

      try {
        setIsActionLoading(true);

        await deleteInstitutionStaff(
          institutionId,
          target.id,
          accessToken,
        );

        toast.success(
          "Administrator removed successfully",
        );

        setPendingAction(null);

        await loadStaff();
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to remove administrator",
        );
      } finally {
        setIsActionLoading(false);
      }
    };

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  // ==========================================
  // NOT FOUND
  // ==========================================

  if (!institution) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">
          <Building2 className="h-8 w-8 text-brand-purple" />
        </div>

        <h2 className="mt-5 text-xl font-bold text-gray-900">
          Institution not found
        </h2>

        <p className="mt-2 max-w-md text-sm text-gray-500">
          We couldn't load the requested institution.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/sudo/institutions",
            )
          }
          className="mt-6 flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Institutions
        </button>
      </div>
    );
  }

  const stats =
    institution.stats;

  const activeStaffCount =
    staff.filter(
      (member) =>
        member.status === "active",
    ).length;

  const adminCount =
    staff.filter(
      (member) =>
        member.role === "admin",
    ).length;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-7">
      {/* ====================================== */}
      {/* BREADCRUMB */}
      {/* ====================================== */}

      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/sudo/institutions",
            )
          }
          className="font-medium text-gray-400 transition hover:text-gray-700"
        >
          Institutions
        </button>

        <ChevronRight className="h-4 w-4 text-gray-300" />

        <span className="font-semibold text-gray-700">
          {institution.name}
        </span>
      </div>

      {/* ====================================== */}
      {/* HERO */}
      {/* ====================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50">
              <Building2 className="h-7 w-7 text-brand-purple" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {institution.name}
                </h1>

                <InstitutionStatusBadge
                  status={
                    institution.status
                  }
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span className="font-semibold text-gray-600">
                  {institution.code}
                </span>

                <span>•</span>

                <span className="break-all">
                  {institution.contact_email}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setIsEditOpen(true)
              }
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                setPendingAction({
                  type: "institution-status",
                  institution,
                })
              }
              className="flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Power className="h-4 w-4" />

              {institution.status ===
              "active"
                ? "Suspend"
                : "Activate"}
            </button>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* TABS */}
      {/* ====================================== */}

      <div className="border-b border-gray-200">
        <div className="flex gap-7">
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "overview",
              )
            }
            className={`relative flex items-center gap-2 pb-4 text-sm font-semibold transition ${
              activeTab === "overview"
                ? "text-brand-purple"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <Building2 className="h-4 w-4" />

            Overview

            {activeTab ===
              "overview" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-purple" />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "administrators",
              )
            }
            className={`relative flex items-center gap-2 pb-4 text-sm font-semibold transition ${
              activeTab ===
              "administrators"
                ? "text-brand-purple"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <Users className="h-4 w-4" />

            Administrators

            {activeTab ===
              "administrators" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-purple" />
            )}
          </button>
        </div>
      </div>

      {/* ====================================== */}
      {/* OVERVIEW */}
      {/* ====================================== */}

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* STATS */}

          {stats && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.kiosks !==
                undefined && (
                <StatCard
                  icon={
                    <Building2 className="h-5 w-5" />
                  }
                  label="Kiosks"
                  value={
                    stats.kiosks
                  }
                />
              )}

              {stats.machines !==
                undefined && (
                <StatCard
                  icon={
                    <Power className="h-5 w-5" />
                  }
                  label="Machines"
                  value={
                    stats.machines
                  }
                />
              )}

              {stats.administrators !==
                undefined && (
                <StatCard
                  icon={
                    <ShieldCheck className="h-5 w-5" />
                  }
                  label="Administrators"
                  value={
                    stats.administrators
                  }
                />
              )}

              {stats.staff !==
                undefined && (
                <StatCard
                  icon={
                    <Users className="h-5 w-5" />
                  }
                  label="Staff"
                  value={
                    stats.staff
                  }
                />
              )}
            </div>
          )}

          {/* MAIN INFORMATION */}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Institution Information
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Basic information about this institution.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsEditOpen(true)
                  }
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </button>
              </div>

              <div className="mt-7 grid gap-7 sm:grid-cols-2">
                <InfoItem
                  icon={
                    <Building2 className="h-4 w-4" />
                  }
                  label="Institution Name"
                  value={
                    institution.name
                  }
                />

                <InfoItem
                  icon={
                    <ShieldCheck className="h-4 w-4" />
                  }
                  label="Institution Code"
                  value={
                    institution.code
                  }
                />

                <InfoItem
                  icon={
                    <Mail className="h-4 w-4" />
                  }
                  label="Contact Email"
                  value={
                    institution.contact_email
                  }
                />

                <InfoItem
                  icon={
                    <Phone className="h-4 w-4" />
                  }
                  label="Contact Phone"
                  value={
                    institution.contact_phone ||
                    "Not provided"
                  }
                />

                <InfoItem
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  label="Created"
                  value={new Date(
                    institution.created_at,
                  ).toLocaleDateString(
                    undefined,
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                />

                <InfoItem
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  label="Last Updated"
                  value={new Date(
                    institution.updated_at,
                  ).toLocaleDateString(
                    undefined,
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                />
              </div>
            </div>

            {/* STATUS */}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Institution Status
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current operational status.
              </p>

              <div className="mt-7">
                <InstitutionStatusBadge
                  status={
                    institution.status
                  }
                />
              </div>

              <div className="mt-7 space-y-3 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() =>
                    setPendingAction({
                      type: "institution-status",
                      institution,
                    })
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <Power className="h-4 w-4" />

                  {institution.status ===
                  "active"
                    ? "Suspend Institution"
                    : "Activate Institution"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPendingAction({
                      type: "institution-delete",
                      institution,
                    })
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Institution
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVE RESOURCES */}

          {stats &&
            (stats.active_kiosks !==
              undefined ||
              stats.active_machines !==
                undefined) && (
              <div className="grid gap-6 sm:grid-cols-2">
                {stats.active_kiosks !==
                  undefined && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Active Kiosks
                        </p>

                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          {
                            stats.active_kiosks
                          }
                        </p>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                        <Check className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                )}

                {stats.active_machines !==
                  undefined && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Active Machines
                        </p>

                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          {
                            stats.active_machines
                          }
                        </p>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                        <Check className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {/* ====================================== */}
      {/* ADMINISTRATORS */}
      {/* ====================================== */}

      {activeTab ===
        "administrators" && (
        <div className="space-y-6">
          {/* HEADER */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Administrators
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage accounts belonging to this institution.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsAddAdminOpen(true)
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Administrator
            </button>
          </div>

          {/* SUMMARY */}

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={
                <Users className="h-5 w-5" />
              }
              label="Total Accounts"
              value={
                staff.length
              }
            />

            <StatCard
              icon={
                <Check className="h-5 w-5" />
              }
              label="Active Accounts"
              value={
                activeStaffCount
              }
            />

            <StatCard
              icon={
                <ShieldCheck className="h-5 w-5" />
              }
              label="Administrators"
              value={
                adminCount
              }
            />
          </div>

          {/* STAFF LIST */}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {isStaffLoading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
              </div>
            ) : staff.length ===
              0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50">
                  <Users className="h-7 w-7 text-brand-purple" />
                </div>

                <h3 className="mt-4 font-semibold text-gray-900">
                  No administrators found
                </h3>

                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Add an administrator to start managing this institution.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setIsAddAdminOpen(
                      true,
                    )
                  }
                  className="mt-5 flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Add Administrator
                </button>
              </div>
            ) : (
              <>
                {/* TABLE HEADER */}

                <div className="hidden grid-cols-[minmax(240px,1.5fr)_150px_130px_200px] items-center gap-4 border-b border-gray-100 bg-gray-50/70 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 md:grid">
                  <span>Administrator</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span className="text-right">
                    Actions
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {staff.map(
                    (member) => (
                      <div
                        key={
                          member.id
                        }
                        className="flex flex-col gap-4 px-5 py-5 transition hover:bg-gray-50 md:grid md:grid-cols-[minmax(240px,1.5fr)_150px_130px_200px] md:items-center md:gap-4 md:px-6"
                      >
                        {/* USER */}

                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50">
                            <User className="h-5 w-5 text-brand-purple" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {
                                member.name
                              }
                            </p>

                            <p className="mt-1 truncate text-sm text-gray-500">
                              {
                                member.email
                              }
                            </p>
                          </div>
                        </div>

                        {/* ROLE */}

                        <div>
                          <span className="inline-flex rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold capitalize text-brand-purple">
                            {
                              member.role
                            }
                          </span>
                        </div>

                        {/* STATUS */}

                        <div>
                          <StaffStatusBadge
                            status={
                              member.status
                            }
                          />
                        </div>

                        {/* ACTIONS */}

                        <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                          <button
                            type="button"
                            disabled={
                              isActionLoading
                            }
                            onClick={() =>
                              setPendingAction({
                                type: "staff-status",
                                staff: member,
                              })
                            }
                            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-white disabled:opacity-50"
                          >
                            <Power className="h-3.5 w-3.5" />

                            {member.status ===
                            "active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              isActionLoading
                            }
                            onClick={() =>
                              setPendingAction({
                                type: "staff-delete",
                                staff: member,
                              })
                            }
                            className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
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
      )}

      {/* ====================================== */}
      {/* EDIT MODAL */}
      {/* ====================================== */}

      {isEditOpen && (
        <EditInstitutionModal
          institution={
            institution
          }
          isSaving={
            isEditSaving
          }
          onClose={() =>
            setIsEditOpen(false)
          }
          onSaved={
            handleUpdateInstitution
          }
        />
      )}

      {/* ====================================== */}
      {/* ADD ADMIN MODAL */}
      {/* ====================================== */}

      {isAddAdminOpen &&
        institutionId && (
          <AddAdministratorModal
            isCreating={
              isAdminCreating
            }
            onClose={() =>
              setIsAddAdminOpen(
                false,
              )
            }
            onCreated={
              handleCreateAdmin
            }
          />
        )}

      {/* ====================================== */}
      {/* INSTITUTION STATUS CONFIRM */}
      {/* ====================================== */}

      {pendingAction?.type ===
        "institution-status" && (
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
            void handleToggleInstitutionStatus(
              pendingAction.institution,
            )
          }
          onCancel={() =>
            setPendingAction(null)
          }
        />
      )}

      {/* ====================================== */}
      {/* INSTITUTION DELETE CONFIRM */}
      {/* ====================================== */}

      {pendingAction?.type ===
        "institution-delete" && (
        <ConfirmDialog
          title="Delete institution?"
          message={`This will permanently remove "${pendingAction.institution.name}".`}
          confirmLabel="Delete"
          isDangerous
          isLoading={
            isActionLoading
          }
          onConfirm={() =>
            void handleDeleteInstitution(
              pendingAction.institution,
            )
          }
          onCancel={() =>
            setPendingAction(null)
          }
        />
      )}

      {/* ====================================== */}
      {/* STAFF STATUS CONFIRM */}
      {/* ====================================== */}

      {pendingAction?.type ===
        "staff-status" && (
        <ConfirmDialog
          title={
            pendingAction.staff
              .status === "active"
              ? "Deactivate administrator?"
              : "Activate administrator?"
          }
          message={`This will ${
            pendingAction.staff
              .status === "active"
              ? "deactivate"
              : "activate"
          } "${pendingAction.staff.name}".`}
          confirmLabel={
            pendingAction.staff
              .status === "active"
              ? "Deactivate"
              : "Activate"
          }
          isLoading={
            isActionLoading
          }
          onConfirm={() =>
            void handleToggleStaffStatus(
              pendingAction.staff,
            )
          }
          onCancel={() =>
            setPendingAction(null)
          }
        />
      )}

      {/* ====================================== */}
      {/* STAFF DELETE CONFIRM */}
      {/* ====================================== */}

      {pendingAction?.type ===
        "staff-delete" && (
        <ConfirmDialog
          title="Remove administrator?"
          message={`This will remove "${pendingAction.staff.name}" from this institution.`}
          confirmLabel="Remove"
          isDangerous
          isLoading={
            isActionLoading
          }
          onConfirm={() =>
            void handleDeleteStaff(
              pendingAction.staff,
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