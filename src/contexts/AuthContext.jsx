import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { login as loginRequest, logout as logoutRequest, restoreSession, writeSession } from '../services/authService';
import { endImpersonation, impersonateUser } from '../services/platformService';

export const AuthContext = createContext(null);

const ACTOR_KEY = 'eventpilot.actor';
const IMPERSONATION_KEY = 'eventpilot.impersonation';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [impersonation, setImpersonation] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(IMPERSONATION_KEY) || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let active = true;
    restoreSession()
      .then((user) => {
        if (!active) return;
        setCurrentUser(user);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Session expired. Please login again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    const user = await loginRequest(credentials);
    if (user) setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    sessionStorage.removeItem(ACTOR_KEY);
    sessionStorage.removeItem(IMPERSONATION_KEY);
    setImpersonation(null);
    setCurrentUser(null);
  }, []);

  const startImpersonation = useCallback(async (target, reason, minutes = 15) => {
    if (!currentUser || currentUser.role !== 'fde') {
      throw new Error('Only an FDE can impersonate.');
    }
    const trimmed = String(reason || '').trim();
    if (!trimmed) throw new Error('A reason is required before impersonation.');
    const result = await impersonateUser({ ...target, reason: trimmed, minutes });
    const banner = {
      ...result,
      name: target.name,
      email: target.email,
    };
    sessionStorage.setItem(ACTOR_KEY, JSON.stringify(currentUser));
    sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(banner));
    writeSession(target);
    setImpersonation(banner);
    setCurrentUser(target);
    return banner;
  }, [currentUser]);

  const stopImpersonation = useCallback(async () => {
    const actor = JSON.parse(sessionStorage.getItem(ACTOR_KEY) || 'null');
    await endImpersonation(currentUser);
    sessionStorage.removeItem(ACTOR_KEY);
    sessionStorage.removeItem(IMPERSONATION_KEY);
    setImpersonation(null);
    if (actor) {
      writeSession(actor);
      setCurrentUser(actor);
    }
  }, [currentUser]);

  const value = useMemo(() => ({
    currentUser,
    loading,
    error,
    impersonation,
    login,
    logout,
    startImpersonation,
    stopImpersonation,
  }), [currentUser, loading, error, impersonation, login, logout, startImpersonation, stopImpersonation]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
