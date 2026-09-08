import {
  ArrowLeft,
  Save,
  Loader2,
  Monitor,
  Building2,
  MapPin,
  Hash,
  Tag,
} from "lucide-react";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { toast } from "sonner";

import {
  getKioskById,
  updateKiosk,
} from "../../../api/kioskApi";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import type {
  KioskStatus,
  KioskType,
  UpdateKioskPayload,
} from "../../../types/kiosk";

// ==========================================
// COMPONENT
// ==========================================

export default function EditKioskPage() {
  const navigate = useNavigate();

  const { kioskId } = useParams<{
    kioskId: string;
  }>();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATES
  // ==========================================

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

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
  // FETCH KIOSK
  // ==========================================

  useEffect(() => {
    const fetchKiosk = async () => {
      if (!kioskId) {
        setError("Invalid kiosk ID");
        setIsLoading(false);
        return;
      }

      if (!accessToken) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // FIX: accessToken first, kioskId second —
        // matches getKioskById(accessToken, kioskId) signature
        const kiosk = await getKioskById(
          accessToken,
          kioskId,
        );

        // ======================================
        // POPULATE FORM
        // ======================================

        setName(kiosk.name || "");

        setCode(kiosk.code || "");

        setType(
          kiosk.type || "institution",
        );

        setInstitutionId(
          kiosk.institution_id || "",
        );

        setLocation(
          kiosk.location || "",
        );

        setStatus(
          kiosk.status || "active",
        );
      } catch (error) {
        console.error(
          "Failed to fetch kiosk:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load kiosk details";

        setError(message);

        toast.error(
          "Failed to load kiosk details",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchKiosk();
  }, [kioskId, accessToken]);

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!kioskId) {
      toast.error("Invalid kiosk ID");
      return;
    }

    if (!accessToken) {
      toast.error(
        "Authentication required",
      );
      return;
    }

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name.trim()) {
      toast.error(
        "Kiosk name is required",
      );
      return;
    }

    if (!code.trim()) {
      toast.error(
        "Kiosk code is required",
      );
      return;
    }

    if (
      type === "institution" &&
      !institutionId.trim()
    ) {
      toast.error(
        "Institution ID is required for institution kiosks",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // ========================================
      // BUILD PAYLOAD
      // ========================================

      const payload: UpdateKioskPayload = {
        name: name.trim(),

        code: code.trim(),

        type,

        institution_id:
          type === "institution"
            ? institutionId.trim()
            : null,

        location:
          location.trim() || undefined,

        status,
      };

      // ========================================
      // UPDATE API
      // FIX: accessToken first, then kioskId, then payload —
      // matches updateKiosk(accessToken, kioskId, payload) signature
      // ========================================

      await updateKiosk(
        accessToken,
        kioskId,
        payload,
      );

      toast.success(
        "Kiosk updated successfully",
      );

      // ========================================
      // REDIRECT TO DETAILS
      // ========================================

      navigate(
        `/sudo/kiosks/${kioskId}`,
        {
          replace: true,
        },
      );
    } catch (error) {
      console.error(
        "Failed to update kiosk:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to update kiosk";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />

          <p className="text-sm font-medium text-gray-500">
            Loading kiosk details...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-red-700">
            Unable to load kiosk
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/sudo/kiosks")
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Kiosks
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="mx-auto max-w-4xl pb-10">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="mb-8">
        <button
          type="button"
          onClick={() =>
            navigate(
              `/sudo/kiosks/${kioskId}`,
            )
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-purple"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Kiosk Details
        </button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Edit Kiosk
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Update the basic configuration and
            information for this kiosk.
          </p>
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
            BASIC INFORMATION
        ==================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update the primary kiosk details.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* KIOSK NAME */}

            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700"
              >
                Kiosk Name
              </label>

              <div className="relative">
                <Monitor className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  placeholder="Enter kiosk name"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* KIOSK CODE */}

            <div className="space-y-2">
              <label
                htmlFor="code"
                className="text-sm font-semibold text-gray-700"
              >
                Kiosk Code
              </label>

              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="Example: KIOSK-001"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm uppercase outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* KIOSK TYPE */}

            <div className="space-y-2">
              <label
                htmlFor="type"
                className="text-sm font-semibold text-gray-700"
              >
                Kiosk Type
              </label>

              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <select
                  id="type"
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target
                        .value as KioskType,
                    )
                  }
                  disabled={isSubmitting}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  <option value="institution">
                    Institution
                  </option>

                  <option value="public">
                    Public
                  </option>
                </select>
              </div>
            </div>

            {/* STATUS */}

            <div className="space-y-2">
              <label
                htmlFor="status"
                className="text-sm font-semibold text-gray-700"
              >
                Kiosk Status
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
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
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

        {/* ====================================
            INSTITUTION
        ==================================== */}

        {type === "institution" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Institution Assignment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Assign this kiosk to an institution.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="institutionId"
                className="text-sm font-semibold text-gray-700"
              >
                Institution ID
              </label>

              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  id="institutionId"
                  type="text"
                  value={institutionId}
                  onChange={(event) =>
                    setInstitutionId(
                      event.target.value,
                    )
                  }
                  placeholder="Enter institution ID"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>

              <p className="text-xs text-gray-500">
                This kiosk will be linked to the
                specified institution.
              </p>
            </div>
          </div>
        )}

        {/* ====================================
            LOCATION
        ==================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Location
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Specify where this kiosk is
              physically located.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="location"
              className="text-sm font-semibold text-gray-700"
            >
              Kiosk Location
            </label>

            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-400" />

              <textarea
                id="location"
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value,
                  )
                }
                placeholder="Example: Main Building, Ground Floor"
                rows={4}
                disabled={isSubmitting}
                className="w-full resize-none rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* ====================================
            ACTIONS
        ==================================== */}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
          {/* CANCEL */}

          <button
            type="button"
            onClick={() =>
              navigate(
                `/sudo/kiosks/${kioskId}`,
              )
            }
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          {/* SAVE */}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />

                Updating Kiosk...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />

                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}