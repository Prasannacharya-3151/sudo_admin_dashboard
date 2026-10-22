
// import { SUDO_API_BASE_URL } from "./apiConfig";
// import { sudoTokenStore } from "./sudoTokenStore";

// import type {
//   ApiResponse,
//   SudoAdmin,
//   SudoLoginData,
//   SudoLoginPayload,
//   SudoSignupPayload,
//   SudoLogoutPayload,
// } from "../types/sudo";

// const getErrorMessage = async (response: Response): Promise<string> => {
//   try {
//     const errorData: unknown = await response.json();

//     if (typeof errorData === "object" && errorData !== null) {
//       if ("message" in errorData) {
//         const message = (errorData as { message?: unknown }).message;
//         if (typeof message === "string") return message;
//       }

//       if ("error" in errorData) {
//         const error = (errorData as { error?: unknown }).error;
//         if (typeof error === "string") return error;
//       }

//       if ("detail" in errorData) {
//         const detail = (errorData as { detail?: unknown }).detail;
//         if (typeof detail === "string") return detail;

//         if (Array.isArray(detail)) {
//           return detail
//             .map((item: unknown) => {
//               if (typeof item !== "object" || item === null) {
//                 return "Validation error";
//               }
//               const validation = item as { loc?: unknown; msg?: unknown };
//               const field = Array.isArray(validation.loc)
//                 ? validation.loc
//                     .filter((value: unknown) => value !== "body")
//                     .map(String)
//                     .join(".")
//                 : "";
//               const message =
//                 typeof validation.msg === "string" ? validation.msg : "Invalid value";
//               return field ? `${field}: ${message}` : message;
//             })
//             .join(", ");
//         }
//       }
//     }

//     if (response.status === 401) return "Your session has expired. Please sign in again.";
//     if (response.status === 403) return "You are not authorized to perform this action.";
//     if (response.status === 404) return "Resource not found.";
//     if (response.status === 409) return "This resource already exists.";
//     return `Request failed with status ${response.status}`;
//   } catch {
//     if (response.status === 401) return "Your session has expired. Please sign in again.";
//     if (response.status === 403) return "You are not authorized to perform this action.";
//     return `Request failed with status ${response.status}`;
//   }
// };

// export const signupSudo = async (payload: SudoSignupPayload): Promise<SudoAdmin> => {
//   const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });

//   if (!response.ok) throw new Error(await getErrorMessage(response));

//   const result: ApiResponse<SudoAdmin> = await response.json();
//   return result.data;
// };

// export const loginSudo = async (payload: SudoLoginPayload): Promise<SudoLoginData> => {
//   const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/auth/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });

//   if (!response.ok) throw new Error(await getErrorMessage(response));

//   const result: ApiResponse<SudoLoginData> = await response.json();
//   return result.data;
// };

// /**
//  * NOTE: confirm this path with backend — it isn't in the files you shared.
//  * Refresh tokens are single-use: the response must include a new refresh_token,
//  * and the caller must persist it immediately (sudoTokenStore.setTokens does this).
//  */
// const refreshSudo = async (refreshToken: string): Promise<SudoLoginData> => {
//   const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/auth/refresh`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ refresh_token: refreshToken }),
//   });

//   if (!response.ok) throw new Error(await getErrorMessage(response));

//   const result: ApiResponse<SudoLoginData> = await response.json();
//   return result.data;
// };

// /* ---------------------------------------------------------------------- */
// /* Single-flight refresh: concurrent 401s share one in-flight refresh call */
// /* ---------------------------------------------------------------------- */

// let refreshInFlight: Promise<void> | null = null;

// async function performTokenRefresh(): Promise<void> {
//   const currentRefreshToken = sudoTokenStore.getRefreshToken();

//   if (!currentRefreshToken) {
//     throw new Error("No refresh token available.");
//   }

//   const data = await refreshSudo(currentRefreshToken);
//   // Rotate immediately — the old refresh token is now invalid server-side.
//   sudoTokenStore.setTokens(data.access_token, data.refresh_token, data.expires_in);
// }

// export function refreshSudoSession(): Promise<void> {
//   if (!refreshInFlight) {
//     refreshInFlight = performTokenRefresh().finally(() => {
//       refreshInFlight = null;
//     });
//   }
//   return refreshInFlight;
// }

// /* ---------------------------------------------------------------------- */
// /* Authenticated fetch: attaches token, retries exactly once on 401       */
// /* ---------------------------------------------------------------------- */

// export async function sudoAuthorizedFetch(
//   path: string,
//   init: RequestInit = {},
//   hasRetried = false,
// ): Promise<Response> {
//   const accessToken = sudoTokenStore.getAccessToken();

