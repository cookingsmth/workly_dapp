React.createElement('style', {
            dangerouslySetInnerHTML: {
              __html: `
                .scroll-container::-webkit-scrollbar {
                  display: none;
                }
                .scroll-container {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `
            }
          })
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Wallet, 
  Copy, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Rocket,
  Shield,
  Target,
  Clock,
  DollarSign,
  FileText,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  Upload,
  X,
  File,
  Image,
  Paperclip,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'

// Solana wallet generation and monitoring functionality
const generateSolanaWallet = () => {
  // В реальном приложении используйте @solana/web3.js
  const mockPrivateKey = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')
  const mockPublicKey = Array.from({length: 44}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('')
  
  return {
    publicKey: mockPublicKey,
    privateKey: mockPrivateKey,
    address: mockPublicKey
  }
}

const monitorWalletBalance = async (address, expectedAmount, tokenType, onPaymentReceived, onProgressUpdate) => {
  // Симуляция мониторинга блокчейна
  console.log(`Monitoring wallet ${address} for ${expectedAmount} ${tokenType}`)
  
  // В реальном приложении здесь был бы запрос к RPC Solana
  return new Promise((resolve) => {
    let checkCount = 0
    const maxChecks = 8 // Минимум 8 проверок = ~24 секунды
    
    const checkInterval = setInterval(async () => {
      checkCount++
      console.log(`Balance check ${checkCount}/${maxChecks}...`)
      
      // Обновляем прогресс
      const progress = (checkCount / maxChecks) * 100
      const remainingTime = (maxChecks - checkCount) * 3
      
      if (onProgressUpdate) {
        onProgressUpdate({
          currentCheck: checkCount,
          totalChecks: maxChecks,
          progress: progress,
          estimatedTime: remainingTime
        })
      }
      
      // Первые 5 проверок всегда неуспешные (минимум 15 секунд)
      // Затем 30% шанс успеха на каждую проверку
      const canSucceed = checkCount >= 5
      const simulatedPayment = canSucceed && Math.random() > 0.7
      
      if (simulatedPayment) {
        clearInterval(checkInterval)
        console.log('Payment received after', checkCount * 3, 'seconds!')
        onPaymentReceived({
          amount: expectedAmount,
          token: tokenType,
          txHash: 'mock_transaction_hash_' + Date.now(),
          timestamp: new Date().toISOString(),
          confirmations: Math.floor(Math.random() * 50) + 10
        })
        resolve(true)
      } else if (checkCount >= maxChecks) {
        // Если дошли до максимума проверок, всё равно "получаем" платёж
        clearInterval(checkInterval)
        console.log('Payment received after maximum wait time!')
        onPaymentReceived({
          amount: expectedAmount,
          token: tokenType,
          txHash: 'mock_transaction_hash_' + Date.now(),
          timestamp: new Date().toISOString(),
          confirmations: Math.floor(Math.random() * 50) + 10
        })
        resolve(true)
      }
    }, 3000) // Проверка каждые 3 секунды
    
    // Таймаут через 2 минуты (максимум)
    setTimeout(() => {
      clearInterval(checkInterval)
      if (checkCount < maxChecks) {
        console.log('Payment monitoring timeout')
        resolve(false)
      }
    }, 120000)
  })
}

const SUPPORTED_TOKENS = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    requiresExtraSOL: false,
    solFeeAmount: 0,
    description: 'Native Solana token',
    icon: React.createElement(Zap, { className: "w-6 h-6" }),
    gradient: 'from-purple-500 to-violet-600',
    shadowColor: 'shadow-purple-500/50',
    decimals: 9
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    requiresExtraSOL: true,
    solFeeAmount: 0.01,
    description: 'Stablecoin pegged to USD',
    icon: React.createElement(DollarSign, { className: "w-6 h-6 text-green-400" }),
    gradient: 'from-green-500 to-emerald-600',
    shadowColor: 'shadow-green-500/50',
    decimals: 6
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    requiresExtraSOL: true,
    solFeeAmount: 0.01,
    description: 'Regulated USD stablecoin',
    icon: React.createElement('div', { className: "w-6 h-6 rounded-full bg-blue-500" }),
    gradient: 'from-blue-500 to-cyan-600',
    shadowColor: 'shadow-blue-500/50',
    decimals: 6
  }
}

const GlassCard = function({ children, className = '', variant = 'default' }) {
  const variants = {
    default: 'bg-slate-900/80 border-slate-700/50 backdrop-blur-2xl shadow-2xl',
    purple: 'bg-purple-900/30 border-purple-400/30 backdrop-blur-2xl shadow-2xl shadow-purple-500/20',
    blue: 'bg-blue-900/30 border-blue-400/30 backdrop-blur-2xl shadow-2xl shadow-blue-500/20',
    green: 'bg-emerald-900/30 border-emerald-400/30 backdrop-blur-2xl shadow-2xl shadow-emerald-500/20',
    amber: 'bg-amber-900/30 border-amber-400/30 backdrop-blur-2xl shadow-2xl shadow-amber-500/20'
  }

  return React.createElement(motion.div,
    {
      className: `relative backdrop-blur-xl border rounded-3xl ${variants[variant]} ${className}`,
      whileHover: { scale: className.includes('overflow-visible') ? 1 : 1.02 },
      transition: { duration: 0.2 }
    },
    React.createElement('div', { className: "absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl" }),
    React.createElement('div', { className: "relative" }, children)
  )
}

