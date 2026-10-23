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
  PaperPricing,
  CreatePaperPricingPayload,
  UpdatePaperPricingPayload,
} from "../types/kiosk";

// ======================================================
// HELPERS
// ======================================================

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const errorData = await response.json();

    return (
      errorData.message ||
      errorData.error ||
      errorData.detail ||
      "Something went wrong"
    );
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
  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result
  ) {
    return (result as ApiResponse<T>).data;
  }

  return result as T;
};

// ======================================================
// KIOSK CRUD
// ======================================================

// POST /sudo-admin/kiosks/
export const createKiosk = async (
  accessToken: string,
  payload: CreateKioskPayload,
): Promise<Kiosk> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<Kiosk> | Kiosk = await response.json();

  return unwrapResponse<Kiosk>(result);
};

// GET /kiosk/
export const getKiosks = async (
  filters?: KioskListFilters,
): Promise<Kiosk[]> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/kiosk/`, {
    method: "GET",
    headers: noAuthHeaders,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<Kiosk[]> | Kiosk[] = await response.json();
  const data = unwrapResponse<Kiosk[]>(result);

  if (!filters) {
    return data;
  }

  return data.filter((kiosk) => {
    if (
      filters.kiosk_type &&
      kiosk.kiosk_type !== filters.kiosk_type
    ) {
      return false;
    }

    if (
      filters.institution_id &&
      kiosk.institution_id !== filters.institution_id
    ) {
      return false;
    }

    if (filters.paired !== undefined) {
      const isPaired = kiosk.paired_at !== null;

      if (isPaired !== filters.paired) {
        return false;
      }
    }

    return true;
  });
};

// GET /sudo-admin/kiosks/{kioskId}
export const getKioskById = async (
  accessToken: string,
  kioskId: string,
): Promise<KioskDetails> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}`,
    {
      method: "GET",
      headers: authHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<KioskDetails> | KioskDetails =
    await response.json();

  return unwrapResponse<KioskDetails>(result);
};

// PATCH /sudo-admin/kiosks/{kioskId}
export const updateKiosk = async (
  accessToken: string,
  kioskId: string,
  payload: UpdateKioskPayload,
): Promise<Kiosk> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}`,
    {
      method: "PATCH",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<Kiosk> | Kiosk = await response.json();

  return unwrapResponse<Kiosk>(result);
};

// DELETE /sudo-admin/kiosks/{kioskId}
export const deleteKiosk = async (
  accessToken: string,
  kioskId: string,
): Promise<void> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

// ======================================================
// KIOSK CAPABILITIES
// ======================================================

// GET /kiosks/{kioskId}/capabilities
// Public endpoint — no authentication required.
export const getKioskCapabilities = async (
  kioskId: string,
): Promise<KioskCapabilities> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/kiosks/${kioskId}/capabilities`,
    {
      method: "GET",
      headers: noAuthHeaders,
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result:
    | ApiResponse<KioskCapabilities>
    | KioskCapabilities = await response.json();

  return unwrapResponse<KioskCapabilities>(result);
};

// PUT /sudo-admin/kiosks/{kioskId}/capabilities
// Sudo Admin only.
// Sends only the capability keys supplied in the payload.
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

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result:
    | ApiResponse<KioskCapabilities>
    | KioskCapabilities = await response.json();

  return unwrapResponse<KioskCapabilities>(result);
};

// ======================================================
// PUBLIC KIOSK PRICING
// ======================================================

// GET /kiosks/{kioskId}/pricing
// Public endpoint — returns active pricing rows.
// Each row includes pages_per_sheet.
export const getPublicKioskPricing = async (
  kioskId: string,
): Promise<KioskPricing[]> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/kiosks/${kioskId}/pricing`,
    {
      method: "GET",
      headers: noAuthHeaders,
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<KioskPricing[]> | KioskPricing[] =
    await response.json();

  return unwrapResponse<KioskPricing[]>(result);
};

// ======================================================
// SUDO ADMIN KIOSK PRICING
// ======================================================

// POST /sudo-admin/kiosks/{kioskId}/pricing
// Creates a pricing combination.
// pages_per_sheet can be 1, 2, or 4.
// If omitted, the backend defaults it to 1.
export const createKioskPricing = async (
  accessToken: string,
  kioskId: string,
  payload: CreateKioskPricingPayload,
): Promise<KioskPricing> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pricing`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<KioskPricing> | KioskPricing =
    await response.json();

  return unwrapResponse<KioskPricing>(result);
};

// PATCH /sudo-admin/kiosks/{kioskId}/pricing/{pricingId}
// Updates price and/or active status.
// Do not include pages_per_sheet: it is immutable.
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

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<KioskPricing> | KioskPricing =
    await response.json();

  return unwrapResponse<KioskPricing>(result);
};

