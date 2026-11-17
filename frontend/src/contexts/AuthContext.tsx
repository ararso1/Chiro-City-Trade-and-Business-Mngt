import CentralAuthGate from '@/components/CentralAuthGate';
import {
  isCentralAuth,
  hasCentralSession,
  signIn,
  signOut,
} from "@/services/chiroAuth";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { api, setAuthToken } from "@/services/api";

export type UserRole = string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

interface AuthContextType {
  authError: string;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  homePath: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const signingOut = useRef(false);

  const refreshProfile = async () => {
    const token = isCentralAuth()
      ? hasCentralSession()
      : localStorage.getItem("chiro_trade_token");
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await api.auth.profile();
      setUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        permissions: profile.permissions ?? [],
      });
    } catch (error) {
      setAuthError((error as Error).message);
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
    const clear = () => {
      setUser(null);
      if (!signingOut.current) setIsLoading(false);
    };
    window.addEventListener("cctbm:unauthorized", clear);
    return () => window.removeEventListener("cctbm:unauthorized", clear);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (isCentralAuth()) {
      await signIn();
      return false;
    }
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setAuthToken(res.access_token);
      setUser({
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as UserRole,
        permissions: res.user.permissions ?? [],
      });
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    signingOut.current = true;
    setIsLoading(true);
    try {
      if (isCentralAuth()) await signOut();
      setAuthToken(null);
      setUser(null);
      if (!isCentralAuth()) setIsLoading(false);
    } catch (error) {
      signingOut.current = false;
      setAuthError(error instanceof Error ? error.message : 'Unable to sign out.');
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const destinations: [string, string[]][] = [
    ["/dashboard", ["dashboard.view"]],
    ["/traders", ["traders.read"]],
    ["/finance", ["payments.read", "finance.read"]],
    ["/inspections", ["inspections.read"]],
    ["/admin/users", ["users.read", "roles.read"]],
    ["/reports", ["reports.read"]],
    ["/complaints", ["complaints.read"]],
    ["/archive", ["documents.read"]],
    ["/admin/settings", ["settings.read"]],
  ];
  const homePath =
    destinations.find(([, permissions]) =>
      permissions.some(hasPermission),
    )?.[0] || "/no-access";
  const value: AuthContextType = {
    homePath,
    authError,
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    isLoading,
    refreshProfile,
  };

  return <CentralAuthGate active={isCentralAuth()} loading={isLoading} authenticated={!!user} error={authError} onSignOut={logout}><AuthContext.Provider value={value}>{children}</AuthContext.Provider></CentralAuthGate>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
