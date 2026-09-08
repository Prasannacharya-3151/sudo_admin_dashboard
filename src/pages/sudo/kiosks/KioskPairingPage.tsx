import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Cpu,
  Link,
  Link2Off,
  Loader2,
  Monitor,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { toast } from "sonner";

import { useSudoAuth } from "../../../context/SudoAuthContext";

import {
  getKioskPairing,
  pairKiosk,
} from "../../../api/kioskApi";

import type {
  KioskPairing,
  PairKioskPayload,
} from "../../../types/kiosk";

// ==========================================
// COMPONENT
// ==========================================

export default function KioskPairingPage() {
  const navigate = useNavigate();

  const { kioskId } = useParams<{
    kioskId: string;
  }>();

  const { accessToken } = useSudoAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [pairing, setPairing] =
    useState<KioskPairing | null>(
      null,
    );

  const [deviceId, setDeviceId] =
    useState("");

  const [pairingCode, setPairingCode] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isPairing, setIsPairing] =
    useState(false);

  // ==========================================
  // LOAD PAIRING
  // ==========================================

  const loadPairing = useCallback(
    async () => {
      if (!kioskId || !accessToken) {
        return;
      }

      try {
        setIsLoading(true);

        // FIX: accessToken first, kioskId second —
        // matches getKioskPairing(accessToken, kioskId) signature
        const data =
          await getKioskPairing(
            accessToken,
            kioskId,
          );

        setPairing(data);

        setDeviceId(
          data.device_id ?? "",
        );

        setPairingCode(
          data.pairing_code ?? "",
        );
      } catch (error) {
        console.error(
          "Failed to load pairing:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load kiosk pairing";

        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [kioskId, accessToken],
  );

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    void loadPairing();
  }, [loadPairing]);

  // ==========================================
  // PAIR KIOSK
  // ==========================================

  const handlePair = async () => {
    if (!kioskId || !accessToken) {
      toast.error(
        "Authentication information missing",
      );

      return;
    }

    if (
      !deviceId.trim() &&
      !pairingCode.trim()
    ) {
      toast.error(
        "Enter a device ID or pairing code",
      );

      return;
    }

    try {
      setIsPairing(true);

      const payload: PairKioskPayload = {};

      if (deviceId.trim()) {
        payload.device_id =
          deviceId.trim();
      }

      if (pairingCode.trim()) {
        payload.pairing_code =
          pairingCode.trim();
      }

      // FIX: accessToken first, then kioskId, then payload —
      // matches pairKiosk(accessToken, kioskId, payload) signature
      const updatedPairing =
        await pairKiosk(
          accessToken,
          kioskId,
          payload,
        );

      setPairing(updatedPairing);

      setDeviceId(
        updatedPairing.device_id ?? "",
      );

      setPairingCode(
        updatedPairing.pairing_code ?? "",
      );

      toast.success(
        "Kiosk paired successfully",
      );
    } catch (error) {
      console.error(
        "Failed to pair kiosk:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to pair kiosk";

      toast.error(message);
    } finally {
      setIsPairing(false);
    }
  };

  // ==========================================
  // COPY PAIRING CODE
  // ==========================================

  const handleCopyCode = async () => {
    if (!pairingCode) {
      toast.error(
        "No pairing code available",
      );

      return;
    }

    try {
      await navigator.clipboard.writeText(
        pairingCode,
      );

      toast.success(
        "Pairing code copied",
      );
    } catch {
      toast.error(
        "Failed to copy pairing code",
      );
    }
  };

  // ==========================================
  // STATUS CONFIG
  // ==========================================

  const statusConfig = {
    paired: {
      label: "Paired",
      className:
        "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle2,
    },

    pending: {
      label: "Pending",
      className:
        "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: RefreshCw,
    },

    unpaired: {
      label: "Unpaired",
      className:
        "bg-gray-100 text-gray-600 border-gray-200",
      icon: Link2Off,
    },
  } as const;

  type PairingStatusKey = keyof typeof statusConfig;

  // FIX: narrow pairing?.status (a general string) down to a known
  // statusConfig key, falling back to "unpaired" if it's anything else
  const rawStatus = pairing?.status ?? "unpaired";

  const pairingStatus: PairingStatusKey =
    rawStatus in statusConfig
      ? (rawStatus as PairingStatusKey)
      : "unpaired";

  const currentStatus =
    statusConfig[pairingStatus];

  const StatusIcon =
    currentStatus.icon;

  // ==========================================
  // LOADING
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">

        <div className="flex flex-col items-center gap-4">

          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />

          <p className="text-sm text-gray-500">
            Loading kiosk pairing...
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">

      {/* HEADER */}

      <div className="flex items-start gap-4">

        <button
          type="button"
          onClick={() =>
            navigate(`/sudo/kiosks/${kioskId}`)
          }
          className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-brand-purple"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>

          <div className="flex items-center gap-2">

            <Link className="h-6 w-6 text-brand-purple" />

            <h1 className="text-2xl font-bold text-gray-900">
              Kiosk Pairing
            </h1>

          </div>

          <p className="mt-2 text-sm text-gray-500">
            Connect this kiosk with its physical device.
          </p>

        </div>

      </div>

      {/* STATUS CARD */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-brand-purple">

              <Monitor className="h-6 w-6" />

            </div>

            <div>

              <p className="text-sm font-medium text-gray-500">
                Pairing Status
              </p>

              <div className="mt-2 flex items-center gap-3">

                <h2 className="text-xl font-bold text-gray-900">
                  Device Connection
                </h2>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${currentStatus.className}`}
                >

                  <StatusIcon className="h-3.5 w-3.5" />

                  {currentStatus.label}

                </span>

              </div>

            </div>

          </div>

          {pairing?.paired_at && (

            <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">

              Paired on{" "}

              <span className="font-semibold text-gray-700">
                {new Date(
                  pairing.paired_at,
                ).toLocaleString()}
              </span>

            </div>

          )}

        </div>

      </div>

      {/* PAIRING INFO */}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* CURRENT DEVICE */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-brand-purple">

              <Cpu className="h-5 w-5" />

            </div>

            <div>

              <h2 className="font-bold text-gray-900">
                Device Information
              </h2>

              <p className="text-sm text-gray-500">
                Connected kiosk device
              </p>

            </div>

          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Device ID
            </p>

            <p className="mt-2 break-all font-mono text-sm font-semibold text-gray-800">
              {pairing?.device_id ||
                "No device paired"}
            </p>

          </div>

        </div>

        {/* PAIRING CODE */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-brand-purple">

              <ShieldCheck className="h-5 w-5" />

            </div>

            <div>

              <h2 className="font-bold text-gray-900">
                Pairing Code
              </h2>

              <p className="text-sm text-gray-500">
                Secure kiosk pairing identifier
              </p>

            </div>

          </div>

          <div className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">

            <p className="break-all font-mono text-lg font-bold tracking-wider text-gray-900">
              {pairing?.pairing_code ||
                "Not available"}
            </p>

            <button
              type="button"
              onClick={handleCopyCode}
              disabled={!pairing?.pairing_code}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm transition hover:text-brand-purple disabled:opacity-40"
            >
              <Copy className="h-4 w-4" />
            </button>

          </div>

        </div>

      </div>

      {/* PAIR DEVICE */}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-100 px-6 py-5">

          <h2 className="text-lg font-bold text-gray-900">
            Pair Kiosk Device
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Connect a physical kiosk device using its device ID or pairing code.
          </p>

        </div>

        <div className="space-y-6 p-6">

          {/* DEVICE ID */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Device ID
            </label>

            <input
              type="text"
              value={deviceId}
              onChange={(event) =>
                setDeviceId(
                  event.target.value,
                )
              }
              placeholder="Enter kiosk device ID"
              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
            />

          </div>

          {/* DIVIDER */}

          <div className="relative flex items-center">

            <div className="flex-1 border-t border-gray-200" />

            <span className="px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              OR
            </span>

            <div className="flex-1 border-t border-gray-200" />

          </div>

          {/* PAIRING CODE */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Pairing Code
            </label>

            <input
              type="text"
              value={pairingCode}
              onChange={(event) =>
                setPairingCode(
                  event.target.value,
                )
              }
              placeholder="Enter pairing code"
              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm uppercase outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
            />

          </div>

          {/* ACTION */}

          <div className="flex justify-end">

            <button
              type="button"
              onClick={handlePair}
              disabled={
                isPairing ||
                (!deviceId.trim() &&
                  !pairingCode.trim())
              }
              className="inline-flex items-center gap-2 rounded-xl bg-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {isPairing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link className="h-4 w-4" />
              )}

              {isPairing
                ? "Pairing..."
                : pairingStatus === "paired"
                  ? "Update Pairing"
                  : "Pair Device"}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}