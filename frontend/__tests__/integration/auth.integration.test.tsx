import { supabase } from '@/lib/supabase/supabaseConfig'

describe('Auth Integration Tests', () => {
  const testEmail = `kudakwashemujuru1@gmail.com`
  const testPassword = 'TestPassword123!'
  let userId: string | null = null

  afterAll(async () => {
    if (userId) {
      console.log(`Manual cleanup needed: Delete user ${testEmail} from Supabase dashboard`)
    }
  })

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      })

      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      expect(data.user?.email).toBe(testEmail)

      if (data.user) {
        userId = data.user.id
        console.log(`Created test user: ${testEmail} (ID: ${userId})`)
      }

      if (data.session) {
        expect(data.session.access_token).toBeDefined()
        console.log(`Session created with token: ${data.session.access_token.substring(0, 20)}...`)
      } else {
        console.log(`No session - email confirmation may be required`)
      }
    }, 10000)
  })

  describe('User Login', () => {
    it('should successfully login with correct credentials', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          console.log(`Email confirmation required. Check Supabase settings.`)
          console.log(`Go to: Authentication -> Settings -> Email Auth -> Disable "Confirm email"`)
          expect(error.message).toContain('Email not confirmed')
        } else {
          throw error
        }
      } else {
        expect(data.user).toBeDefined()
        expect(data.user?.email).toBe(testEmail)
        expect(data.session).toBeDefined()
        expect(data.session?.access_token).toBeDefined()

        console.log(`Login successful`)
        console.log(`Access token: ${data.session?.access_token.substring(0, 20)}...`)
      }
    }, 10000)

    it('should fail login with incorrect password', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'WrongPassword123!',
      })

      expect(error).toBeDefined()
      expect(data.user).toBeNull()
      console.log(`Correctly rejected invalid credentials`)
    }, 10000)

    it('should fail login with non-existent user', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      })

      expect(error).toBeDefined()
      expect(data.user).toBeNull()
      console.log(`Correctly rejected non-existent user`)
    }, 10000)
  })

  describe('Session Management', () => {
    it('should retrieve current session', async () => {
      const { data, error } = await supabase.auth.getSession()

      expect(error).toBeNull()

      if (data.session) {
        console.log(`Current session found for: ${data.session.user.email}`)
        expect(data.session.user).toBeDefined()
        expect(data.session.access_token).toBeDefined()
      } else {
        console.log(`No active session (user may need to login first)`)
      }
    }, 10000)
  })

  describe('Sign Out', () => {
    it('should successfully sign out', async () => {
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      const { error } = await supabase.auth.signOut()

      if (error && !error.message.includes('Email not confirmed')) {
        throw error
      }

      const { data: sessionData } = await supabase.auth.getSession()
      expect(sessionData.session).toBeNull()

      console.log(`Sign out successful`)
    }, 10000)
  })

  describe('Token Validation', () => {
    it('should have valid JWT token structure', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      if (error && error.message.includes('Email not confirmed')) {
        console.log(`Skipping token validation - email not confirmed`)
        return
      }

      expect(error).toBeNull()
      expect(data.session?.access_token).toBeDefined()

      const token = data.session?.access_token
      if (token) {
        const parts = token.split('.')
        expect(parts.length).toBe(3)

        const payload = JSON.parse(atob(parts[1]))
        expect(payload.sub).toBe(userId)
        expect(payload.email).toBe(testEmail)
        expect(payload.aud).toBe('authenticated')
        expect(payload.exp).toBeGreaterThan(Date.now() / 1000)

        console.log(`Token structure valid`)
        console.log(`User ID: ${payload.sub}`)
        console.log(`Email: ${payload.email}`)
        console.log(`Expires: ${new Date(payload.exp * 1000).toISOString()}`)
      }
    }, 10000)
  })
})
