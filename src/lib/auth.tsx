import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const handleAuthRedirect = async () => {
      const hasAuthParams = 
        window.location.hash.includes("access_token") || 
        window.location.hash.includes("id_token") ||
        window.location.hash.includes("error") ||
        window.location.search.includes("code=") ||
        window.location.search.includes("error=");

      if (hasAuthParams) {
        try {
          // Exchange PKCE code or load implicit session
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (isMounted && currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
        } catch (err) {
          console.error("Error exchanging session during redirect:", err);
        } finally {
          if (isMounted) {
            setIsLoading(false);
            // Clean up the URL only after session is confirmed or resolved
            const cleanUrl = window.location.origin + "/";
            window.history.replaceState(null, "", cleanUrl);
          }
        }
      } else {
        // Standard non-redirect app load
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (isMounted) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setIsLoading(false);
          }
        } catch (err) {
          console.error("Error fetching session on app load:", err);
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };

    handleAuthRedirect();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        // Sanitize parameters if signed in through redirect
        if (event === "SIGNED_IN" || currentSession) {
          const hasRedirectParams = 
            window.location.hash.includes("access_token") || 
            window.location.hash.includes("id_token") ||
            window.location.hash.includes("error") ||
            window.location.search.includes("code=") ||
            window.location.search.includes("error=");
          
          if (hasRedirectParams) {
            const cleanUrl = window.location.origin + "/";
            window.history.replaceState(null, "", cleanUrl);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = window.location.origin + "/";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // To prevent UI flicker, we wait until the initial auth check is done.
  // Alternatively, we could render children but let components handle `isLoading`.
  // Here we just render children since the UI works without auth anyway.

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