const EscrowWalletDisplay = function({ wallet, expectedAmount, token, onPaymentReceived, isMonitoring }) {
  const [copied, setCopied] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('waiting') // waiting, monitoring, received, timeout
  const [scanProgress, setScanProgress] = useState(0)
  const [currentCheck, setCurrentCheck] = useState(0)
  const [totalChecks, setTotalChecks] = useState(8)
  const [estimatedTime, setEstimatedTime] = useState(0)

  const copyToClipboard = async function(text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  useEffect(() => {
    if (isMonitoring && wallet && expectedAmount) {
      setPaymentStatus('monitoring')
      setScanProgress(0)
      setCurrentCheck(0)
      
      const handleProgressUpdate = (progressData) => {
        setCurrentCheck(progressData.currentCheck)
        setTotalChecks(progressData.totalChecks)
        setScanProgress(progressData.progress)
        setEstimatedTime(progressData.estimatedTime)
      }
      
      monitorWalletBalance(wallet.address, expectedAmount, token, (paymentData) => {
        setPaymentStatus('received')
        setScanProgress(100)
        onPaymentReceived(paymentData)
      }, handleProgressUpdate).then((success) => {
        if (!success && paymentStatus === 'monitoring') {
          setPaymentStatus('timeout')
          setScanProgress(0)
        }
      })
    }
  }, [isMonitoring, wallet, expectedAmount, token, onPaymentReceived])

  if (!wallet) return null

  return React.createElement('div', { className: "space-y-4" },
    // Статус платежа
    React.createElement(GlassCard, { 
      variant: paymentStatus === 'received' ? 'green' : paymentStatus === 'monitoring' ? 'blue' : 'purple',
      className: "p-4" 
    },
      React.createElement('div', { className: "flex items-center justify-between" },
        React.createElement('div', { className: "flex items-center gap-3" },
          React.createElement('div', { 
            className: `w-10 h-10 rounded-full flex items-center justify-center ${
              paymentStatus === 'received' ? 'bg-green-500' : 
              paymentStatus === 'monitoring' ? 'bg-blue-500' : 'bg-purple-500'
            }` 
          },
            paymentStatus === 'received' ? React.createElement(CheckCircle, { className: "w-6 h-6 text-white" }) :
            paymentStatus === 'monitoring' ? React.createElement(motion.div, {
              animate: { rotate: 360 },
              transition: { duration: 2, repeat: Infinity, ease: "linear" }
            }, React.createElement(RefreshCw, { className: "w-6 h-6 text-white" })) :
            React.createElement(Clock, { className: "w-6 h-6 text-white" })
          ),
          React.createElement('div', null,
            React.createElement('h4', { className: "font-bold text-white" },
              paymentStatus === 'received' ? 'Payment Received!' :
              paymentStatus === 'monitoring' ? 'Monitoring Payment...' :
              paymentStatus === 'timeout' ? 'Payment Timeout' :
              'Waiting for Payment'
            ),
            React.createElement('p', { className: "text-sm opacity-80" },
              paymentStatus === 'received' ? 'Task will be published automatically' :
              paymentStatus === 'monitoring' ? 'Scanning blockchain for incoming transactions...' :
              paymentStatus === 'timeout' ? 'No payment detected - please try again' :
              'Send exact amount to the address below'
            )
          )
        ),
        React.createElement('div', { className: "text-right" },
          React.createElement('div', { className: "text-lg font-bold" }, `${expectedAmount} ${token}`),
          SUPPORTED_TOKENS[token]?.requiresExtraSOL && React.createElement('div', { className: "text-xs opacity-70" }, 
            `+ ${SUPPORTED_TOKENS[token].solFeeAmount} SOL fee`
          )
        )
      )
    ),

    // Прогресс-бар мониторинга
    paymentStatus === 'monitoring' && React.createElement(GlassCard, { variant: "blue", className: "p-6" },
      React.createElement('div', { className: "space-y-4" },
        React.createElement('div', { className: "flex items-center justify-between mb-3" },
          React.createElement('div', { className: "flex items-center gap-2" },
            React.createElement(motion.div, {
              animate: { rotate: 360 },
              transition: { duration: 2, repeat: Infinity, ease: "linear" }
            }, React.createElement(RefreshCw, { className: "w-5 h-5 text-blue-400" })),
            React.createElement('span', { className: "text-white font-semibold" }, "Scanning Blockchain")
          ),
          React.createElement('div', { className: "text-right" },
            React.createElement('div', { className: "text-sm text-blue-300 font-mono" }, 
              `Check ${currentCheck}/${totalChecks}`
            ),
            estimatedTime > 0 && React.createElement('div', { className: "text-xs text-slate-400" }, 
              `~${estimatedTime}s remaining`
            )
          )
        ),
        
        // Основной прогресс-бар
        React.createElement('div', { className: "relative" },
          React.createElement('div', { className: "w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700" },
            React.createElement(motion.div, {
              className: "h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 relative",
              initial: { width: "0%" },
              animate: { width: `${scanProgress}%` },
              transition: { duration: 0.5, ease: "easeOut" }
            },
              // Анимированный блик
              React.createElement(motion.div, {
                className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12",
                animate: { x: ['-100%', '200%'] },
                transition: { duration: 2, repeat: Infinity, ease: "linear" }
              })
            )
          ),
          React.createElement('div', { className: "absolute -top-6 left-0 right-0 flex justify-between text-xs text-slate-400" },
            React.createElement('span', null, "0%"),
            React.createElement('span', { className: "font-mono text-blue-300" }, `${Math.round(scanProgress)}%`),
            React.createElement('span', null, "100%")
          )
        ),
        
        // Детальная информация о сканировании
        React.createElement('div', { className: "grid grid-cols-3 gap-4 mt-4" },
          React.createElement('div', { className: "text-center" },
            React.createElement('div', { className: "text-xl font-bold text-blue-400" }, currentCheck),
            React.createElement('div', { className: "text-xs text-slate-400" }, "Scans Complete")
          ),
          React.createElement('div', { className: "text-center" },
            React.createElement('div', { className: "text-xl font-bold text-purple-400" }, 
              `${Math.round(scanProgress)}%`
            ),
            React.createElement('div', { className: "text-xs text-slate-400" }, "Progress")
          ),
          React.createElement('div', { className: "text-center" },
            React.createElement('div', { className: "text-xl font-bold text-cyan-400" }, 
              estimatedTime > 0 ? `${estimatedTime}s` : '--'
            ),
            React.createElement('div', { className: "text-xs text-slate-400" }, "Est. Time")
          )
        ),
        
        // Статус индикаторы
        React.createElement('div', { className: "flex items-center justify-center gap-4 mt-4" },
          [1, 2, 3, 4, 5].map(step => 
            React.createElement(motion.div, {
              key: step,
              className: `w-2 h-2 rounded-full ${currentCheck >= step ? 'bg-blue-400' : 'bg-slate-600'}`,
              animate: currentCheck >= step ? { 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              } : {},
              transition: { duration: 1.5, repeat: currentCheck >= step ? Infinity : 0 }
            })
          )
        ),
        
        // Текстовый статус
        React.createElement('div', { className: "text-center" },
          React.createElement('p', { className: "text-sm text-slate-300" },
            currentCheck < 3 ? "Connecting to Solana RPC nodes..." :
            currentCheck < 5 ? "Querying blockchain for transactions..." :
            currentCheck < 7 ? "Verifying payment details..." :
            "Finalizing confirmation..."
          )
        )
      )
    ),

    // Адрес эскроу кошелька
    React.createElement(GlassCard, { variant: "blue", className: "p-6" },
      React.createElement('div', { className: "flex items-center justify-between mb-4" },
        React.createElement('div', { className: "flex items-center gap-2" },
          React.createElement(Wallet, { className: "w-5 h-5 text-blue-400" }),
          React.createElement('span', { className: "text-sm font-medium text-slate-300" }, "Escrow Wallet Address")
        ),
        React.createElement('div', { className: "flex items-center gap-2" },
          React.createElement(motion.div, {
            className: "w-2 h-2 bg-green-400 rounded-full",
            animate: { opacity: [1, 0.5, 1] },
            transition: { duration: 2, repeat: Infinity }
          }),
          React.createElement('span', { className: "text-xs font-semibold text-green-400" }, "SECURED")
        )
      ),
      React.createElement('div', { className: "relative" },
        React.createElement('div', { className: "bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50" },
          React.createElement('div', { className: "flex items-center justify-between gap-4" },
            React.createElement('code', { className: "text-blue-300 font-mono text-sm break-all flex-1" }, wallet.address),
            React.createElement(motion.button, {
              onClick: () => copyToClipboard(wallet.address),
              className: "flex-shrink-0 p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl text-white shadow-lg hover:shadow-blue-500/50",
              whileHover: { scale: 1.05 },
              whileTap: { scale: 0.95 }
            },
              React.createElement(AnimatePresence, { mode: "wait" },
                copied ? 
                  React.createElement(motion.div, {
                    key: "check",
                    initial: { opacity: 0, scale: 0.5 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.5 }
                  }, React.createElement(Check, { className: "w-5 h-5" }))
                  :
                  React.createElement(motion.div, {
                    key: "copy",
                    initial: { opacity: 0, scale: 0.5 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.5 }
                  }, React.createElement(Copy, { className: "w-5 h-5" }))
              )
            )
          )
        ),
        copied && React.createElement(motion.div, {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -10 },
          className: "absolute -top-12 right-0 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium"
        }, "✓ Address Copied!")
      )
    ),

    // Информация о безопасности эскроу
    React.createElement(GlassCard, { variant: "green", className: "p-6" },
      React.createElement('div', { className: "flex items-start gap-3" },
        React.createElement(Shield, { className: "w-6 h-6 text-green-400 flex-shrink-0" }),
        React.createElement('div', null,
          React.createElement('div', { className: "font-medium text-green-300 mb-2" }, "Secure Escrow System"),
          React.createElement('div', { className: "text-sm text-green-200 space-y-1" },
            React.createElement('p', null, "• Funds are held by smart contract, not individuals"),
            React.createElement('p', null, "• Automatic release upon task completion"),
            React.createElement('p', null, "• Dispute resolution built-in"),
            React.createElement('p', null, "• No private key access needed")
          )
        )
      )
    )
  )
}

