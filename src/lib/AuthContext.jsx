import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44, supabase } from '@/api/base44Client';

// NOTE: Base44 previously hosted its own login page and an "app public
// settings" check (auth_required / user_not_registered) on its own
// platform. Neither concept exists in a self-hosted Supabase app -- any
// authenticated Supabase user is a valid user. This context now only
// tracks whether someone is logged in, matching the same interface the
// rest of the app already expects (AppOnboardingFlow, RoleGuard, etc.)
// so nothing else needed to change.

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      // Not being logged in is normal for guests -- do not surface this
      // as an error banner, the app already lets guests browse freely.
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadUser();
    const unsubscribe = base44.onAuthChange(() => {
      loadUser();
    });
    return unsubscribe;
  }, []);

  const refreshUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    return currentUser;
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await base44.auth.logout();
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      // kept for compatibility with existing consumers -- always false/null
      // now since there is no separate "app settings" load step anymore
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      checkAppState: loadUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
