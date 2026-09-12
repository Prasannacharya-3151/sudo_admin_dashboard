
import { SUDO_API_BASE_URL } from "./apiConfig";
import { sudoTokenStore } from "./sudoTokenStore";

import type {
  ApiResponse,
  SudoAdmin,
  SudoLoginData,
  SudoLoginPayload,
  SudoSignupPayload,
  SudoLogoutPayload,
} from "../types/sudo";

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const errorData: unknown = await response.json();

    if (typeof errorData === "object" && errorData !== null) {
      if ("message" in errorData) {
        const message = (errorData as { message?: unknown }).message;
        if (typeof message === "string") return message;
      }

      if ("error" in errorData) {
        const error = (errorData as { error?: unknown }).error;
        if (typeof error === "string") return error;
      }

      if ("detail" in errorData) {
        const detail = (errorData as { detail?: unknown }).detail;
        if (typeof detail === "string") return detail;

        if (Array.isArray(detail)) {
          return detail
            .map((item: unknown) => {
              if (typeof item !== "object" || item === null) {
                return "Validation error";
              }
              const validation = item as { loc?: unknown; msg?: unknown };
              const field = Array.isArray(validation.loc)
                ? validation.loc
                    .filter((value: unknown) => value !== "body")
                    .map(String)
                    .join(".")
                : "";
              const message =
                typeof validation.msg === "string" ? validation.msg : "Invalid value";
              return field ? `${field}: ${message}` : message;
            })
            .join(", ");
        }
      }
    }

    if (response.status === 401) return "Your session has expired. Please sign in again.";
    if (response.status === 403) return "You are not authorized to perform this action.";
    if (response.status === 404) return "Resource not found.";
    if (response.status === 409) return "This resource already exists.";
    return `Request failed with status ${response.status}`;
  } catch {
    if (response.status === 401) return "Your session has expired. Please sign in again.";
    if (response.status === 403) return "You are not authorized to perform this action.";
    return `Request failed with status ${response.status}`;
  }
};

export const signupSudo = async (payload: SudoSignupPayload): Promise<SudoAdmin> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<SudoAdmin> = await response.json();
  return result.data;
};

export const loginSudo = async (payload: SudoLoginPayload): Promise<SudoLoginData> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<SudoLoginData> = await response.json();
  return result.data;
};

/**
 * NOTE: confirm this path with backend — it isn't in the files you shared.
 * Refresh tokens are single-use: the response must include a new refresh_token,
 * and the caller must persist it immediately (sudoTokenStore.setTokens does this).
 */
const refreshSudo = async (refreshToken: string): Promise<SudoLoginData> => {
  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<SudoLoginData> = await response.json();
  return result.data;
};

/* ---------------------------------------------------------------------- */
/* Single-flight refresh: concurrent 401s share one in-flight refresh call */
/* ---------------------------------------------------------------------- */

let refreshInFlight: Promise<void> | null = null;

async function performTokenRefresh(): Promise<void> {
  const currentRefreshToken = sudoTokenStore.getRefreshToken();

  if (!currentRefreshToken) {
    throw new Error("No refresh token available.");
  }

  const data = await refreshSudo(currentRefreshToken);
  // Rotate immediately — the old refresh token is now invalid server-side.
  sudoTokenStore.setTokens(data.access_token, data.refresh_token, data.expires_in);
}

export function refreshSudoSession(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = performTokenRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/* ---------------------------------------------------------------------- */
/* Authenticated fetch: attaches token, retries exactly once on 401       */
/* ---------------------------------------------------------------------- */

export async function sudoAuthorizedFetch(
  path: string,
  init: RequestInit = {},
  hasRetried = false,
): Promise<Response> {
  const accessToken = sudoTokenStore.getAccessToken();

  const response = await fetch(`${SUDO_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${accessToken ?? ""}`,
    },
  });

  if (response.status !== 401 || hasRetried) {
    return response;
  }

  try {
    await refreshSudoSession();
  } catch (error) {
    sudoTokenStore.clear();
    throw error instanceof Error ? error : new Error("Session expired. Please sign in again.");
  }

  return sudoAuthorizedFetch(path, init, true); // retried flag stops further recursion
}

export const getSudoProfile = async (): Promise<SudoAdmin> => {
  const response = await sudoAuthorizedFetch("/sudo-admin/auth/me", { method: "GET" });

  if (!response.ok) throw new Error(await getErrorMessage(response));

  const result: ApiResponse<SudoAdmin> = await response.json();
  return result.data;
};

export const logoutSudo = async (refreshToken: string): Promise<void> => {
  const payload: SudoLogoutPayload = { refresh_token: refreshToken };

  const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(await getErrorMessage(response));
};