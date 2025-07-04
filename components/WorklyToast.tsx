// components/WorklyToast.tsx - Уведомления в стиле Workly
import { useState, useEffect } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

// Глобальный стейт для тостов
let toastState: Toast[] = []
let setToastState: ((toasts: Toast[]) => void) | null = null

// Функция для показа уведомлений (можно использовать в любом месте)
export const showWorklyToast = (message: string, type: Toast['type'] = 'info') => {
  const id = Date.now().toString()
  const newToast: Toast = { id, message, type }
  
  toastState = [...toastState, newToast]
  if (setToastState) {
    setToastState(toastState)
  }

  // Автоматически убираем через 4 секунды
  setTimeout(() => {
    toastState = toastState.filter(toast => toast.id !== id)
    if (setToastState) {
      setToastState(toastState)
    }
  }, 4000)
}

// Компонент контейнера уведомлений
export const WorklyToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    setToastState = setToasts
    return () => {
      setToastState = null
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3">
      {toasts.map((toast) => (
        <WorklyToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// Отдельный компонент уведомления
const WorklyToastItem = ({ toast }: { toast: Toast }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Анимация появления
    setTimeout(() => setIsVisible(true), 50)
  }, [])

  const getToastConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          gradient: 'from-green-500/20 via-emerald-500/20 to-green-600/20',
          border: 'border-green-400/40',
          glow: 'shadow-green-500/25',
          icon: (
            <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ),
          emoji: '🚀'
        }
      case 'error':
        return {
          gradient: 'from-red-500/20 via-pink-500/20 to-red-600/20',
          border: 'border-red-400/40',
          glow: 'shadow-red-500/25',
          icon: (
            <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ),
          emoji: '⚠️'
        }
      case 'warning':
        return {
          gradient: 'from-yellow-500/20 via-orange-500/20 to-yellow-600/20',
          border: 'border-yellow-400/40',
          glow: 'shadow-yellow-500/25',
          icon: (
            <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          ),
          emoji: '💡'
        }
      default: // info
        return {
          gradient: 'from-blue-500/20 via-cyan-500/20 to-blue-600/20',
          border: 'border-blue-400/40',
          glow: 'shadow-blue-500/25',
          icon: (
            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ),
          emoji: 'ℹ️'
        }
    }
  }

  const config = getToastConfig()

  return (
    <div
      className={`
        transform transition-all duration-500 ease-out
        ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        bg-gradient-to-br ${config.gradient}
        backdrop-blur-md border ${config.border}
        rounded-2xl p-4 shadow-xl ${config.glow}
        min-w-[300px] max-w-[400px]
        hover:scale-105 hover:shadow-2xl
        cursor-pointer group
        relative overflow-hidden
      `}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      
      {/* Content */}
      <div className="relative z-10 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="text-white font-medium text-sm leading-relaxed">
            {toast.message}
          </p>
        </div>

        {/* Emoji */}
        <div className="flex-shrink-0 text-lg opacity-80 group-hover:scale-110 transition-transform duration-200">
          {config.emoji}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-white/20 to-white/40 w-full">
        <div 
          className="h-full bg-gradient-to-r from-white/60 to-white/80 animate-[shrink_4000ms_linear_forwards]"
          style={{
            animation: 'shrink 4000ms linear forwards'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}