const ModernInput = function(props) {
  const {
    label,
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    required,
    icon: Icon,
    rows,
    className = ''
  } = props
  
  const [isFocused, setIsFocused] = useState(false)

  return React.createElement('div', { className: `space-y-2 ${className}` },
    label && React.createElement('label', { className: "flex items-center gap-2 text-sm font-medium text-slate-200" },
      Icon && React.createElement(Icon, { className: "w-4 h-4" }),
      React.createElement('span', null, label),
      required && React.createElement('span', { className: "text-red-400" }, "*")
    ),
    React.createElement('div', { className: "relative group" },
      React.createElement(motion.div, {
        className: "absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20",
        animate: { opacity: isFocused ? 0.4 : 0.2 },
        transition: { duration: 0.3 }
      }),
      type === 'textarea' ?
        React.createElement('textarea', {
          value: value || '',
          onChange: (e) => onChange(e.target.value),
          onFocus: () => setIsFocused(true),
          onBlur: () => setIsFocused(false),
          placeholder: placeholder,
          rows: rows || 4,
          className: "relative w-full px-4 py-3 bg-slate-900/70 backdrop-blur-xl border-2 border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300 resize-none"
        }) :
        React.createElement('input', {
          type: type,
          value: value || '',
          onChange: (e) => onChange(e.target.value),
          onFocus: () => setIsFocused(true),
          onBlur: () => setIsFocused(false),
          placeholder: placeholder,
          className: "relative w-full px-4 py-3 bg-slate-900/70 backdrop-blur-xl border-2 border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300"
        })
    ),
    error && React.createElement(motion.div, {
      initial: { opacity: 0, height: 0 },
      animate: { opacity: 1, height: 'auto' },
      exit: { opacity: 0, height: 0 },
      className: "flex items-center gap-2 text-red-400 text-sm"
    },
      React.createElement(AlertTriangle, { className: "w-4 h-4" }),
      React.createElement('span', null, error)
    )
  )
}

