
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  Loader2,
  MapPin,
  Monitor,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";
import { createKiosk } from "../../../api/kioskApi";
import { getInstitutions } from "../../../api/institutionApi";

import KioskLocationPicker from "../kiosks/KioskLocationPicker";

import type {
  CreateKioskPayload,
  Kiosk,
  KioskType,
} from "../../../types/kiosk";
import type { Institution } from "../../../types/institution";

export default function CreateKioskPage() {
  const navigate = useNavigate();
  const { accessToken } = useSudoAuth();

  // Basic information
  const [name, setName] = useState("");
  const [kioskType, setKioskType] =
    useState<KioskType>("institution");
  const [institutionId, setInstitutionId] = useState("");

  // Address
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [postalCode, setPostalCode] = useState("");

  // Coordinates are optional. Empty strings mean no location selected.
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Institutions
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoadingInstitutions, setIsLoadingInstitutions] =
    useState(true);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success modal and pairing code
  const [createdKiosk, setCreatedKiosk] =
    useState<Kiosk | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Load institutions once when the page mounts.
  useEffect(() => {
    let cancelled = false;

    const loadInstitutions = async () => {
      if (!accessToken) {
        if (!cancelled) {
          setIsLoadingInstitutions(false);
        }
        return;
      }

      try {
        setIsLoadingInstitutions(true);

        const data = await getInstitutions(accessToken);

        if (!cancelled) {
          setInstitutions(data);
        }
      } catch (error) {
        console.error("Failed to load institutions:", error);

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
    // The token may rotate silently. We do not need to reload
    // the institution dropdown for every token rotation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep institution selection consistent with kiosk type.
  const handleTypeChange = (value: KioskType) => {
    setKioskType(value);

    if (value === "public") {
      setInstitutionId("");
    }
  };

  // Keep the map and coordinate state synchronized.
  const handleLocationChange = (
    newLatitude: number | null,
    newLongitude: number | null,
  ) => {
    if (newLatitude === null || newLongitude === null) {
      setLatitude("");
      setLongitude("");
      return;
    }

    setLatitude(String(newLatitude));
    setLongitude(String(newLongitude));
  };

  // Validate the complete form before creating the kiosk.
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

    if (!addressLine1.trim()) {
      toast.error("Address line 1 is required");
      return false;
    }

    if (!city.trim() || city.trim().length > 100) {
      toast.error("City is required (max 100 characters)");
      return false;
    }

    if (!state.trim() || state.trim().length > 100) {
      toast.error("State is required (max 100 characters)");
      return false;
    }

    if (!country.trim() || country.trim().length > 100) {
      toast.error("Country is required (max 100 characters)");
      return false;
    }

    if (postalCode.trim().length > 20) {
      toast.error("Postal code must be 20 characters or fewer");
      return false;
    }

    // Coordinates must either both be provided or both be empty.
    const hasLatitude = latitude.trim() !== "";
    const hasLongitude = longitude.trim() !== "";

    if (hasLatitude !== hasLongitude) {
      toast.error(
        "Select a complete location on the map, or clear both coordinates.",
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

  // Submit the kiosk to the existing API.
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) return;
    if (!validateForm()) return;

    if (!accessToken) {
      toast.error("Authentication session expired");
      navigate("/sudo/login");
      return;
    }

    try {
      setIsSubmitting(true);

      const hasLocation =
        latitude.trim() !== "" && longitude.trim() !== "";

      const payload: CreateKioskPayload = {
        name: name.trim(),
        kiosk_type: kioskType,
        institution_id:
          kioskType === "institution" ? institutionId : null,
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2.trim() || null,
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        postal_code: postalCode.trim() || null,

        // Send both coordinates or neither.
        latitude: hasLocation ? Number(latitude) : null,
        longitude: hasLocation ? Number(longitude) : null,
      };

      const kiosk = await createKiosk(accessToken, payload);

      setCreatedKiosk(kiosk);
      toast.success("Kiosk created successfully");
    } catch (error) {
      console.error("Failed to create kiosk:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create kiosk",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/sudo/kiosks");
  };

  const handleCopyPairingCode = async () => {
    if (!createdKiosk) return;

    try {
      await navigator.clipboard.writeText(
        createdKiosk.pairing_code,
      );

      setCodeCopied(true);
      toast.success("Pairing code copied");

      window.setTimeout(() => {
        setCodeCopied(false);
      }, 2000);
    } catch {
      toast.error("Couldn't copy — please copy it manually");
    }
  };

  const handleDoneAfterCreate = () => {
    navigate("/sudo/kiosks");
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Page heading */}
      <div className="mb-8">
        <button
          type="button"
          onClick={handleCancel}
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-purple px-4 py-2.5 text-sm font-medium text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Kiosks
        </button>

        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Create New Kiosk
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Register a new kiosk. Capabilities, pricing, and printers
          are configured after creation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Name this kiosk so it is easy to identify.
            </p>
          </div>

          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Kiosk Name <span className="ml-1 text-red-500">*</span>
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Campus Print Kiosk 1"
            maxLength={100}
            disabled={isSubmitting}
            className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
          />
        </section>

        {/* Kiosk type */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Kiosk Type
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Select where this kiosk belongs.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleTypeChange("institution")}
              disabled={isSubmitting}
              className={`rounded-2xl border-2 p-5 text-left transition ${
                kioskType === "institution"
                  ? "border-brand-purple bg-brand-purple/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    kioskType === "institution"
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
                    Belongs to a specific institution.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange("public")}
              disabled={isSubmitting}
              className={`rounded-2xl border-2 p-5 text-left transition ${
                kioskType === "public"
                  ? "border-brand-purple bg-brand-purple/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    kioskType === "public"
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
                    Independent, not tied to any institution.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {kioskType === "institution" && (
            <div className="mt-5">
              <label
                htmlFor="institution"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Institution{" "}
                <span className="ml-1 text-red-500">*</span>
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
                    setInstitutionId(event.target.value)
                  }
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  <option value="">Select an institution</option>
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
                  <p className="mt-2 text-sm text-amber-600">
                    No institutions available. Please create one
                    first.
                  </p>
                )}
            </div>
          )}
        </section>

        {/* Address and location picker */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Kiosk Location
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter the kiosk address and optionally mark its
                physical location on the map.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="address1"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Address Line 1{" "}
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="address1"
                type="text"
                value={addressLine1}
                onChange={(event) =>
                  setAddressLine1(event.target.value)
                }
                placeholder="e.g. Library Block, Ground Floor"
                disabled={isSubmitting}
                className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address2"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Address Line 2
              </label>

              <input
                id="address2"
                type="text"
                value={addressLine2}
                onChange={(event) =>
                  setAddressLine2(event.target.value)
                }
                placeholder="Optional"
                disabled={isSubmitting}
                className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                City <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="city"
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                maxLength={100}
                disabled={isSubmitting}
                className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                State <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="state"
                type="text"
                value={state}
                onChange={(event) => setState(event.target.value)}
                maxLength={100}
                disabled={isSubmitting}
                className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div>
              <label
                htmlFor="country"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Country <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="country"
                type="text"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                maxLength={100}
                disabled={isSubmitting}
                className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div>
              <label
                htmlFor="postal"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Postal Code
              </label>

              <input
                id="postal"
                type="text"
                value={postalCode}
                onChange={(event) =>
                  setPostalCode(event.target.value)
                }
                maxLength={20}
                placeholder="Optional"
                disabled={isSubmitting}
                className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Interactive map */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Pinpoint Kiosk on Map
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Click the map to place the kiosk marker. You can
                leave this blank if the location is not known yet.
              </p>
            </div>

            <KioskLocationPicker
              latitude={
                latitude.trim() === "" ? null : Number(latitude)
              }
              longitude={
                longitude.trim() === "" ? null : Number(longitude)
              }
              onLocationChange={handleLocationChange}
            />

            {/* Keep manual coordinate editing available. */}
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="latitude"
                  className="mb-2 block text-sm font-semibold text-gray-700"
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
                  placeholder="Optional, e.g. 12.9715996"
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>

              <div>
                <label
                  htmlFor="longitude"
                  className="mb-2 block text-sm font-semibold text-gray-700"
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
                  placeholder="Optional, e.g. 77.5945663"
                  disabled={isSubmitting}
                  className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Form actions */}
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
            disabled={isSubmitting || isLoadingInstitutions}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* Success modal: preserve the pairing code for the installer. */}
      {createdKiosk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>

            <h2 className="text-lg font-bold text-gray-900">
              Kiosk Created
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              "{createdKiosk.name}" is registered. Copy the pairing
              code below and give it to the on-site installer.
            </p>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span className="break-all font-mono text-lg font-bold tracking-wider text-gray-900">
                {createdKiosk.pairing_code}
              </span>

              <button
                type="button"
                onClick={() => void handleCopyPairingCode()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-purple px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                {codeCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleDoneAfterCreate}
              className="mt-6 w-full rounded-full bg-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Done — Go to Kiosks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
