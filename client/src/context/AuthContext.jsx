import { useState, useEffect } from 'react';
import authService from '../services/authService';
import AuthContext from './authContextCore';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      const cached = saved ? JSON.parse(saved) : null;
      if (cached && typeof cached === 'object' && cached._id) return cached;
    } catch {
      localStorage.removeItem('user');
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  // Verify the HttpOnly session cookie on mount. Remove any legacy bearer token.
  useEffect(() => {
    const verify = async () => {
      localStorage.removeItem('token');
      try {
        const data = await authService.getProfile();
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const register = async (formData) => {
    const data = await authService.register(formData);
    setUser(data.user);
    return data;
  };

  const login = async (formData) => {
    const data = await authService.login(formData);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
