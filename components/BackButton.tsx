import { useRouter } from 'next/router'
import { Button } from './ui'
import clsx from 'clsx'

interface BackButtonProps {
  className?: string
  label?: string
  href?: string
  variant?: 'fixed' | 'inline'
}

export default function BackButton({ 
  className, 
  label = 'Back', 
  href,
  variant = 'fixed' 
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  if (variant === 'fixed') {
    return (
      <div className={clsx(
        'fixed top-6 left-6 z-50',
        className
      )}>
        <button
          onClick={handleBack}
          className="group flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-300 shadow-lg"
        >
          <svg 
            className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className="font-medium">{label}</span>
        </button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleBack}
      variant="glass"
      size="md"
      icon={
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
            clipRule="evenodd" 
          />
        </svg>
      }
      className={className}
    >
      {label}
    </Button>
  )
}