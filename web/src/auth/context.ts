import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export type AuthMode = "login" | "signup";

export interface AuthContextValue {
  /** true when Supabase env is present (real-service build). Demo = false. */
  configured: boolean;
  session: Session | null;
  user: User | null;
  /** initial session still loading */
  loading: boolean;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirm: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** open the auth modal in login or signup mode */
  openAuth: (mode: AuthMode) => void;
  closeAuth: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
