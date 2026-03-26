import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getToken, getUser, saveToken, saveUser, clearAuth } from '../lib/storage';
import { authApi } from '../lib/api';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  student?: { firstName: string; lastName: string; grade?: string | null } | null;
  teacher?: { firstName: string; lastName: string } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER';
  grade?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Uygulama açılışında kayıtlı oturumu yükle
  useEffect(() => {
    const loadSession = async () => {
      try {
        const [savedToken, savedUser] = await Promise.all([getToken(), getUser()]);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
        }
      } catch {
        // Bozuk veri varsa temizle
        await clearAuth();
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { user: userData, token: userToken } = response.data.data;
    await saveToken(userToken);
    await saveUser(userData);
    setToken(userToken);
    setUser(userData);
  };

  const register = async (data: RegisterData) => {
    const response = await authApi.register(data);
    const { user: userData, token: userToken } = response.data.data;
    await saveToken(userToken);
    await saveUser(userData);
    setToken(userToken);
    setUser(userData);
  };

  const logout = async () => {
    await clearAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
