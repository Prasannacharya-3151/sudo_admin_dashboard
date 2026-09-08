import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  MoreVertical,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserX,
  XCircle,
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
  deleteAdministrator,
  getAdministratorById,
  updateAdministrator,
} from "../../../api/administratorApi";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import type {
  AdministratorDetails,
  AdministratorStatus,
} from "../../../types/administrator";

// ==========================================
// STATUS BADGE
// ==========================================

function StatusBadge({
  status,
}: {
  status: AdministratorStatus;
}) {
  const styles = {
    active:
      "bg-emerald-50 text-emerald-700 border-emerald-200",

    inactive:
      "bg-gray-100 text-gray-600 border-gray-200",

    suspended:
      "bg-red-50 text-red-700 border-red-200",
  };

  const icons = {
    active: (
      <CheckCircle2 className="h-4 w-4" />
    ),

    inactive: (
      <XCircle className="h-4 w-4" />
    ),

    suspended: (
      <UserX className="h-4 w-4" />
    ),
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {icons[status]}

      {status}
    </span>
  );
}

// ==========================================
// DETAIL ITEM
// ==========================================

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}

function DetailItem({
  icon,
  label,
  value,
}: DetailItemProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-gray-900">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT
// ==========================================

export default function AdministratorDetailsPage() {
  const navigate = useNavigate();

  // ASSUMPTION: route is something like
  // /sudo/admins/:institutionId/:adminId
  // Adjust the param names below to match
  // your actual router if different.
  const { institutionId, adminId } =
    useParams<{
      institutionId: string;
      adminId: string;
    }>();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [administrator, setAdministrator] =
    useState<AdministratorDetails | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isActionLoading, setIsActionLoading] =
    useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [showActions, setShowActions] =
    useState(false);

  // ==========================================
  // FETCH ADMINISTRATOR
  // ==========================================

  const fetchAdministrator = async () => {
    if (!institutionId || !adminId) {
      toast.error("Administrator ID is missing");

      navigate("/sudo/admins");

      return;
    }

    if (!accessToken) {
      toast.error("Authentication token missing");

      return;
    }

    try {
      setIsLoading(true);

      const response =
        await getAdministratorById(
          accessToken,
          institutionId,
          adminId,
        );

      setAdministrator(response);
    } catch (error) {
      console.error(
        "Failed to fetch administrator:",
        error,
      );

      toast.error(
        "Failed to load administrator details",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // LOAD
  // ==========================================

  useEffect(() => {
    void fetchAdministrator();
  }, [institutionId, adminId, accessToken]);

  // ==========================================
  // CHANGE STATUS
  // ==========================================

  const handleStatusChange = async (
    status: AdministratorStatus,
  ) => {
    if (
      !institutionId ||
      !adminId ||
      !accessToken ||
      !administrator
    ) {
      return;
    }

    try {
      setIsActionLoading(true);

      const updatedAdministrator =
        await updateAdministrator(
          accessToken,
          institutionId,
          adminId,
          {
            status,
          },
        );

      setAdministrator((previous) =>
        previous
          ? { ...previous, ...updatedAdministrator }
          : previous,
      );

      toast.success(
        `Administrator ${status === "active"
          ? "activated"
          : status === "inactive"
            ? "deactivated"
            : "suspended"
        } successfully`,
      );

      setShowActions(false);
    } catch (error) {
      console.error(
        "Failed to update administrator:",
        error,
      );

      toast.error(
        "Failed to update administrator status",
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  // ==========================================
  // DELETE ADMINISTRATOR
  // ==========================================

  const handleDelete = async () => {
    if (!institutionId || !adminId || !accessToken) {
      return;
    }

    try {
      setIsActionLoading(true);

      await deleteAdministrator(
        accessToken,
        institutionId,
        adminId,
      );

      toast.success(
        "Administrator deleted successfully",
      );

      navigate("/sudo/admins");
    } catch (error) {
      console.error(
        "Failed to delete administrator:",
        error,
      );

      toast.error(
        "Failed to delete administrator",
      );
    } finally {
      setIsActionLoading(false);

      setShowDeleteConfirm(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-9 w-9 animate-spin text-brand-purple" />

          <p className="text-sm font-medium text-gray-500">
            Loading administrator details...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // NOT FOUND
  // ==========================================

  if (!administrator) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <UserX className="h-8 w-8" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            Administrator not found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            The administrator you are looking for
            does not exist or may have been removed.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/sudo/admins")
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Administrators
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (
    date?: string | null,
  ) => {
    if (!date) return "—";

    try {
      return new Intl.DateTimeFormat(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      ).format(new Date(date));
    } catch {
      return date;
    }
  };

  // ==========================================
  // INITIALS
  // ==========================================

  const initials = administrator.name
    .split(" ")
    .map((item) => item.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() =>
              navigate("/sudo/admins")
            }
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-brand-purple"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Administrator Details
              </h1>

              <StatusBadge
                status={administrator.status}
              />
            </div>

            <p className="mt-1 text-sm text-gray-500">
              View and manage administrator account
              information.
            </p>
          </div>
        </div>

        {/* HEADER ACTIONS */}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/sudo/admins/${institutionId}/${administrator.id}/edit`,
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Edit3 className="h-4 w-4" />

            Edit Administrator
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowActions(!showActions)
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {/* ACTION DROPDOWN */}

            {showActions && (
              <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white py-2 shadow-xl">
                {administrator.status !==
                  "active" && (
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        handleStatusChange(
                          "active",
                        )
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                    >
                      <UserCheck className="h-4 w-4" />

                      Activate Administrator
                    </button>
                  )}

                {administrator.status ===
                  "active" && (
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        handleStatusChange(
                          "inactive",
                        )
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                    >
                      <UserX className="h-4 w-4" />

                      Deactivate Administrator
                    </button>
                  )}

                {administrator.status !==
                  "suspended" && (
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() =>
                        handleStatusChange(
                          "suspended",
                        )
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-orange-600 transition hover:bg-orange-50 disabled:opacity-50"
                    >
                      <ShieldCheck className="h-4 w-4" />

                      Suspend Administrator
                    </button>
                  )}

                <div className="my-2 border-t border-gray-100" />

                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => {
                    setShowActions(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />

                  Delete Administrator
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================
          PROFILE CARD
      ====================================== */}

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-brand-purple to-purple-500 px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* AVATAR */}

            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white text-2xl font-bold text-brand-purple shadow-lg">
              {initials}
            </div>

            {/* PROFILE */}

            <div className="text-white">
              <h2 className="text-2xl font-bold">
                {administrator.name}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />

                  {administrator.email}
                </span>
              </div>

              <div className="mt-4">
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold capitalize backdrop-blur-sm">
                  {administrator.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE DETAILS */}

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            icon={
              <User className="h-5 w-5" />
            }
            label="Full Name"
            value={administrator.name}
          />

          <DetailItem
            icon={
              <Mail className="h-5 w-5" />
            }
            label="Email Address"
            value={administrator.email}
          />

          <DetailItem
            icon={
              <ShieldCheck className="h-5 w-5" />
            }
            label="Role"
            value={administrator.role}
          />

          <DetailItem
            icon={
              <Building2 className="h-5 w-5" />
            }
            label="Institution"
            value={
              administrator.institution_name ||
              administrator.institution_id ||
              "Platform Administrator"
            }
          />

          <DetailItem
            icon={
              <Calendar className="h-5 w-5" />
            }
            label="Created At"
            value={formatDate(
              administrator.created_at,
            )}
          />

          <DetailItem
            icon={
              <Calendar className="h-5 w-5" />
            }
            label="Last Updated"
            value={formatDate(
              administrator.updated_at,
            )}
          />
        </div>
      </div>

      {/* ======================================
          ACCOUNT STATUS
      ====================================== */}

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Account Status
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Control whether this administrator can
              access the institution management
              portal.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <StatusBadge
              status={administrator.status}
            />

            {administrator.status ===
            "active" ? (
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() =>
                  handleStatusChange(
                    "inactive",
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                {isActionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}

                Deactivate
              </button>
            ) : (
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() =>
                  handleStatusChange(
                    "active",
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                {isActionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}

                Activate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================
          DELETE CONFIRMATION MODAL
      ====================================== */}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 className="h-7 w-7" />
            </div>

            <h3 className="mt-5 text-xl font-bold text-gray-900">
              Delete Administrator?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {administrator.name}
              </span>
              ? This action may permanently remove
              administrator access.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() =>
                  setShowDeleteConfirm(false)
                }
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />

                    Delete Administrator
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}