const ModernButton = function(props) {
  const {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    icon: Icon,
    onClick
  } = props

  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/25',
    secondary: 'bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25',
    ghost: 'hover:bg-white/5 text-white border border-white/10 hover:border-white/20'
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return React.createElement(motion.button, {
    onClick: onClick,
    disabled: disabled || isLoading,
    className: `relative inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all duration-300 backdrop-blur-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`,
    whileHover: { scale: disabled ? 1 : 1.02 },
    whileTap: { scale: disabled ? 1 : 0.98 }
  },
    React.createElement('div', { className: "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" }),
    React.createElement('div', { className: "relative flex items-center gap-2" },
      isLoading ? 
        React.createElement(motion.div, {
          className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full",
          animate: { rotate: 360 },
          transition: { duration: 1, repeat: Infinity, ease: "linear" }
        }) :
        Icon && React.createElement(Icon, { className: "w-5 h-5" }),
      React.createElement('span', { className: isLoading ? 'opacity-70' : '' }, children)
    )
  )
}

const TokenDropdown = function(props) {
  const { selected, setSelected } = props
  const [isOpen, setIsOpen] = useState(false)
  const tokens = Object.values(SUPPORTED_TOKENS)
  const selectedToken = SUPPORTED_TOKENS[selected]

  const handleTokenSelect = function(tokenSymbol) {
    console.log('Token selected:', tokenSymbol)
    setSelected(tokenSymbol)
    setIsOpen(false)
  }

  const handleToggle = function(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleBackdropClick = function(e) {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(false)
  }

  return React.createElement('div', { className: "relative", onClick: (e) => e.stopPropagation() },
    React.createElement(GlassCard, { className: "overflow-visible" },
      React.createElement('button', {
        type: "button",
        onClick: handleToggle,
        className: "w-full p-4 text-left hover:bg-white/5 transition-colors duration-300 focus:outline-none"
      },
        React.createElement('div', { className: "flex items-center justify-between" },
          React.createElement('div', { className: "flex items-center gap-3" },
            React.createElement('div', { className: `w-10 h-10 rounded-xl bg-gradient-to-r ${selectedToken.gradient} flex items-center justify-center shadow-lg ${selectedToken.shadowColor}` },
              selectedToken.icon
            ),
            React.createElement('div', null,
              React.createElement('div', { className: "font-semibold text-white" }, selected),
              React.createElement('div', { className: "text-sm text-slate-400" }, selectedToken.name)
            )
          ),
          React.createElement(motion.div, {
            animate: { rotate: isOpen ? 180 : 0 },
            transition: { duration: 0.2 }
          },
            React.createElement(ChevronDown, { className: "w-5 h-5 text-slate-400" })
          )
        )
      )
    ),
    isOpen && React.createElement(React.Fragment, null,
      React.createElement('div', {
        className: "fixed inset-0 z-[60]",
        onClick: handleBackdropClick
      }),
      React.createElement('div', { className: "absolute z-[70] mt-2 w-full" },
        React.createElement(motion.div, {
          initial: { opacity: 0, y: -10, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: -10, scale: 0.95 },
          transition: { duration: 0.2 }
        },
          React.createElement(GlassCard, { className: "p-2 shadow-2xl border-2 border-slate-600/50" },
            tokens.map((token, index) =>
              React.createElement('button', {
                key: token.symbol,
                type: "button",
                onClick: (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleTokenSelect(token.symbol)
                },
                className: `w-full p-3 rounded-xl transition-all duration-200 text-left focus:outline-none ${selected === token.symbol ? 'bg-purple-600/30 border border-purple-400/50' : 'hover:bg-white/10'}`
              },
                React.createElement('div', { className: "flex items-center justify-between" },
                  React.createElement('div', { className: "flex items-center gap-3" },
                    React.createElement('div', { className: `w-8 h-8 rounded-lg bg-gradient-to-r ${token.gradient} flex items-center justify-center shadow-md` },
                      token.icon
                    ),
                    React.createElement('div', null,
                      React.createElement('div', { className: `font-medium text-sm ${selected === token.symbol ? 'text-purple-200' : 'text-white'}` }, token.symbol),
                      React.createElement('div', { className: "text-xs text-slate-400" }, token.name)
                    )
                  ),
                  React.createElement('div', { className: "flex items-center gap-2" },
                    token.requiresExtraSOL && React.createElement('div', { className: "px-2 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full" },
                      React.createElement('span', { className: "text-xs font-medium text-amber-300" }, `+${token.solFeeAmount} SOL`)
                    ),
                    selected === token.symbol && React.createElement('div', { className: "w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center" },
                      React.createElement(CheckCircle, { className: "w-3 h-3 text-white" })
                    )
                  )
                )
              )
            )
          )
        )
      )
    ),
    selectedToken.requiresExtraSOL && React.createElement(motion.div, {
      initial: { opacity: 0, height: 0 },
      animate: { opacity: 1, height: 'auto' },
      exit: { opacity: 0, height: 0 },
      className: "mt-4"
    },
      React.createElement(GlassCard, { variant: "amber", className: "p-4" },
        React.createElement('div', { className: "flex items-start gap-3" },
          React.createElement(AlertTriangle, { className: "w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" }),
          React.createElement('div', null,
            React.createElement('div', { className: "font-medium text-amber-300 mb-1" }, "Extra SOL Required"),
            React.createElement('div', { className: "text-sm text-amber-200" }, `Additional ${selectedToken.solFeeAmount} SOL needed for transaction fees`)
          )
        )
      )
    )
  )
}

export default function CreateTaskModal(props) {
  const { isOpen = true, onClose, onCreate } = props
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [escrowWallet, setEscrowWallet] = useState(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [paymentReceived, setPaymentReceived] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    token: 'SOL',
    deadline: '',
    files: []
  })
  
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const handleEscape = function(event) {
      if (event.key === 'Escape' && isOpen) {
        onClose && onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return function() {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Генерация кошелька при переходе к шагу 2
  useEffect(() => {
    if (currentStep === 2 && !escrowWallet) {
      const wallet = generateSolanaWallet()
      setEscrowWallet(wallet)
      console.log('Generated escrow wallet:', wallet.address)
    }
  }, [currentStep, escrowWallet])

  // Автоматическое создание задания после получения платежа
  useEffect(() => {
    if (paymentReceived) {
      console.log('Payment received, auto-creating task...', paymentReceived)
      setTimeout(() => {
        handleAutoSubmit()
      }, 2000) // Задержка для показа успешного статуса
    }
  }, [paymentReceived])

  const validateForm = function() {
    const newErrors = {}
    
    if (!formData.title.trim()) newErrors.title = 'Task title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount required'
    if (!formData.deadline) newErrors.deadline = 'Deadline is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateField = function(field, value) {
    console.log(`Updating ${field} to:`, value)
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleNext = function() {
    if (validateForm()) setCurrentStep(2)
  }

  const handleStartMonitoring = function() {
    if (!escrowWallet || !formData.amount) {
      console.error('Missing wallet or amount for monitoring')
      return
    }
    
    setIsMonitoring(true)
    console.log('Starting payment monitoring...')
  }

  const handlePaymentReceived = function(payment) {
    console.log('Payment received callback:', payment)
    setPaymentReceived(payment)
    setIsMonitoring(false)
  }

  const handleAutoSubmit = async function() {
    setIsLoading(true)
    
    const taskData = {
      ...formData,
      status: 'open',
      reward: {
        amount: parseFloat(formData.amount),
        token: formData.token
      },
      escrow: {
        walletAddress: escrowWallet.address,
        payment: paymentReceived,
        secured: true
      },
      createdAt: new Date().toISOString(),
      id: 'task_' + Date.now()
    }
    
    // Симуляция создания задания
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('Task created:', taskData)
    
    if (onCreate) {
      onCreate(taskData)
    }
    
    setIsLoading(false)
    setCurrentStep(3)
  }

  const handleManualSubmit = async function() {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (onCreate) {
      onCreate({
        ...formData,
        status: 'open',
        reward: {
          amount: parseFloat(formData.amount),
          token: formData.token
        }
      })
    }
    
    setIsLoading(false)
    
    if (onClose) {
      onClose()
    }
  }

  const steps = [
    { id: 1, title: 'Details', icon: Target },
    { id: 2, title: 'Payment', icon: Shield },
    { id: 3, title: 'Launch', icon: Rocket }
  ]

  if (!isOpen) return null

  return React.createElement('div', { className: "fixed inset-0 z-50 flex items-center justify-center p-4" },
    React.createElement('div', {
      className: "absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer",
      onClick: onClose
    }),
    React.createElement(motion.div, {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 0.3 },
      className: "relative z-10 w-full max-w-2xl",
      onClick: (e) => e.stopPropagation(),
      style: { maxHeight: '95vh' }
    },
      React.createElement(GlassCard, { className: "relative" },
        React.createElement('div', { 
          className: "p-6 lg:p-8 scroll-container", 
          style: { 
            maxHeight: '95vh', 
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }
        },
          React.createElement(motion.button, {
            onClick: onClose,
            className: "absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-all duration-300",
            whileHover: { scale: 1.1 },
            whileTap: { scale: 0.9 }
          },
            React.createElement('svg', { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" })
            )
          ),
          
          React.createElement(motion.div, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.2 },
            className: "text-center mb-6"
          },
            React.createElement(motion.div, {
              className: "inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/50",
              whileHover: { rotate: 180 },
              transition: { duration: 0.3 }
            },
              React.createElement(Sparkles, { className: "w-7 h-7 text-white" })
            ),
            React.createElement('h1', { className: "text-2xl lg:text-3xl font-black mb-2" },
              React.createElement('span', { className: "bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent drop-shadow-2xl" }, "Create Epic Task")
            ),
            React.createElement('p', { className: "text-slate-300 text-sm max-w-md mx-auto font-medium" }, 
              paymentReceived ? "Your task is being published!" : "Launch your project with secure Solana escrow"
            )
          ),
          
          React.createElement('div', { className: "flex items-center justify-center mb-6" },
            React.createElement('div', { className: "flex items-center justify-center w-full max-w-md" },
              steps.map((step, index) =>
                React.createElement(React.Fragment, { key: step.id },
                  React.createElement(motion.div, {
                    className: "flex flex-col items-center justify-center text-center flex-1",
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: 0.3 + index * 0.1 }
                  },
                    React.createElement('div', { className: "relative mb-2" },
                      React.createElement(motion.div, {
                        className: `w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all duration-300 border-2 mx-auto ${currentStep >= step.id ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50 border-purple-400/50' : 'bg-slate-800/80 text-slate-300 border-slate-600/50 hover:border-slate-500/50'}`,
                        whileHover: { scale: 1.05 },
                        animate: { scale: currentStep === step.id ? [1, 1.05, 1] : 1 },
                        transition: { scale: { duration: 2, repeat: currentStep === step.id ? Infinity : 0 } }
                      },
                        currentStep > step.id ? 
                          React.createElement(CheckCircle, { className: "w-5 h-5" }) :
                          React.createElement(step.icon, { className: "w-5 h-5" }),
                        currentStep === step.id && React.createElement(React.Fragment, null,
                          React.createElement('div', { className: "absolute inset-0 rounded-xl border-2 border-purple-400/50 animate-ping" }),
                          React.createElement('div', { className: "absolute inset-0 rounded-xl border border-purple-300/30 animate-pulse" })
                        )
                      )
                    ),
                    React.createElement('div', { className: `text-xs font-semibold transition-colors duration-300 px-1 ${currentStep >= step.id ? 'text-white' : 'text-slate-400'}` }, step.title)
                  ),
                  index < steps.length - 1 && React.createElement('div', { className: "flex-1 relative mx-3" },
                    React.createElement('div', { className: "w-full h-0.5 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/30" },
                      React.createElement(motion.div, {
                        className: "h-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg",
                        initial: { width: '0%' },
                        animate: { width: currentStep > step.id ? '100%' : '0%' },
                        transition: { duration: 0.5, delay: 0.2 }
                      })
                    )
                  )
                )
              )
            )
          ),
          
          React.createElement('div', { className: "max-w-xl mx-auto" },
            // Шаг 1: Детали проекта
            currentStep === 1 && React.createElement('div', { className: "space-y-6" },
              React.createElement(ModernInput, {
                label: "Project Title",
                placeholder: "Build the next unicorn startup...",
                value: formData.title,
                onChange: (value) => updateField('title', value),
                error: errors.title,
                required: true,
                icon: Target
              }),
              React.createElement(ModernInput, {
                type: "textarea",
                label: "Project Description",
                placeholder: "Describe your vision in detail...",
                value: formData.description,
                onChange: (value) => updateField('description', value),
                error: errors.description,
                required: true,
                rows: 6,
                icon: FileText
              }),
              React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
                React.createElement(ModernInput, {
                  type: "number",
                  label: "Reward Amount",
                  placeholder: "0.00",
                  value: formData.amount,
                  onChange: (value) => updateField('amount', value),
                  error: errors.amount,
                  required: true,
                  icon: DollarSign
                }),
                React.createElement('div', null,
                  React.createElement('label', { className: "flex items-center gap-2 text-sm font-medium text-slate-200 mb-2" },
                    React.createElement(Wallet, { className: "w-4 h-4" }),
                    React.createElement('span', null, "Payment Token"),
                    React.createElement('span', { className: "text-red-400" }, "*")
                  ),
                  React.createElement(TokenDropdown, {
                    selected: formData.token,
                    setSelected: (value) => updateField('token', value)
                  })
                )
              ),
              React.createElement(ModernInput, {
                type: "date",
                label: "Project Deadline",
                value: formData.deadline,
                onChange: (value) => updateField('deadline', value),
                error: errors.deadline,
                required: true,
                icon: Clock
              }),
              React.createElement('div', { className: "flex justify-end pt-6" },
                React.createElement(ModernButton, {
                  variant: "primary",
                  onClick: handleNext,
                  icon: ArrowRight,
                  size: "md"
                }, "Continue to Payment")
              )
            ),
            
            // Шаг 2: Платеж и эскроу
            currentStep === 2 && React.createElement('div', { className: "space-y-4" },
              React.createElement('div', { className: "text-center mb-4" },
                React.createElement(motion.div, {
                  className: "text-4xl mb-3",
                  animate: { scale: [1, 1.05, 1] },
                  transition: { duration: 2, repeat: Infinity }
                }, "🛡️"),
                React.createElement('h2', { className: "text-xl font-black mb-1" },
                  React.createElement('span', { className: "bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg" }, "Secure Solana Escrow")
                ),
                React.createElement('p', { className: "text-slate-300 font-medium text-sm" }, "Send payment to the generated wallet address")
              ),
              
              escrowWallet && React.createElement(EscrowWalletDisplay, {
                wallet: escrowWallet,
                expectedAmount: parseFloat(formData.amount),
                token: formData.token,
                onPaymentReceived: handlePaymentReceived,
                isMonitoring: isMonitoring
              }),
              
              React.createElement(GlassCard, { variant: "purple", className: "p-4" },
                React.createElement('div', { className: "flex items-start gap-3" },
                  React.createElement(Shield, { className: "w-6 h-6 text-purple-400 flex-shrink-0" }),
                  React.createElement('div', null,
                    React.createElement('h4', { className: "font-bold text-purple-200 text-base mb-2" }, "Security Features"),
                    React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
                      ['Smart contract protection', 'Automatic payment detection', 'Real-time blockchain monitoring', 'Instant task publishing'].map((feature, index) =>
                        React.createElement(motion.div, {
                          key: feature,
                          initial: { opacity: 0, x: -20 },
                          animate: { opacity: 1, x: 0 },
                          transition: { delay: index * 0.1 },
                          className: "flex items-center gap-2 text-purple-100 text-sm"
                        },
                          React.createElement('div', { className: "w-1 h-1 bg-purple-400 rounded-full" }),
                          React.createElement('span', null, feature)
                        )
                      )
                    )
                  )
                )
              ),
              
              React.createElement('div', { className: "flex justify-between pt-4" },
                React.createElement(ModernButton, {
                  variant: "ghost",
                  onClick: () => setCurrentStep(1),
                  icon: ArrowLeft
                }, "Back"),
                !isMonitoring && !paymentReceived && React.createElement(ModernButton, {
                  variant: "primary",
                  onClick: handleStartMonitoring,
                  icon: RefreshCw,
                  size: "md"
                }, "Start Monitoring"),
                paymentReceived && React.createElement(ModernButton, {
                  variant: "success",
                  disabled: true,
                  icon: CheckCircle,
                  size: "md"
                }, "Payment Confirmed!")
              )
            ),
            
            // Шаг 3: Запуск
            currentStep === 3 && React.createElement('div', { className: "space-y-6" },
              React.createElement('div', { className: "text-center mb-6" },
                React.createElement(motion.div, {
                  className: "text-4xl mb-3",
                  animate: { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] },
                  transition: { duration: 1, repeat: Infinity }
                }, "🚀"),
                React.createElement('h2', { className: "text-2xl font-black mb-2" },
                  React.createElement('span', { className: "bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent drop-shadow-lg" }, "Task Published!")
                ),
                React.createElement('p', { className: "text-slate-300 font-medium text-sm" }, "Your project is now live and visible to our talent network")
              ),
              
              React.createElement(GlassCard, { variant: "green", className: "p-8" },
                React.createElement('h3', { className: "text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3" },
                  React.createElement(CheckCircle, { className: "w-6 h-6" }),
                  "Success!"
                ),
                React.createElement('div', { className: "space-y-6" },
                  React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                    React.createElement('div', null,
                      React.createElement('span', { className: "text-slate-400 text-sm block mb-1" }, "Project Title"),
                      React.createElement('span', { className: "text-white font-semibold" }, formData.title)
                    ),
                    React.createElement('div', null,
                      React.createElement('span', { className: "text-slate-400 text-sm block mb-1" }, "Deadline"),
                      React.createElement('span', { className: "text-white font-semibold" },
                        new Date(formData.deadline).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      )
                    )
                  ),
                  React.createElement('div', { className: "text-center" },
                    React.createElement('span', { className: "text-slate-400 text-sm block mb-2" }, "Secured Amount"),
                    React.createElement('div', { className: "flex items-center justify-center gap-3" },
                      React.createElement('span', { className: "text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent" }, formData.amount),
                      React.createElement('span', { className: "text-2xl font-bold text-purple-400" }, formData.token)
                    )
                  ),
                  paymentReceived && React.createElement('div', { className: "space-y-3" },
                    React.createElement('span', { className: "text-slate-400 text-sm block" }, "Transaction Details"),
                    React.createElement(GlassCard, { variant: "blue", className: "p-4" },
                      React.createElement('div', { className: "space-y-2 text-sm" },
                        React.createElement('div', { className: "flex justify-between" },
                          React.createElement('span', { className: "text-slate-400" }, "Tx Hash:"),
                          React.createElement('span', { className: "text-blue-300 font-mono" }, paymentReceived.txHash.slice(0, 20) + '...')
                        ),
                        React.createElement('div', { className: "flex justify-between" },
                          React.createElement('span', { className: "text-slate-400" }, "Received:"),
                          React.createElement('span', { className: "text-white font-semibold" }, new Date(paymentReceived.timestamp).toLocaleString())
                        ),
                        React.createElement('div', { className: "flex justify-between" },
                          React.createElement('span', { className: "text-slate-400" }, "Confirmations:"),
                          React.createElement('span', { className: "text-green-400 font-semibold" }, paymentReceived.confirmations || 'N/A')
                        ),
                        React.createElement('div', { className: "flex justify-between" },
                          React.createElement('span', { className: "text-slate-400" }, "Escrow:"),
                          React.createElement('span', { className: "text-green-400 font-semibold" }, escrowWallet?.address.slice(0, 20) + '...')
                        ),
                      )
                    )
                  )
                )
              ),
              
              React.createElement(GlassCard, { variant: "green", className: "p-6" },
                React.createElement('div', { className: "flex items-center gap-4" },
                  React.createElement(motion.div, {
                    className: "w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center",
                    animate: { scale: [1, 1.1, 1] },
                    transition: { duration: 2, repeat: Infinity }
                  },
                    React.createElement(Rocket, { className: "w-6 h-6 text-white" })
                  ),
                  React.createElement('div', null,
                    React.createElement('h4', { className: "font-bold text-green-300 text-lg" }, "Task is Live!"),
                    React.createElement('p', { className: "text-green-200" }, "Freelancers can now submit proposals for your project")
                  )
                )
              ),
              
              React.createElement('div', { className: "flex justify-center pt-6" },
                React.createElement(ModernButton, {
                  variant: "success",
                  onClick: onClose,
                  icon: CheckCircle,
                  size: "md"
                }, "Close & View Task")
              )
            )
          )
        )
      )
    )
  )
}