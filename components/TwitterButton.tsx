import React from 'react'
import { motion } from 'framer-motion'

const TwitterButton: React.FC = () => {
  return (
    <div className="flex justify-center py-1">
      <motion.a
        href="https://x.com/workly_dapp"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute -inset-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Button */}
        <div className="relative bg-gradient-to-r from-gray-900 to-black border border-white/20 rounded-2xl px-8 py-4 group-hover:border-white/40 transition-all duration-300 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {/* X Logo */}
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors duration-300">
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="text-black"
              >
                <path 
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" 
                  fill="currentColor"
                />
              </svg>
            </div>
            
            {/* Text */}
            <div>
              <div className="text-white font-semibold text-lg">Follow us on X</div>
              <div className="text-gray-400 text-sm">@workly_dapp</div>
            </div>
            
            {/* Arrow */}
            <motion.div
              className="ml-2 text-white/60 group-hover:text-white transition-colors duration-300"
              animate={{
                x: [0, 4, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M7 17L17 7M17 7H7M17 7V17" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>
        </div>
      </motion.a>
    </div>
  )
}

export default TwitterButton