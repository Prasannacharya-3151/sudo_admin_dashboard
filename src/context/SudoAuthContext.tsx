
// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
//   useSyncExternalStore,
//   type ReactNode,
// } from "react";

// import {
//   getSudoProfile,
//   loginSudo,
//   logoutSudo,
//   refreshSudoSession,
//   signupSudo,
// } from "../api/sudoApi";

// import { sudoTokenStore } from "../api/sudoTokenStore";

// import type {
//   SudoAuthContextType,
//   SudoLoginPayload,
//   SudoSignupPayload,
// } from "../types/sudo";

// const SudoAuthContext = createContext<SudoAuthContextType | null>(null);

// interface SudoAuthProviderProps {
//   children: ReactNode;
// }

// // Refresh at 75% of the token's lifetime. Works whether expires_in is
// // 60 seconds or 15 minutes, unlike a fixed "expires_in - 60s" buffer.
// const PROACTIVE_REFRESH_FRACTION = 0.75;

// export function SudoAuthProvider({ children }: SudoAuthProviderProps) {
//   const tokenState = useSyncExternalStore(
//     sudoTokenStore.subscribe,
//     sudoTokenStore.getState,
//     sudoTokenStore.getState,
//   );

//   const [isLoading, setIsLoading] = useState(true);

//   const signup = useCallback(async (payload: SudoSignupPayload): Promise<void> => {
//     await signupSudo(payload);
//   }, []);

//   const login = useCallback(async (payload: SudoLoginPayload): Promise<void> => {
//     const loginData = await loginSudo(payload);

//     if (!loginData.access_token) {
//       throw new Error("Login succeeded but access token was not returned.");
//     }
//     if (!loginData.refresh_token) {
//       throw new Error("Login succeeded but refresh token was not returned.");
//     }
//     if (typeof loginData.expires_in !== "number" || loginData.expires_in <= 0) {
//       throw new Error("Login succeeded but token expiry was not returned.");
//     }

//     sudoTokenStore.setSession(
//       loginData.access_token,
//       loginData.refresh_token,
//       loginData.expires_in,
//       loginData.admin,
//     );

//     if (!loginData.admin) {
//       const profile = await getSudoProfile();
//       sudoTokenStore.setAdmin(profile);
//     }
//   }, []);

//   const refreshProfile = useCallback(async (): Promise<void> => {
//     if (!sudoTokenStore.getAccessToken()) {
//       sudoTokenStore.clear();
//       return;
//     }

//     try {
//       const profile = await getSudoProfile();
//       sudoTokenStore.setAdmin(profile);
//     } catch (error) {
//       console.error("Failed to refresh Sudo profile:", error);
//       sudoTokenStore.clear();
//       throw error;
//     }
//   }, []);

//   const logout = useCallback(async (): Promise<void> => {
//     const storedRefreshToken = sudoTokenStore.getRefreshToken();

//     try {
//       if (storedRefreshToken) {
//         await logoutSudo(storedRefreshToken);
//       }
//     } catch (error) {
//       console.error("Backend logout failed:", error);
//     } finally {
//       sudoTokenStore.clear();
//     }
//   }, []);

//   /*
//    * ==========================================
//    * INITIALIZE AUTH — session restore on load.
//    * getSudoProfile()'s internal sudoAuthorizedFetch
//    * transparently refreshes an expired access token,
//    * so we don't need a manual expiry pre-check here.
//    * ==========================================
//    */
//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         if (!sudoTokenStore.getAccessToken() || !sudoTokenStore.getRefreshToken()) {
//           sudoTokenStore.clear();
//           return;
//         }

//         const profile = await getSudoProfile();
//         sudoTokenStore.setAdmin(profile);
//       } catch (error) {
//         console.error("Failed to restore Sudo session:", error);
//         sudoTokenStore.clear();
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     void initializeAuth();
//   }, []);

//   /*
//    * ==========================================
//    * PROACTIVE REFRESH
//    * Reschedules itself automatically: a successful
//    * refresh updates loginTime in the store, which
//    * re-triggers this effect with the new expiry.
//    * ==========================================
//    */
//   useEffect(() => {
//     const { accessToken, refreshToken, expiresIn, loginTime } = tokenState;

//     if (!accessToken || !refreshToken || !expiresIn || !loginTime) {
//       return;
//     }

//     const lifetimeMs = expiresIn * 1000;
//     const refreshAt = loginTime + lifetimeMs * PROACTIVE_REFRESH_FRACTION;
//     const delay = refreshAt - Date.now();

