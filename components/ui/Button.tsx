import { forwardRef, ReactNode } from 'react'
import clsx from 'clsx'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'gradient' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  disabled?: boolean
  className?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  glow?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  glow = false,
  ...props
}, ref) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent overflow-hidden group transform-gpu'

  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 hover:from-purple-700 hover:via-purple-600 hover:to-blue-700 text-white hover:scale-105 focus:ring-purple-500/50 shadow-xl hover:shadow-purple-500/40',
    secondary: 'bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/15 text-white border-2 border-white/20 hover:border-white/40 hover:scale-105 focus:ring-white/50 backdrop-blur-sm',
    success: 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white hover:scale-105 focus:ring-green-500/50 shadow-xl hover:shadow-green-500/40',
    danger: 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:via-rose-600 hover:to-red-700 text-white hover:scale-105 focus:ring-red-500/50 shadow-xl hover:shadow-red-500/40',
    warning: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white hover:scale-105 focus:ring-amber-500/50 shadow-xl hover:shadow-amber-500/40',
    gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white hover:scale-110 focus:ring-purple-500/50 shadow-2xl hover:shadow-purple-500/50',
    ghost: 'bg-transparent hover:bg-white/10 text-white border border-white/20 hover:border-white/40 hover:scale-105 focus:ring-white/50',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:scale-105 focus:ring-white/50'
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3',
    xl: 'px-10 py-5 text-xl gap-4'
  }

  const glowEffects = {
    primary: 'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-purple-600 before:to-blue-600 before:opacity-0 hover:before:opacity-20 before:blur-xl before:-z-10',
    gradient: 'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-purple-500 before:via-pink-500 before:to-blue-500 before:opacity-0 hover:before:opacity-30 before:blur-xl before:-z-10',
    success: 'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-green-500 before:to-emerald-500 before:opacity-0 hover:before:opacity-20 before:blur-xl before:-z-10'
  }

  const isDisabled = disabled || isLoading

  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    glow && (glowEffects[variant as keyof typeof glowEffects] || glowEffects.primary),
    isDisabled && 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none pointer-events-none',
    'before:transition-all before:duration-300',
    className
  )

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={classes}
      {...props}
    >
      {/* Shine */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      {/* Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Content */}
      <div className={clsx('relative z-10 flex items-center justify-center', isLoading && 'opacity-0')}>
        {!isLoading && icon && iconPosition === 'left' && (
          <span className="transition-transform group-hover:scale-110">{icon}</span>
        )}
        <span className="relative">{children}</span>
        {!isLoading && icon && iconPosition === 'right' && (
          <span className="transition-transform group-hover:scale-110">{icon}</span>
        )}
      </div>
    </button>
  )
})

Button.displayName = 'Button'
export default Button
