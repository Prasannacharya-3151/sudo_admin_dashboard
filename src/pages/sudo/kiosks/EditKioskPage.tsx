import {
  ArrowLeft,
  Save,
  Loader2,
  Monitor,
  Building2,
  MapPin,
  AlertTriangle,
} from "lucide-react";

import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { getKioskById, updateKiosk } from "../../../api/kioskApi";
import { getInstitutions } from "../../../api/institutionApi";
import { useSudoAuth } from "../../../context/SudoAuthContext";

import type { KioskType, UpdateKioskPayload } from "../../../types/kiosk";
import type { Institution } from "../../../types/institution";

// ==========================================
// COMPONENT
// ==========================================

export default function EditKioskPage() {
  const navigate = useNavigate();
  const { kioskId } = useParams<{ kioskId: string }>();
  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // FORM STATE
  // ==========================================

  const [name, setName] = useState("");
  const [kioskType, setKioskType] = useState<KioskType>("institution");
  const [institutionId, setInstitutionId] = useState("");

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(true);

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

        const kiosk = await getKioskById(accessToken, kioskId);

        setName(kiosk.name || "");
        setKioskType(kiosk.kiosk_type || "institution");
        setInstitutionId(kiosk.institution_id || "");
        setAddressLine1(kiosk.address_line_1 || "");
        setAddressLine2(kiosk.address_line_2 || "");
        setCity(kiosk.city || "");
        setState(kiosk.state || "");
        setCountry(kiosk.country || "");
        setPostalCode(kiosk.postal_code || "");
        setLatitude(kiosk.latitude != null ? String(kiosk.latitude) : "");
        setLongitude(kiosk.longitude != null ? String(kiosk.longitude) : "");
      } catch (error) {
        console.error("Failed to fetch kiosk:", error);
        const message = error instanceof Error ? error.message : "Failed to load kiosk details";
        setError(message);
        toast.error("Failed to load kiosk details");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchKiosk();
  }, [kioskId, accessToken]);

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
        const data = await getInstitutions(accessToken);
        setInstitutions(data);
      } catch (error) {
        console.error("Failed to load institutions:", error);
      } finally {
        setIsLoadingInstitutions(false);
      }
    };

    void loadInstitutions();
  }, [accessToken]);

  const handleTypeChange = (value: KioskType) => {
    setKioskType(value);
    if (value === "public") setInstitutionId("");
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!kioskId) {
      toast.error("Invalid kiosk ID");
      return;
    }

    if (!accessToken) {
      toast.error("Authentication required");
      return;
    }

    if (!name.trim()) {
      toast.error("Kiosk name is required");
      return;
    }

    if (kioskType === "institution" && !institutionId) {
      toast.error("Please select an institution");
      return;
    }

    if (!addressLine1.trim() || !city.trim() || !state.trim() || !country.trim()) {
      toast.error("Address line 1, city, state and country are required");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: UpdateKioskPayload = {
        name: name.trim(),
        kiosk_type: kioskType,
        institution_id: kioskType === "institution" ? institutionId : null,
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim() || null,
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        postal_code: postalCode.trim() || null,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
      };

      await updateKiosk(accessToken, kioskId, payload);

      toast.success("Kiosk updated successfully");
      navigate(`/sudo/kiosks/${kioskId}`, { replace: true });
    } catch (error) {
      console.error("Failed to update kiosk:", error);
      const message = error instanceof Error ? error.message : "Failed to update kiosk";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // LOADING / ERROR
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
          <p className="text-sm font-medium text-gray-500">Loading kiosk details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-red-700">Unable to load kiosk</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/sudo/kiosks")}
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
      {/* HEADER */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(`/sudo/kiosks/${kioskId}`)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-purple"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Kiosk Details
        </button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Kiosk</h1>
          <p className="mt-2 text-sm text-gray-500">
            Update the profile and location for this kiosk.
          </p>
        </div>
      </div>

      {/* BACKEND-PENDING NOTICE */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Saving profile updates depends on a backend route that isn't live yet.
          The form works, but submitting may fail until that's shipped.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BASIC INFO */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            <p className="mt-1 text-sm text-gray-500">Update the primary kiosk details.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                Kiosk Name
              </label>
              <div className="relative">
                <Monitor className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-gray-700">Kiosk Type</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange("institution")}
                  disabled={isSubmitting}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    kioskType === "institution"
                      ? "border-brand-purple bg-brand-purple/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900">Institution</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("public")}
                  disabled={isSubmitting}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    kioskType === "public"
                      ? "border-brand-purple bg-brand-purple/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900">Public</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* INSTITUTION */}
        {kioskType === "institution" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Institution Assignment</h2>
              <p className="mt-1 text-sm text-gray-500">Assign this kiosk to an institution.</p>
            </div>

            {isLoadingInstitutions ? (
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading institutions...
              </div>
            ) : (
              <select
                value={institutionId}
                onChange={(event) => setInstitutionId(event.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value="">Select an institution</option>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name} ({institution.code})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* LOCATION */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Location</h2>
              <p className="mt-1 text-sm text-gray-500">Update where this kiosk is installed.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-gray-700">Address Line 1</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(event) => setAddressLine1(event.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-gray-700">Address Line 2</label>
              <input
                type="text"
                value={addressLine2}
                onChange={(event) => setAddressLine2(event.target.value)}
                placeholder="Optional"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">City</label>
              <input
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                maxLength={100}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">State</label>
              <input
                type="text"
                value={state}
                onChange={(event) => setState(event.target.value)}
                maxLength={100}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Country</label>
              <input
                type="text"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                maxLength={100}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                maxLength={20}
                placeholder="Optional"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                placeholder="Optional"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                placeholder="Optional"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(`/sudo/kiosks/${kioskId}`)}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

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