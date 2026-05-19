export interface User {
    id: string
    email: string
  }

  export interface AuthResponse {
    access_token: string
    user: User
  }

  export interface AuthContextType {
    user: User | null
    loading: boolean
    signUp: (email: string, password: string) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<void>
  }