import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type {
  ChangeEvent,
  FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import {
  createAdministrator,
} from "../../../api/administratorApi";

import {
  getInstitutions,
} from "../../../api/institutionApi";

import {
  useSudoAuth,
} from "../../../context/SudoAuthContext";

import type {
  Institution,
} from "../../../types/institution";

// ==========================================
// FORM STATE
// ==========================================

interface AdministratorFormData {
  institutionId: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ==========================================
// INITIAL FORM STATE
// ==========================================

const initialFormData: AdministratorFormData = {
  institutionId: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

// ==========================================
// COMPONENT
// ==========================================

export default function CreateAdministratorPage() {
  const navigate = useNavigate();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [formData, setFormData] =
    useState<AdministratorFormData>(
      initialFormData,
    );

  const [institutions, setInstitutions] =
    useState<Institution[]>([]);

  const [isLoadingInstitutions, setIsLoadingInstitutions] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  // ==========================================
  // LOAD INSTITUTIONS
  // ==========================================

  useEffect(() => {
    const loadInstitutions = async () => {
      if (!accessToken) {
        setIsLoadingInstitutions(false);
        return;
      }

      try {
        setIsLoadingInstitutions(true);

        const response =
          await getInstitutions(accessToken);

        setInstitutions(response);
      } catch (error) {
        console.error(
          "Failed to load institutions:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load institutions",
        );
      } finally {
        setIsLoadingInstitutions(false);
      }
    };

    void loadInstitutions();
  }, [accessToken]);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateForm = (): boolean => {
    if (!formData.institutionId) {
      toast.error(
        "Please select an institution",
      );

      return false;
    }

    if (!formData.name.trim()) {
      toast.error(
        "Administrator name is required",
      );

      return false;
    }

    if (formData.name.trim().length > 150) {
      toast.error(
        "Name must not exceed 150 characters",
      );

      return false;
    }

    if (!formData.email.trim()) {
      toast.error(
        "Email address is required",
      );

      return false;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        formData.email.trim(),
      )
    ) {
      toast.error(
        "Please enter a valid email address",
      );

      return false;
    }

    if (!formData.password) {
      toast.error(
        "Password is required",
      );

      return false;
    }

    if (formData.password.length < 8) {
      toast.error(
        "Password must be at least 8 characters",
      );

      return false;
    }

    if (formData.password.length > 72) {
      toast.error(
        "Password must not exceed 72 characters",
      );

      return false;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      toast.error(
        "Passwords do not match",
      );

      return false;
    }

    return true;
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!accessToken) {
      toast.error(
        "Authentication session expired. Please login again.",
      );

      navigate(
        "/sudo/login",
        {
          replace: true,
        },
      );

      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      await createAdministrator(
        accessToken,
        formData.institutionId,
        {
          name: formData.name.trim(),

          email: formData.email
            .trim()
            .toLowerCase(),

          password: formData.password,

          role: "admin",
        },
      );

      toast.success(
        "Administrator created successfully",
      );

      navigate("/sudo/admins");
    } catch (error: unknown) {
      console.error(
        "Failed to create administrator:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create administrator",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel = () => {
    navigate("/sudo/admins");
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">

      <button
        type="button"
        onClick={handleCancel}
        className="mt-1 inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200  hover:bg-brand-purple/90 "
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Administrator
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create an administrator account
            for an institution.
          </p>
        </div>

    

      {/* ====================================== */}
      {/* FORM */}
      {/* ====================================== */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* ====================================== */}
        {/* INSTITUTION */}
        {/* ====================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">

              <Building2 className="h-5 w-5 text-brand-purple" />

            </div>

            <div>

              <h2 className="font-bold text-gray-900">
                Institution
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select the institution this
                administrator belongs to.
              </p>

            </div>

          </div>

          <div>

            <label
              htmlFor="institutionId"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Select Institution

              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="institutionId"
              name="institutionId"
              value={formData.institutionId}
              onChange={handleChange}
              disabled={isLoadingInstitutions}
              className="h-12 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
            >

              <option value="">
                {isLoadingInstitutions
                  ? "Loading institutions..."
                  : "Select an institution"}
              </option>

              {institutions.map(
                (institution) => (
                  <option
                    key={institution.id}
                    value={institution.id}
                  >
                    {institution.name} (
                    {institution.code})
                  </option>
                ),
              )}

            </select>

          </div>

        </div>

        {/* ====================================== */}
        {/* ADMINISTRATOR DETAILS */}
        {/* ====================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">

              <User className="h-5 w-5 text-brand-purple" />

            </div>

            <div>

              <h2 className="font-bold text-gray-900">
                Administrator Details
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the administrator's
                account information.
              </p>

            </div>

          </div>

          <div className="grid gap-5 md:grid-cols-2">

            {/* NAME */}

            <div className="md:col-span-2">

              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Full Name

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">

                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter administrator name"
                  maxLength={150}
                  className="h-12 w-full rounded-full border border-gray-200 pl-12 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="md:col-span-2">

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email Address

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">

                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@institution.edu"
                  className="h-12 w-full rounded-full border border-gray-200 pl-12 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                />

              </div>

            </div>

          </div>

        </div>

        {/* ====================================== */}
        {/* SECURITY */}
        {/* ====================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50">

              <ShieldCheck className="h-5 w-5 text-brand-purple" />

            </div>

            <div>

              <h2 className="font-bold text-gray-900">
                Account Security
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Set a secure password for the
                administrator account.
              </p>

            </div>

          </div>

          <div className="grid gap-5 md:grid-cols-2">

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Password

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">

                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="h-12 w-full rounded-full border border-gray-200 pl-12 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous,
                    )
                  }
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>

              <p className="mt-2 text-xs text-gray-500">
                Password must be between 8 and
                72 characters.
              </p>

            </div>

            {/* CONFIRM PASSWORD */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Confirm Password

                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="relative">

                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    formData.confirmPassword
                  }
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="h-12 w-full rounded-full border border-gray-200 pl-12 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous,
                    )
                  }
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>

            </div>

          </div>

        </div>

        {/* ====================================== */}
        {/* INFO */}
        {/* ====================================== */}

        <div className="flex gap-3 rounded-xl border border-purple-100 bg-purple-50 p-4">

          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-purple" />

          <div>

            <p className="text-sm font-semibold text-gray-800">
              Institution Administrator Access
            </p>

            <p className="mt-1 text-sm leading-6 text-gray-600">
              This account will be created with
              the administrator role. The user
              can log in through the institution
              staff portal.
            </p>

          </div>

        </div>

        {/* ====================================== */}
        {/* ACTIONS */}
        {/* ====================================== */}

        <div className="flex flex-col-reverse justify-end gap-3  border-gray-200 sm:flex-row">

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="h-12 rounded-full border border-gray-200 px-6 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isLoadingInstitutions
            }
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-purple px-6 text-sm font-semibold text-white transition hover:bg-brand-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Administrator...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                Create Administrator
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
}