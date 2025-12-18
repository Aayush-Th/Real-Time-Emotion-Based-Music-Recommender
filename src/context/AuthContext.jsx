import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null); // Alias for compatibility
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setCurrentUser(userData);
      setUser(userData); // Keep both in sync
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // Call backend auth endpoint
    return fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const userData = { email: data.user.email, name: data.user.name, displayName: data.user.name };
          setCurrentUser(userData);
          setUser(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
          return { success: true };
        }

        // Provide clearer error messages for common cases
        const errMsg = data.error || (res.status === 401 ? 'Invalid email or password' : `Login failed (${res.status})`);
        return { success: false, error: errMsg };
      })
      .catch((err) => ({ success: false, error: `Network error: ${err?.message || 'unknown'}` }));
  };

  const signup = (name, email, password) => {
    // Call backend register endpoint. Do not auto-login; client should prompt login.
    return fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 201) {
          // Registration successful — prompt client to login next
          return { success: true };
        }
        return { success: false, error: data.error || 'Registration failed' };
      })
      .catch((err) => ({ success: false, error: 'Network error' }));
  };

  const logout = () => {
    // Attempt to clear any server-side session (Spotify tokens) but don't block
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

    setCurrentUser(null);
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value = {
    currentUser,
    user, // Add user as alias
    login,
    signup,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
