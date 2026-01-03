import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin_provinsi" | "admin_kab_kota" | "panitia" | "wasit" | "evaluator";
export type RegistrationStatus = "pending" | "approved" | "rejected" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  role: AppRole | null;
  isProfileComplete: boolean;
  kabupatenKotaId: string | null;
  registrationStatus: RegistrationStatus;
  requestedRole: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: () => boolean;
  isAdminProvinsi: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [kabupatenKotaId, setKabupatenKotaId] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>(null);
  const [requestedRole, setRequestedRole] = useState<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (data) {
      setRole(data.role as AppRole);
    } else {
      setRole(null);
    }
  };

  const fetchProfileStatus = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("is_profile_complete, kabupaten_kota_id, registration_status, requested_role")
      .eq("id", userId)
      .maybeSingle();
    
    if (data) {
      setIsProfileComplete(data.is_profile_complete || false);
      setKabupatenKotaId(data.kabupaten_kota_id || null);
      setRegistrationStatus(data.registration_status as RegistrationStatus);
      setRequestedRole(data.requested_role || null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await Promise.all([
        fetchUserRole(user.id),
        fetchProfileStatus(user.id)
      ]);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
            fetchProfileStatus(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setIsProfileComplete(false);
          setKabupatenKotaId(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
        fetchProfileStatus(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setIsProfileComplete(false);
    setKabupatenKotaId(null);
    setRegistrationStatus(null);
    setRequestedRole(null);
  };

  const isAdmin = () => {
    return role === "admin_provinsi" || role === "admin_kab_kota";
  };

  const isAdminProvinsi = () => {
    return role === "admin_provinsi";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        role,
        isProfileComplete,
        kabupatenKotaId,
        registrationStatus,
        requestedRole,
        signIn,
        signOut,
        refreshProfile,
        isAdmin,
        isAdminProvinsi,
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
