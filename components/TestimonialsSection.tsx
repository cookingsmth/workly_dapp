import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const TestimonialsSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  const partners = [
    {
      name: "Solana",
      logo: "/solana.png"
    },
    {
      name: "USDC", 
      logo: "/usdc.png"
    },
    {
      name: "Celo",
      logo: "/celo.png"
    },
    {
      name: "dex",
      logo: "/dex.png"
    }
  ]

  return (
    <section ref={sectionRef} className="max-w-2xl mx-auto py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <motion.h2 
          className="text-3xl font-bold mb-12 text-white"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.3 }}
        >
          Trusted Partners
        </motion.h2>

        <div className="flex justify-center items-center gap-12">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="group"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <motion.div 
          className="relative w-full max-w-md mx-auto mt-8"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent blur-sm"></div>
        </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export default TestimonialsSection