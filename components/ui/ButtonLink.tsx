import Link from 'next/link'
import clsx from 'clsx'
import { ReactNode } from 'react'

interface Props {
  href: string
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'gradient'
}

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-white/10 text-white hover:bg-white/20',
  gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white hover:opacity-90'
}

export default function ButtonLink({ href, children, className, variant = 'primary' }: Props) {
  return (
    <Link
      href={href}
      className={clsx(
        'inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold transition-all duration-300',
        variants[variant],
        className
      )}
    >
      {children}
    </Link>
  )
}
