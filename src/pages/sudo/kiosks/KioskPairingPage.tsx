import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Link,
  Link2Off,
  Loader2,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { useSudoAuth } from "../../../context/SudoAuthContext";
import {
  adminPairKiosk,
  getKioskById,
  getKioskPairingStatus,
  getKiosks,
  unpairKiosk,
} from "../../../api/kioskApi";
import type {
  AdminPairKioskPayload,
  KioskDetails,
  KioskPairingStatusResponse,
} from "../../../types/kiosk";

// ==========================================
// HELPERS
// ==========================================

// Returns the first value that is NOT undefined.
// null is a real value and must be preserved after unpairing.
function pick<T>(...values: (T | undefined)[]): T | undefined {
  for (const value of values) {
    if (value !== undefined) return value;
  }

  return undefined;
}

// Merge pairing status into kiosk details without allowing an empty
// pairing code from the status response to overwrite a valid code.
function mergePairingStatus(
  base: KioskDetails,
  status: KioskPairingStatusResponse | null | undefined,
): KioskDetails {
  if (!status) return base;

  return {
    ...base,
    pairing_code: status.pairing_code?.trim()
      ? status.pairing_code
      : base.pairing_code,
    device_id: pick<string | null>(
      status.device_id,
      base.device_id,
    ),
    paired_at: pick<string | null>(
      status.paired_at,
      base.paired_at,
    ),
  };
}

// ==========================================
// COMPONENT
// ==========================================

