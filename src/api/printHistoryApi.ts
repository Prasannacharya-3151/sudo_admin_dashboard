import { SUDO_API_BASE_URL } from "./apiConfig";

import type {
  PrintHistoryFilters,
  PrintHistoryResponse,
} from "../types/sudoPrintHistory";

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
// GET PRINT HISTORY
// ==========================================

export const getPrintHistory = async (
  filters: PrintHistoryFilters = {},
): Promise<PrintHistoryResponse> => {
  const params = new URLSearchParams();

  // ----------------------------------------
  // KIOSK
  // ----------------------------------------

  if (filters.kiosk_id?.trim()) {
    params.set(
      "kiosk_id",
      filters.kiosk_id.trim(),
    );
  }

  // ----------------------------------------
  // INSTITUTION
  // ----------------------------------------

  if (filters.institution_id?.trim()) {
    params.set(
      "institution_id",
      filters.institution_id.trim(),
    );
  }

  // ----------------------------------------
  // ONLY PRINTED
  // ----------------------------------------

  if (filters.only_printed) {
    params.set(
      "only_printed",
      "true",
    );
  }

  // ----------------------------------------
  // PRINT MODE
  // ----------------------------------------

  if (filters.print_mode) {
    params.set(
      "print_mode",
      filters.print_mode,
    );
  }

  // ----------------------------------------
  // PRINTING SIDE
  // ----------------------------------------

  if (filters.printing_side) {
    params.set(
      "printing_side",
      filters.printing_side,
    );
  }

  // ----------------------------------------
  // FROM
  // ----------------------------------------

  if (filters.from) {
    params.set("from", filters.from);
  }

  // ----------------------------------------
  // TO
  // ----------------------------------------

  if (filters.to) {
    params.set("to", filters.to);
  }

  // ----------------------------------------
  // PAGE
  // ----------------------------------------

  params.set(
    "page",
    String(filters.page ?? 1),
  );

  // ----------------------------------------
  // PAGE SIZE
  // ----------------------------------------

  params.set(
    "page_size",
    String(filters.page_size ?? 20),
  );

  // ----------------------------------------
  // REQUEST
  // ----------------------------------------

  const query = params.toString();

  const url =
    `${SUDO_API_BASE_URL}/sudo-admin/analytics/print-history` +
    (query ? `?${query}` : "");

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const message =
      await getErrorMessage(response);

    throw new Error(message);
  }

  const result: PrintHistoryResponse =
    await response.json();

  return result;
};