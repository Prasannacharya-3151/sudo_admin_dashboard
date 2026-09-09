import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
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
  unpairKiosk,
} from "../../../api/kioskApi";
import type { AdminPairKioskPayload, KioskDetails } from "../../../types/kiosk";

// ==========================================
// COMPONENT
// ==========================================

export default function KioskPairingPage() {
  const navigate = useNavigate();
  const { kioskId } = useParams<{ kioskId: string }>();
  const { accessToken } = useSudoAuth();

  const [kiosk, setKiosk] = useState<KioskDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnpairing, setIsUnpairing] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // manual pair form
  const [pairingCode, setPairingCode] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [isPairing, setIsPairing] = useState(false);

  // ==========================================
  // LOAD — try the placeholder pairing-status endpoint first;
  // fall back to kiosk detail (which we know works) if it 404s.
  // ==========================================

  const loadPairingInfo = useCallback(async () => {
    if (!kioskId || !accessToken) return;

    try {
      setIsLoading(true);

      try {
        const status = await getKioskPairingStatus(accessToken, kioskId);
        setKiosk((previous) =>
          previous
            ? { ...previous, pairing_code: status.pairing_code, device_id: status.device_id ?? null, paired_at: status.paired_at ?? null }
            : ({
                pairing_code: status.pairing_code,
                device_id: status.device_id ?? null,
                paired_at: status.paired_at ?? null,
              } as KioskDetails),
        );
      } catch {
        // placeholder route not live yet — fall back to the confirmed detail endpoint
        const data = await getKioskById(accessToken, kioskId);
        setKiosk(data);
      }
    } catch (error) {
      console.error("Failed to load pairing info:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load kiosk pairing status");
    } finally {
      setIsLoading(false);
    }
  }, [kioskId, accessToken]);

  useEffect(() => {
    void loadPairingInfo();
  }, [loadPairingInfo]);

  // ==========================================
  // MANUAL PAIR — placeholder admin action
  // ==========================================

  const handlePair = async () => {
    if (!kioskId || !accessToken) return;

    if (!pairingCode.trim() && !deviceId.trim()) {
      toast.error("Enter a pairing code or device ID");
      return;
    }

    try {
      setIsPairing(true);

      const payload: AdminPairKioskPayload = {};
      if (pairingCode.trim()) payload.pairing_code = pairingCode.trim();
      if (deviceId.trim()) payload.device_id = deviceId.trim();

      const result = await adminPairKiosk(accessToken, kioskId, payload);

      setKiosk((previous) =>
        previous
          ? { ...previous, pairing_code: result.pairing_code, device_id: result.device_id ?? null, paired_at: result.paired_at ?? null }
          : previous,
      );

      setPairingCode("");
      setDeviceId("");
      toast.success("Kiosk paired successfully");
    } catch (error) {
      console.error("Failed to pair kiosk:", error);
      toast.error(error instanceof Error ? error.message : "Failed to pair kiosk");
    } finally {
      setIsPairing(false);
    }
  };

  // ==========================================
  // UNPAIR — confirmed real endpoint
  // ==========================================

  const handleUnpair = async () => {
    if (!kioskId || !accessToken) return;
    if (!window.confirm("Unpair this device? The old credentials stop working immediately.")) return;

    try {
      setIsUnpairing(true);
      const result = await unpairKiosk(accessToken, kioskId);
      setKiosk((previous) =>
        previous ? { ...previous, pairing_code: result.pairing_code, device_id: null, paired_at: null } : previous,
      );
      toast.success("Device unpaired — new pairing code issued");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unpair device");
    } finally {
      setIsUnpairing(false);
    }
  };

  const handleCopyCode = async () => {
    if (!kiosk?.pairing_code) return;
    try {
      await navigator.clipboard.writeText(kiosk.pairing_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error("Failed to copy pairing code");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
          <p className="text-sm text-gray-500">Loading pairing status...</p>
        </div>
      </div>
    );
  }

  if (!kiosk) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <Wifi className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-900">Kiosk not found</h2>
      </div>
    );
  }

  const isPaired = !!kiosk.paired_at;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => navigate(`/sudo/kiosks/${kioskId}`)}
          className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-brand-purple"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Wifi className="h-6 w-6 text-brand-purple" />
            <h1 className="text-2xl font-bold text-gray-900">Device Pairing</h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Connect this kiosk with its physical device.
          </p>
        </div>
      </div>

      {/* PLACEHOLDER NOTICE */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          Manual pairing below calls a placeholder endpoint
          (<code className="font-mono text-xs">POST /sudo-admin/kiosks/&#123;kioskId&#125;/pair</code>) —
          swap it in <code className="font-mono text-xs">api/kioskApi.ts</code> once the backend
          confirms the real route. Unpair already uses the confirmed endpoint.
        </p>
      </div>

      {/* STATUS CARD */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-brand-purple">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <div className="mt-2 flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{isPaired ? "Paired" : "Awaiting Pairing"}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                    isPaired
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-gray-200 bg-gray-100 text-gray-600"
                  }`}
                >
                  {isPaired ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Link2Off className="h-3.5 w-3.5" />}
                  {isPaired ? "Connected" : "Not Connected"}
                </span>
              </div>
            </div>
          </div>

          {isPaired && (
            <button
              type="button"
              onClick={handleUnpair}
              disabled={isUnpairing}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {isUnpairing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2Off className="h-4 w-4" />}
              Unpair Device
            </button>
          )}
        </div>

        {isPaired && (
          <div className="mt-6 grid gap-5 border-t border-gray-100 pt-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Device ID</p>
              <p className="mt-2 break-all font-mono text-sm font-semibold text-gray-800">{kiosk.device_id}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Paired At</p>
              <p className="mt-2 font-semibold text-gray-800">
                {kiosk.paired_at ? new Date(kiosk.paired_at).toLocaleString() : "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* PAIRING CODE */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-brand-purple">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Pairing Code</h2>
            <p className="text-sm text-gray-500">
              {isPaired ? "Already consumed for this pairing." : "Give this to the installer, or use manual pairing below."}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
          <p className="break-all font-mono text-lg font-bold tracking-wider text-gray-900">
            {kiosk.pairing_code || "Not available"}
          </p>
          <button
            type="button"
            onClick={handleCopyCode}
            disabled={!kiosk.pairing_code}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm transition hover:text-brand-purple disabled:opacity-40"
          >
            {codeCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* MANUAL PAIR (placeholder) */}
      {!isPaired && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-lg font-bold text-gray-900">Pair Kiosk Device</h2>
            <p className="mt-1 text-sm text-gray-500">
              Connect a physical kiosk device using its device ID or pairing code.
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Device ID</label>
              <input
                type="text"
                value={deviceId}
                onChange={(event) => setDeviceId(event.target.value)}
                placeholder="Enter kiosk device ID"
                className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
              />
            </div>

            <div className="relative flex items-center">
              <div className="flex-1 border-t border-gray-200" />
              <span className="px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">OR</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Pairing Code</label>
              <input
                type="text"
                value={pairingCode}
                onChange={(event) => setPairingCode(event.target.value)}
                placeholder="Enter pairing code"
                className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm uppercase outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePair}
                disabled={isPairing || (!deviceId.trim() && !pairingCode.trim())}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-purple px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPairing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
                {isPairing ? "Pairing..." : "Pair Device"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}