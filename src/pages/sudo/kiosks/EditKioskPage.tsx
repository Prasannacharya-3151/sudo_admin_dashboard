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

import {
  getKioskById,
  updateKiosk,
} from "../../../api/kioskApi";

import { getInstitutions } from "../../../api/institutionApi";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import KioskLocationPicker from "../kiosks/KioskLocationPicker";

import type {
  KioskType,
  UpdateKioskPayload,
} from "../../../types/kiosk";

import type { Institution } from "../../../types/institution";

// ==========================================
// COMPONENT
// ==========================================

export default function EditKioskPage() {
  const navigate = useNavigate();

  const { kioskId } = useParams<{ kioskId: string }>();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // FORM STATE
  // ==========================================

  const [name, setName] = useState("");

  const [kioskType, setKioskType] =
    useState<KioskType>("institution");

  const [institutionId, setInstitutionId] = useState("");

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Coordinates are optional.
  // Empty strings mean no location is configured.
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // ==========================================
  // INSTITUTIONS
  // ==========================================

  const [institutions, setInstitutions] = useState<Institution[]>([]);

  const [isLoadingInstitutions, setIsLoadingInstitutions] =
    useState(true);

  // ==========================================
  // FETCH KIOSK
  // ==========================================

  useEffect(() => {
    let cancelled = false;

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

        if (cancelled) return;

        // Populate the existing form fields.
        setName(kiosk.name ?? "");

        setKioskType(kiosk.kiosk_type ?? "institution");

        setInstitutionId(kiosk.institution_id ?? "");

        setAddressLine1(kiosk.address_line_1 ?? "");
        setAddressLine2(kiosk.address_line_2 ?? "");
        setCity(kiosk.city ?? "");
        setState(kiosk.state ?? "");
        setCountry(kiosk.country ?? "");
        setPostalCode(kiosk.postal_code ?? "");

        // Populate the map with the saved location.
        setLatitude(
          kiosk.latitude != null
            ? String(kiosk.latitude)
            : "",
        );

        setLongitude(
          kiosk.longitude != null
            ? String(kiosk.longitude)
            : "",
        );
      } catch (err) {
        console.error("Failed to fetch kiosk:", err);

        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load kiosk details";

          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchKiosk();

    return () => {
      cancelled = true;
    };

    // Do not reload the kiosk every time the access token rotates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kioskId]);

  // ==========================================
  // LOAD INSTITUTIONS
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadInstitutions = async () => {
      if (!accessToken) {
        setIsLoadingInstitutions(false);
        return;
      }

      try {
        setIsLoadingInstitutions(true);

        const data = await getInstitutions(accessToken);

        if (!cancelled) {
          setInstitutions(data);
        }
      } catch (err) {
        console.error("Failed to load institutions:", err);

        if (!cancelled) {
          toast.error("Failed to load institutions");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingInstitutions(false);
        }
      }
    };

    void loadInstitutions();

    return () => {
      cancelled = true;
    };

    // Institution options don't need reloading for token rotation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================
  // KIOSK TYPE
  // ==========================================

  const handleTypeChange = (value: KioskType) => {
    setKioskType(value);

    if (value === "public") {
      setInstitutionId("");
    }
  };

  // ==========================================
  // MAP LOCATION CHANGE
  // ==========================================

  const handleLocationChange = (
    newLatitude: number | null,
    newLongitude: number | null,
  ) => {
    // Clear both coordinates together.
    if (newLatitude === null || newLongitude === null) {
      setLatitude("");
      setLongitude("");
      return;
    }

    setLatitude(String(newLatitude));
    setLongitude(String(newLongitude));
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validateForm = (): boolean => {
    if (!name.trim()) {
      toast.error("Kiosk name is required");
      return false;
    }

    if (name.trim().length > 100) {
      toast.error("Kiosk name must be 100 characters or fewer");
      return false;
    }

    if (kioskType === "institution" && !institutionId) {
      toast.error("Please select an institution");
      return false;
    }

    if (
      !addressLine1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !country.trim()
    ) {
      toast.error(
        "Address line 1, city, state and country are required",
      );

      return false;
    }

    if (city.trim().length > 100) {
      toast.error("City must be 100 characters or fewer");
      return false;
    }

    if (state.trim().length > 100) {
      toast.error("State must be 100 characters or fewer");
      return false;
    }

    if (country.trim().length > 100) {
      toast.error("Country must be 100 characters or fewer");
      return false;
    }

    if (postalCode.trim().length > 20) {
      toast.error("Postal code must be 20 characters or fewer");
      return false;
    }

    // Coordinates must either both be present or both be empty.
    const hasLatitude = latitude.trim() !== "";
    const hasLongitude = longitude.trim() !== "";

    if (hasLatitude !== hasLongitude) {
      toast.error(
        "Please provide both latitude and longitude, or clear the location.",
      );

      return false;
    }

    if (hasLatitude && hasLongitude) {
      const latitudeValue = Number(latitude);
      const longitudeValue = Number(longitude);

      if (
        !Number.isFinite(latitudeValue) ||
        latitudeValue < -90 ||
        latitudeValue > 90
      ) {
        toast.error("Latitude must be between -90 and 90");
        return false;
      }

      if (
        !Number.isFinite(longitudeValue) ||
        longitudeValue < -180 ||
        longitudeValue > 180
      ) {
        toast.error("Longitude must be between -180 and 180");
        return false;
      }
    }

    return true;
  };

  // ==========================================
  // SUBMIT FORM
  // ==========================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!kioskId) {
      toast.error("Invalid kiosk ID");
      return;
    }

    if (!accessToken) {
      toast.error("Authentication required");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const hasLocation =
        latitude.trim() !== "" &&
        longitude.trim() !== "";

      const payload: UpdateKioskPayload = {
        name: name.trim(),

        kiosk_type: kioskType,

        institution_id:
          kioskType === "institution"
            ? institutionId
            : null,

        address_line_1: addressLine1.trim(),

        address_line_2:
          addressLine2.trim() || null,

        city: city.trim(),
        state: state.trim(),
        country: country.trim(),

        postal_code: postalCode.trim() || null,

        // Always send both coordinates together.
        // null + null removes the kiosk from the map.
        latitude: hasLocation ? Number(latitude) : null,
        longitude: hasLocation ? Number(longitude) : null,
      };

      await updateKiosk(accessToken, kioskId, payload);

      toast.success("Kiosk updated successfully");

      navigate(`/sudo/kiosks/${kioskId}`, {
        replace: true,
      });
    } catch (err) {
      console.error("Failed to update kiosk:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to update kiosk";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // LOADING STATE
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
  // ERROR STATE
  // ==========================================

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-600" />

          <h2 className="mt-3 text-lg font-semibold text-red-700">
            Unable to load kiosk
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate("/sudo/kiosks")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Kiosks
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="pb-10">
      {/* HEADER */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() =>
            navigate(`/sudo/kiosks/${kioskId}`)
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
            Update kiosk information, address and map location.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* ====================================== */}
        {/* BASIC INFORMATION */}
        {/* ====================================== */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update the primary kiosk details.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700"
              >
                Kiosk Name
              </label>

              <div className="relative">
                <Monitor className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  maxLength={100}
                  required
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-full border border-gray-200 pl-11 pr-5 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* KIOSK TYPE */}

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Kiosk Type
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() =>
                    handleTypeChange("institution")
                  }
                  disabled={isSubmitting}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    kioskType === "institution"
                      ? "border-brand-purple bg-brand-purple/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-500" />

                    <span className="text-sm font-semibold text-gray-900">
                      Institution
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTypeChange("public")
                  }
                  disabled={isSubmitting}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    kioskType === "public"
                      ? "border-brand-purple bg-brand-purple/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-gray-500" />

                    <span className="text-sm font-semibold text-gray-900">
                      Public
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================== */}
        {/* INSTITUTION ASSIGNMENT */}
        {/* ====================================== */}

        {kioskType === "institution" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Institution Assignment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Assign this kiosk to an institution.
              </p>
            </div>

            {isLoadingInstitutions ? (
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading institutions...
              </div>
            ) : (
              <select
                value={institutionId}
                onChange={(event) =>
                  setInstitutionId(event.target.value)
                }
                disabled={isSubmitting}
                required={kioskType === "institution"}
                className="h-12 w-full rounded-full border border-gray-200 bg-white px-5 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value="">
                  Select an institution
                </option>

                {institutions.map((institution) => (
                  <option
                    key={institution.id}
                    value={institution.id}
                  >
                    {institution.name} ({institution.code})
                  </option>
                ))}
              </select>
            )}

            {!isLoadingInstitutions &&
              institutions.length === 0 && (
                <p className="mt-3 text-sm text-amber-600">
                  No institutions were loaded. Check your
                  institution API or create an institution first.
                </p>
              )}
          </section>
        )}

        {/* ====================================== */}
        {/* ADDRESS AND LOCATION */}
        {/* ====================================== */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple/10">
              <MapPin className="h-5 w-5 text-brand-purple" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Kiosk Location
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update the address and pinpoint the kiosk on the map.
              </p>
            </div>
          </div>

          {/* ADDRESS FIELDS */}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="addressLine1"
                className="text-sm font-semibold text-gray-700"
              >
                Address Line 1
              </label>

              <input
                id="addressLine1"
                type="text"
                value={addressLine1}
                onChange={(event) =>
                  setAddressLine1(event.target.value)
                }
                required
                disabled={isSubmitting}
                className="h-12 w-full rounded-full border border-gray-200 px-5 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="addressLine2"
                className="text-sm font-semibold text-gray-700"
              >
                Address Line 2
              </label>

              <input
                id="addressLine2"
                type="text"
                value={addressLine2}
                onChange={(event) =>
                  setAddressLine2(event.target.value)
                }
                placeholder="Optional"
                disabled={isSubmitting}
                className="h-12 w-full rounded-full border border-gray-200 px-5 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="city"
                className="text-sm font-semibold text-gray-700"
              >
                City
              </label>

              <input
                id="city"
                type="text"
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
                maxLength={100}
                required
                disabled={isSubmitting}
                className="h-12 w-full rounded-full border border-gray-200 px-5 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="state"
                className="text-sm font-semibold text-gray-700"
              >
                State
              </label>

              <input
                id="state"
                type="text"
                value={state}
                onChange={(event) =>
                  setState(event.target.value)
                }
                maxLength={100}
                required
                disabled={isSubmitting}
                className="h-12 w-full rounded-full border border-gray-200 px-5 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="country"
                className="text-sm font-semibold text-gray-700"
              >
                Country
              </label>

              <input
                id="country"
                type="text"
                value={country}
                onChange={(event) =>
                  setCountry(event.target.value)
                }
                maxLength={100}
                required
                disabled={isSubmitting}
                className="h-12 w-full rounded-full border border-gray-200 px-5 text-sm outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="postalCode"
                className="text-sm font-semibold text-gray-700"
              >
                Postal Code
              </label>

              <input
                id="postalCode"
                type="text"
                value={postalCode}
                onChange={(event) =>
                  setPostalCode(event.target.value)
                }
                maxLength={20}
                placeholder="Optional"
                disabled={isSubmitting}
                className="h-12 w-full rounded-full border border-gray-200 px-5 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* INTERACTIVE MAP */}

          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Pinpoint Kiosk on Map
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                The saved location is shown automatically.
                Click a new point to move the kiosk, or clear
                the location if it should no longer appear on
                the map.
              </p>
            </div>

            <KioskLocationPicker
              latitude={
                latitude.trim() === ""
                  ? null
                  : Number(latitude)
              }
              longitude={
                longitude.trim() === ""
                  ? null
                  : Number(longitude)
              }
              onLocationChange={handleLocationChange}
              readOnly={false}
            />

            {/* MANUAL COORDINATE INPUTS */}

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="latitude"
                  className="text-sm font-semibold text-gray-700"
                >
                  Latitude
                </label>

                <input
                  id="latitude"
                  type="number"
                  min={-90}
                  max={90}
                  step="any"
                  value={latitude}
                  onChange={(event) =>
                    setLatitude(event.target.value)
                  }
                  placeholder="Optional"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-full border border-gray-200 px-5 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="longitude"
                  className="text-sm font-semibold text-gray-700"
                >
                  Longitude
                </label>

                <input
                  id="longitude"
                  type="number"
                  min={-180}
                  max={180}
                  step="any"
                  value={longitude}
                  onChange={(event) =>
                    setLongitude(event.target.value)
                  }
                  placeholder="Optional"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-full border border-gray-200 px-5 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              Latitude and longitude must be supplied together.
              Clearing the location sends null for both fields.
            </p>
          </div>
        </section>

        {/* ====================================== */}
        {/* FORM ACTIONS */}
        {/* ====================================== */}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() =>
              navigate(`/sudo/kiosks/${kioskId}`)
            }
            disabled={isSubmitting}
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingInstitutions}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-purple px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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