import React, { useState, useEffect } from 'react'

const FeeCalculator: React.FC = () => {
  const [projectValue, setProjectValue] = useState(100)
  const [savings, setSavings] = useState(0)
  const [animatedValue, setAnimatedValue] = useState(100)

  // Platform fee structures
  const platforms = {
    workly: {
      name: "Workly",
      fee: 0.025, // 2.5%
      color: "from-purple-500 to-blue-500",
      logo: "/workly.png"
    },
    upwork: {
      name: "Upwork", 
      fee: 0.10, // 10%
      color: "from-green-600 to-green-700",
      logo: "https://cdn.worldvectorlogo.com/logos/upwork-1.svg"
    },
    fiverr: {
      name: "Fiverr",
      fee: 0.055, // 5.5%
      color: "from-green-500 to-green-600", 
      logo: "https://cdn.worldvectorlogo.com/logos/fiverr-1.svg"
    },
    freelancer: {
      name: "Freelancer",
      fee: 0.10, // 10%
      color: "from-blue-600 to-blue-700",
      logo: "https://cdn.worldvectorlogo.com/logos/freelancer-1.svg"
    }
  }

  // Calculate fees and savings
  useEffect(() => {
    const worklyFee = projectValue * platforms.workly.fee
    const averageCompetitorFee = projectValue * 0.075 // Average of competitors
    setSavings(averageCompetitorFee - worklyFee)
    
    // Animate project value display
    let start = animatedValue
    let end = projectValue
    let duration = 300
    let startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const current = start + (end - start) * progress
      setAnimatedValue(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }, [projectValue, animatedValue])

  const calculateFee = (platform: keyof typeof platforms) => {
    return projectValue * platforms[platform].fee
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <section className="relative z-10 max-w-6xl mx-auto mt-24 mb-16 px-4">
      {/* Section Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full text-sm font-medium text-green-300 backdrop-blur-sm mb-6">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
          </svg>
          <span>Fee Calculator</span>
        </div>
        
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-300 via-blue-400 to-purple-300 bg-clip-text text-transparent">
          See How Much You Save
        </h2>
        
        <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Compare platform fees and discover why thousands choose Workly for crypto payments with minimal costs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Input */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl opacity-40"></div>
          <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-sm opacity-30 animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    Project Calculator
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Calculate your savings with real numbers
                  </p>
                </div>
              </div>
            </div>
            
            {/* Slider */}
            <div className="mb-8">
              <label className="block text-gray-300 mb-4 text-lg font-medium">
                Project Value: {formatCurrency(animatedValue)}
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="10"
                  max="5000"
                  step="10"
                  value={projectValue}
                  onChange={(e) => setProjectValue(Number(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>$10</span>
                  <span>$5,000</span>
                </div>
              </div>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2 mb-8">
              {[50, 100, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setProjectValue(amount)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    projectValue === amount
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Savings highlight */}
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6 text-center">
              <div className="text-sm text-green-300 mb-2">You Save with Workly</div>
              <div className="text-3xl font-bold text-green-400 mb-2">
                {formatCurrency(Math.max(0, savings))}
              </div>
              <div className="text-xs text-gray-400">
                vs average competitor fees
              </div>
            </div>
          </div>
        </div>

        {/* Fee Comparison */}
        <div className="space-y-4">
          {Object.entries(platforms).map(([key, platform], index) => {
            const fee = calculateFee(key as keyof typeof platforms)
            const youPay = projectValue - fee
            const isWorkly = key === 'workly'
            
            return (
              <div
                key={key}
                className={`relative group transition-all duration-300 ${
                  isWorkly ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                {/* Glow effect for Workly */}
                {isWorkly && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-30"></div>
                )}
                
                <div className={`relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border rounded-2xl p-6 ${
                  isWorkly 
                    ? 'border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-blue-500/5' 
                    : 'border-white/10'
                }`}>
                  {/* Best Deal Badge */}
                  {isWorkly && (
                    <div className="absolute -top-3 left-6 px-4 py-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full text-xs font-bold text-white">
                      🏆 Best Deal
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg p-1.5 flex items-center justify-center">
                        <img 
                          src={platform.logo} 
                          alt={`${platform.name} logo`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to text if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLDivElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="w-full h-full bg-gradient-to-r from-gray-600 to-gray-700 rounded text-white text-xs font-bold items-center justify-center hidden"
                        >
                          {platform.name.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">{platform.name}</h4>
                        <p className="text-sm text-gray-400">
                          {(platform.fee * 100).toFixed(1)}% platform fee
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        {formatCurrency(youPay)}
                      </div>
                      <div className="text-sm text-gray-400">
                        You receive
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${platform.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${(youPay / projectValue) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      Platform fee: {formatCurrency(fee)}
                    </span>
                    {isWorkly && (
                      <span className="text-green-400 font-medium">
                        ⚡ Crypto payments
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Additional Benefits */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: "⚡",
            title: "Instant Payments",
            description: "Crypto payments settle in minutes, not days",
            color: "from-yellow-500 to-orange-500"
          },
          {
            icon: "🌍",
            title: "Global Access",
            description: "No geographical restrictions or currency conversion fees",
            color: "from-blue-500 to-cyan-500"
          },
          {
            icon: "🔒",
            title: "Smart Contracts",
            description: "Automated escrow ensures payment security",
            color: "from-purple-500 to-pink-500"
          }
        ].map((benefit, index) => (
          <div key={index} className="group relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${benefit.color} rounded-xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500`}></div>
            <div className="relative bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 text-center hover:scale-105 transition-all duration-300">
              <div className="text-3xl mb-3">{benefit.icon}</div>
              <h4 className="text-lg font-bold text-white mb-2">{benefit.title}</h4>
              <p className="text-sm text-gray-300">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider {
          background: linear-gradient(to right, #7c3aed 0%, #2563eb 100%);
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        
        .slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
      `}</style>
    </section>
  )
}

export default FeeCalculator