import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Loader2,
  MapPin,
  Monitor,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import { createKiosk } from "../../../api/kioskApi";
import { getInstitutions } from "../../../api/institutionApi";

import type {
  CreateKioskPayload,
  KioskStatus,
  KioskType,
} from "../../../types/kiosk";

import type { Institution } from "../../../types/institution";

// ==========================================
// COMPONENT
// ==========================================

export default function CreateKioskPage() {
  const navigate = useNavigate();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // FORM STATE
  // ==========================================

  const [name, setName] = useState("");

  const [code, setCode] = useState("");

  const [type, setType] =
    useState<KioskType>("institution");

  const [institutionId, setInstitutionId] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [status, setStatus] =
    useState<KioskStatus>("active");

  // ==========================================
  // INSTITUTIONS
  // ==========================================

  const [institutions, setInstitutions] =
    useState<Institution[]>([]);

  const [isLoadingInstitutions, setIsLoadingInstitutions] =
    useState(true);

  // ==========================================
  // SUBMIT STATE
  // ==========================================

  const [isSubmitting, setIsSubmitting] =
    useState(false);

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

        const data = await getInstitutions(
          accessToken,
        );

        setInstitutions(data);
      } catch (error) {
        console.error(
          "Failed to load institutions:",
          error,
        );

        toast.error(
          "Failed to load institutions",
        );
      } finally {
        setIsLoadingInstitutions(false);
      }
    };

    void loadInstitutions();
  }, [accessToken]);

  // ==========================================
  // TYPE CHANGE
  // ==========================================

  const handleTypeChange = (
    value: KioskType,
  ) => {
    setType(value);

    // Public kiosk does not belong
    // to an institution
    if (value === "public") {
      setInstitutionId("");
    }
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateForm = (): boolean => {
    if (!name.trim()) {
      toast.error(
        "Kiosk name is required",
      );

      return false;
    }

    if (!code.trim()) {
      toast.error(
        "Kiosk code is required",
      );

      return false;
    }

    if (
      type === "institution" &&
      !institutionId
    ) {
      toast.error(
        "Please select an institution",
      );

      return false;
    }

    return true;
  };

  // ==========================================
  // CREATE KIOSK
  // ==========================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!accessToken) {
      toast.error(
        "Authentication session expired",
      );

      navigate("/sudo/login");

      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreateKioskPayload = {
        name: name.trim(),

        code: code.trim().toUpperCase(),

        type,

        status,

        ...(location.trim()
          ? {
              location: location.trim(),
            }
          : {}),

        ...(type === "institution" &&
        institutionId
          ? {
              institution_id: institutionId,
            }
          : {}),
      };

      // FIX: accessToken first, payload second —
      // matches createKiosk(accessToken, payload) signature
      await createKiosk(
        accessToken,
        payload,
      );

      toast.success(
        "Kiosk created successfully",
      );

      navigate("/sudo/kiosks");
    } catch (error) {
      console.error(
        "Failed to create kiosk:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create kiosk",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel = () => {
    navigate("/sudo/kiosks");
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen  p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* ======================================
            HEADER
        ====================================== */}

        <div className="mb-8">
          <button
            type="button"
            onClick={handleCancel}
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-purple px-4 py-2.5 text-sm font-medium text-white "
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Kiosks
          </button>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple/10">
                <Monitor className="h-6 w-6 text-brand-purple" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  Create New Kiosk
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Configure and register a new PrintPoint kiosk.
                </p>
              </div>
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
          {/* ======================================
              BASIC INFORMATION
          ====================================== */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the basic details for this kiosk.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* KIOSK NAME */}

              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Kiosk Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. Main Campus Kiosk"
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>

              {/* KIOSK CODE */}

              <div>
                <label
                  htmlFor="code"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Kiosk Code
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="e.g. KIOSK001"
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm uppercase text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>

              {/* KIOSK STATUS */}

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Initial Status
                </label>

                <select
                  id="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as KioskStatus,
                    )
                  }
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                  <option value="maintenance">
                    Maintenance
                  </option>

                  <option value="suspended">
                    Suspended
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* ======================================
              KIOSK TYPE
          ====================================== */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Kiosk Type
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select where this kiosk belongs.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* INSTITUTION */}

              <button
                type="button"
                onClick={() =>
                  handleTypeChange(
                    "institution",
                  )
                }
                disabled={isSubmitting}
                className={`rounded-full border-2 p-5 text-left transition ${
                  type === "institution"
                    ? "border-brand-purple bg-brand-purple/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${
                      type === "institution"
                        ? "bg-brand-purple text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Institution Kiosk
                    </h3>

                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      Assign this kiosk to a
                      specific institution.
                    </p>
                  </div>
                </div>
              </button>

              {/* PUBLIC */}

              <button
                type="button"
                onClick={() =>
                  handleTypeChange("public")
                }
                disabled={isSubmitting}
                className={`rounded-full border-2 p-5 text-left transition ${
                  type === "public"
                    ? "border-brand-purple bg-brand-purple/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      type === "public"
                        ? "bg-brand-purple text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Monitor className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Public Kiosk
                    </h3>

                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      Independent kiosk available
                      for public use.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ======================================
              INSTITUTION ASSIGNMENT
          ====================================== */}

          {type === "institution" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Institution Assignment
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select the institution that
                  owns this kiosk.
                </p>
              </div>

              <div>
                <label
                  htmlFor="institution"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Institution
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                {isLoadingInstitutions ? (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Loading institutions...
                  </div>
                ) : (
                  <select
                    id="institution"
                    value={institutionId}
                    onChange={(event) =>
                      setInstitutionId(
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                    className="w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                  >
                    <option value="">
                      Select an institution
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
                )}

                {!isLoadingInstitutions &&
                  institutions.length === 0 && (
                    <p className="mt-2 text-sm text-amber-600">
                      No institutions available.
                      Please create an institution
                      first.
                    </p>
                  )}
              </div>
            </div>
          )}

          {/* ======================================
              LOCATION
          ====================================== */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Location
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add the physical location of this
                kiosk.
              </p>
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Kiosk Location
              </label>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Ground Floor, Main Building"
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-gray-200 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* ======================================
              ACTIONS
          ====================================== */}

          <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingInstitutions
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-purple px-6 py-3 text-sm font-semibold text-white  transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />

                  Creating Kiosk...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />

                  Create Kiosk
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}