import { useState, useEffect, useCallback } from 'react'

interface User {
  username: string
}

interface AuthError {
  message: string
  field?: 'username' | 'password' | 'general'
}

interface AuthResult {
  success: boolean
  error?: AuthError
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  // Загружаем пользователя при монтировании
  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed && parsed.username) {
            setUser({ username: parsed.username })
          }
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error)
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  // Валидация данных
  const validateCredentials = (username: string, password: string): AuthError | null => {
    if (!username.trim()) {
      return { message: 'Username is required', field: 'username' }
    }
    if (username.length < 3) {
      return { message: 'Username must be at least 3 characters', field: 'username' }
    }
    if (!password) {
      return { message: 'Password is required', field: 'password' }
    }
    if (password.length < 6) {
      return { message: 'Password must be at least 6 characters', field: 'password' }
    }
    return null
  }

  // Логин
  const login = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    setError(null)
    
    // Валидация
    const validationError = validateCredentials(username, password)
    if (validationError) {
      setError(validationError)
      return { success: false, error: validationError }
    }

    try {
      // Имитируем задержку API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const found = users.find((u: any) => 
        u.username === username.trim() && u.password === password
      )
      
      if (found) {
        const userData = { username: username.trim() }
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        setError(null)
        return { success: true }
      } else {
        const error = { message: 'Invalid username or password', field: 'general' as const }
        setError(error)
        return { success: false, error }
      }
    } catch (err) {
      const error = { message: 'Login failed. Please try again.', field: 'general' as const }
      setError(error)
      return { success: false, error }
    }
  }, [])

  // Регистрация
  const register = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    setError(null)
    
    // Валидация
    const validationError = validateCredentials(username, password)
    if (validationError) {
      setError(validationError)
      return { success: false, error: validationError }
    }

    try {
      // Имитируем задержку API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const trimmedUsername = username.trim()
      
      // Проверяем, существует ли пользователь
      const existingUser = users.find((u: any) => u.username === trimmedUsername)
      if (existingUser) {
        const error = { message: 'Username already exists', field: 'username' as const }
        setError(error)
        return { success: false, error }
      }
      
      // Создаем нового пользователя
      const newUser = { username: trimmedUsername, password }
      const updatedUsers = [...users, newUser]
      localStorage.setItem('users', JSON.stringify(updatedUsers))
      
      // Логиним пользователя
      const userData = { username: trimmedUsername }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      setError(null)
      
      return { success: true }
    } catch (err) {
      const error = { message: 'Registration failed. Please try again.', field: 'general' as const }
      setError(error)
      return { success: false, error }
    }
  }, [])

  // Выход
  const logout = useCallback(() => {
    localStorage.removeItem('user')
    setUser(null)
    setError(null)
  }, [])

  // Очистка ошибок
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Состояние
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    
    // Методы
    login,
    register,
    logout,
    clearError
  }
}