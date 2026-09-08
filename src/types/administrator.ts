// ==========================================
// COMMON API RESPONSE
// ==========================================

export interface ApiResponse<T> {
  data: T;
}

// ==========================================
// ADMINISTRATOR ROLE
// ==========================================

export type AdministratorRole =
  | "admin"
  | "staff";

// ==========================================
// ADMINISTRATOR STATUS
// ==========================================

export type AdministratorStatus =
  | "active"
  | "inactive"
  | "suspended";

// ==========================================
// ADMINISTRATOR
// ==========================================

export interface Administrator {
  id: string;

  institution_id: string;

  name: string;

  email: string;

  role: AdministratorRole;

  status: AdministratorStatus;

  created_at: string;

  updated_at: string;
}

// ==========================================
// CREATE ADMINISTRATOR PAYLOAD
// ==========================================

export interface CreateAdministratorPayload {
  name: string;

  email: string;

  password: string;

  role: AdministratorRole;
}

// ==========================================
// UPDATE ADMINISTRATOR PAYLOAD
// ==========================================

export interface UpdateAdministratorPayload {
  name?: string;

  email?: string;

  password?: string;

  role?: AdministratorRole;

  status?: AdministratorStatus;
}

// ==========================================
// ADMINISTRATOR DETAILS
// ==========================================

export interface AdministratorDetails
  extends Administrator {
  institution_name?: string;

  institution_code?: string;
}

// ==========================================
// ADMINISTRATOR LIST RESPONSE
// ==========================================

export interface AdministratorListResponse {
  items: Administrator[];

  total?: number;

  page?: number;

  limit?: number;
}

// ==========================================
// CREATE ADMINISTRATOR RESPONSE
// ==========================================

export type CreateAdministratorResponse =
  ApiResponse<Administrator>;

// ==========================================
// GET ADMINISTRATOR RESPONSE
// ==========================================

export type AdministratorResponse =
  ApiResponse<AdministratorDetails>;