//     const doRefresh = () => {
//       refreshSudoSession().catch((error) => {
//         console.error("Proactive token refresh failed:", error);
//         sudoTokenStore.clear();
//       });
//     };

//     if (delay <= 0) {
//       doRefresh();
//       return;
//     }

//     const timer = window.setTimeout(doRefresh, delay);
//     return () => window.clearTimeout(timer);
//   }, [tokenState.accessToken, tokenState.refreshToken, tokenState.expiresIn, tokenState.loginTime]);

//   const value = useMemo<SudoAuthContextType>(
//     () => ({
//       admin: tokenState.admin,
//       accessToken: tokenState.accessToken,
//       refreshToken: tokenState.refreshToken,
//       expiresIn: tokenState.expiresIn,
//       isAuthenticated: Boolean(tokenState.admin && tokenState.accessToken),
//       isLoading,
//       signup,
//       login,
//       logout,
//       refreshProfile,
//     }),
//     [tokenState, isLoading, signup, login, logout, refreshProfile],
//   );

//   return <SudoAuthContext.Provider value={value}>{children}</SudoAuthContext.Provider>;
// }

// export function useSudoAuth() {
//   const context = useContext(SudoAuthContext);

//   if (!context) {
//     throw new Error("useSudoAuth must be used inside SudoAuthProvider");
//   }

//   return context;
// }



import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  AuthRejectedError,
  getSudoProfile,
  loginSudo,
  logoutSudo,
  refreshSudoSession,
  signupSudo,
} from "../api/sudoApi";

import { sudoTokenStore } from "../api/sudoTokenStore";

import type {
  SudoAuthContextType,
  SudoLoginPayload,
  SudoSignupPayload,
} from "../types/sudo";

const SudoAuthContext =
  createContext<SudoAuthContextType | null>(null);

interface SudoAuthProviderProps {
  children: ReactNode;
}

/**
 * Refresh at 75% of the access token's reported lifetime.
 *
 * For expires_in = 600 seconds:
 * 600 * 0.75 = 450 seconds = 7 minutes 30 seconds.
 */
const PROACTIVE_REFRESH_FRACTION = 0.75;

/**
 * Retry temporary refresh failures after 15 seconds.
 */
const REFRESH_RETRY_DELAY_MS = 15_000;

/**
 * Prevent repeated immediate refresh attempts when a stored session
 * is already beyond its expected access-token expiry.
 */
const MIN_REFRESH_DELAY_MS = 1_000;