// DELETE /sudo-admin/kiosks/{kioskId}/pricing/{pricingId}
// Backend soft-deletes the row by setting active=false.
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

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

// ======================================================
// LEGACY / SIMPLE PAPER PRICING
// Keep these functions so existing A4 paper pricing
// functionality is not accidentally removed.
// ======================================================

// GET /sudo-admin/kiosks/{kioskId}/paper-pricing
export const getKioskPaperPricing = async (
  accessToken: string,
  kioskId: string,
): Promise<PaperPricing[]> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/paper-pricing`,
    {
      method: "GET",
      headers: authHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<PaperPricing[]> | PaperPricing[] =
    await response.json();

  return unwrapResponse<PaperPricing[]>(result);
};

// POST /sudo-admin/kiosks/{kioskId}/paper-pricing
export const createKioskPaperPricing = async (
  accessToken: string,
  kioskId: string,
  payload: CreatePaperPricingPayload,
): Promise<PaperPricing> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/paper-pricing`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<PaperPricing> | PaperPricing =
    await response.json();

  return unwrapResponse<PaperPricing>(result);
};

// PATCH /sudo-admin/kiosks/{kioskId}/paper-pricing/{pricingId}
export const updateKioskPaperPricing = async (
  accessToken: string,
  kioskId: string,
  pricingId: string,
  payload: UpdatePaperPricingPayload,
): Promise<PaperPricing> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/paper-pricing/${pricingId}`,
    {
      method: "PATCH",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<PaperPricing> | PaperPricing =
    await response.json();

  return unwrapResponse<PaperPricing>(result);
};

// ======================================================
// KIOSK PRINTERS
// ======================================================

// GET /sudo-admin/kiosks/{kioskId}/printers
export const getKioskPrinters = async (
  accessToken: string,
  kioskId: string,
): Promise<KioskPrinter[]> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/printers`,
    {
      method: "GET",
      headers: authHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<KioskPrinter[]> | KioskPrinter[] =
    await response.json();

  return unwrapResponse<KioskPrinter[]>(result);
};

// POST /sudo-admin/kiosks/{kioskId}/printers
export const addKioskPrinter = async (
  accessToken: string,
  kioskId: string,
  payload: AddKioskPrinterPayload,
): Promise<KioskPrinter> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/printers`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<KioskPrinter> | KioskPrinter =
    await response.json();

  return unwrapResponse<KioskPrinter>(result);
};

// DELETE /sudo-admin/kiosks/{kioskId}/printers/{printerId}
// No update-printer endpoint is defined in the API spec.
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

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

// ======================================================
// KIOSK PAIRING
// ======================================================

// POST /kiosks/pair
export const pairKioskMachine = async (
  payload: PairKioskPayload,
): Promise<PairKioskResponse> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/kiosks/pair`,
    {
      method: "POST",
      headers: noAuthHeaders,
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<PairKioskResponse> | PairKioskResponse =
    await response.json();

  return unwrapResponse<PairKioskResponse>(result);
};

// POST /kiosks/auth
// Called at kiosk boot with stored device credentials.
export const authenticateKioskMachine = async (
  payload: KioskAuthPayload,
): Promise<KioskAuthResponse> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/kiosks/auth`,
    {
      method: "POST",
      headers: noAuthHeaders,
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<KioskAuthResponse> | KioskAuthResponse =
    await response.json();

  return unwrapResponse<KioskAuthResponse>(result);
};

// POST /sudo-admin/kiosks/{kioskId}/unpair
export const unpairKiosk = async (
  accessToken: string,
  kioskId: string,
): Promise<UnpairKioskResponse> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/unpair`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result:
    | ApiResponse<UnpairKioskResponse>
    | UnpairKioskResponse = await response.json();

  return unwrapResponse<UnpairKioskResponse>(result);
};

// GET /sudo-admin/kiosks/{kioskId}/pairing
export const getKioskPairingStatus = async (
  accessToken: string,
  kioskId: string,
): Promise<KioskPairingStatusResponse> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pairing`,
    {
      method: "GET",
      headers: authHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result:
    | ApiResponse<KioskPairingStatusResponse>
    | KioskPairingStatusResponse = await response.json();

  return unwrapResponse<KioskPairingStatusResponse>(result);
};

// POST /sudo-admin/kiosks/{kioskId}/pair
export const adminPairKiosk = async (
  accessToken: string,
  kioskId: string,
  payload: AdminPairKioskPayload,
): Promise<KioskPairingStatusResponse> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pair`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result:
    | ApiResponse<KioskPairingStatusResponse>
    | KioskPairingStatusResponse = await response.json();

  return unwrapResponse<KioskPairingStatusResponse>(result);
};