// ==========================================
// COMMON API RESPONSE
// ==========================================

export interface ApiResponse<T> {
  data: T;
}

// ==========================================
// SUDO ADMIN
// ==========================================

export interface SudoAdmin {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// ==========================================
// SIGNUP
// ==========================================

export interface SudoSignupPayload {
  name: string;
  email: string;
  password: string;
}

// ==========================================
// LOGIN
// ==========================================

export interface SudoLoginPayload {
  email: string;
  password: string;
}

// ==========================================
// LOGIN DATA
// ==========================================

export interface SudoLoginData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  admin: SudoAdmin;
}

// ==========================================
// LOGIN RESPONSE
// ==========================================

export type SudoLoginResponse =
  ApiResponse<SudoLoginData>;

// ==========================================
// LOGOUT
// ==========================================

export interface SudoLogoutPayload {
  refresh_token: string;
}

// ==========================================
// AUTH CONTEXT
// ==========================================

export interface SudoAuthContextType {
  admin: SudoAdmin | null;

  // Access token used by all sudo protected APIs
  accessToken: string | null;

  // Authentication state
  isAuthenticated: boolean;

  // Initial auth verification loading state
  isLoading: boolean;

  // Auth actions
  signup: (
    payload: SudoSignupPayload,
  ) => Promise<void>;

  login: (
    payload: SudoLoginPayload,
  ) => Promise<void>;

  logout: () => Promise<void>;

  refreshProfile: () => Promise<void>;
}