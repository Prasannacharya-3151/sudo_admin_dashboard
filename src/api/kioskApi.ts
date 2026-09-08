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
  UpdateKioskPricingPayload,
  KioskPrinter,
  AddKioskPrinterPayload,
  UpdateKioskPrinterPayload,
  KioskPairing,
  PairKioskPayload,
  KioskListResponse,
} from "../types/kiosk";

// ==========================================
// HELPER
// ==========================================

const getErrorMessage = async (
  response: Response,
): Promise<string> => {
  try {
    const errorData = await response.json();

    return (
      errorData.message ||
      errorData.error ||
      "Something went wrong"
    );
  } catch {
    return "Something went wrong";
  }
};

// ==========================================
// GET AUTH HEADERS
// ==========================================

const getAuthHeaders = (
  accessToken: string,
): HeadersInit => ({
  "Content-Type": "application/json",

  Authorization: `Bearer ${accessToken}`,
});

// ==========================================
// RESPONSE HELPER
// Handles:
// { data: ... }
// ==========================================

const unwrapResponse = <T>(
  result: ApiResponse<T> | T,
): T => {
  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result &&
    result.data !== undefined
  ) {
    return result.data;
  }

  return result as T;
};

// ==========================================
// CREATE KIOSK
// POST /kiosk/
// ==========================================

export const createKiosk = async (
  accessToken: string,
  payload: CreateKioskPayload,
): Promise<Kiosk> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/kiosk/`,
    {
      method: "POST",

      headers: getAuthHeaders(accessToken),

      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<Kiosk>
    | Kiosk = await response.json();

  return unwrapResponse<Kiosk>(result);
};

// ==========================================
// GET ALL KIOSKS
// GET /sudo-admin/kiosks
// ==========================================

export const getKiosks = async (
  accessToken: string,
): Promise<Kiosk[]> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks`,
    {
      method: "GET",

      headers: getAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<Kiosk[]>
    | Kiosk[]
    | KioskListResponse =
    await response.json();

  const data = unwrapResponse<
    Kiosk[] | KioskListResponse
  >(result);

  if (Array.isArray(data)) {
    return data;
  }

  return data.items || [];
};

// ==========================================
// GET SINGLE KIOSK
// GET /sudo-admin/kiosks/:kioskId
// ==========================================

export const getKioskById = async (
  accessToken: string,
  kioskId: string,
): Promise<KioskDetails> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}`,
    {
      method: "GET",

      headers: getAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<KioskDetails>
    | KioskDetails =
    await response.json();

  return unwrapResponse<KioskDetails>(
    result,
  );
};

// ==========================================
// UPDATE KIOSK
// PATCH /sudo-admin/kiosks/:kioskId
// ==========================================

export const updateKiosk = async (
  accessToken: string,
  kioskId: string,
  payload: UpdateKioskPayload,
): Promise<Kiosk> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}`,
    {
      method: "PATCH",

      headers: getAuthHeaders(accessToken),

      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<Kiosk>
    | Kiosk =
    await response.json();

  return unwrapResponse<Kiosk>(result);
};

// ==========================================
// DELETE KIOSK
// DELETE /sudo-admin/kiosks/:kioskId
// ==========================================

export const deleteKiosk = async (
  accessToken: string,
  kioskId: string,
): Promise<void> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}`,
    {
      method: "DELETE",

      headers: getAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }
};

// ==========================================
// GET KIOSK CAPABILITIES
// GET /sudo-admin/kiosks/:kioskId/capabilities
// ==========================================

export const getKioskCapabilities = async (
  accessToken: string,
  kioskId: string,
): Promise<KioskCapabilities> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/capabilities`,
    {
      method: "GET",

      headers: getAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<KioskCapabilities>
    | KioskCapabilities =
    await response.json();

  return unwrapResponse<KioskCapabilities>(
    result,
  );
};

// ==========================================
// UPDATE KIOSK CAPABILITIES
// PATCH /sudo-admin/kiosks/:kioskId/capabilities
// ==========================================

