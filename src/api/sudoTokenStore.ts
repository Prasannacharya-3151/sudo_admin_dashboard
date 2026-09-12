import type { SudoAdmin } from "../types/sudo";

const ACCESS_KEY = "sudo_access_token";
const REFRESH_KEY = "sudo_refresh_token";
const EXPIRES_KEY = "sudo_expires_in";
const LOGIN_TIME_KEY = "sudo_login_time";
const ADMIN_KEY = "sudo_admin";

export interface SudoAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  loginTime: number | null;
  admin: SudoAdmin | null;
}

type Listener = () => void;

function readState(): SudoAuthState {
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  const expiresInRaw = localStorage.getItem(EXPIRES_KEY);
  const loginTimeRaw = localStorage.getItem(LOGIN_TIME_KEY);
  const adminRaw = localStorage.getItem(ADMIN_KEY);

  const expiresInNum = expiresInRaw ? Number(expiresInRaw) : NaN;
  const loginTimeNum = loginTimeRaw ? Number(loginTimeRaw) : NaN;

  let admin: SudoAdmin | null = null;
  if (adminRaw) {
    try {
      admin = JSON.parse(adminRaw) as SudoAdmin;
    } catch {
      admin = null;
    }
  }

  // Incomplete session (e.g. access token with no refresh token) is not valid.
  if (!accessToken || !refreshToken) {
    return {
      accessToken: null,
      refreshToken: null,
      expiresIn: null,
      loginTime: null,
      admin: null,
    };
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: Number.isFinite(expiresInNum) && expiresInNum > 0 ? expiresInNum : null,
    loginTime: Number.isFinite(loginTimeNum) ? loginTimeNum : null,
    admin,
  };
}

let state: SudoAuthState = readState();
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function persist(next: SudoAuthState) {
  if (next.accessToken) localStorage.setItem(ACCESS_KEY, next.accessToken);
  else localStorage.removeItem(ACCESS_KEY);

  if (next.refreshToken) localStorage.setItem(REFRESH_KEY, next.refreshToken);
  else localStorage.removeItem(REFRESH_KEY);

  if (next.expiresIn) localStorage.setItem(EXPIRES_KEY, String(next.expiresIn));
  else localStorage.removeItem(EXPIRES_KEY);

  if (next.loginTime) localStorage.setItem(LOGIN_TIME_KEY, String(next.loginTime));
  else localStorage.removeItem(LOGIN_TIME_KEY);

  if (next.admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(next.admin));
  else localStorage.removeItem(ADMIN_KEY);
}

export const sudoTokenStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getState(): SudoAuthState {
    return state;
  },

  getAccessToken(): string | null {
    return state.accessToken;
  },

  getRefreshToken(): string | null {
    return state.refreshToken;
  },

  /** Full session write — login, or a refresh that rotates the refresh token. */
  setSession(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    admin: SudoAdmin,
  ) {
    state = {
      accessToken,
      refreshToken,
      expiresIn,
      loginTime: Date.now(),
      admin,
    };
    persist(state);
    notify();
  },

  /** Rotate tokens only (used by the refresh flow when admin hasn't changed). */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    state = {
      ...state,
      accessToken,
      refreshToken,
      expiresIn,
      loginTime: Date.now(),
    };
    persist(state);
    notify();
  },

  setAdmin(admin: SudoAdmin) {
    state = { ...state, admin };
    persist(state);
    notify();
  },

  clear() {
    state = {
      accessToken: null,
      refreshToken: null,
      expiresIn: null,
      loginTime: null,
      admin: null,
    };
    persist(state);
    notify();
  },

  /** Re-read from localStorage — used when another tab changes auth state. */
  syncFromStorage() {
    state = readState();
    notify();
  },
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (
      event.key === ACCESS_KEY ||
      event.key === REFRESH_KEY ||
      event.key === EXPIRES_KEY ||
      event.key === LOGIN_TIME_KEY ||
      event.key === ADMIN_KEY
    ) {
      sudoTokenStore.syncFromStorage();
    }
  });
}