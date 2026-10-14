import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateLoyaltyPoints: (newPoints: number) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  updateLoyaltyPoints: () => {},
  isAuthenticated: false,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('bmb_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.loyaltyPoints === undefined) parsed.loyaltyPoints = 280;
        return parsed;
      } catch {
        return null;
      }
    }
    // Pre-populate with default passenger user for convenience
    return {
      id: 2,
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '9898989898',
      role: 'ROLE_USER',
      loyaltyPoints: 280,
    };
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('bmb_token') || 'demo_jwt_token_default_user';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('bmb_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bmb_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('bmb_token', token);
    } else {
      localStorage.removeItem('bmb_token');
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bmb_token');
    localStorage.removeItem('bmb_user');
  };

  const updateLoyaltyPoints = (newPoints: number) => {
    setUser(prev => (prev ? { ...prev, loyaltyPoints: newPoints } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateLoyaltyPoints,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ROLE_ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
