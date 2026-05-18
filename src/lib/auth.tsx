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
    let isInitializing = true;

    const handleAuthRedirect = async () => {
      const hasAuthParams = 
        window.location.hash.includes("access_token") || 
        window.location.hash.includes("id_token") ||
        window.location.hash.includes("error") ||
        window.location.search.includes("code=") ||
        window.location.search.includes("error=");

      try {
        // 3. Fix race condition: Call getSession() FIRST
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      } catch (err) {
        console.error("Error exchanging session during redirect/init:", err);
      } finally {
        if (isMounted) {
          // 4. URL cleanup MUST happen AFTER session resolution and BEFORE ending loading
          if (hasAuthParams) {
            const cleanUrl = window.location.origin + "/";
            window.history.replaceState(null, "", cleanUrl);
          }
          isInitializing = false;
          setIsLoading(false);
        }
      }
    };

    handleAuthRedirect();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        // 5. Ensure onAuthStateChange sync does NOT trigger UI rerender before session is ready
        if (isInitializing) {
          return;
        }

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

  // 2. BLOCK premature rendering of routes until session loading is complete
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1f]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        </div>
      </div>
    );
  }

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
