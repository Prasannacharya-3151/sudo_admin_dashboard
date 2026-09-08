import {
  ArrowLeft,
  Loader2,
  Save,
  ShieldCheck,
  UserCog,
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
  getAdministratorById,
  updateAdministrator,
} from "../../../api/administratorApi";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import type {
  AdministratorRole,
  AdministratorStatus,
  UpdateAdministratorPayload,
} from "../../../types/administrator";

// ==========================================
// COMPONENT
// ==========================================

export default function EditAdministratorPage() {
  // ==========================================
  // ROUTER
  // ==========================================

  const navigate = useNavigate();

  const {
    institutionId,
    administratorId,
  } = useParams<{
    institutionId: string;
    administratorId: string;
  }>();

  // ==========================================
  // AUTH
  // ==========================================

  const { accessToken } = useSudoAuth();

  // ==========================================
  // LOADING STATES
  // ==========================================

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  // ==========================================
  // FORM STATE
  // ==========================================

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState<AdministratorRole>("admin");

  const [status, setStatus] =
    useState<AdministratorStatus>("active");

  // ==========================================
  // LOAD ADMINISTRATOR
  // ==========================================

  useEffect(() => {
    const loadAdministrator = async () => {
      // ----------------------------------------
      // VALIDATION
      // ----------------------------------------

      if (
        !accessToken ||
        !institutionId ||
        !administratorId
      ) {
        toast.error(
          "Missing administrator information",
        );

        navigate(
          "/sudo/admins",
          {
            replace: true,
          },
        );

        return;
      }

      try {
        setIsLoading(true);

        // ----------------------------------------
        // API CALL
        // ----------------------------------------

        const administrator =
          await getAdministratorById(
            accessToken,
            institutionId,
            administratorId,
          );

        // ----------------------------------------
        // SET FORM DATA
        // ----------------------------------------

        setName(
          administrator.name || "",
        );

        setEmail(
          administrator.email || "",
        );

        setRole(
          administrator.role || "admin",
        );

        setStatus(
          administrator.status || "active",
        );
      } catch (error: unknown) {
        console.error(
          "Failed to load administrator:",
          error,
        );

        toast.error(
          "Failed to load administrator details",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadAdministrator();
  }, [
    accessToken,
    institutionId,
    administratorId,
    navigate,
  ]);

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = (): boolean => {
    // ----------------------------------------
    // NAME
    // ----------------------------------------

    if (!name.trim()) {
      toast.error(
        "Administrator name is required",
      );

      return false;
    }

    if (name.trim().length > 150) {
      toast.error(
        "Name must be less than 150 characters",
      );

      return false;
    }

    // ----------------------------------------
    // EMAIL
    // ----------------------------------------

    if (!email.trim()) {
      toast.error(
        "Email address is required",
      );

      return false;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      toast.error(
        "Please enter a valid email address",
      );

      return false;
    }

    // ----------------------------------------
    // PASSWORD
    // ----------------------------------------

    if (
      password &&
      (
        password.length < 8 ||
        password.length > 72
      )
    ) {
      toast.error(
        "Password must be between 8 and 72 characters",
      );

      return false;
    }

    return true;
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    // ----------------------------------------
    // VALIDATE
    // ----------------------------------------

    if (!validateForm()) {
      return;
    }

    // ----------------------------------------
    // CHECK AUTH
    // ----------------------------------------

    if (
      !accessToken ||
      !institutionId ||
      !administratorId
    ) {
      toast.error(
        "Authentication information is missing",
      );

      return;
    }

    try {
      setIsSubmitting(true);

      // ----------------------------------------
      // BUILD PAYLOAD
      // ----------------------------------------

      const payload: UpdateAdministratorPayload = {
        name: name.trim(),
        email: email.trim(),
        role,
        status,
      };

      // Only send password if user entered one

      if (password.trim()) {
        payload.password =
          password.trim();
      }

      // ----------------------------------------
      // UPDATE API
      // ----------------------------------------

      await updateAdministrator(
        accessToken,
        institutionId,
        administratorId,
        payload,
      );

      toast.success(
        "Administrator updated successfully",
      );

      // ----------------------------------------
      // NAVIGATE BACK
      // ----------------------------------------

      navigate(
        `/sudo/admins/${institutionId}/${administratorId}`,
      );
    } catch (error: unknown) {
      console.error(
        "Failed to update administrator:",
        error,
      );

      const axiosError =
        error as {
          response?: {
            data?: {
              detail?: string;
              message?: string;
            };
          };
        };

      const message =
        axiosError?.response?.data?.detail ||
        axiosError?.response?.data?.message ||
        "Failed to update administrator";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // BACK
  // ==========================================

  const handleBack = () => {
    if (
      institutionId &&
      administratorId
    ) {
      navigate(
        `/sudo/admins/${institutionId}/${administratorId}`,
      );

      return;
    }

    navigate("/sudo/admins");
  };

  // ==========================================
  // LOADING UI
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />

          <p className="text-sm font-medium text-gray-500">
            Loading administrator details...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-4">

          {/* BACK BUTTON */}

          <button
            type="button"
            onClick={handleBack}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-brand-purple"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* TITLE */}

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Administrator
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Update administrator account information
              and permissions.
            </p>
          </div>

        </div>

      </div>

      {/* ======================================
          FORM
      ====================================== */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* ====================================
            PERSONAL INFORMATION
        ==================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          {/* SECTION HEADER */}

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
              <UserCog className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Administrator Information
              </h2>

              <p className="text-sm text-gray-500">
                Update personal account details.
              </p>
            </div>

          </div>

          {/* FIELDS */}

          <div className="grid gap-5 md:grid-cols-2">

            {/* NAME */}

            <div className="space-y-2">

              <label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700"
              >
                Full Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="Enter administrator name"
                maxLength={150}
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />

            </div>

            {/* EMAIL */}

            <div className="space-y-2">

              <label
                htmlFor="email"
                className="text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="admin@example.com"
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />

            </div>

          </div>

        </div>

        {/* ====================================
            SECURITY
        ==================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          {/* HEADER */}

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Account & Permissions
              </h2>

              <p className="text-sm text-gray-500">
                Manage administrator access and account
                status.
              </p>
            </div>

          </div>

          <div className="grid gap-5 md:grid-cols-2">

            {/* ROLE */}

            <div className="space-y-2">

              <label
                htmlFor="role"
                className="text-sm font-semibold text-gray-700"
              >
                Role
              </label>

              <select
                id="role"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target
                      .value as AdministratorRole,
                  )
                }
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value="admin">
                  Administrator
                </option>

                <option value="staff">
                  Staff
                </option>
              </select>

            </div>

            {/* STATUS */}

            <div className="space-y-2">

              <label
                htmlFor="status"
                className="text-sm font-semibold text-gray-700"
              >
                Account Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as AdministratorStatus,
                  )
                }
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>

            </div>

            {/* PASSWORD */}

            <div className="space-y-2 md:col-span-2">

              <label
                htmlFor="password"
                className="text-sm font-semibold text-gray-700"
              >
                New Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Leave empty to keep current password"
                minLength={8}
                maxLength={72}
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />

              <p className="text-xs text-gray-500">
                Leave this field empty if you don't want
                to change the password.
              </p>

            </div>

          </div>

        </div>

        {/* ====================================
            ACTIONS
        ==================================== */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          {/* CANCEL */}

          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          {/* SAVE */}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 text-sm font-semibold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />

                Save Changes
              </>
            )}
          </button>

        </div>

      </form>

    </div>
  );
}