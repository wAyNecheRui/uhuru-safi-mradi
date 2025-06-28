
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  type: 'citizen' | 'contractor' | 'government';
  phone?: string;
  organization?: string;
  skills?: string;
  isVerified: boolean;
  registrationDate: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string; confirmPassword: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing auth on app load
    const savedAuth = localStorage.getItem('userAuth');
    if (savedAuth) {
      try {
        const userData = JSON.parse(savedAuth);
        if (userData.isAuthenticated) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        localStorage.removeItem('userAuth');
      }
    }
  }, []);

  const login = async (email: string, password: string, userType: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userData: User = {
      id: Date.now().toString(),
      name: email.split('@')[0], // Simple name derivation
      email,
      type: userType as 'citizen' | 'contractor' | 'government',
      isVerified: false,
      registrationDate: new Date().toISOString()
    };

    setUser(userData);
    localStorage.setItem('userAuth', JSON.stringify({ ...userData, isAuthenticated: true }));
  };

  const register = async (userData: Partial<User> & { password: string; confirmPassword: string }) => {
    if (userData.password !== userData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name || '',
      email: userData.email || '',
      type: userData.type || 'citizen',
      phone: userData.phone,
      organization: userData.organization,
      skills: userData.skills,
      isVerified: false,
      registrationDate: new Date().toISOString()
    };

    setUser(newUser);
    localStorage.setItem('userAuth', JSON.stringify({ ...newUser, isAuthenticated: true }));
    localStorage.setItem('userProfile', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userAuth');
    localStorage.removeItem('userProfile');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
