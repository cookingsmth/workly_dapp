import { useState } from 'react'
import { Modal } from './Modal'
import { useAuth } from '../hooks/useAuth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login, error, clearError } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    const result = await login(username, password)
    
    if (result.success) {
      // Очищаем форму и закрываем модал
      setUsername('')
      setPassword('')
      onClose()
    }
    setIsSubmitting(false)
  }

  const handleClose = () => {
    if (isSubmitting) return
    setUsername('')
    setPassword('')
    clearError()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Login" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            className={`w-full p-3 bg-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
              error?.field === 'username' 
                ? 'focus:ring-red-500/50 ring-2 ring-red-500/50' 
                : 'focus:ring-purple-500/50'
            }`}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
          />
          {error?.field === 'username' && (
            <p className="text-sm text-red-400 mt-1">{error.message}</p>
          )}
        </div>

        <div>
          <input
            type="password"
            className={`w-full p-3 bg-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
              error?.field === 'password' 
                ? 'focus:ring-red-500/50 ring-2 ring-red-500/50' 
                : 'focus:ring-purple-500/50'
            }`}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
          {error?.field === 'password' && (
            <p className="text-sm text-red-400 mt-1">{error.message}</p>
          )}
        </div>

        {error?.field === 'general' && (
          <p className="text-sm text-red-400 text-center">{error.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !username.trim() || !password}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {isSubmitting && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          )}
          {isSubmitting ? 'Signing In...' : 'Login'}
        </button>
      </form>
    </Modal>
  )
}