export const updateKioskCapabilities = async (
  accessToken: string,
  kioskId: string,
  payload: UpdateKioskCapabilitiesPayload,
): Promise<KioskCapabilities> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/capabilities`,
    {
      method: "PATCH",

      headers: getAuthHeaders(accessToken),

      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<KioskCapabilities>
    | KioskCapabilities =
    await response.json();

  return unwrapResponse<KioskCapabilities>(
    result,
  );
};

// ==========================================
// GET KIOSK PRICING
// GET /sudo-admin/kiosks/:kioskId/pricing
// ==========================================

export const getKioskPricing = async (
  accessToken: string,
  kioskId: string,
): Promise<KioskPricing> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pricing`,
    {
      method: "GET",

      headers: getAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<KioskPricing>
    | KioskPricing =
    await response.json();

  return unwrapResponse<KioskPricing>(
    result,
  );
};

// ==========================================
// UPDATE KIOSK PRICING
// PATCH /sudo-admin/kiosks/:kioskId/pricing
// ==========================================

export const updateKioskPricing = async (
  accessToken: string,
  kioskId: string,
  payload: UpdateKioskPricingPayload,
): Promise<KioskPricing> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pricing`,
    {
      method: "PATCH",

      headers: getAuthHeaders(accessToken),

      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<KioskPricing>
    | KioskPricing =
    await response.json();

  return unwrapResponse<KioskPricing>(
    result,
  );
};

// ==========================================
// GET KIOSK PRINTERS
// GET /sudo-admin/kiosks/:kioskId/printers
// ==========================================

export const getKioskPrinters = async (
  accessToken: string,
  kioskId: string,
): Promise<KioskPrinter[]> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/printers`,
    {
      method: "GET",

      headers: getAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<KioskPrinter[]>
    | KioskPrinter[] =
    await response.json();

  return unwrapResponse<KioskPrinter[]>(
    result,
  );
};

// ==========================================
// ADD KIOSK PRINTER
// POST /sudo-admin/kiosks/:kioskId/printers
// ==========================================

export const addKioskPrinter = async (
  accessToken: string,
  kioskId: string,
  payload: AddKioskPrinterPayload,
): Promise<KioskPrinter> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/printers`,
    {
      method: "POST",

      headers: getAuthHeaders(accessToken),

      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<KioskPrinter>
    | KioskPrinter =
    await response.json();

  return unwrapResponse<KioskPrinter>(
    result,
  );
};

// ==========================================
// UPDATE KIOSK PRINTER
// PATCH /sudo-admin/kiosks/:kioskId/printers/:printerId
// ==========================================

export const updateKioskPrinter = async (
  accessToken: string,
  kioskId: string,
  printerId: string,
  payload: UpdateKioskPrinterPayload,
): Promise<KioskPrinter> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/printers/${printerId}`,
    {
      method: "PATCH",

      headers: getAuthHeaders(accessToken),

      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<KioskPrinter>
    | KioskPrinter =
    await response.json();

  return unwrapResponse<KioskPrinter>(
    result,
  );
};

// ==========================================
// DELETE KIOSK PRINTER
// DELETE /sudo-admin/kiosks/:kioskId/printers/:printerId
// ==========================================

export const deleteKioskPrinter = async (
  accessToken: string,
  kioskId: string,
  printerId: string,
): Promise<void> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/printers/${printerId}`,
    {
      method: "DELETE",

      headers: getAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }
};

// ==========================================
// GET KIOSK PAIRING STATUS
// GET /sudo-admin/kiosks/:kioskId/pairing
// ==========================================

export const getKioskPairing = async (
  accessToken: string,
  kioskId: string,
): Promise<KioskPairing> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pairing`,
    {
      method: "GET",

      headers: getAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<KioskPairing>
    | KioskPairing =
    await response.json();

  return unwrapResponse<KioskPairing>(
    result,
  );
};

// ==========================================
// PAIR KIOSK
// POST /sudo-admin/kiosks/:kioskId/pair
// ==========================================

export const pairKiosk = async (
  accessToken: string,
  kioskId: string,
  payload: PairKioskPayload,
): Promise<KioskPairing> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/pair`,
    {
      method: "POST",

      headers: getAuthHeaders(accessToken),

      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result:
    | ApiResponse<KioskPairing>
    | KioskPairing =
    await response.json();

  return unwrapResponse<KioskPairing>(
    result,
  );
};

// ==========================================
// UNPAIR KIOSK
// POST /sudo-admin/kiosks/:kioskId/unpair
// ==========================================

export const unpairKiosk = async (
  accessToken: string,
  kioskId: string,
): Promise<void> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/kiosks/${kioskId}/unpair`,
    {
      method: "POST",

      headers: getAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }
};