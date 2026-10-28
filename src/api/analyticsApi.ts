import { SUDO_API_BASE_URL } from "./apiConfig";

import type {
  RevenueQueryParams,
  SheetsPrintedResponse,
  SudoRevenueResponse,
  SudoRevenueByKioskResponse,
  SudoGrowthResponse,
} from "../types/sudoAnalytics";

// ==========================================
// API RESPONSE WRAPPER
// ==========================================

interface ApiResponse<T> {
  data: T;
}

// ==========================================
// ERROR HELPER
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
// QUERY BUILDER
// ==========================================

const buildQuery = (
  params: Record<
    string,
    string | undefined
  >,
): string => {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    },
  );

  const query = searchParams.toString();

  return query ? `?${query}` : "";
};

// ==========================================
// AUTH HEADERS
// ==========================================

const getAuthHeaders = (): HeadersInit => {
  const accessToken =
    localStorage.getItem(
      "sudo_access_token",
    );

  return {
    "Content-Type": "application/json",

    ...(accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {}),
  };
};

// ==========================================
// GET PLATFORM REVENUE
// ==========================================

export const getSudoRevenue =
  async (
    params: RevenueQueryParams = {},
  ): Promise<SudoRevenueResponse> => {
    const query = buildQuery({
      date: params.date,
      from: params.from,
      to: params.to,
    });

    const response = await fetch(
      `${SUDO_API_BASE_URL}/sudo-admin/analytics/revenue${query}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const message =
        await getErrorMessage(response);

      throw new Error(message);
    }

    const result: ApiResponse<SudoRevenueResponse> =
      await response.json();

    return result.data;
  };

// ==========================================
// GET PLATFORM SHEETS PRINTED TODAY
// ==========================================

export const getSudoSheetsPrintedToday =
  async (
    kioskId?: string,
  ): Promise<SheetsPrintedResponse> => {
    const query = buildQuery({
      kiosk_id: kioskId,
    });

    const response = await fetch(
      `${SUDO_API_BASE_URL}/sudo-admin/analytics/sheets/printed/today${query}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const message =
        await getErrorMessage(response);

      throw new Error(message);
    }

    const result: ApiResponse<SheetsPrintedResponse> =
      await response.json();

    return result.data;
  };

// ==========================================
// GET REVENUE BY KIOSK
// ==========================================

export const getSudoRevenueByKiosk =
  async (
    params: RevenueQueryParams = {},
  ): Promise<SudoRevenueByKioskResponse> => {
    const query = buildQuery({
      date: params.date,
      from: params.from,
      to: params.to,
    });

    const response = await fetch(
      `${SUDO_API_BASE_URL}/sudo-admin/analytics/revenue/by-kiosk${query}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const message =
        await getErrorMessage(response);

      throw new Error(message);
    }

    const result: ApiResponse<SudoRevenueByKioskResponse> =
      await response.json();

    return result.data;
  };

// ==========================================
// GET GROWTH
// ==========================================

export const getSudoGrowth = async (
  windowDays: number = 30,
): Promise<SudoGrowthResponse> => {
  const params = new URLSearchParams({
    window_days: String(windowDays),
  });

  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/analytics/growth?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const message =
      await getErrorMessage(response);

    throw new Error(message);
  }

  const result: ApiResponse<SudoGrowthResponse> =
    await response.json();

  return result.data;
};