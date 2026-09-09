export interface ApiResponse<T> {
  data: T;
}

export interface WardenUser {
  id: string;
  institution_id: string;
  institution_name: string;
  email: string;
  created_at?: string;
}

export interface SignupUserPayload {
  institution_id: string;
  institution_name: string;
  email: string;
  password: string;
}

export interface SignupUserResponse {
  id: string;
  email: string;
}

export type UsersResponse =
  ApiResponse<WardenUser[]>;

export type SignupResponse =
  ApiResponse<SignupUserResponse>;