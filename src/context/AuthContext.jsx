import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, authApi, clearTokens, getAccessToken, setTokens, UNAUTH_EVENT } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const dropSession = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setReady(true);
      return;
    }
    try {
      const profile = await authApi.profile();
      setUser(profile);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) dropSession();
    } finally {
      setReady(true);
    }
  }, [dropSession]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    function onUnauth() {
      setUser(null);
    }
    window.addEventListener(UNAUTH_EVENT, onUnauth);
    return () => window.removeEventListener(UNAUTH_EVENT, onUnauth);
  }, []);

  const signIn = useCallback((payload) => {
    setTokens(payload.accessToken, payload.refreshToken);
    setUser(payload.user || null);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* token may already be invalid */
    }
    dropSession();
  }, [dropSession]);

  const value = useMemo(
    () => ({ user, setUser, ready, signIn, signOut, reload: loadProfile }),
    [user, ready, signIn, signOut, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
