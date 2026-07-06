'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  // On mount, restore session from the HttpOnly cookie via /api?path=auth/me
  useEffect(() => {
    const onboarded = localStorage.getItem('provenance_onboarded');
    if (onboarded === 'true') setIsOnboarded(true);

    fetch('/api/?path=auth/me')
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setUser(res.data);
          if (res.data.onboarded) {
            setIsOnboarded(true);
            localStorage.setItem('provenance_onboarded', 'true');
          }
        }
      })
      .catch(() => {}) // unauthenticated - stay null
      .finally(() => setLoading(false));
  }, []);

  /**
   * Login with email + password.
   * The server sets an HttpOnly session cookie on success.
   * @returns {{ success: boolean, error?: string }}
   */
  const login = async (email, password) => {
    const res = await fetch('/api/?path=auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.data);
      if (data.data.onboarded) {
        setIsOnboarded(true);
        localStorage.setItem('provenance_onboarded', 'true');
      }
    }
    return data;
  };

  /**
   * Create a new account.
   * The server sets an HttpOnly session cookie on success.
   * @returns {{ success: boolean, error?: string }}
   */
  const signup = async (email, password, name) => {
    const res = await fetch('/api/?path=auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.data);
      setIsOnboarded(false);
      localStorage.removeItem('provenance_onboarded');
    }
    return data;
  };

  /**
   * Logout - clears the HttpOnly session cookie server-side.
   */
  const logout = async () => {
    await fetch('/api/?path=auth/logout', { method: 'POST' });
    setUser(null);
    setIsOnboarded(false);
    localStorage.removeItem('provenance_onboarded');
  };

  const completeOnboarding = (data) => {
    setIsOnboarded(true);
    localStorage.setItem('provenance_onboarded', 'true');
    localStorage.setItem('provenance_onboarding_data', JSON.stringify(data));
    // Persist server-side so the one-time onboarding scan bypass closes
    fetch('/api?path=auth/complete-onboarding', { method: 'POST' })
      .catch((err) => console.error('Failed to persist onboarding state', err));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      isOnboarded,
      completeOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
