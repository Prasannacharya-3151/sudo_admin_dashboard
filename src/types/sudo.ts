
export interface ApiResponse<T> {
  data: T;
}

export interface SudoAdmin {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface SudoSignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface SudoLoginPayload {
  email: string;
  password: string;
}

export interface SudoLoginData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  admin: SudoAdmin;
}

export type SudoLoginResponse =
  ApiResponse<SudoLoginData>;

export interface SudoLogoutPayload {
  refresh_token: string;
}

export interface SudoAuthContextType {
  admin: SudoAdmin | null;

  accessToken: string | null;

  refreshToken: string | null;

  expiresIn: number | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  signup: (
    payload: SudoSignupPayload,
  ) => Promise<void>;

  login: (
    payload: SudoLoginPayload,
  ) => Promise<void>;

  logout: () => Promise<void>;

  refreshProfile: () => Promise<void>;
}