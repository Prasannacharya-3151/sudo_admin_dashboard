import {
  SUDO_API_BASE_URL,
} from "./apiConfig";

import type {
  ApiResponse,
  Institution,
  InstitutionDetails,
  InstitutionStaff,
  CreateInstitutionPayload,
  CreateInstitutionAdminPayload,
  UpdateInstitutionPayload,
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
      errorData.message ||
      errorData.error ||
      "Something went wrong"
    );
  } catch {
    return "Something went wrong";
  }
};

// ==========================================
// AUTH HEADER HELPER
// ==========================================

const getAuthHeaders = (
  accessToken: string,
): HeadersInit => {
  return {
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${accessToken}`,
  };
};

// ==========================================
// CREATE INSTITUTION
//
// POST /institution/
// ==========================================

export const createInstitution =
  async (
    payload: CreateInstitutionPayload,
    accessToken: string,
  ): Promise<Institution> => {
    const response = await fetch(
      `${SUDO_API_BASE_URL}/institution/`,
      {
        method: "POST",

        headers:
          getAuthHeaders(accessToken),

        body: JSON.stringify(
          payload,
        ),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response),
      );
    }

    const result:
      ApiResponse<Institution> =
      await response.json();

    return result.data;
  };

// ==========================================
// CREATE INSTITUTION ADMIN
//
// POST /institution/:institutionId/staff
// ==========================================

export const createInstitutionAdmin =
  async (
    institutionId: string,
    payload: CreateInstitutionAdminPayload,
    accessToken: string,
  ): Promise<InstitutionStaff> => {
    const response = await fetch(
      `${SUDO_API_BASE_URL}/institution/${institutionId}/staff`,
      {
        method: "POST",

        headers:
          getAuthHeaders(accessToken),

        body: JSON.stringify(
          payload,
        ),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response),
      );
    }

    const result:
      ApiResponse<InstitutionStaff> =
      await response.json();

    return result.data;
  };

// ==========================================
// GET ALL INSTITUTIONS
//
// GET /sudo-admin/institutions
//
// Planned Dashboard Endpoint
// ==========================================

export const getInstitutions =
  async (
    accessToken: string,
  ): Promise<Institution[]> => {
    const response = await fetch(
      `${SUDO_API_BASE_URL}/sudo-admin/institutions`,
      {
        method: "GET",

        headers:
          getAuthHeaders(accessToken),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response),
      );
    }

    const result:
      ApiResponse<Institution[]> =
      await response.json();

    return result.data;
  };

// ==========================================
// GET SINGLE INSTITUTION
//
// GET /sudo-admin/institutions/:institutionId
//
// Returns institution with stats
// ==========================================

export const getInstitutionById =
  async (
    institutionId: string,
    accessToken: string,
  ): Promise<InstitutionDetails> => {
    const response = await fetch(
      `${SUDO_API_BASE_URL}/sudo-admin/institutions/${institutionId}`,
      {
        method: "GET",

        headers:
          getAuthHeaders(accessToken),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response),
      );
    }

    const result:
      ApiResponse<InstitutionDetails> =
      await response.json();

    return result.data;
  };

// ==========================================
// UPDATE INSTITUTION
//
// PATCH /sudo-admin/institutions/:institutionId
//
// All fields optional
// ==========================================

export const updateInstitution =
  async (
    institutionId: string,
    payload: UpdateInstitutionPayload,
    accessToken: string,
  ): Promise<Institution> => {
    const response = await fetch(
      `${SUDO_API_BASE_URL}/sudo-admin/institutions/${institutionId}`,
      {
        method: "PATCH",

        headers:
          getAuthHeaders(accessToken),

        body: JSON.stringify(
          payload,
        ),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response),
      );
    }

    const result:
      ApiResponse<Institution> =
      await response.json();

    return result.data;
  };

// ==========================================
// DELETE / DEACTIVATE INSTITUTION
//
// DELETE /sudo-admin/institutions/:institutionId
// ==========================================

export const deleteInstitution =
  async (
    institutionId: string,
    accessToken: string,
  ): Promise<void> => {
    const response = await fetch(
      `${SUDO_API_BASE_URL}/sudo-admin/institutions/${institutionId}`,
      {
        method: "DELETE",

        headers:
          getAuthHeaders(accessToken),
      },
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response),
      );
    }
  };