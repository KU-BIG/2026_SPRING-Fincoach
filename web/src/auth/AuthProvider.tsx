import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { AuthContext, type AuthContextValue, type AuthMode } from "./context";
import AuthModal from "./AuthModal";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [modal, setModal] = useState<{ open: boolean; mode: AuthMode }>({
    open: false,
    mode: "login",
  });

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp: AuthContextValue["signUp"] = async (email, password) => {
    if (!supabase) return { error: "인증이 구성되지 않았습니다.", needsConfirm: false };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message, needsConfirm: false };
    // when email confirmation is on, session is null until the user confirms
    return { error: null, needsConfirm: !data.session };
  };

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    if (!supabase) return { error: "인증이 구성되지 않았습니다." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const value: AuthContextValue = {
    configured: supabaseConfigured,
    session,
    user: session?.user ?? null,
    loading,
    signUp,
    signIn,
    signOut,
    openAuth: (mode) => setModal({ open: true, mode }),
    closeAuth: () => setModal((m) => ({ ...m, open: false })),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modal.open && <AuthModal initialMode={modal.mode} />}
    </AuthContext.Provider>
  );
}
