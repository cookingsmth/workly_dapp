import { useState, useRef, useEffect } from 'react'
import { Modal } from './Modal'
import { useAuth } from '../hooks/useAuth'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mockCode, setMockCode] = useState('')
  
  const { register, error, clearError } = useAuth()
  const inputRefs = useRef<HTMLInputElement[]>([])

  // Генерируем mock код при переходе к верификации
  useEffect(() => {
    if (step === 'verify') {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      setMockCode(code)
      console.log('🔐 Verification code:', code) // В консоли для тестирования
    }
  }, [step])

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      // Можно показать ошибку через ваш error state
      return
    }

    setIsSubmitting(true)
    
    // Имитация отправки email
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setStep('verify')
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const enteredCode = verificationCode.join('')
    
    if (enteredCode !== mockCode) {
      // Показать ошибку
      console.log('❌ Wrong verification code')
      return
    }

    setIsSubmitting(true)
    const result = await register(username, password, email)
    
    if (result.success) {
      // Очищаем форму и принудительно обновляем страницу
      handleClose()
      window.location.href = '/'
    }
    setIsSubmitting(false)
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return
    
    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    // Автоматический переход к следующему полю
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    setStep('register')
    setUsername('')
    setPassword('')
    setEmail('')
    setVerificationCode(['', '', '', '', '', ''])
    setMockCode('')
    clearError()
    onClose()
  }

  const isRegisterFormValid = username.trim() && password && email.trim()
  const isCodeComplete = verificationCode.every(digit => digit !== '')

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={step === 'register' ? 'Create Account' : 'Verify Email'} 
      size="sm"
    >
      {step === 'register' ? (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
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

          <div>
            <input
              type="email"
              className={`w-full p-3 bg-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                error?.field === 'email' 
                  ? 'focus:ring-red-500/50 ring-2 ring-red-500/50' 
                  : 'focus:ring-purple-500/50'
              }`}
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            {error?.field === 'email' && (
              <p className="text-sm text-red-400 mt-1">{error.message}</p>
            )}
          </div>

          {error?.field === 'general' && (
            <p className="text-sm text-red-400 text-center">{error.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isRegisterFormValid}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {isSubmitting ? 'Sending Code...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
            <p className="text-gray-400 text-sm">
              We sent a 6-digit verification code to<br />
              <span className="text-white font-medium">{email}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Check console for the code (demo mode)
            </p>
          </div>

          <form onSubmit={handleVerificationSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    if (el) inputRefs.current[index] = el
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors"
                  disabled={isSubmitting}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !isCodeComplete}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
              </button>

              <button
                type="button"
                onClick={() => setStep('register')}
                disabled={isSubmitting}
                className="w-full py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                ← Back to Registration
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  )
}