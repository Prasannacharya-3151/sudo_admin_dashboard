import { SUDO_API_BASE_URL } from "./apiConfig";

import type {
  Administrator,
  AdministratorDetails,
  ApiResponse,
  CreateAdministratorPayload,
  UpdateAdministratorPayload,
} from "../types/administrator";

// ==========================================
// HELPER
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
    return "Something went wrong";
  }
};

// ==========================================
// CREATE ADMINISTRATOR
// ==========================================
//
// POST
// /institution/{institutionId}/staff
//
// Requires:
// Authorization: Bearer <sudo admin access_token>
//
// ==========================================

export const createAdministrator = async (
  accessToken: string,
  institutionId: string,
  payload: CreateAdministratorPayload,
): Promise<Administrator> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/institution/${institutionId}/staff`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result: ApiResponse<Administrator> =
    await response.json();

  return result.data;
};

// ==========================================
// GET ADMINISTRATOR DETAILS
// ==========================================
//
// GET
// /institution/{institutionId}/staff/{administratorId}
//
// Only use when backend endpoint exists.
//
// ==========================================

export const getAdministratorById = async (
  accessToken: string,
  institutionId: string,
  administratorId: string,
): Promise<AdministratorDetails> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/institution/${institutionId}/staff/${administratorId}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result: ApiResponse<AdministratorDetails> =
    await response.json();

  return result.data;
};

// ==========================================
// UPDATE ADMINISTRATOR
// ==========================================
//
// PATCH
// /institution/{institutionId}/staff/{administratorId}
//
// Only use when backend endpoint exists.
//
// ==========================================

export const updateAdministrator = async (
  accessToken: string,
  institutionId: string,
  administratorId: string,
  payload: UpdateAdministratorPayload,
): Promise<Administrator> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/institution/${institutionId}/staff/${administratorId}`,
    {
      method: "PATCH",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  const result: ApiResponse<Administrator> =
    await response.json();

  return result.data;
};

// ==========================================
// DELETE ADMINISTRATOR
// ==========================================
//
// DELETE
// /institution/{institutionId}/staff/{administratorId}
//
// Only use when backend endpoint exists.
//
// ==========================================

export const deleteAdministrator = async (
  accessToken: string,
  institutionId: string,
  administratorId: string,
): Promise<void> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/institution/${institutionId}/staff/${administratorId}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }
};