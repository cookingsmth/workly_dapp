import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MessageCircle, Bell, Settings } from 'lucide-react'

export default function ProfileWidget() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  // Состояние кошелька
  const [wallet, setWallet] = useState<any>(null)
  const [walletLoading, setWalletLoading] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Закрывать меню при смене роута
  useEffect(() => {
    setOpen(false)
  }, [router.pathname])

  // Загрузка информации о кошельке
  useEffect(() => {
    if (user) {
      fetchWalletInfo()
    }
  }, [user])

  const fetchWalletInfo = async () => {
    if (!user) return
    
    setWalletLoading(true)
    try {
      const response = await fetch('/api/wallet/info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWallet(data.wallet)
      } else {
        const errorData = await response.json()
        if (errorData.needsCreation) {
          // Автоматически создаем кошелек
          await createWallet()
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error)
    } finally {
      setWalletLoading(false)
    }
  }

  const createWallet = async () => {
    try {
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWallet(data.wallet)
      }
    } catch (error) {
      console.error('Failed to create wallet:', error)
    }
  }

  const formatBalance = (balance: number) => {
    if (balance === 0) return '0'
    if (balance < 0.001) return '<0.001'
    return balance.toFixed(3)
  }

  const getTotalBalance = () => {
    if (!wallet) return 0
    return wallet.solBalance + wallet.usdtBalance + wallet.usdcBalance
  }

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    setOpen(false)
    // Принудительно обновляем страницу после logout
    window.location.href = '/'
  }

  return (
    <div ref={ref} className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white/20 transition-all duration-200 text-sm text-white shadow-lg border border-white/10"
      >
        <div className="relative">
          <span className="bg-gradient-to-br from-purple-500 to-purple-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold uppercase text-sm shadow-md">
            {user.username[0]}
          </span>
        </div>
        
        <div className="flex flex-col items-start">
          <span className="font-medium">{user.username}</span>
          <span className="text-xs text-white/60">{user.email}</span>
        </div>
        
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-white/80" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-3 bg-[#1a1d2e] border border-white/10 rounded-xl shadow-2xl p-2 w-52 space-y-1 backdrop-blur-sm"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-white font-medium">{user.username}</p>
              <p className="text-white/60 text-sm">{user.email}</p>
            </div>

            {/* Wallet Info */}
            {wallet && (
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <img src="/solana.png" alt="SOL" className="w-5 h-5" />
                      <span className="text-green-400 font-semibold ml-2">
                        {formatBalance(wallet.solBalance)}
                      </span>
                    </div>
                    {wallet.worklyBalance >   0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-lg">🚀</span>
                        <span className="text-purple-400 font-semibold">
                          {formatBalance(wallet.worklyBalance)}
                        </span>
                      </div>
                    )}
                  </div>
                  {walletLoading && (
                    <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                  )}
                </div>
                
                {/* WORKLY Token Benefits */}
                {wallet.worklyBalance >= 100 && (
                  <div className="mt-1 text-xs text-purple-400">
                    {wallet.worklyBalance >= 1000 ? '50% fee discount' :
                     wallet.worklyBalance >= 500 ? '30% fee discount' :
                     '15% fee discount'} active
                  </div>
                )}
              </div>
            )}

            {/* Navigation Links */}
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              onClick={() => setOpen(false)}
            >
              <span className="text-blue-400">🏠</span>
              Home
            </Link>
            
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              onClick={() => setOpen(false)}
            >
              <span className="text-green-400">👤</span>
              Profile
            </Link>
            
            <Link
              href="/tasks"
              className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              onClick={() => setOpen(false)}
            >
              <span className="text-purple-400">📋</span>
              Tasks
            </Link>

            {/* Wallet Link */}
            <Link
              href="/wallet"
              className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              onClick={() => setOpen(false)}
            >
              <span className="text-orange-400">💰</span>
              My Wallet
              {wallet && getTotalBalance() > 0 && (
                <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                  {formatBalance(getTotalBalance())}
                </span>
              )}
            </Link>

            <Link
              href="/notifications"
              className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              onClick={() => setOpen(false)}
            >
              <Bell className="w-4 h-4 text-yellow-400" />
              Notifications
            </Link>

            <Link
              href="/messages"
              className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              onClick={() => setOpen(false)}
            >
              <MessageCircle className="w-4 h-4 text-blue-400" />
              Messages
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              onClick={() => setOpen(false)}
            >
              <Settings className="w-4 h-4 text-gray-400" />
              Settings
            </Link>

            {/* Divider */}
            <div className="border-t border-white/10 my-1"></div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
            >
              <span className="text-red-400">🔓</span>
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}