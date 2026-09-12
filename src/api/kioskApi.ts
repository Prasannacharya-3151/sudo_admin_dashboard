import { SUDO_API_BASE_URL } from "./apiConfig";

import type {
  ApiResponse,
  Kiosk,
  KioskDetails,
  CreateKioskPayload,
  UpdateKioskPayload,
  KioskCapabilities,
  UpdateKioskCapabilitiesPayload,
  KioskPricing,
  CreateKioskPricingPayload,
  UpdateKioskPricingPayload,
  KioskPrinter,
  AddKioskPrinterPayload,
  PairKioskPayload,
  PairKioskResponse,
  KioskAuthPayload,
  KioskAuthResponse,
  UnpairKioskResponse,
  KioskListFilters,
  KioskPairingStatusResponse,
  AdminPairKioskPayload,
} from "../types/kiosk";

// ==========================================
// HELPERS
// ==========================================

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.json();
    return errorData.message || errorData.error || "Something went wrong";
  } catch {
    return "Something went wrong";
  }
};

const authHeaders = (accessToken: string): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
});

const noAuthHeaders: HeadersInit = {
  "Content-Type": "application/json",
};

const unwrapResponse = <T>(result: ApiResponse<T> | T): T => {
  if (typeof result === "object" && result !== null && "data" in result) {
    return (result as ApiResponse<T>).data;
  }
  return result as T;
};

// ==========================================
// KIOSK CRUD
// ==========================================

// POST /sudo-admin/kiosks/
export const createKiosk = async (
  accessToken: string,
  payload: CreateKioskPayload,
): Promise<Kiosk> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/kiosks/`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<Kiosk> = await response.json();
  return unwrapResponse<Kiosk>(result);
};

export const getKiosks = async (
  filters?: KioskListFilters,
): Promise<Kiosk[]> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/kiosk/`, {
    method: "GET",
    headers: noAuthHeaders,
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<Kiosk[]> | Kiosk[] = await response.json();
  const data = unwrapResponse<Kiosk[]>(result);

  if (!filters) return data;

  return data.filter((kiosk) => {
    if (filters.kiosk_type && kiosk.kiosk_type !== filters.kiosk_type) return false;
    if (filters.institution_id && kiosk.institution_id !== filters.institution_id) return false;
    if (filters.paired !== undefined) {
      const isPaired = kiosk.paired_at !== null;
      if (isPaired !== filters.paired) return false;
    }
    return true;
  });
};

// GET /sudo-admin/kiosks/{kioskId}
export const getKioskById = async (
  accessToken: string,
  kioskId: string,
): Promise<KioskDetails> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<KioskDetails> = await response.json();
  return unwrapResponse<KioskDetails>(result);
};

export const updateKiosk = async (
  accessToken: string,
  kioskId: string,
  payload: UpdateKioskPayload,
): Promise<Kiosk> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<Kiosk> = await response.json();
  return unwrapResponse<Kiosk>(result);
};

export const deleteKiosk = async (accessToken: string, kioskId: string): Promise<void> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));
};

// ==========================================
// CAPABILITIES
// ==========================================

// GET /kiosks/{kioskId}/capabilities — PUBLIC, no auth
export const getKioskCapabilities = async (kioskId: string): Promise<KioskCapabilities> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/kiosks/${kioskId}/capabilities`, {
    method: "GET",
    headers: noAuthHeaders,
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<KioskCapabilities> = await response.json();
  return unwrapResponse<KioskCapabilities>(result);
};

// PUT /sudo-admin/kiosks/{kioskId}/capabilities
export const updateKioskCapabilities = async (
  accessToken: string,
  kioskId: string,
  payload: UpdateKioskCapabilitiesPayload,
): Promise<KioskCapabilities> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/capabilities`,
    {
      method: "PUT",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<KioskCapabilities> = await response.json();
  return unwrapResponse<KioskCapabilities>(result);
};

// ==========================================
// PRICING (row-based)
// ==========================================

// POST /sudo-admin/kiosks/{kioskId}/pricing
export const createKioskPricing = async (
  accessToken: string,
  kioskId: string,
  payload: CreateKioskPricingPayload,
): Promise<KioskPricing> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pricing`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<KioskPricing> = await response.json();
  return unwrapResponse<KioskPricing>(result);
};

// PATCH /sudo-admin/kiosks/{kioskId}/pricing/{pricingId}
export const updateKioskPricing = async (
  accessToken: string,
  kioskId: string,
  pricingId: string,
  payload: UpdateKioskPricingPayload,
): Promise<KioskPricing> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pricing/${pricingId}`,
    {
      method: "PATCH",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<KioskPricing> = await response.json();
  return unwrapResponse<KioskPricing>(result);
};

// DELETE /sudo-admin/kiosks/{kioskId}/pricing/{pricingId} — soft delete (active -> false)
export const deactivateKioskPricing = async (
  accessToken: string,
  kioskId: string,
  pricingId: string,
): Promise<void> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pricing/${pricingId}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
  );

  if (!response.ok) throw new Error(await getErrorMessage(response));
};

// ==========================================
// PRINTERS
// ==========================================

// GET /sudo-admin/kiosks/{kioskId}/printers
export const getKioskPrinters = async (
  accessToken: string,
  kioskId: string,
): Promise<KioskPrinter[]> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/printers`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<KioskPrinter[]> = await response.json();
  return unwrapResponse<KioskPrinter[]>(result);
};

// POST /sudo-admin/kiosks/{kioskId}/printers — becomes default automatically
export const addKioskPrinter = async (
  accessToken: string,
  kioskId: string,
  payload: AddKioskPrinterPayload,
): Promise<KioskPrinter> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/printers`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<KioskPrinter> = await response.json();
  return unwrapResponse<KioskPrinter>(result);
};

// DELETE /sudo-admin/kiosks/{kioskId}/printers/{printerId}
// NOTE: no update-printer endpoint exists in the spec — don't add one.
export const removeKioskPrinter = async (
  accessToken: string,
  kioskId: string,
  printerId: string,
): Promise<void> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/printers/${printerId}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
  );

  if (!response.ok) throw new Error(await getErrorMessage(response));
};

export const pairKioskMachine = async (
  payload: PairKioskPayload,
): Promise<PairKioskResponse> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/kiosks/pair`, {
    method: "POST",
    headers: noAuthHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<PairKioskResponse> = await response.json();
  return unwrapResponse<PairKioskResponse>(result);
};

// POST /kiosks/auth — NO auth. Called at every kiosk boot with stored device credentials.
export const authenticateKioskMachine = async (
  payload: KioskAuthPayload,
): Promise<KioskAuthResponse> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/kiosks/auth`, {
    method: "POST",
    headers: noAuthHeaders,
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<KioskAuthResponse> = await response.json();
  return unwrapResponse<KioskAuthResponse>(result);
};

export const unpairKiosk = async (
  accessToken: string,
  kioskId: string,
): Promise<UnpairKioskResponse> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/unpair`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<UnpairKioskResponse> = await response.json();
  return unwrapResponse<UnpairKioskResponse>(result);
};

export const getKioskPairingStatus = async (
  accessToken: string,
  kioskId: string,
): Promise<KioskPairingStatusResponse> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pairing`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<KioskPairingStatusResponse> = await response.json();
  return unwrapResponse<KioskPairingStatusResponse>(result);
};

export const adminPairKiosk = async (
  accessToken: string,
  kioskId: string,
  payload: AdminPairKioskPayload,
): Promise<KioskPairingStatusResponse> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pair`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<KioskPairingStatusResponse> = await response.json();
  return unwrapResponse<KioskPairingStatusResponse>(result);
};