export function SudoAuthProvider({
  children,
}: SudoAuthProviderProps) {
  const tokenState = useSyncExternalStore(
    sudoTokenStore.subscribe,
    sudoTokenStore.getState,
    sudoTokenStore.getState,
  );

  const [isLoading, setIsLoading] = useState(true);

  /**
   * Signup.
   */
  const signup = useCallback(
    async (payload: SudoSignupPayload): Promise<void> => {
      await signupSudo(payload);
    },
    [],
  );

  /**
   * Login.
   */
  const login = useCallback(
    async (payload: SudoLoginPayload): Promise<void> => {
      const loginData = await loginSudo(payload);

      if (!loginData.access_token) {
        throw new Error(
          "Login succeeded but no access token was returned.",
        );
      }

      if (!loginData.refresh_token) {
        throw new Error(
          "Login succeeded but no refresh token was returned.",
        );
      }

      if (
        typeof loginData.expires_in !== "number" ||
        !Number.isFinite(loginData.expires_in) ||
        loginData.expires_in <= 0
      ) {
        throw new Error(
          "Login succeeded but the token expiry is invalid.",
        );
      }

      /*
       * Your API response includes an admin object according to the
       * existing SudoLoginData type. Keep that behavior where present.
       */
      sudoTokenStore.setSession(
        loginData.access_token,
        loginData.refresh_token,
        loginData.expires_in,
        loginData.admin ?? null,
      );

      /*
       * If login does not return an admin profile, retrieve it from
       * the authenticated profile endpoint.
       */
      if (!loginData.admin) {
        const profile = await getSudoProfile();

        sudoTokenStore.setAdmin(profile);
      }
    },
    [],
  );

  /**
   * Refresh the current admin profile.
   */
  const refreshProfile = useCallback(
    async (): Promise<void> => {
      if (!sudoTokenStore.getAccessToken()) {
        return;
      }

      try {
        const profile = await getSudoProfile();

        sudoTokenStore.setAdmin(profile);
      } catch (error) {
        console.error(
          "Failed to refresh Sudo profile:",
          error,
        );

        /*
         * Don't clear the session for every failure.
         * A temporary network or server error is recoverable.
         */
        if (error instanceof AuthRejectedError) {
          sudoTokenStore.clear();
        }

        throw error;
      }
    },
    [],
  );

  /**
   * Logout.
   */
  const logout = useCallback(async (): Promise<void> => {
    const storedRefreshToken =
      sudoTokenStore.getRefreshToken();

    try {
      if (storedRefreshToken) {
        await logoutSudo(storedRefreshToken);
      }
    } catch (error) {
      console.error(
        "Backend logout failed:",
        error,
      );
    } finally {
      /*
       * Explicit user logout always clears local state, even if
       * the backend cannot be reached.
       */
      sudoTokenStore.clear();
    }
  }, []);

  /**
   * Restore authentication on initial page load.
   */
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async (): Promise<void> => {
      try {
        const accessToken =
          sudoTokenStore.getAccessToken();

        const refreshToken =
          sudoTokenStore.getRefreshToken();

        if (!accessToken || !refreshToken) {
          sudoTokenStore.clear();
          return;
        }

        /*
         * getSudoProfile uses sudoAuthorizedFetch.
         *
         * If the access token has expired, the fetch layer attempts
         * a refresh and retries the profile request once.
         */
        const profile = await getSudoProfile();

        if (!cancelled) {
          sudoTokenStore.setAdmin(profile);
        }
      } catch (error) {
        console.error(
          "Failed to restore Sudo session:",
          error,
        );

        /*
         * Clear only for an explicit authentication rejection.
         * Retain stored credentials during temporary failures.
         */
        if (error instanceof AuthRejectedError) {
          sudoTokenStore.clear();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Proactive access-token refresh.
   *
   * With expires_in = 600, this schedules refresh approximately
   * 450 seconds after the last successful token save.
   */
  useEffect(() => {
    const {
      accessToken,
      refreshToken,
      expiresIn,
      loginTime,
    } = tokenState;

    if (
      !accessToken ||
      !refreshToken ||
      !expiresIn ||
      !loginTime
    ) {
      return;
    }

    let cancelled = false;

    let timer: number | undefined;
    let retryTimer: number | undefined;

    const lifetimeMs = expiresIn * 1000;

    const refreshAt =
      loginTime +
      lifetimeMs * PROACTIVE_REFRESH_FRACTION;

    const delay = Math.max(
      MIN_REFRESH_DELAY_MS,
      refreshAt - Date.now(),
    );

    const doRefresh = async (): Promise<void> => {
      if (cancelled) {
        return;
      }

      try {
        await refreshSudoSession();

        /*
         * A successful refresh updates the token store.
         * That change triggers this effect again with the new
         * lifetime and timestamp.
         */
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Proactive Sudo token refresh failed:",
          error,
        );

        if (error instanceof AuthRejectedError) {
          sudoTokenStore.clear();
          return;
        }

        /*
         * Do not destroy the session for a temporary network or
         * server error. Retry after a short delay.
         */
        retryTimer = window.setTimeout(() => {
          void doRefresh();
        }, REFRESH_RETRY_DELAY_MS);
      }
    };

    timer = window.setTimeout(() => {
      void doRefresh();
    }, delay);

    return () => {
      cancelled = true;

      if (timer !== undefined) {
        window.clearTimeout(timer);
      }

      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [
    tokenState.accessToken,
    tokenState.refreshToken,
    tokenState.expiresIn,
    tokenState.loginTime,
  ]);

  const value = useMemo<SudoAuthContextType>(
    () => ({
      admin: tokenState.admin,
      accessToken: tokenState.accessToken,
      refreshToken: tokenState.refreshToken,
      expiresIn: tokenState.expiresIn,

      isAuthenticated: Boolean(
        tokenState.admin &&
        tokenState.accessToken,
      ),

      isLoading,

      signup,
      login,
      logout,
      refreshProfile,
    }),
    [
      tokenState,
      isLoading,
      signup,
      login,
      logout,
      refreshProfile,
    ],
  );

  return (
    <SudoAuthContext.Provider value={value}>
      {children}
    </SudoAuthContext.Provider>
  );
}

export function useSudoAuth(): SudoAuthContextType {
  const context = useContext(SudoAuthContext);

  if (!context) {
    throw new Error(
      "useSudoAuth must be used inside SudoAuthProvider",
    );
  }

  return context;
}