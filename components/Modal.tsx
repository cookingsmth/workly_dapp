import { ReactNode, FC } from 'react'
import clsx from 'clsx'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
  className?: string
  showCloseButton?: boolean
}

export const Modal: FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  size = 'md', 
  children,
  className,
  showCloseButton = true
}) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-lg animate-fadeInBackdrop"
      onClick={onClose}
    >
      <div 
        className={clsx(
          "relative glass-morphism p-8 rounded-3xl w-full shadow-2xl text-white animate-fadeInModal transform hover:scale-[1.02] transition-all duration-300",
          sizeClasses[size],
          className
        )} 
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-6 text-gray-400 hover:text-white text-2xl transition-all duration-200 hover:rotate-90"
          >
            ✕
          </button>
        )}
        
        {title && (
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {title}
          </h2>
        )}
        
        {children}
      </div>
    </div>
  )
}