// ==========================================
// COMMON API RESPONSE
// ==========================================

export interface ApiResponse<T> {
  data: T;
}

// ==========================================
// INSTITUTION STATUS
// ==========================================

export type InstitutionStatus =
  | "onboarding"
  | "active"
  | "suspended"
  | "inactive";

// ==========================================
// INSTITUTION
// ==========================================

export interface Institution {
  id: string;

  name: string;

  code: string;

  status: InstitutionStatus;

  contact_email: string;

  contact_phone?: string | null;

  created_at: string;

  updated_at: string;
}

// ==========================================
// CREATE INSTITUTION
// POST /institution/
// ==========================================

export interface CreateInstitutionPayload {
  name: string;

  code: string;

  status?: InstitutionStatus;

  contact_email: string;

  contact_phone?: string;
}

// ==========================================
// UPDATE INSTITUTION
// PATCH /sudo-admin/institutions/:institutionId
// ==========================================

export interface UpdateInstitutionPayload {
  name?: string;

  code?: string;

  status?: InstitutionStatus;

  contact_email?: string;

  contact_phone?: string;
}

// ==========================================
// INSTITUTION ADMIN / STAFF
// ==========================================

export type InstitutionStaffRole =
  | "admin"
  | "staff";

export type InstitutionStaffStatus =
  | "active"
  | "inactive";

// ==========================================
// CREATE INSTITUTION ADMIN
// POST /institution/:institutionId/staff
// ==========================================

export interface CreateInstitutionAdminPayload {
  name: string;

  email: string;

  password: string;

  role: "admin";
}

// ==========================================
// INSTITUTION STAFF RESPONSE
// ==========================================

export interface InstitutionStaff {
  id: string;

  institution_id: string;

  name: string;

  email: string;

  role: InstitutionStaffRole;

  status: InstitutionStaffStatus;

  created_at: string;

  updated_at: string;
}

// ==========================================
// INSTITUTION STATS
//
// Backend hasn't finalized exact fields,
// so these are optional/flexible.
// ==========================================

export interface InstitutionStats {
  kiosks?: number;

  machines?: number;

  administrators?: number;

  staff?: number;

  active_kiosks?: number;

  active_machines?: number;
}

// ==========================================
// INSTITUTION DETAILS
//
// GET /sudo-admin/institutions/:institutionId
// ==========================================

export interface InstitutionDetails
  extends Institution {
  stats?: InstitutionStats;
}

// ==========================================
// LIST INSTITUTIONS RESPONSE
// ==========================================

export type InstitutionListResponse =
  ApiResponse<Institution[]>;

// ==========================================
// SINGLE INSTITUTION RESPONSE
// ==========================================

export type InstitutionResponse =
  ApiResponse<
    Institution | InstitutionDetails
  >;