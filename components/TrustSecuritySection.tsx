import React from 'react'

const TrustSecuritySection: React.FC = () => {
  const securityFeatures = [
    {
      icon: (
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M12 1l9 4v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V5l9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
        </svg>
      ),
      title: "Smart Contract Escrow",
      description: "Funds are automatically held in blockchain escrow until work is completed and approved.",
      features: [
        "Automatic fund release",
        "No middleman control", 
        "Transparent on blockchain"
      ],
      gradient: "from-purple-500 to-blue-500"
    },
    {
      icon: (
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
      ),
      title: "Multi-Signature Security",
      description: "Advanced cryptographic signatures ensure only authorized parties can access funds.",
      features: [
        "Multiple approval required",
        "Hardware wallet support",
        "Enterprise-grade encryption"
      ],
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: (
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
      ),
      title: "Verified Users Only",
      description: "KYC verification and reputation system ensure you work with trusted professionals.",
      features: [
        "Identity verification",
        "Skill verification",
        "Community ratings"
      ],
      gradient: "from-cyan-500 to-green-500"
    },
    {
      icon: (
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      title: "Dispute Resolution",
      description: "Fair arbitration system with community governance for resolving conflicts.",
      features: [
        "24/7 mediation service",
        "Evidence-based decisions",
        "Fair outcome guarantee"
      ],
      gradient: "from-green-500 to-purple-500"
    }
  ]

  const trustStats = [
    { number: "$2.4M+", label: "Secured in Escrow" },
    { number: "99.8%", label: "Successful Transactions" },
    { number: "0", label: "Security Breaches" },
    { number: "24/7", label: "Security Monitoring" }
  ]

  return (
    <section className="relative z-10 max-w-6xl mx-auto mt-24 mb-16 px-4">
      {/* Section Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-sm font-medium text-purple-300 backdrop-blur-sm mb-6">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-7-4z" clipRule="evenodd"/>
          </svg>
          <span>Blockchain Security</span>
        </div>
        
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-300 via-purple-400 to-cyan-300 bg-clip-text text-transparent">
          Your Funds Are Protected
        </h2>
        
        <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Advanced blockchain technology and smart contracts ensure your payments are secure, transparent, and guaranteed.
        </p>
      </div>

      {/* Security Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {securityFeatures.map((feature, index) => (
          <div key={index} className="group relative">
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500`}></div>
            
            {/* Card */}
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl min-h-[280px]">
              {/* Top border gradient */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
              
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">{feature.description}</p>
              
              {/* Features list */}
              <ul className="space-y-3">
                {feature.features.map((item, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Trust Statistics */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl opacity-40"></div>
        <div className="relative bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Trusted by the Community</h3>
          <p className="text-gray-300 mb-8">Real numbers from real users who chose security</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustStats.map((stat, index) => (
              <div key={index} className="text-center group/stat">
                <div className="text-3xl font-bold text-cyan-300 mb-2 group-hover/stat:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrustSecuritySection