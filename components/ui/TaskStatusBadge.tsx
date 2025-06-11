import clsx from 'clsx'

interface TaskStatusBadgeProps {
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'waiting_payment' | 'funded'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export const TaskStatusBadge = ({ status, size = 'md', animated = true }: TaskStatusBadgeProps) => {
  const statusConfig = {
    waiting_payment: {
      gradient: 'from-amber-400 via-orange-400 to-amber-400',
      bg: 'from-amber-500/20 via-orange-500/20 to-amber-500/20',
      border: 'border-amber-400/40',
      text: 'text-amber-100',
      label: 'Waiting Payment',
      icon: '⏳',
      glow: 'shadow-amber-500/30'
    },
    open: {
      gradient: 'from-green-400 via-emerald-400 to-green-400',
      bg: 'from-green-500/20 via-emerald-500/20 to-green-500/20',
      border: 'border-green-400/40',
      text: 'text-green-100',
      label: 'Open',
      icon: '🟢',
      glow: 'shadow-green-500/30'
    },
    funded: {
      gradient: 'from-blue-400 via-cyan-400 to-blue-400',
      bg: 'from-blue-500/20 via-cyan-500/20 to-blue-500/20',
      border: 'border-blue-400/40',
      text: 'text-blue-100',
      label: 'Funded',
      icon: '💰',
      glow: 'shadow-blue-500/30'
    },
    in_progress: {
      gradient: 'from-purple-400 via-indigo-400 to-purple-400',
      bg: 'from-purple-500/20 via-indigo-500/20 to-purple-500/20',
      border: 'border-purple-400/40',
      text: 'text-purple-100',
      label: 'In Progress',
      icon: '🔄',
      glow: 'shadow-purple-500/30'
    },
    completed: {
      gradient: 'from-emerald-400 via-teal-400 to-emerald-400',
      bg: 'from-emerald-500/20 via-teal-500/20 to-emerald-500/20',
      border: 'border-emerald-400/40',
      text: 'text-emerald-100',
      label: 'Completed',
      icon: '✅',
      glow: 'shadow-emerald-500/30'
    },
    cancelled: {
      gradient: 'from-red-400 via-rose-400 to-red-400',
      bg: 'from-red-500/20 via-rose-500/20 to-red-500/20',
      border: 'border-red-400/40',
      text: 'text-red-100',
      label: 'Cancelled',
      icon: '❌',
      glow: 'shadow-red-500/30'
    }
  }

  const config = statusConfig[status]
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5'
  }

  return (
    <div className="relative group">
      {/* Glow effect */}
      <div className={clsx(
        'absolute inset-0 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        config.glow,
        `bg-gradient-to-r ${config.gradient}`
      )}></div>
      
      <span className={clsx(
        'relative inline-flex items-center font-bold rounded-full border-2 backdrop-blur-sm transition-all duration-300',
        `bg-gradient-to-r ${config.bg}`,
        config.border,
        config.text,
        sizeClasses[size],
        animated && 'hover:scale-110 hover:shadow-lg transform-gpu'
      )}>
        <span className={clsx(
          'flex-shrink-0',
          animated && status === 'waiting_payment' && 'animate-pulse',
          animated && status === 'in_progress' && 'animate-spin'
        )}>
          {config.icon}
        </span>
        <span className="font-bold">{config.label}</span>
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-full"></div>
      </span>
    </div>
  )
}