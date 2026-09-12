import { SUDO_API_BASE_URL } from "./apiConfig";

import type {
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
  async (): Promise<SudoRevenueResponse> => {
    const response = await fetch(
      `${SUDO_API_BASE_URL}/sudo-admin/analytics/revenue`,
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
// GET REVENUE BY KIOSK
// ==========================================

export const getSudoRevenueByKiosk =
  async (): Promise<SudoRevenueByKioskResponse> => {
    const response = await fetch(
      `${SUDO_API_BASE_URL}/sudo-admin/analytics/revenue/by-kiosk`,
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