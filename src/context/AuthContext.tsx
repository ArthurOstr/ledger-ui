import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiClient from '../api/client';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const verifySession = async () => {
    try {
      // browser attaches cookie HttpOnly here
      await apiClient.get('/users/me');
      setIsAuthenticated(true)
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // FastAPI OAuth2 requires form data, not JSON
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      await apiClient.post('/users/login', formData, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      });

      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed", error)
    throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await apiClient.post('/users/register', {
        email, password
      });
      await login(email, password);
    } catch (error) {
      console.error("Registration failed:", error)
      throw error;
    }
  };

  const logout = async () => {
    try {
    await apiClient.post('/users/logout');
  } catch (error) {
  console.error("Logout failed:", error);
  } finally {
  setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to reuse the auth context in any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
