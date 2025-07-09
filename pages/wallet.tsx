// pages/wallet.tsx - Страница кошелька
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useRouter } from 'next/router'
import { Modal } from '../components/Modal'
import ProfileWidget from '../components/ProfileWidget'
import { useSolPrice } from '../hooks/useSolPrice'
import { WorklyToastContainer, showWorklyToast } from '../components/WorklyToast'
import Head from 'next/head'

interface UserWallet {
  userId: string
  publicKey: string
  solBalance: number
  usdtBalance: number
  usdcBalance: number
  worklyBalance: number
  totalEarned: number
  totalSpent: number
  createdAt: string
  lastUpdated: string
}

export default function WalletPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [wallet, setWallet] = useState<UserWallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawToken, setWithdrawToken] = useState<'SOL'>('SOL')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { price: solPrice, isLoading: priceLoading } = useSolPrice()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      fetchWalletInfo()
    }
  }, [user, isLoading, router])

  const fetchWalletInfo = async () => {
    setLoading(true)
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
          await createWallet()
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet info:', error)
    } finally {
      setLoading(false)
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchWalletInfo()
    setRefreshing(false)
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showWorklyToast('Please enter a valid amount')
      return
    }

    if (!withdrawAddress.trim()) {
      showWorklyToast('Please enter a valid Solana address')
      return
    }

    const amount = parseFloat(withdrawAmount)
    const balance = getTokenBalance(withdrawToken)

    if (amount > balance) {
      showWorklyToast(`Insufficient ${withdrawToken} balance`)
      return
    }

    setWithdrawing(true)
    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount,
          token: withdrawToken,
          toAddress: withdrawAddress.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        await fetchWalletInfo() 
        setWithdrawAmount('')
        setWithdrawAddress('')
        setIsWithdrawOpen(false)
        showWorklyToast(`Successfully withdrawn ${amount} ${withdrawToken}. TX: ${data.txHash}`)
      } else {
        const error = await response.json()
        showWorklyToast('Withdrawal failed: ' + error.error)
      }
    } catch (error) {
      console.error('Withdraw error:', error)
      showWorklyToast('Withdrawal failed')
    } finally {
      setWithdrawing(false)
    }
  }

  const getTokenBalance = (token: string): number => {
    if (!wallet) return 0
    return wallet.solBalance
  }

  const formatBalance = (balance: number, decimals: number = 4): string => {
    return balance.toFixed(decimals)
  }

  const copyAddress = () => {
    if (wallet?.publicKey) {
      navigator.clipboard.writeText(wallet.publicKey)
    }
  }

  const getWorklyBenefits = () => {
    if (!wallet) return []

    const benefits = []
    if (wallet.worklyBalance >= 100) {
      const discount = wallet.worklyBalance >= 1000 ? 50 : wallet.worklyBalance >= 500 ? 30 : 15
      benefits.push(`${discount}% fee discount on all transactions`)
    }
    if (wallet.worklyBalance >= 500) {
      benefits.push('1.5x reward multiplier on completed tasks')
    }
    if (wallet.worklyBalance >= 1000) {
      benefits.push('Priority customer support')
      benefits.push('Access to exclusive features')
    }

    return benefits
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0b0f] via-[#1a1d2e] to-[#16192a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading wallet...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0b0f] via-[#1a1d2e] to-[#16192a]">

      <Head>
        <title>Workly - My Wallet</title>
        <link rel="icon" href="/workly.png" sizes="64x64" type="image/png" />
        <meta name="description" content="Web3 platform for tasks with payment in Solana. Post simple tasks and get them done quickly, with payments guaranteed by smart contracts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ProfileWidget />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center">
                {/* Основной кошелек */}
                <div className="w-8 h-6 bg-gradient-to-br from-purple-400 via-blue-500 to-cyan-400 rounded-lg shadow-lg relative">
                  <div className="absolute top-1 right-1 w-2 h-2 bg-white/30 rounded-full" />
                  <div className="absolute bottom-0.5 left-1 w-1 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Летающие монетки */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0s' }} />
                <div className="absolute -top-0.5 right-2 w-2 h-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0.3s' }} />
              </div>
              My Wallet
            </h1>
            <p className="text-gray-400">Manage your funds and WORKLY tokens</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 hover:border-blue-400/50 backdrop-blur-sm text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 flex items-center gap-3 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

            <div className={`relative z-10 transition-transform duration-300 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}>
              {refreshing ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>

            <span className="relative z-10 text-blue-100 group-hover:text-white transition-colors duration-300">
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </span>

            {refreshing && (
              <div className="relative z-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {wallet ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Wallet Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Wallet Address */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4">Wallet Address</h2>
                <div className="flex items-center gap-3 p-4 bg-black/20 rounded-lg">
                  <span className="text-blue-400 font-mono text-sm flex-1 break-all">
                    {wallet.publicKey}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="group relative overflow-hidden px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 hover:border-blue-400/50 backdrop-blur-sm text-blue-300 hover:text-white rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
                  >
                    {/* Анимированный блик */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />

                    <svg className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium relative z-10">Copy</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This is your Solana wallet address. You can receive payments and tokens here.
                </p>
              </div>

              {/* Balances */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4">Token Balances</h2>
                <div className="space-y-4">
                  {[
                    {
                      token: 'SOL',
                      balance: wallet.solBalance,
                      icon: <img src="solana.png" alt="SOL" className="w-5 h-5" />,
                      color: 'text-purple-400',
                      description: 'Solana'
                    },
                    {
                      token: 'WORKLY',
                      balance: wallet.worklyBalance,
                      icon: <img src="workly.png" alt="Workly" className="w-6 h-6" />,
                      color: 'text-orange-400',
                      description: 'Workly Token'
                    }
                  ].map(({ token, balance, icon, color, description }) => (
                    <div key={token} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <div>
                          <div className="text-white font-medium">{token}</div>
                          <div className="text-xs text-gray-500">{description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${color}`}>
                          {formatBalance(balance, token === 'SOL' ? 4 : 2)}
                        </div>
                        {token === 'SOL' && balance > 0 && (
                          <div className="text-xs text-gray-500">
                            {!priceLoading ? (
                              `≈ $${(balance * solPrice).toFixed(2)} USD`
                            ) : (
                              '≈ Loading...'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setIsWithdrawOpen(true)}
                  disabled={wallet.solBalance === 0}
                  className="group relative overflow-hidden w-full mt-4 px-6 py-4 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:via-blue-500/30 hover:to-cyan-500/30 border border-purple-500/30 hover:border-purple-400/50 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/25"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <img src="/solana.png" alt="SOL" className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />

                    <svg className="w-5 h-5 text-purple-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>

                    <span className="text-purple-100 group-hover:text-white transition-colors duration-200">
                      Withdraw SOL
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statistics */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Statistics
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">Total Earned</div>
                    <div className="flex items-center gap-2">
                      <img src="/solana.png" alt="SOL" className="h-4 w-4" />
                      <span className="text-lg font-bold text-green-400">
                        {formatBalance(wallet.totalEarned, 4)} SOL
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">Total Spent</div>
                    <div className="flex items-center gap-2">
                      <img src="/solana.png" alt="SOL" className="h-4 w-4" />
                      <span className="text-lg font-bold text-red-400">
                        {formatBalance(wallet.totalSpent, 4)} SOL
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">Net Profit</div>
                    <div className="flex items-center gap-2">
                      <img src="/solana.png" alt="SOL" className="h-4 w-4" />
                      <span className={`text-lg font-bold ${wallet.totalEarned - wallet.totalSpent >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {formatBalance(wallet.totalEarned - wallet.totalSpent, 4)} SOL
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Earned:</span>
                      <span>≈ ${formatBalance(wallet.totalEarned * solPrice, 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spent:</span>
                      <span>≈ ${formatBalance(wallet.totalSpent * solPrice, 2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Net:</span>
                      <span className={wallet.totalEarned - wallet.totalSpent >= 0 ? 'text-green-400/70' : 'text-red-400/70'}>
                        ≈ ${formatBalance((wallet.totalEarned - wallet.totalSpent) * solPrice, 2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* WORKLY Token Benefits */}
              {wallet.worklyBalance > 0 && (
                <div className="bg-gradient-to-br from-purple-900/20 to-orange-900/20 rounded-xl p-6 border border-purple-500/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    🚀 WORKLY Benefits
                  </h3>
                  <div className="space-y-2">
                    {getWorklyBenefits().map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-green-400">✓</span>
                        <span className="text-gray-300">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  {wallet.worklyBalance < 100 && (
                    <div className="mt-4 p-3 bg-purple-500/10 rounded-lg">
                      <div className="text-sm text-purple-400">
                        Hold 100+ WORKLY tokens to unlock fee discounts!
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Wallet Created */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Wallet Info</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <div className="text-white">
                      {new Date(wallet.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Updated:</span>
                    <div className="text-white">
                      {new Date(wallet.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-xl font-semibold text-white mb-2">Wallet not found</h2>
            <p className="text-gray-400 mb-6">There was an error loading your wallet information.</p>
            <button
              onClick={fetchWalletInfo}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <Modal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        title="Withdraw Funds"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-2">
              ⚠️ Important
            </div>
            <p className="text-xs text-gray-300">
              Withdrawals are sent directly to the Solana blockchain. Make sure the address is correct and supports the selected token.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token
            </label>
            <div className="w-full p-3 bg-white/10 rounded-xl text-white flex items-center gap-3">
              <img src="solana.png" alt="SOL" className="w-5 h-5" />
              <div className="flex-1">
                <div className="font-medium">SOL</div>
                <div className="text-sm text-gray-400">Balance: {formatBalance(wallet?.solBalance || 0, 4)}</div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                min="0"
                max={getTokenBalance(withdrawToken)}
                className="w-full p-3 bg-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => setWithdrawAmount(getTokenBalance(withdrawToken).toString())}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-all"
              >
                MAX
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Available: {formatBalance(getTokenBalance(withdrawToken), withdrawToken === 'SOL' ? 4 : 6)} {withdrawToken}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination Address
            </label>
            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              placeholder="Enter Solana wallet address"
              className="w-full p-3 bg-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsWithdrawOpen(false)}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmount || !withdrawAddress}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {withdrawing && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
              {withdrawing ? 'Withdrawing...' : '💸 Withdraw'}
            </button>
          </div>
        </div>
      </Modal>
      <WorklyToastContainer />
    </div>
  )
}