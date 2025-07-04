// hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  username: string
  email: string
  walletAddress?: string
  createdAt: string
  isEmailVerified: boolean
  profile: {
    bio: string
    avatar: string | null
    skills: string[]
    completedTasks: number
    rating: number
    totalEarned: number
  }
}

interface AuthError {
  message: string
  field?: 'username' | 'password' | 'email' | 'general'
}

interface AuthResult {
  success: boolean
  error?: AuthError
  user?: User
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          localStorage.removeItem('token')
        }
      } catch (error) {
        console.error('Error loading user:', error)
        localStorage.removeItem('token')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        setError(null)
        return { success: true, user: data.user }
      } else {
        const error = {
          message: data.message || data.error || 'Login failed',
          field: data.field || 'general' as const
        }
        setError(error)
        return { success: false, error }
      }
    } catch (err) {
      const error = { 
        message: 'Network error. Please check your connection.', 
        field: 'general' as const 
      }
      setError(error)
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (username: string, password: string, email: string): Promise<AuthResult> => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        setError(null)
        return { success: true, user: data.user }
      } else {
        let error: AuthError

        if (data.details && Array.isArray(data.details)) {
          const firstError = data.details[0]
          error = {
            message: firstError.message,
            field: firstError.path[0] as any
          }
        } else {
          error = {
            message: data.error || 'Registration failed',
            field: data.field || 'general' as const
          }
        }

        setError(error)
        return { success: false, error }
      }
    } catch (err) {
      const error = { 
        message: 'Network error. Please check your connection.', 
        field: 'general' as const 
      }
      setError(error)
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<Pick<User, 'walletAddress'>>): Promise<AuthResult> => {
    if (!user) {
      return { success: false, error: { message: 'Not authenticated' } }
    }

    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return { success: true, user: data.user }
      } else {
        const error = { 
          message: data.error || 'Failed to update profile', 
          field: 'general' as const 
        }
        setError(error)
        return { success: false, error }
      }
    } catch (err) {
      const error = { 
        message: 'Network error. Please try again.', 
        field: 'general' as const 
      }
      setError(error)
      return { success: false, error }
    }
  }, [user])

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).catch(() => {
        })
      }
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      setError(null)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const refreshAuth = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return false

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return true
      } else {
        localStorage.removeItem('token')
        setUser(null)
        return false
      }
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
      return false
    }
  }, [])

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    
    login,
    register,
    logout,
    updateProfile,
    clearError,
    refreshAuth
  }
}