//   const response = await fetch(`${SUDO_API_BASE_URL}${path}`, {
//     ...init,
//     headers: {
//       ...(init.headers ?? {}),
//       Authorization: `Bearer ${accessToken ?? ""}`,
//     },
//   });

//   if (response.status !== 401 || hasRetried) {
//     return response;
//   }

//   try {
//     await refreshSudoSession();
//   } catch (error) {
//     sudoTokenStore.clear();
//     throw error instanceof Error ? error : new Error("Session expired. Please sign in again.");
//   }

//   return sudoAuthorizedFetch(path, init, true); // retried flag stops further recursion
// }

// export const getSudoProfile = async (): Promise<SudoAdmin> => {
//   const response = await sudoAuthorizedFetch("/sudo-admin/auth/me", { method: "GET" });

//   if (!response.ok) throw new Error(await getErrorMessage(response));

//   const result: ApiResponse<SudoAdmin> = await response.json();
//   return result.data;
// };

// export const logoutSudo = async (refreshToken: string): Promise<void> => {
//   const payload: SudoLogoutPayload = { refresh_token: refreshToken };

//   const response = await fetch(`${SUDO_API_BASE_URL}/sudo-admin/auth/logout`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });

//   if (!response.ok) throw new Error(await getErrorMessage(response));
// };





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

/**
 * Authentication was explicitly rejected by the backend.
 *
 * Do not use this error for network failures or server errors.
 */
export class AuthRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthRejectedError";
  }
}

/**
 * Read an API error message without assuming every backend
 * response uses the same error format.
 */
const getErrorMessage = async (
  response: Response,
): Promise<string> => {
  try {
    const errorData: unknown = await response.json();

    if (typeof errorData === "object" && errorData !== null) {
      if ("message" in errorData) {
        const message = (
          errorData as { message?: unknown }
        ).message;

        if (typeof message === "string") {
          return message;
        }
      }

      if ("error" in errorData) {
        const error = (
          errorData as { error?: unknown }
        ).error;

        if (typeof error === "string") {
          return error;
        }
      }

      if ("detail" in errorData) {
        const detail = (
          errorData as { detail?: unknown }
        ).detail;

        if (typeof detail === "string") {
          return detail;
        }

        if (Array.isArray(detail)) {
          return detail
            .map((item: unknown) => {
              if (
                typeof item !== "object" ||
                item === null
              ) {
                return "Validation error";
              }

              const validation = item as {
                loc?: unknown;
                msg?: unknown;
              };

              const field = Array.isArray(validation.loc)
                ? validation.loc
                    .filter((value) => value !== "body")
                    .map(String)
                    .join(".")
                : "";

              const message =
                typeof validation.msg === "string"
                  ? validation.msg
                  : "Invalid value";

              return field
                ? `${field}: ${message}`
                : message;
            })
            .join(", ");
        }
      }
    }
  } catch {
    // Response might not contain JSON.
  }

  if (response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (response.status === 403) {
    return "You are not authorized to perform this action.";
  }

  if (response.status === 404) {
    return "Resource not found.";
  }

  if (response.status === 409) {
    return "This resource already exists.";
  }

  return `Request failed with status ${response.status}`;
};

/**
 * Convert an explicit HTTP response into a useful error.
 */
async function createResponseError(
  response: Response,
): Promise<Error> {
  const message = await getErrorMessage(response);

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    return new AuthRejectedError(message);
  }

  return new Error(message);
}

/**
 * Signup.
 */
export const signupSudo = async (
  payload: SudoSignupPayload,
): Promise<SudoAdmin> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw await createResponseError(response);
  }

  const result: ApiResponse<SudoAdmin> =
    await response.json();

  return result.data;
};

/**
 * Login.
 */
export const loginSudo = async (
  payload: SudoLoginPayload,
): Promise<SudoLoginData> => {
  const response = await fetch(
    `${SUDO_API_BASE_URL}/sudo-admin/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw await createResponseError(response);
  }

  const result: ApiResponse<SudoLoginData> =
    await response.json();

  return result.data;
};

/**
 * Refresh endpoint.
 *
 * Assumed backend contract:
 * POST /sudo-admin/auth/refresh
 * Body: { refresh_token: string }
 *
 * This function does not clear local storage. Its caller decides
 * whether a failure is a confirmed authentication rejection.
 */
const refreshSudo = async (
  refreshToken: string,
): Promise<SudoLoginData> => {
  let response: Response;

  try {
    response = await fetch(
      `${SUDO_API_BASE_URL}/sudo-admin/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      },
    );
  } catch {
    throw new Error(
      "Unable to reach the server while refreshing your session.",
    );
  }

  if (!response.ok) {
    throw await createResponseError(response);
  }

  const result: ApiResponse<SudoLoginData> =
    await response.json();

  const data = result?.data;

  if (
    !data ||
    typeof data.access_token !== "string" ||
    !data.access_token ||
    typeof data.expires_in !== "number" ||
    !Number.isFinite(data.expires_in) ||
    data.expires_in <= 0
  ) {
    throw new Error(
      "The refresh endpoint returned an invalid token response.",
    );
  }

  return data;
};