export default function KioskPairingPage() {
  const navigate = useNavigate();
  const { kioskId } = useParams<{ kioskId: string }>();
  const { accessToken } = useSudoAuth();

  // Always access the latest token without making token rotation
  // itself trigger another request.
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  const [kiosk, setKiosk] = useState<KioskDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPairing, setIsPairing] = useState(false);
  const [isUnpairing, setIsUnpairing] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const [pairingCode, setPairingCode] = useState("");
  const [deviceId, setDeviceId] = useState("");

  // ==========================================
  // LOAD PAIRING INFORMATION
  // ==========================================

  const loadPairingInfo = useCallback(
    async (silent = false) => {
      if (!kioskId) {
        setIsLoading(false);
        return;
      }

      const token = accessTokenRef.current;

      if (!token) {
        if (!silent) {
          setIsLoading(false);
        }

        return;
      }

      try {
        if (!silent) {
          setIsLoading(true);
        }

        // Primary source: kiosk details.
        const details = await getKioskById(token, kioskId);

        // Additional source: pairing status endpoint.
        let status: KioskPairingStatusResponse | null = null;

        try {
          status = await getKioskPairingStatus(token, kioskId);
        } catch (pairingError) {
          // Continue using kiosk details if the pairing-status endpoint
          // is unavailable in the current backend deployment.
          console.warn(
            "Pairing-status endpoint unavailable; using kiosk details:",
            pairingError,
          );
        }

        let merged = mergePairingStatus(details, status);

        // Fallback: attempt to obtain the pairing code from the kiosk list
        // if neither details nor the pairing-status response supplied it.
        if (!merged.pairing_code?.trim()) {
          try {
            const kiosks = await getKiosks();

            const listKiosk = kiosks.find(
              (item) => item.id === kioskId,
            );

            if (listKiosk?.pairing_code?.trim()) {
              merged = {
                ...merged,
                pairing_code: listKiosk.pairing_code,
              };
            }
          } catch (listError) {
            console.warn(
              "Could not load pairing code from kiosk list:",
              listError,
            );
          }
        }

        setKiosk((previous) => {
          // Never reuse pairing information from another kiosk.
          const sameKiosk =
            previous?.id === kioskId ? previous : null;

          return {
            ...merged,

            pairing_code: merged.pairing_code?.trim()
              ? merged.pairing_code
              : sameKiosk?.pairing_code,

            device_id: pick<string | null>(
              merged.device_id,
              sameKiosk?.device_id,
            ),

            paired_at: pick<string | null>(
              merged.paired_at,
              sameKiosk?.paired_at,
            ),
          };
        });
      } catch (error) {
        console.error(
          "Failed to load kiosk pairing information:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load kiosk pairing information",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [kioskId],
  );

  useEffect(() => {
    // Wait until authentication supplies a token.
    // Boolean(accessToken) remains true when the token rotates,
    // so rotation alone will not trigger another fetch.
    if (accessToken) {
      void loadPairingInfo();
    }
  }, [kioskId, Boolean(accessToken), loadPairingInfo]);

  // ==========================================
  // PAIR DEVICE
  // POST /sudo-admin/kiosks/{id}/pair
  // ==========================================

  const handlePair = async () => {
    if (!kioskId || !accessToken) {
      toast.error("Authentication required");
      return;
    }

    const cleanPairingCode = pairingCode.trim();
    const cleanDeviceId = deviceId.trim();

    if (!cleanPairingCode && !cleanDeviceId) {
      toast.error("Enter a pairing code or device ID");
      return;
    }

    try {
      setIsPairing(true);

      const payload: AdminPairKioskPayload = {};

      if (cleanPairingCode) {
        payload.pairing_code = cleanPairingCode;
      }

      if (cleanDeviceId) {
        payload.device_id = cleanDeviceId;
      }

      const result = await adminPairKiosk(
        accessToken,
        kioskId,
        payload,
      );

      // Immediately merge the response into the displayed kiosk.
      setKiosk((previous) =>
        previous
          ? mergePairingStatus(previous, result)
          : previous,
      );

      setPairingCode("");
      setDeviceId("");

      toast.success("Kiosk paired successfully");

      // Refresh pairing information silently to confirm the server state.
      await loadPairingInfo(true);
    } catch (error) {
      console.error("Failed to pair kiosk:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to pair kiosk",
      );
    } finally {
      setIsPairing(false);
    }
  };

  // ==========================================
  // UNPAIR DEVICE
  // POST /sudo-admin/kiosks/{id}/unpair
  // Returns a fresh pairing_code.
  // ==========================================

  const handleUnpair = async () => {
    if (!kioskId || !accessToken) {
      toast.error("Authentication required");
      return;
    }

    const confirmed = window.confirm(
      "Unpair this kiosk device?\n\nThe current device credentials will stop working.",
    );

    if (!confirmed) return;

    try {
      setIsUnpairing(true);

      const result = await unpairKiosk(
        accessToken,
        kioskId,
      );

      // The unpair endpoint returns the new pairing code.
      // Display it immediately without waiting for another GET request.
      setKiosk((previous) =>
        previous
          ? {
              ...previous,
              pairing_code: result.pairing_code,
              device_id: null,
              paired_at: null,
            }
          : previous,
      );

      setPairingCode("");
      setDeviceId("");

      toast.success(
        "Kiosk unpaired — new pairing code issued",
      );
    } catch (error) {
      console.error("Failed to unpair kiosk:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to unpair kiosk",
      );
    } finally {
      setIsUnpairing(false);
    }
  };

  // ==========================================
  // COPY PAIRING CODE
  // ==========================================

  const handleCopyCode = async () => {
    const code = kiosk?.pairing_code;

    if (!code) {
      toast.error("No pairing code is available");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);

      setCodeCopied(true);

      toast.success("Pairing code copied");

      window.setTimeout(() => {
        setCodeCopied(false);
      }, 2000);
    } catch {
      toast.error("Failed to copy pairing code");
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />

          <p className="text-xs text-gray-500">
            Loading pairing status...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // NOT FOUND
  // ==========================================

  if (!kiosk) {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center">
        <Wifi className="mx-auto mb-3 h-10 w-10 text-slate-300" />

        <h2 className="text-base font-semibold text-slate-900">
          Kiosk not found
        </h2>

        <button
          type="button"
          onClick={() => navigate("/sudo/kiosks")}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-brand-purple px-5 text-xs font-semibold text-white transition hover:opacity-90"
        >
          Back to Kiosks
        </button>
      </div>
    );
  }

  // paired_at is the source of truth for whether the device is paired.
  const isPaired = Boolean(kiosk.paired_at);
  const isBusy = isPairing || isUnpairing;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-8">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/sudo/kiosks/${kioskId}`)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-brand-purple"
          aria-label="Back to kiosk"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-brand-purple" />

            <h1 className="text-lg font-bold leading-tight text-gray-900">
              Device Pairing
            </h1>
          </div>

          <p className="mt-0.5 text-xs text-gray-500">
            Pair or unpair the physical device assigned to this kiosk.
          </p>
        </div>
      </div>

      {/* STATUS */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-50 text-brand-purple">
              <Cpu className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">
                Pairing Status
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  {isPaired ? "Paired" : "Awaiting Pairing"}
                </h2>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    isPaired
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-gray-200 bg-gray-100 text-gray-600"
                  }`}
                >
                  {isPaired ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Link2Off className="h-3 w-3" />
                  )}

                  {isPaired ? "Connected" : "Not Connected"}
                </span>
              </div>
            </div>
          </div>

          {isPaired && (
            <button
              type="button"
              onClick={handleUnpair}
              disabled={isBusy}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-red-200 px-5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUnpairing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2Off className="h-3.5 w-3.5" />
              )}

              {isUnpairing ? "Unpairing..." : "Unpair Device"}
            </button>
          )}
        </div>

        {isPaired && (
          <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Device ID
              </p>

              <p className="mt-1 break-all font-mono text-xs font-semibold text-gray-800">
                {kiosk.device_id || "—"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Paired At
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-800">
                {kiosk.paired_at
                  ? new Date(kiosk.paired_at).toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* PAIRING CODE */}
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-brand-purple">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Pairing Code
            </h2>

            <p className="text-xs text-gray-500">
              {isPaired
                ? "This code has already been used for the current pairing."
                : "Use this code to connect the physical kiosk device."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-full bg-gray-50 py-2 pl-5 pr-2">
          <p className="break-all font-mono text-base font-bold tracking-wider text-gray-900">
            {kiosk.pairing_code || "Not available"}
          </p>

          <button
            type="button"
            onClick={handleCopyCode}
            disabled={!kiosk.pairing_code}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition hover:text-brand-purple disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Copy pairing code"
          >
            {codeCopied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* PAIR DEVICE */}
      {!isPaired && (
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-brand-purple">
                <Link className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Pair Kiosk Device
                </h2>

                <p className="text-xs text-gray-500">
                  Enter the physical device ID or pairing code.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block px-1 text-xs font-semibold text-gray-700">
                Device ID
              </label>

              <input
                type="text"
                value={deviceId}
                onChange={(event) => setDeviceId(event.target.value)}
                placeholder="Enter kiosk device ID"
                disabled={isBusy}
                className="h-10 w-full rounded-full border border-gray-200 px-5 text-xs outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 disabled:bg-gray-50"
              />
            </div>

            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-200" />

              <span className="px-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                OR
              </span>

              <div className="flex-1 border-t border-gray-200" />
            </div>

            <div>
              <label className="mb-1.5 block px-1 text-xs font-semibold text-gray-700">
                Pairing Code
              </label>

              <input
                type="text"
                value={pairingCode}
                onChange={(event) =>
                  setPairingCode(event.target.value.toUpperCase())
                }
                placeholder="Enter pairing code"
                disabled={isBusy}
                className="h-10 w-full rounded-full border border-gray-200 px-5 text-xs uppercase outline-none transition placeholder:normal-case placeholder:text-gray-400 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 disabled:bg-gray-50"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePair}
                disabled={
                  isBusy ||
                  (!deviceId.trim() && !pairingCode.trim())
                }
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-brand-purple px-6 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPairing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Link className="h-3.5 w-3.5" />
                )}

                {isPairing ? "Pairing..." : "Pair Device"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAIRED INFORMATION */}
      {isPaired && (
        <div className="rounded-3xl border border-green-200 bg-green-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

            <div>
              <h3 className="text-sm font-bold text-green-900">
                Kiosk device is connected
              </h3>

              <p className="mt-0.5 text-xs text-green-700">
                The physical device is currently paired with this kiosk. Use{" "}
                <span className="font-semibold">Unpair Device</span> above if
                you need to replace it.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}