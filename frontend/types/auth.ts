import { User as SupabaseUser, AuthError, Session } from '@supabase/supabase-js'

export type UserRole = "admin" | "researcher";

export interface User {
    id: string
    email: string
    app_metadata?: {
    role?: UserRole
  }
  }

  export interface AuthResponse {
    access_token: string
    user: User
  }

  export interface AuthContextType {
    user: SupabaseUser | null
    session: Session | null
    loading: boolean
    signUp: (email: string, password: string) => Promise<{ user: SupabaseUser | null; error: AuthError | null }>
    signIn: (email: string, password: string) => Promise<{ user: SupabaseUser | null; error: AuthError | null }>
    signOut: () => Promise<{ error: AuthError | null }>
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>
    updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>
    showPicker: boolean;
    setShowPicker: (show: boolean) => void;
  }

  export const isAdmin = (user: SupabaseUser | null): boolean => {
    return (user?.app_metadata as { role?: UserRole } | undefined)?.role === 'admin'
  }