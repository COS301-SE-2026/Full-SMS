import axios from 'axios'
import { supabase } from '@/lib/supabase/supabaseConfig'

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - automatically attach Supabase JWT token
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    } catch (error) {
      console.error('Error getting session:', error)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 errors (token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status } = error.response

      switch (status) {
        case 401:
          // Token expired or invalid - sign out user
          await supabase.auth.signOut()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          break
        case 403:
          console.error('Forbidden: You do not have permission to access this resource')
          break
        case 404:
          console.error('Not found:', error.response.data?.detail || error.message)
          break
        case 500:
          console.error('Server error:', error.response.data?.detail || error.message)
          break
        default:
          console.error('API error:', error.response.data?.detail || error.message)
      }
    } else if (error.request) {
      console.error('Network error: No response received from server')
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