/**
 * Single-flight refresh inside the current JavaScript runtime.
 */
let refreshInFlight: Promise<void> | null = null;

/**
 * Coordinate refresh operations across tabs where the browser supports
 * the Web Locks API.
 *
 * If another tab refreshed the token while this tab waited, reuse the
 * updated tokens instead of submitting the old refresh token again.
 */
async function performTokenRefresh(): Promise<void> {
  const startingRefreshToken =
    sudoTokenStore.getRefreshToken();

  if (!startingRefreshToken) {
    throw new AuthRejectedError(
      "No refresh token is available. Please sign in again.",
    );
  }

  const refreshWithLatestToken = async (): Promise<void> => {
    sudoTokenStore.syncFromStorage();

    const currentRefreshToken =
      sudoTokenStore.getRefreshToken();

    if (!currentRefreshToken) {
      throw new AuthRejectedError(
        "Your session has ended. Please sign in again.",
      );
    }

    // Another tab might already have refreshed the session.
    if (currentRefreshToken !== startingRefreshToken) {
      return;
    }

    const data = await refreshSudo(currentRefreshToken);

    // A rotated refresh token must be persisted immediately.
    //
    // Fallback to the existing token only when the backend explicitly
    // supports refresh responses that omit refresh_token.
    const nextRefreshToken =
      data.refresh_token ?? currentRefreshToken;

    if (
      typeof data.refresh_token !== "string" &&
      data.refresh_token !== undefined
    ) {
      throw new Error(
        "The refresh endpoint returned an invalid refresh token.",
      );
    }

    sudoTokenStore.setTokens(
      data.access_token,
      nextRefreshToken,
      data.expires_in,
    );
  };

  if (
    typeof navigator !== "undefined" &&
    "locks" in navigator &&
    navigator.locks
  ) {
    await navigator.locks.request(
      "sudo-token-refresh",
      refreshWithLatestToken,
    );

    return;
  }

  /*
   * Browsers without Web Locks still get single-flight protection
   * within this tab. Cross-tab refresh coordination is not guaranteed
   * in those browsers.
   */
  await refreshWithLatestToken();
}

export function refreshSudoSession(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = performTokenRefresh().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

/**
 * Authenticated fetch.
 *
 * Adds the current access token.
 * If a request receives 401, refreshes once and retries once.
 */
export async function sudoAuthorizedFetch(
  path: string,
  init: RequestInit = {},
  hasRetried = false,
): Promise<Response> {
  const accessToken = sudoTokenStore.getAccessToken();

  const headers = new Headers(init.headers);

  headers.set(
    "Authorization",
    `Bearer ${accessToken ?? ""}`,
  );

  const response = await fetch(
    `${SUDO_API_BASE_URL}${path}`,
    {
      ...init,
      headers,
    },
  );

  if (response.status !== 401 || hasRetried) {
    return response;
  }

  try {
    await refreshSudoSession();
  } catch (error) {
    /*
     * Only clear the session for an explicitly rejected refresh.
     * Network failures and server errors should not automatically
     * destroy the saved session.
     */
    if (error instanceof AuthRejectedError) {
      sudoTokenStore.clear();
    }

    throw error instanceof Error
      ? error
      : new Error(
          "Unable to refresh your session. Please try again.",
        );
  }

  return sudoAuthorizedFetch(path, init, true);
}

/**
 * Get the authenticated Sudo admin profile.
 */
export const getSudoProfile = async (): Promise<SudoAdmin> => {
  const response = await sudoAuthorizedFetch(
    "/sudo-admin/auth/me",
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw await createResponseError(response);
  }

  const result: ApiResponse<SudoAdmin> =
    await response.json();

  return result.data;
};

/**
 * Logout.
 */
export const logoutSudo = async (
  refreshToken: string,
): Promise<void> => {
  const payload: SudoLogoutPayload = {
    refresh_token: refreshToken,
  };

  let response: Response;

  try {
    response = await fetch(
      `${SUDO_API_BASE_URL}/sudo-admin/auth/logout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
  } catch {
    throw new Error(
      "Unable to reach the server to complete logout.",
    );
  }

  if (!response.ok) {
    throw await createResponseError(response);
  }
};