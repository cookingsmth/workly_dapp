import { useState } from 'react'
import clsx from 'clsx'
import { TokenType } from '../../types/token'
import { getTokenInfo, calculateTotalCost, getUSDValue } from '../../utils/tokenUtils'

interface EscrowCardProps {
  address: string
  amount: number
  token: TokenType
  status: 'waiting_payment' | 'funded' | 'completed' | 'cancelled'
  className?: string
}

export const EscrowCard = ({ address, amount, token, status, className }: EscrowCardProps) => {
  const [copied, setCopied] = useState(false)
  
  const tokenInfo = getTokenInfo(token)
  const costBreakdown = calculateTotalCost(amount, token)
  const totalUSDValue = getUSDValue(amount, token) + (costBreakdown.hasAdditionalFees ? getUSDValue(costBreakdown.feeAmount, 'SOL') : 0)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const statusConfig = {
    waiting_payment: {
      gradient: 'from-amber-500/20 via-orange-500/20 to-amber-500/20',
      borderGradient: 'from-amber-400/50 via-orange-400/50 to-amber-400/50',
      textColor: 'text-amber-300',
      bgGlow: 'shadow-amber-500/20',
      icon: '⏳',
      label: 'Waiting for Payment',
      pulseColor: 'bg-amber-400'
    },
    funded: {
      gradient: 'from-green-500/20 via-emerald-500/20 to-green-500/20',
      borderGradient: 'from-green-400/50 via-emerald-400/50 to-green-400/50',
      textColor: 'text-green-300',
      bgGlow: 'shadow-green-500/20',
      icon: '✅',
      label: 'Funded & Ready',
      pulseColor: 'bg-green-400'
    },
    completed: {
      gradient: 'from-purple-500/20 via-blue-500/20 to-purple-500/20',
      borderGradient: 'from-purple-400/50 via-blue-400/50 to-purple-400/50',
      textColor: 'text-purple-300',
      bgGlow: 'shadow-purple-500/20',
      icon: '🎉',
      label: 'Completed',
      pulseColor: 'bg-purple-400'
    },
    cancelled: {
      gradient: 'from-red-500/20 via-rose-500/20 to-red-500/20',
      borderGradient: 'from-red-400/50 via-rose-400/50 to-red-400/50',
      textColor: 'text-red-300',
      bgGlow: 'shadow-red-500/20',
      icon: '❌',
      label: 'Cancelled',
      pulseColor: 'bg-red-400'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={clsx(
      'relative group',
      className
    )}>
      {/* Glow effect */}
      <div className={clsx(
        'absolute -inset-1 bg-gradient-to-r rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500',
        config.borderGradient
      )}></div>
      
      {/* Main card */}
      <div className={clsx(
        'relative glass-morphism rounded-2xl border-2 transition-all duration-500 hover:scale-[1.02]',
        `bg-gradient-to-br ${config.gradient}`,
        `border-gradient-to-r ${config.borderGradient}`,
        config.bgGlow
      )}>
        
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl shadow-2xl">
                  {config.icon}
                </div>
                <div className={clsx(
                  'absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse',
                  config.pulseColor
                )}></div>
              </div>
              <div>
                <h3 className="font-bold text-xl text-white mb-1">Smart Escrow</h3>
                <p className={clsx('text-sm font-medium', config.textColor)}>{config.label}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg">
                  {tokenInfo.icon}
                </div>
                <div>
                  <p className="text-2xl font-black text-white">
                    {amount} {token}
                  </p>
                  {costBreakdown.hasAdditionalFees && (
                    <p className="text-sm text-amber-300 font-medium">
                      + {costBreakdown.feeAmount} SOL fees
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Total value:</span>
                <span className="text-lg font-bold text-green-400">
                  ${totalUSDValue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        {status === 'waiting_payment' && costBreakdown.hasAdditionalFees && (
          <div className="px-6 mb-6">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-xs">💰</span>
                Payment Breakdown
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400 text-sm">Task reward:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{amount} {token}</span>
                    <span className="text-xs text-gray-500">${getUSDValue(amount, token).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400 text-sm">Network fees:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 font-medium">{costBreakdown.feeAmount} SOL</span>
                    <span className="text-xs text-gray-500">${getUSDValue(costBreakdown.feeAmount, 'SOL').toFixed(2)}</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Total to send:</span>
                    <span className="text-xl font-black text-green-400">${totalUSDValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Address */}
        <div className="px-6 mb-6">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center justify-center text-xs">🔐</span>
                Escrow Address
              </h4>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">Secure</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-sm text-purple-300 font-mono break-all bg-black/20 p-3 rounded-xl border border-white/5">
                {address}
              </code>
              <button
                onClick={copyToClipboard}
                className={clsx(
                  'px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg',
                  copied 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white border border-white/20'
                )}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="px-6 pb-6">
          {status === 'waiting_payment' && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-sm"></div>
              <div className="relative bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">💡</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-300 mb-3">Payment Instructions</h4>
                    <div className="space-y-2 text-sm text-amber-200">
                      <div className="flex items-center gap-3 p-2 bg-amber-500/10 rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center">1</span>
                        <span>Send exactly <span className="font-bold text-amber-100">{amount} {token}</span> to the address above</span>
                      </div>
                      {costBreakdown.hasAdditionalFees && (
                        <div className="flex items-center gap-3 p-2 bg-amber-500/10 rounded-lg">
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center">2</span>
                          <span>Also send <span className="font-bold text-amber-100">{costBreakdown.feeAmount} SOL</span> for transaction fees</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-2 bg-amber-500/10 rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center">{costBreakdown.hasAdditionalFees ? '3' : '2'}</span>
                        <span>Wait for confirmation (~30 seconds)</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-amber-500/10 rounded-lg">
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center">{costBreakdown.hasAdditionalFees ? '4' : '3'}</span>
                        <span>Your task goes live automatically</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {costBreakdown.hasAdditionalFees && status === 'waiting_payment' && (
            <div className="mt-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-sm"></div>
              <div className="relative bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🤖</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-300 mb-2">Smart Escrow Protection</h4>
                    <p className="text-sm text-blue-200 leading-relaxed">
                      Our smart contract automatically handles the {token} transfer to workers and uses the SOL for transaction fees. 
                      <span className="font-medium text-blue-100"> No manual intervention required!</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'funded' && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-sm"></div>
              <div className="relative bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">🎯</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-300 text-lg mb-1">Task is Live!</h4>
                    <p className="text-sm text-green-200">
                      {costBreakdown.hasAdditionalFees 
                        ? `${amount} ${token} + ${costBreakdown.feeAmount} SOL received. Workers can now apply!`
                        : `${amount} ${token} received. Workers can now apply!`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-sm"></div>
              <div className="relative bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">🎉</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-300 text-lg mb-1">Task Completed!</h4>
                    <p className="text-sm text-purple-200">
                      Payment of {amount} {token} has been successfully sent to the worker.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}