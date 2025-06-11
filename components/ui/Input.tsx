import { forwardRef, useState } from 'react'
import clsx from 'clsx'

interface InputProps {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  className?: string
  inputClassName?: string
  disabled?: boolean
  required?: boolean
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea'
  placeholder?: string
  value?: string | number
  onChange?: (value: string) => void
  rows?: number
  glow?: boolean
  floating?: boolean
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  className,
  inputClassName,
  disabled,
  required,
  type = 'text',
  placeholder,
  value,
  onChange,
  rows = 3,
  glow = false,
  floating = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value !== undefined && value !== ''

  const baseInputClasses = clsx(
    'w-full bg-gradient-to-r from-white/10 to-white/5 text-white placeholder-gray-400 rounded-2xl border-2 transition-all duration-300 backdrop-blur-sm',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
    glow && 'focus:shadow-2xl',
    error 
      ? 'border-red-500/50 focus:border-red-400 focus:ring-red-500/50 bg-red-500/5' 
      : 'border-white/20 focus:border-purple-400/60 focus:ring-purple-500/30 hover:border-white/30',
    icon ? (iconPosition === 'left' ? 'pl-12 pr-4' : 'pl-4 pr-12') : 'px-4',
    type === 'textarea' ? 'py-4' : 'py-4',
    disabled && 'opacity-50 cursor-not-allowed bg-gray-500/10',
    floating && 'pt-6 pb-2'
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
  }

  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)

  return (
    <div className={className}>
      <div className="relative group">
        {/* Glow effect */}
        {glow && (isFocused || hasValue) && (
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 transition-opacity duration-300"></div>
        )}
        
        {/* Icon */}
        {icon && (
          <div className={clsx(
            'absolute top-1/2 -translate-y-1/2 z-10 text-gray-400 transition-colors group-focus-within:text-purple-400',
            iconPosition === 'left' ? 'left-4' : 'right-4'
          )}>
            {icon}
          </div>
        )}
        
        {/* Floating label */}
        {floating && label && (
          <label className={clsx(
            'absolute left-4 transition-all duration-300 pointer-events-none z-10',
            (isFocused || hasValue) 
              ? 'top-2 text-xs text-purple-400 font-medium' 
              : 'top-1/2 -translate-y-1/2 text-gray-400'
          )}>
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        
        {/* Regular label */}
        {!floating && label && (
          <label className="block text-sm font-bold text-gray-300 mb-3">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        
        {/* Input/Textarea */}
        {type === 'textarea' ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={floating ? '' : placeholder}
            disabled={disabled}
            rows={rows}
            className={clsx(baseInputClasses, 'resize-none', inputClassName)}
            {...props}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={floating ? '' : placeholder}
            disabled={disabled}
            className={clsx(baseInputClasses, inputClassName)}
            {...props}
          />
        )}
        
        {/* Animated border */}
        <div className={clsx(
          'absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 transition-opacity duration-300 pointer-events-none',
          (isFocused && !error) && 'opacity-20'
        )}></div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-1 duration-300">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Hint */}
      {hint && !error && (
        <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {hint}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
