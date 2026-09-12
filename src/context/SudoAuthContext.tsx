
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

const SudoAuthContext = createContext<SudoAuthContextType | null>(null);

interface SudoAuthProviderProps {
  children: ReactNode;
}

// Refresh at 75% of the token's lifetime. Works whether expires_in is
// 60 seconds or 15 minutes, unlike a fixed "expires_in - 60s" buffer.
const PROACTIVE_REFRESH_FRACTION = 0.75;

export function SudoAuthProvider({ children }: SudoAuthProviderProps) {
  const tokenState = useSyncExternalStore(
    sudoTokenStore.subscribe,
    sudoTokenStore.getState,
    sudoTokenStore.getState,
  );

  const [isLoading, setIsLoading] = useState(true);

  const signup = useCallback(async (payload: SudoSignupPayload): Promise<void> => {
    await signupSudo(payload);
  }, []);

  const login = useCallback(async (payload: SudoLoginPayload): Promise<void> => {
    const loginData = await loginSudo(payload);

    if (!loginData.access_token) {
      throw new Error("Login succeeded but access token was not returned.");
    }
    if (!loginData.refresh_token) {
      throw new Error("Login succeeded but refresh token was not returned.");
    }
    if (typeof loginData.expires_in !== "number" || loginData.expires_in <= 0) {
      throw new Error("Login succeeded but token expiry was not returned.");
    }

    sudoTokenStore.setSession(
      loginData.access_token,
      loginData.refresh_token,
      loginData.expires_in,
      loginData.admin,
    );

    if (!loginData.admin) {
      const profile = await getSudoProfile();
      sudoTokenStore.setAdmin(profile);
    }
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!sudoTokenStore.getAccessToken()) {
      sudoTokenStore.clear();
      return;
    }

    try {
      const profile = await getSudoProfile();
      sudoTokenStore.setAdmin(profile);
    } catch (error) {
      console.error("Failed to refresh Sudo profile:", error);
      sudoTokenStore.clear();
      throw error;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const storedRefreshToken = sudoTokenStore.getRefreshToken();

    try {
      if (storedRefreshToken) {
        await logoutSudo(storedRefreshToken);
      }
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      sudoTokenStore.clear();
    }
  }, []);

  /*
   * ==========================================
   * INITIALIZE AUTH — session restore on load.
   * getSudoProfile()'s internal sudoAuthorizedFetch
   * transparently refreshes an expired access token,
   * so we don't need a manual expiry pre-check here.
   * ==========================================
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!sudoTokenStore.getAccessToken() || !sudoTokenStore.getRefreshToken()) {
          sudoTokenStore.clear();
          return;
        }

        const profile = await getSudoProfile();
        sudoTokenStore.setAdmin(profile);
      } catch (error) {
        console.error("Failed to restore Sudo session:", error);
        sudoTokenStore.clear();
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();
  }, []);

  /*
   * ==========================================
   * PROACTIVE REFRESH
   * Reschedules itself automatically: a successful
   * refresh updates loginTime in the store, which
   * re-triggers this effect with the new expiry.
   * ==========================================
   */
  useEffect(() => {
    const { accessToken, refreshToken, expiresIn, loginTime } = tokenState;

    if (!accessToken || !refreshToken || !expiresIn || !loginTime) {
      return;
    }

    const lifetimeMs = expiresIn * 1000;
    const refreshAt = loginTime + lifetimeMs * PROACTIVE_REFRESH_FRACTION;
    const delay = refreshAt - Date.now();

    const doRefresh = () => {
      refreshSudoSession().catch((error) => {
        console.error("Proactive token refresh failed:", error);
        sudoTokenStore.clear();
      });
    };

    if (delay <= 0) {
      doRefresh();
      return;
    }

    const timer = window.setTimeout(doRefresh, delay);
    return () => window.clearTimeout(timer);
  }, [tokenState.accessToken, tokenState.refreshToken, tokenState.expiresIn, tokenState.loginTime]);

  const value = useMemo<SudoAuthContextType>(
    () => ({
      admin: tokenState.admin,
      accessToken: tokenState.accessToken,
      refreshToken: tokenState.refreshToken,
      expiresIn: tokenState.expiresIn,
      isAuthenticated: Boolean(tokenState.admin && tokenState.accessToken),
      isLoading,
      signup,
      login,
      logout,
      refreshProfile,
    }),
    [tokenState, isLoading, signup, login, logout, refreshProfile],
  );

  return <SudoAuthContext.Provider value={value}>{children}</SudoAuthContext.Provider>;
}

export function useSudoAuth() {
  const context = useContext(SudoAuthContext);

  if (!context) {
    throw new Error("useSudoAuth must be used inside SudoAuthProvider");
  }

  return context;
}