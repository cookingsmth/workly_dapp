import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Link from 'next/link'
import { useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import TrustSecuritySection from '../components/TrustSecuritySection'
import FeeCalculator from '../components/FeeCalculator'
import TestimonialsSection from '../components/TestimonialsSection'
import TwitterButton from '../components/TwitterButton'
import { motion, AnimatePresence } from 'framer-motion'

import { RegisterModal } from '../components/RegisterModal'
import { LoginModal } from '../components/LoginModal'
import { PrivacyModal } from '../components/PrivacyModal'
import { TermsModal } from '../components/TermsModal'
import { HowItWorksModal } from '../components/HowItWorksModal'
import ApplyModal from '../components/ApplyModal'

import { useAuth } from '../hooks/useAuth'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  baseOpacity: number
  pulseSpeed: number
}

export default function Home() {
  const router = useRouter()

  const { user, isLoading, logout } = useAuth()

  const [modals, setModals] = useState({
    register: false,
    login: false,
    privacy: false,
    terms: false,
    howItWorks: false,
    apply: false
  })

  const [currentTask, setCurrentTask] = useState("")
  const [vantaEffect, setVantaEffect] = useState<any>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const vantaRef = useRef<HTMLDivElement>(null)
  const [isApplied, setIsApplied] = useState(false)

  const openModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: true }))
  }

  const closeModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }))
  }

  const handleLogout = () => {
    logout()
  }

  useEffect(() => {
    let vantaInstance: any = null
    let animationFrame: number | null = null

    const loadVanta = async () => {
      try {
        const THREE = await import('three')
        // @ts-ignore
        const VANTA = await import('vanta/dist/vanta.net.min')

        if (!vantaRef.current) return

        vantaInstance = (VANTA as any).default({
          el: vantaRef.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x9333ea,
          backgroundColor: 0x0b0f1a,
          spacing: 18.0,
          points: 8.0,
          maxDistance: 23.0,
          showDots: true,
        })

        setVantaEffect(vantaInstance)

        const animateVanta = () => {
          if (vantaInstance && vantaInstance.setOptions) {
            const time = Date.now() * 0.001
            const spacing = 16.0 + Math.sin(time * 0.5) * 4.0
            const maxDistance = 20.0 + Math.cos(time * 0.3) * 8.0
            const points = 6.0 + Math.sin(time * 0.4) * 3.0

            vantaInstance.setOptions({
              spacing: spacing,
              maxDistance: maxDistance,
              points: points
            })
          }
          animationFrame = requestAnimationFrame(animateVanta)
        }

        animateVanta()

      } catch (error) {
        console.log('Vanta loading failed, using fallback:', error)
        createFallbackBackground()
      }
    }

    const createFallbackBackground = () => {
      if (!vantaRef.current) return

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.zIndex = '1'
      canvas.style.pointerEvents = 'none'

      if (vantaRef.current) {
        vantaRef.current.appendChild(canvas)
      }

      const particles: Particle[] = []

      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.2,
          baseOpacity: Math.random() * 0.5 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.01
        })
      }

      const animate = (time: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        particles.forEach((particle, index) => {
          particle.x += particle.speedX
          particle.y += particle.speedY

          if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1
          if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1

          particle.opacity = particle.baseOpacity + Math.sin(time * particle.pulseSpeed) * 0.3

          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(147, 51, 234, ${Math.max(0, particle.opacity)})`
          ctx.fill()

          particles.forEach((otherParticle, otherIndex) => {
            if (index !== otherIndex) {
              const dx = particle.x - otherParticle.x
              const dy = particle.y - otherParticle.y
              const distance = Math.sqrt(dx * dx + dy * dy)

              if (distance < 100) {
                const opacity = (1 - distance / 100) * 0.1
                ctx.beginPath()
                ctx.moveTo(particle.x, particle.y)
                ctx.lineTo(otherParticle.x, otherParticle.y)
                ctx.strokeStyle = `rgba(147, 51, 234, ${opacity})`
                ctx.lineWidth = 1
                ctx.stroke()
              }
            }
          })
        })

        animationFrame = requestAnimationFrame(animate)
      }

      animate(0)
    }

    loadVanta()

    return () => {
      if (vantaInstance) {
        try {
          vantaInstance.destroy()
        } catch (error) {
          console.log('Error destroying Vanta:', error)
        }
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Responsive Vanta effect
  useEffect(() => {
    const handleResize = () => {
      if (vantaEffect && vantaEffect.resize) {
        vantaEffect.resize()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [vantaEffect])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] flex items-center justify-center relative overflow-hidden">
        {/* Loading Vanta Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="text-white text-xl flex flex-col items-center gap-4 z-10">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Loading Workly...
            </div>
            <div className="text-sm text-gray-400">Initializing Web3 workspace</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Workly — Web3 Task Platform</title>
        <link rel="icon" href="/workly.png" sizes="64x64" type="image/png" />
        <meta name="description" content="Web3 platform for tasks with payment in Solana. Post simple tasks and get them done quickly, with payments guaranteed by smart contracts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Enhanced Vanta Background Container */}
      <div ref={vantaRef} className="relative min-h-[110vh] text-white overflow-hidden">
        {/* Additional animated elements with continuous animation */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating orbs with independent continuous animation */}
          <div
            className="absolute w-4 h-4 bg-purple-400 rounded-full opacity-60 blur-sm animate-float-1"
          />
          <div
            className="absolute w-6 h-6 bg-blue-400 rounded-full opacity-40 blur-sm animate-float-2"
          />
          <div
            className="absolute w-3 h-3 bg-pink-400 rounded-full opacity-50 blur-sm animate-float-3"
          />
          <div
            className="absolute w-5 h-5 bg-cyan-400 rounded-full opacity-30 blur-sm animate-float-4"
          />
          <div
            className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-60 blur-sm animate-float-5"
          />
        </div>

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0b0f1a]/30 pointer-events-none z-5"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f1a]/20 via-transparent to-[#0b0f1a]/20 pointer-events-none z-5"></div>

        {/* Enhanced Header */}
        {!user ? (
          <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center w-[95%] max-w-[1200px] px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src="/workly.png" alt="Logo" className="w-10 h-10 animate-pulse" />
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md animate-pulse"></div>
              </div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-purple-700 bg-clip-text text-transparent">
                WORKLY
              </h1>
            </div>

            <nav className="hidden md:flex space-x-4 items-center text-sm text-gray-300 font-medium">
              <button
                onClick={() => openModal('howItWorks')}
                className="px-4 py-2 rounded-xl border border-purple-500/40 bg-black/30 text-white font-semibold backdrop-blur-sm hover:border-purple-400/80 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
              >
                How It Works
              </button>

              <button
                onClick={() => openModal('register')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-blue-500 text-white font-semibold shadow-md hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/50"
              >
                Register
              </button>

              <button
                onClick={() => openModal('login')}
                className="px-4 py-2 rounded-xl border border-purple-400/40 text-white hover:scale-105 transition-all duration-300 hover:bg-white/5"
              >
                Login
              </button>
            </nav>
          </header>
        ) : (
          <header className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
            <div className="group flex items-center gap-4 px-6 py-3 bg-white/8 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:bg-white/12">

              <Link href="/" className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/workly.png"
                    alt="Logo"
                    className="w-9 h-9 group-hover:animate-pulse transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-purple-700 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:via-purple-400 group-hover:to-purple-600 transition-all duration-300">
                  WORKLY
                </h1>
              </Link>

              <div className="w-px h-6 bg-white/20"></div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">
                    {user?.username}
                  </span>
                  <span className="text-xs text-green-400 font-medium">Online</span>
                </div>
              </div>

              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </header>
        )}


        {/* Enhanced Main Content */}
        <main className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-10 mt-40 mb-28 px-4 animate-fade-in">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-sm font-medium text-purple-300 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Web3 Productivity Revolution</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-extrabold my-6 py-2 mb-6 bg-gradient-to-r from-blue-300 via-cyan-300 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Web3 platform for tasks with payment in Solana
              </h2>
            </div>

            <p className="text-lg text-gray-300 mb-10 max-w-xl leading-relaxed">
              Post simple tasks and get them done quickly, with payments guaranteed by a smart contract.
              Experience the future of decentralized work.
            </p>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => router.push('/tasks')}
                className="group px-8 py-4 rounded-2xl font-bold text-white text-lg shadow-xl bg-gradient-to-r from-[#a259ff] via-[#4d66ff] to-[#23c6e0] hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="flex items-center justify-center gap-3 relative z-10">
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Get Started
                </span>
              </button>

              <button className="group px-8 py-4 rounded-2xl font-bold text-white text-lg border-2 border-purple-500/50 bg-transparent hover:bg-purple-500/10 hover:scale-105 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="flex items-center justify-center gap-3 relative z-10">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Watch Demo
                </span>
              </button>
            </div>

            <div className="flex items-center gap-6">
              <p className="text-sm text-gray-400 font-medium">
                All payments in:
              </p>
              <div className="flex items-center gap-4">
                <div className="group relative">
                  <span className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-semibold backdrop-blur-sm hover:from-purple-400/30 hover:to-blue-400/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/25">
                    <img src="/solana.png" alt="Solana" className="w-5 h-5" />
                    SOL
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <span className="text-xs text-gray-500 italic">Fast & Secure</span>
              </div>
            </div>
          </div>

          {/* Enhanced Hero Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
            <div className="relative glass-morphism p-8 rounded-3xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 max-w-md mx-auto border border-white/10">
              <div className="absolute top-7 right-0 -translate-y-1 translate-x-4 rotate-[45deg] text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] pointer-events-none select-none">
                Example
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="inline-block text-xs uppercase font-bold px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-600 to-blue-400 text-white animate-pulse">
                  🔥 New Task Posted
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">Live</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-4 leading-tight">
                Translate article from English to Spanish
              </h3>

              <div className="space-y-3 mb-6">
                {[
                  "Provide clear and accurate translation",
                  "Double check grammar and tone",
                  "Deliver as a Word document"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-300">0.08 SOL</div>
                  <div className="text-xs text-gray-400">≈ $12.50</div>
                </div>
                <button
                  onClick={() => {
                    if (!isApplied) {
                      setIsApplied(true)
                    }
                  }}
                  className={`px-4 py-2 text-white rounded-xl font-semibold transition-all duration-500 transform ${isApplied
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 cursor-not-allowed scale-105'
                    : 'bg-gradient-to-r from-green-500 to-blue-500 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25'
                    }`}
                  disabled={isApplied}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isApplied ? (
                      <>
                        <span className="animate-bounce">🚀</span>
                        <span className="animate-pulse">Coming Soon</span>
                      </>
                    ) : (
                      'Apply Now'
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Enhanced How It Works Section */}
        <section className="max-w-6xl mx-auto mt-24 px-4 relative z-10">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              How It Works
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Simple, secure, and transparent workflow powered by blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎯",
                title: "Post a Task",
                desc: "Describe your task and assign payment in Solana.",
                gradient: "from-purple-500 to-blue-500"
              },
              {
                icon: "🔒",
                title: "Smart Contract",
                desc: "Funds are held securely until task is approved.",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: "✅",
                title: "Get Results",
                desc: "Worker completes task, you approve & pay.",
                gradient: "from-cyan-500 to-green-500"
              }
            ].map((item, i) => (
              <div key={i} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500`}></div>
                <div className="relative flex flex-col items-center text-center p-8 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl min-h-[180px] transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                  <h4 className="text-lg font-bold text-white mb-3">{item.title}</h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>

                  {/* Step indicator */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <TrustSecuritySection />
        <FeeCalculator />
        <TestimonialsSection />

        {/* Enhanced Footer */}
        <footer className="relative z-10 py-16 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <div className="mb-8">
              <TwitterButton />

              <div className="relative w-full max-w-md mx-auto mt-8 mb-8">
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent blur-sm"></div>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm mb-8">
                <button
                  onClick={() => openModal('privacy')}
                  className="text-gray-400 hover:text-purple-400 transition-colors duration-300 hover:underline"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => openModal('terms')}
                  className="text-gray-400 hover:text-purple-400 transition-colors duration-300 hover:underline"
                >
                  Terms of Service
                </button>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 hover:underline">
                  Documentation
                </a>
              </div>
            </div>

            <div className="text-sm text-gray-400 border-t border-white/10 pt-8">
              <p className="mb-2">© 2025 Workly. Built with ❤️ on Solana.</p>
              <p className="text-xs text-gray-500">Powered by blockchain technology and smart contracts</p>
            </div>
          </div>
        </footer>
      </div>

      <RegisterModal
        isOpen={modals.register}
        onClose={() => closeModal('register')}
      />

      <LoginModal
        isOpen={modals.login}
        onClose={() => closeModal('login')}
      />

      <PrivacyModal
        isOpen={modals.privacy}
        onClose={() => closeModal('privacy')}
      />

      <TermsModal
        isOpen={modals.terms}
        onClose={() => closeModal('terms')}
      />

      <HowItWorksModal
        isOpen={modals.howItWorks}
        onClose={() => closeModal('howItWorks')}
      />

      {modals.apply && (
        <ApplyModal
          isOpen={modals.apply}
          onClose={() => closeModal('apply')}
          taskTitle={currentTask}
          taskId={currentTask}
        />
      )}

      {/* Custom Styles for Enhanced Effects */}
      <style jsx>{`
        .glass-morphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }

        .cyber-border {
          position: relative;
          overflow: hidden;
        }

        .cyber-border::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(147, 51, 234, 0.4),
            transparent
          );
          transition: left 0.5s;
        }

        .cyber-border:hover::before {
          left: 100%;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-float-1 {
          animation: float1 8s ease-in-out infinite;
          left: 15%;
          top: 20%;
        }

        .animate-float-2 {
          animation: float2 12s ease-in-out infinite;
          right: 10%;
          top: 30%;
        }

        .animate-float-3 {
          animation: float3 10s ease-in-out infinite;
          left: 25%;
          bottom: 25%;
        }

        .animate-float-4 {
          animation: float4 14s ease-in-out infinite;
          right: 20%;
          bottom: 40%;
        }

        .animate-float-5 {
          animation: float5 6s ease-in-out infinite;
          left: 60%;
          top: 15%;
        }

        @keyframes float1 {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(30px, -40px) scale(1.1);
          }
          50% {
            transform: translate(-20px, -60px) scale(0.9);
          }
          75% {
            transform: translate(-40px, -20px) scale(1.05);
          }
        }

        @keyframes float2 {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(-50px, 30px) scale(1.2);
          }
          66% {
            transform: translate(40px, -30px) scale(0.8);
          }
        }

        @keyframes float3 {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          20% {
            transform: translate(20px, -30px) scale(1.1);
          }
          40% {
            transform: translate(-30px, -50px) scale(0.9);
          }
          60% {
            transform: translate(50px, -20px) scale(1.15);
          }
          80% {
            transform: translate(-10px, 10px) scale(0.95);
          }
        }

        @keyframes float4 {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          25% {
            transform: translate(-60px, -20px) scale(1.3);
          }
          50% {
            transform: translate(20px, -70px) scale(0.7);
          }
          75% {
            transform: translate(40px, 30px) scale(1.1);
          }
        }

        @keyframes float5 {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          50% {
            transform: translate(-25px, -45px) scale(1.4);
          }
        }

        /* Enhanced particle effects */
        .particle-field {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(147, 51, 234, 0.6);
          border-radius: 50%;
          animation: particleFloat 20s linear infinite;
        }

        @keyframes particleFloat {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }

        /* Responsive improvements */
        @media (max-width: 768px) {
          .glass-morphism {
            backdrop-filter: blur(10px);
          }
          
          .animate-float,
          .animate-float-slow {
            animation: none;
          }
        }

        /* Performance optimizations */
        * {
          will-change: auto;
        }

        .transform {
          will-change: transform;
        }

        .transition-all {
          will-change: transform, opacity, background-color, border-color, box-shadow;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .glass-morphism {
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid white;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in,
          .animate-gradient,
          .animate-float,
          .animate-float-slow,
          .animate-pulse {
            animation: none;
          }
          
          .transition-all {
            transition: none;
          }
        }
      `}</style>
    </>
  )
}