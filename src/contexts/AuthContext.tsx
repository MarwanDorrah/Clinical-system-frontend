'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS, UserRole, USER_ROLES } from '@/config/api.config';
import { 
  isAuthenticated as checkAuth, 
  validateToken, 
  getTokenTimeRemaining,
  isTokenExpiringSoon,
  logout as authLogout 
} from '@/services/auth.service';

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userName: string | null;
  userId: string | null;
  token: string | null;
  tokenExpiresIn: number; 
  isTokenExpiringSoon: boolean;
  login: (token: string, role: UserRole, name: string, id: string) => void;
  logout: () => void;
  isDoctor: () => boolean;
  isNurse: () => boolean;
  refreshAuthStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpiresIn, setTokenExpiresIn] = useState<number>(0);
  const [tokenExpiringSoon, setTokenExpiringSoon] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshAuthStatus = () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (!storedToken) {
      setIsAuthenticated(false);
      setTokenExpiresIn(0);
      setTokenExpiringSoon(false);
      return;
    }

    const validation = validateToken();
    if (!validation.isValid) {
      console.warn('Token validation warning:', validation.error);
      
      if (validation.error?.includes('expired')) {
        logout();
        return;
      }
    }

    const remaining = getTokenTimeRemaining();
    setTokenExpiresIn(remaining);
    setTokenExpiringSoon(isTokenExpiringSoon(5));
    
    setIsAuthenticated(checkAuth());
  };

  useEffect(() => {
    
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE) as UserRole;
    const storedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    const storedId = localStorage.getItem(STORAGE_KEYS.USER_ID);

    if (storedToken && storedRole && storedName && storedId) {
      
      const validation = validateToken();
      
      if (validation.isValid) {
        setToken(storedToken);
        setUserRole(storedRole);
        setUserName(storedName);
        setUserId(storedId);
        setIsAuthenticated(true);
        refreshAuthStatus();
      } else {
        
        console.warn('Stored token invalid on load:', validation.error);
        authLogout(false);
      }
    }
    setIsLoading(false);

    const interval = setInterval(() => {
      if (checkAuth()) {
        refreshAuthStatus();

        if (getTokenTimeRemaining() <= 0) {
          console.warn('Token expired, logging out');
          logout();
        }
      }
    }, 60000); 

    return () => clearInterval(interval);
  }, []);

  const login = (token: string, role: UserRole, name: string, id: string) => {
    
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
    localStorage.setItem(STORAGE_KEYS.USER_ID, id);

    if (role === 'Doctor') {
      localStorage.setItem(STORAGE_KEYS.DOCTOR_ID, id);
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Login successful - Token payload:', {
        sub: payload.sub,
        role: payload.role,
        UserType: payload.UserType,
        name: payload.name,
        email: payload.email,
        
        DoctorId: payload.DoctorId || 'NOT IN TOKEN',
        doctorId: payload.doctorId || 'NOT IN TOKEN',
        exp: new Date(payload.exp * 1000).toISOString(),
      });

      if (role === 'Doctor' && !payload.DoctorId && !payload.doctorId) {
        console.warn('Token does not contain DoctorId claim. Backend may fail to authorize EHR updates.');
        console.warn('Stored doctorId in localStorage as fallback:', id);
      }
    } catch (e) {
      console.error('Failed to decode token for debugging');
    }

    setToken(token);
    setUserRole(role);
    setUserName(name);
    setUserId(id);
    setIsAuthenticated(true);

    const remaining = getTokenTimeRemaining();
    setTokenExpiresIn(remaining);
    setTokenExpiringSoon(isTokenExpiringSoon(5));

    router.push('/dashboard');
  };

  const logout = () => {
    
    authLogout(false);

    localStorage.removeItem(STORAGE_KEYS.DOCTOR_ID);

    setToken(null);
    setUserRole(null);
    setUserName(null);
    setUserId(null);
    setIsAuthenticated(false);
    setTokenExpiresIn(0);
    setTokenExpiringSoon(false);

    router.push('/auth/login?reason=logout');
  };

  const isDoctor = () => userRole === USER_ROLES.DOCTOR;
  const isNurse = () => userRole === USER_ROLES.NURSE;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        userName,
        userId,
        token,
        tokenExpiresIn,
        isTokenExpiringSoon: tokenExpiringSoon,
        login,
        logout,
        isDoctor,
        isNurse,
        refreshAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
