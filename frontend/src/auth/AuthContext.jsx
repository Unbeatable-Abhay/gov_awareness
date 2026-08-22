import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../api/supabaseClient";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkConsent = useCallback(async (userId) => {
    if (!userId) {
      setHasConsent(false);
      return;
    }
    const { data } = await supabase
      .from("user_consents")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    setHasConsent(!!data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await checkConsent(data.session?.user?.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      await checkConsent(newSession?.user?.id);
    });

    return () => listener.subscription.unsubscribe();
  }, [checkConsent]);

  function signInWithGoogle() {
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/profile` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setHasConsent(false);
  }

  async function submitConsent() {
    if (!session?.user?.id) return;
    await supabase.from("user_consents").insert({ user_id: session.user.id });
    setHasConsent(true);
  }

  const value = { session, user: session?.user ?? null, loading, hasConsent, signInWithGoogle, signOut, submitConsent };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { AuthProvider, useAuth };