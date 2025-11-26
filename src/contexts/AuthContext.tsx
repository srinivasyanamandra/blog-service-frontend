import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, remember?: boolean) => Promise<any>;
  signup: (name: string, email: string, password: string) => Promise<any>;
  verifyOtp: (email: string, otp: string, remember?: boolean) => Promise<any>;
  resendOtp: (email: string) => Promise<any>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  pendingEmail: string | null;
  authChecked?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false); // true when initial token validation done

  useEffect(() => {
    // On init: check both sessionStorage and localStorage for token and user.
    (async () => {
      const storageUser = sessionStorage.getItem('pranublog_user') || localStorage.getItem('pranublog_user');
      const storageToken = sessionStorage.getItem('pranublog_token') || localStorage.getItem('pranublog_token');

      if (storageUser && storageToken) {
        try {
          apiClient.setToken(storageToken);
          // validate token with server
          const validation = await apiClient.auth.validateToken();
          if (validation && validation.valid) {
            const userData = JSON.parse(storageUser);
            setUser(userData);
          } else {
            // clear invalid token
            sessionStorage.removeItem('pranublog_user');
            sessionStorage.removeItem('pranublog_token');
            localStorage.removeItem('pranublog_user');
            localStorage.removeItem('pranublog_token');
            apiClient.clearToken();
            setUser(null);
          }
        } catch (err) {
          // server validation failed, clear stored data
          sessionStorage.removeItem('pranublog_user');
          sessionStorage.removeItem('pranublog_token');
          localStorage.removeItem('pranublog_user');
          localStorage.removeItem('pranublog_token');
          apiClient.clearToken();
          setUser(null);
        }
      }

      setAuthChecked(true);
    })();
  }, []);

  useEffect(() => {
    const handler = () => {
      // Clear local auth state on unauthorized events
      setUser(null);
      setPendingEmail(null);
      apiClient.clearToken();
      try {
        localStorage.removeItem('pranublog_user');
        localStorage.removeItem('pranublog_token');
        sessionStorage.removeItem('pranublog_user');
        sessionStorage.removeItem('pranublog_token');
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('pranublog:unauthorized', handler as EventListener);
    return () => window.removeEventListener('pranublog:unauthorized', handler as EventListener);
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    const response = await apiClient.auth.signup(name, email, password);
    setPendingEmail(email);
    return response;
  };

  const verifyOtp = async (email: string, otp: string, remember: boolean = false) => {
    const response = await apiClient.auth.verifyOtp(email, otp);
    const user: User = {
      id: response.userId,
      name: response.name,
      email: response.email,
      role: response.role,
      lastLoginAt: response.lastLoginAt,
    };
    setUser(user);
    // choose storage based on `remember` param; default to session
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('pranublog_user', JSON.stringify(user));
    storage.setItem('pranublog_token', response.token);
    apiClient.setToken(response.token);
    setPendingEmail(null);
    return response;
  };

  const resendOtp = async (email: string) => {
    return apiClient.auth.resendOtp(email);
  };

  const login = async (email: string, password: string, remember: boolean = true) => {
    // remember defaults to true for classic login; if false, we store in sessionStorage
    const response = await apiClient.auth.login(email, password);
    // if server asks for re-verification (user not verified), we shouldn't set token
    if (response && response.isVerified === false) {
      setPendingEmail(response.email || email);
      // keep the token not set and return response to UI to show OTP flow
      return response;
    }
    const user: User = {
      id: response.userId,
      name: response.name,
      email: response.email,
      role: response.role,
      lastLoginAt: response.lastLoginAt,
    };
    setUser(user);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('pranublog_user', JSON.stringify(user));
    storage.setItem('pranublog_token', response.token);
    apiClient.setToken(response.token);
    return response;
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch (e) {
      // ignore logout errors
    }
    setUser(null);
    setPendingEmail(null);
    localStorage.removeItem('pranublog_user');
    localStorage.removeItem('pranublog_token');
    sessionStorage.removeItem('pranublog_user');
    sessionStorage.removeItem('pranublog_token');
    apiClient.clearToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        verifyOtp,
        resendOtp,
        logout,
        isAuthenticated: !!user,
        authChecked,
        pendingEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
