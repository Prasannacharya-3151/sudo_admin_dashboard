import { SUDO_API_BASE_URL } from "./apiConfig";

import type {
  ApiResponse,
  RevenueSummary,
  KioskRevenue,
  PrintModeRevenue,
  PaymentMethodRevenue,
  KioskPageAnalytics,
  StuckJob,
  UnprintedDocument,
} from "../types/kioskAnalytics";

// ==========================================
// ERROR HANDLER
// ==========================================

const getErrorMessage = async (
  response: Response,
): Promise<string> => {
  try {
    const data = await response.json();

    return (
      data?.message ||
      data?.error ||
      "Something went wrong"
    );
  } catch {
    return "Something went wrong";
  }
};

// ==========================================
// AUTH HEADERS
// ==========================================

const getHeaders = (
  accessToken: string,
): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
});

// ==========================================
// QUERY BUILDER
// ==========================================

const buildQuery = (
  params: Record<
    string,
    string | number | boolean | undefined
  >,
): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.set(
          key,
          String(value),
        );
      }
    },
  );

  const query =
    searchParams.toString();

  return query ? `?${query}` : "";
};

// ==========================================
// GENERIC GET
// ==========================================

const get = async <T>(
  endpoint: string,
  accessToken: string,
): Promise<T> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}${endpoint}`,
    {
      method: "GET",
      headers: getHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result =
    (await response.json()) as
      | ApiResponse<T>
      | T;

  if (
    result &&
    typeof result === "object" &&
    "data" in result
  ) {
    return (
      result as ApiResponse<T>
    ).data;
  }

  return result as T;
};

// ==========================================
// 1. REVENUE BY KIOSK
// ==========================================

export const getRevenueByKiosk =
  async (
    accessToken: string,
  ): Promise<KioskRevenue[]> => {
    return get<KioskRevenue[]>(
      "/sudo-admin/analytics/revenue/by-kiosk",
      accessToken,
    );
  };

// ==========================================
// 2. ONE KIOSK REVENUE
// ==========================================

export const getKioskRevenue =
  async (
    accessToken: string,
    kioskId: string,
  ): Promise<RevenueSummary> => {
    return get<RevenueSummary>(
      `/sudo-admin/analytics/kiosks/${encodeURIComponent(
        kioskId,
      )}/revenue`,
      accessToken,
    );
  };

// ==========================================
// 3. KIOSK REVENUE BY PRINT MODE
// ==========================================

export const getKioskRevenueByPrintMode =
  async (
    accessToken: string,
    kioskId: string,
    mode: "BW" | "COLOR",
  ): Promise<PrintModeRevenue> => {
    return get<PrintModeRevenue>(
      `/sudo-admin/analytics/kiosks/${encodeURIComponent(
        kioskId,
      )}/revenue/print-mode/${mode}`,
      accessToken,
    );
  };

// ==========================================
// 4. KIOSK REVENUE BY PAYMENT METHOD
// ==========================================

export const getKioskRevenueByPaymentMethod =
  async (
    accessToken: string,
    kioskId: string,
    method: "upi" | "rfid",
  ): Promise<PaymentMethodRevenue> => {
    return get<PaymentMethodRevenue>(
      `/sudo-admin/analytics/kiosks/${encodeURIComponent(
        kioskId,
      )}/revenue/payment-method/${method}`,
      accessToken,
    );
  };

// ==========================================
// 5. KIOSK PAGES
// ==========================================

export const getKioskPages =
  async (
    accessToken: string,
    kioskId: string,
  ): Promise<KioskPageAnalytics[]> => {
    return get<KioskPageAnalytics[]>(
      `/sudo-admin/analytics/kiosks/${encodeURIComponent(
        kioskId,
      )}/pages`,
      accessToken,
    );
  };

// ==========================================
// 6. STUCK JOBS
// ==========================================

export const getKioskStuckJobs =
  async (
    accessToken: string,
    kioskId: string,
    staleMinutes = 30,
  ): Promise<StuckJob[]> => {
    const query = buildQuery({
      stale_minutes: staleMinutes,
    });

    return get<StuckJob[]>(
      `/sudo-admin/analytics/kiosks/${encodeURIComponent(
        kioskId,
      )}/stuck-jobs${query}`,
      accessToken,
    );
  };

// ==========================================
// 7. UNPRINTED DOCUMENTS
// ==========================================

export const getKioskUnprintedDocuments =
  async (
    accessToken: string,
    kioskId: string,
  ): Promise<UnprintedDocument[]> => {
    return get<UnprintedDocument[]>(
      `/sudo-admin/analytics/kiosks/${encodeURIComponent(
        kioskId,
      )}/unprinted-documents`,
      accessToken,
    );
  };