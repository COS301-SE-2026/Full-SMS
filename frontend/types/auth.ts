import { User as SupabaseUser, AuthError, Session } from '@supabase/supabase-js'

export interface User {
    id: string
    email: string
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
  }