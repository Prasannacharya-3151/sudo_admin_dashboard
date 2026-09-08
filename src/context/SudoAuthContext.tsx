import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getSudoProfile,
  loginSudo,
  logoutSudo,
  signupSudo,
} from "../api/sudoApi";

import type {
  SudoAdmin,
  SudoAuthContextType,
  SudoLoginPayload,
  SudoSignupPayload,
} from "../types/sudo";

// ==========================================
// STORAGE KEYS
// ==========================================

const SUDO_ACCESS_TOKEN_KEY =
  "sudo_access_token";

const SUDO_REFRESH_TOKEN_KEY =
  "sudo_refresh_token";

const SUDO_ADMIN_KEY =
  "sudo_admin";

// ==========================================
// CONTEXT
// ==========================================

const SudoAuthContext =
  createContext<SudoAuthContextType | null>(
    null,
  );

// ==========================================
// PROVIDER PROPS
// ==========================================

interface SudoAuthProviderProps {
  children: ReactNode;
}

// ==========================================
// PROVIDER
// ==========================================

export function SudoAuthProvider({
  children,
}: SudoAuthProviderProps) {
  // ==========================================
  // STATE
  // ==========================================

  const [admin, setAdmin] =
    useState<SudoAdmin | null>(null);

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  // ==========================================
  // CLEAR LOCAL AUTH DATA
  // ==========================================

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(
      SUDO_ACCESS_TOKEN_KEY,
    );

    localStorage.removeItem(
      SUDO_REFRESH_TOKEN_KEY,
    );

    localStorage.removeItem(
      SUDO_ADMIN_KEY,
    );

    setAccessToken(null);

    setAdmin(null);
  }, []);

  // ==========================================
  // SAVE AUTH DATA
  // ==========================================

  const saveAuthData = useCallback(
    (
      accessTokenValue: string,
      refreshToken: string,
      adminData: SudoAdmin,
    ) => {
      localStorage.setItem(
        SUDO_ACCESS_TOKEN_KEY,
        accessTokenValue,
      );

      localStorage.setItem(
        SUDO_REFRESH_TOKEN_KEY,
        refreshToken,
      );

      localStorage.setItem(
        SUDO_ADMIN_KEY,
        JSON.stringify(adminData),
      );

      // Update React state
      setAccessToken(accessTokenValue);

      setAdmin(adminData);
    },
    [],
  );

  // ==========================================
  // SIGNUP
  // ==========================================

  const signup = useCallback(
    async (
      payload: SudoSignupPayload,
    ): Promise<void> => {
      await signupSudo(payload);
    },
    [],
  );

  // ==========================================
  // LOGIN
  // ==========================================

  const login = useCallback(
    async (
      payload: SudoLoginPayload,
    ): Promise<void> => {
      const loginData =
        await loginSudo(payload);

      saveAuthData(
        loginData.access_token,
        loginData.refresh_token,
        loginData.admin,
      );
    },
    [saveAuthData],
  );

  // ==========================================
  // REFRESH PROFILE
  // ==========================================

  const refreshProfile = useCallback(
    async (): Promise<void> => {
      const token =
        localStorage.getItem(
          SUDO_ACCESS_TOKEN_KEY,
        );

      if (!token) {
        clearAuthData();
        return;
      }

      try {
        const profile =
          await getSudoProfile(token);

        localStorage.setItem(
          SUDO_ADMIN_KEY,
          JSON.stringify(profile),
        );

        setAccessToken(token);

        setAdmin(profile);
      } catch (error) {
        console.error(
          "Failed to refresh Sudo profile:",
          error,
        );

        clearAuthData();

        throw error;
      }
    },
    [clearAuthData],
  );

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = useCallback(
    async (): Promise<void> => {
      const refreshToken =
        localStorage.getItem(
          SUDO_REFRESH_TOKEN_KEY,
        );

      try {
        // Call backend logout API
        if (refreshToken) {
          await logoutSudo(refreshToken);
        }
      } catch (error) {
        console.error(
          "Backend logout failed:",
          error,
        );

        // Continue local logout anyway
      } finally {
        // Always clear local auth
        clearAuthData();
      }
    },
    [clearAuthData],
  );

  // ==========================================
  // RESTORE SESSION
  // ==========================================

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAccessToken =
          localStorage.getItem(
            SUDO_ACCESS_TOKEN_KEY,
          );

        const storedAdmin =
          localStorage.getItem(
            SUDO_ADMIN_KEY,
          );

        // No token
        if (!storedAccessToken) {
          setIsLoading(false);
          return;
        }

        // Restore token immediately
        setAccessToken(
          storedAccessToken,
        );

        // Restore cached admin immediately
        if (storedAdmin) {
          try {
            const parsedAdmin =
              JSON.parse(
                storedAdmin,
              ) as SudoAdmin;

            setAdmin(parsedAdmin);
          } catch {
            localStorage.removeItem(
              SUDO_ADMIN_KEY,
            );
          }
        }

        // Verify token and get latest profile
        try {
          const profile =
            await getSudoProfile(
              storedAccessToken,
            );

          setAdmin(profile);

          localStorage.setItem(
            SUDO_ADMIN_KEY,
            JSON.stringify(profile),
          );
        } catch {
          clearAuthData();
        }
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();
  }, [clearAuthData]);

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value =
    useMemo<SudoAuthContextType>(
      () => ({
        admin,

        accessToken,

        isAuthenticated: Boolean(
          admin && accessToken,
        ),

        isLoading,

        signup,

        login,

        logout,

        refreshProfile,
      }),
      [
        admin,
        accessToken,
        isLoading,
        signup,
        login,
        logout,
        refreshProfile,
      ],
    );

  return (
    <SudoAuthContext.Provider
      value={value}
    >
      {children}
    </SudoAuthContext.Provider>
  );
}

// ==========================================
// HOOK
// ==========================================

export function useSudoAuth() {
  const context =
    useContext(SudoAuthContext);

  if (!context) {
    throw new Error(
      "useSudoAuth must be used inside SudoAuthProvider",
    );
  }

  return context;
}