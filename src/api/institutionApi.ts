import { SUDO_API_BASE_URL } from "./apiConfig";

import type {
  ApiResponse,
  Institution,
  InstitutionDetails,
  InstitutionStaff,
  InstitutionAdministrator,
  CreateInstitutionPayload,
  CreateInstitutionAdminPayload,
  UpdateInstitutionPayload,
  InstitutionUpdateResponse,
  InstitutionUpdateResult,
} from "../types/institution";

// ==========================================
// ERROR HELPER
// ==========================================

const getErrorMessage = async (
  response: Response,
): Promise<string> => {
  try {
    const errorData = await response.json();

    return (
      errorData?.detail ||
      errorData?.message ||
      errorData?.error ||
      "Something went wrong"
    );
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

type InstitutionApiError = Error & {
  status?: number;
  code?: string;
};

// Preserve the HTTP status and error code so callers can react
// to 404 administrator_not_found / 409 administrator_email_taken.
const buildApiError = async (
  response: Response,
): Promise<InstitutionApiError> => {
  let errorData: {
    detail?: unknown;
    message?: unknown;
    error?: unknown;
  } | null = null;

  try {
    errorData = (await response.json()) as {
      detail?: unknown;
      message?: unknown;
      error?: unknown;
    };
  } catch {
    errorData = null;
  }

  const detail =
    typeof errorData?.detail === "string"
      ? errorData.detail
      : "";

  const message =
    typeof errorData?.message === "string"
      ? errorData.message
      : "";

  const errorCode =
    typeof errorData?.error === "string"
      ? errorData.error
      : "";

  const apiError = new Error(
    detail ||
      message ||
      errorCode ||
      `Request failed with status ${response.status}`,
  ) as InstitutionApiError;

  apiError.status = response.status;
  apiError.code = errorCode || undefined;

  return apiError;
};

// ==========================================
// AUTH HEADER HELPER
// ==========================================

const getAuthHeaders = (
  accessToken: string,
): HeadersInit => {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
};

// ==========================================
// CREATE INSTITUTION
// POST /institution/
// ==========================================

export const createInstitution = async (
  payload: CreateInstitutionPayload,
  accessToken: string,
): Promise<Institution> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/institution/`,
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

  const result: ApiResponse<Institution> =
    await response.json();

  return result.data;
};

// ==========================================
// GET ALL INSTITUTIONS
// GET /sudo-admin/institutions
// ==========================================

export const getInstitutions = async (
  accessToken: string,
): Promise<Institution[]> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/institutions`,
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

  const result: ApiResponse<Institution[]> =
    await response.json();

  return result.data;
};

// ==========================================
// GET SINGLE INSTITUTION
// GET /sudo-admin/institutions/:institutionId
// ==========================================

export const getInstitutionById = async (
  institutionId: string,
  accessToken: string,
): Promise<InstitutionDetails> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/institutions/${encodeURIComponent(
      institutionId,
    )}`,
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

  const result: ApiResponse<InstitutionDetails> =
    await response.json();

  return result.data;
};

// ==========================================
// UPDATE INSTITUTION
// PATCH /sudo-admin/institutions/:institutionId
// ==========================================

export const updateInstitution = async (
  institutionId: string,
  payload: UpdateInstitutionPayload,
  accessToken: string,
): Promise<InstitutionUpdateResult> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/institutions/${encodeURIComponent(
      institutionId,
    )}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw await buildApiError(response);
  }

  const result: InstitutionUpdateResponse =
    await response.json();

  return result.data;
};

// ==========================================
// DELETE INSTITUTION
// DELETE /sudo-admin/institutions/:institutionId
// ==========================================

export const deleteInstitution = async (
  institutionId: string,
  accessToken: string,
): Promise<void> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/institutions/${encodeURIComponent(
      institutionId,
    )}`,
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
// CREATE INSTITUTION ADMIN
// POST /institution/:institutionId/staff
// ==========================================

export const createInstitutionAdmin = async (
  institutionId: string,
  payload: CreateInstitutionAdminPayload,
  accessToken: string,
): Promise<InstitutionStaff> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/institution/${encodeURIComponent(
      institutionId,
    )}/staff`,
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

  const result: ApiResponse<InstitutionStaff> =
    await response.json();

  return result.data;
};

// ==========================================
// GET INSTITUTION ADMINISTRATOR
// GET /sudo-admin/institutions/:institutionId/administrator
// ==========================================

export const getInstitutionAdministrator = async (
  institutionId: string,
  accessToken: string,
): Promise<InstitutionAdministrator> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/institutions/${encodeURIComponent(
      institutionId,
    )}/administrator`,
    {
      method: "GET",
      headers: getAuthHeaders(accessToken),
    },
  );

  if (!response.ok) {
    throw await buildApiError(response);
  }

  const result: ApiResponse<InstitutionAdministrator> =
    await response.json();

  return result.data;
};

// ==========================================
// DELETE INSTITUTION ADMINISTRATOR
// DELETE /sudo-admin/institutions/:institutionId/administrator
// ==========================================

export const deleteInstitutionAdministrator = async (
  institutionId: string,
  accessToken: string,
): Promise<void> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/institutions/${encodeURIComponent(
      institutionId,
    )}/administrator`,
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