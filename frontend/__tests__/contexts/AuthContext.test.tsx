import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/authContext/AuthContext'
import { supabase } from '@/lib/supabase/supabaseConfig'

// Mock Supabase
jest.mock('@/lib/supabase/supabaseConfig', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}))

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('AuthProvider initialization', () => {
    it('should initialize with loading state', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'mock-token',
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
      })

      const mockSubscription = { unsubscribe: jest.fn() }
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription },
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockSession.user)
    })

    it('should handle no session on initialization', async () => {
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      })

      const mockSubscription = { unsubscribe: jest.fn() }
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription },
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()
    })
  })

  describe('signUp', () => {
    it('should successfully sign up a user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'mock-token' }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      })

      const mockSubscription = { unsubscribe: jest.fn() }
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription },
      })

      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.signUp('test@example.com', 'password123')

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(response.user).toEqual(mockUser)
      expect(response.error).toBeNull()
    })

    it('should handle sign up error', async () => {
      const mockError = { message: 'Email already exists' }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      })

      const mockSubscription = { unsubscribe: jest.fn() }
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription },
      })

      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: mockError,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.signUp('test@example.com', 'password123')

      expect(response.error).toEqual(mockError)
    })
  })

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'mock-token' }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      })

      const mockSubscription = { unsubscribe: jest.fn() }
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription },
      })

      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.signIn('test@example.com', 'password123')

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(response.user).toEqual(mockUser)
      expect(response.error).toBeNull()
    })

    it('should handle sign in error', async () => {
      const mockError = { message: 'Invalid credentials' }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      })

      const mockSubscription = { unsubscribe: jest.fn() }
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription },
      })

      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: mockError,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.signIn('test@example.com', 'wrong-password')

      expect(response.error).toEqual(mockError)
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: '123', email: 'test@example.com' } } },
      })

      const mockSubscription = { unsubscribe: jest.fn() }
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription },
      })

      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.signOut()

      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(response.error).toBeNull()
    })
  })

  describe('resetPassword', () => {
    it('should successfully send password reset email', async () => {
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      })

      const mockSubscription = { unsubscribe: jest.fn() }
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription },
      })

      ;(supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: null,
      })

      // Mock window.location.origin
      delete (window as any).location
      ;(window as any).location = { origin: 'http://localhost:3000' }

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const response = await result.current.resetPassword('test@example.com')

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/auth/reset-password',
        }
      )
      expect(response.error).toBeNull()
    })
  })

  describe('auth state change listener', () => {
    it('should unsubscribe on unmount', async () => {
      const mockUnsubscribe = jest.fn()
      const mockSubscription = { unsubscribe: mockUnsubscribe }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      })

      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription },
      })

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
      })

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})
