import { useRouter } from 'next/router'
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTaskStore } from '../../../stores/taskStore'

interface Task {
  id: string | number
  status?: 'accepted' | 'submitted' | 'open' | string
}

export default function WaitingPage() {
  const router = useRouter()
  const { id } = router.query
  const { tasks } = useTaskStore()
  const task = tasks.find((t: Task) => t.id === id)
  const [vantaEffect, setVantaEffect] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const vantaRef = useRef<HTMLDivElement>(null)
  const taskStatus = (task as Task)?.status
  const taskId = (task as Task)?.id

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let vantaInstance: any = null
    let animationId: number | null = null

    const loadVanta = async () => {
      try {
        const THREE = await import('three')
        // @ts-ignore
        const VANTA = await import('vanta/dist/vanta.rings.min')

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
          backgroundColor: 0x0b0f1a,
          color: 0x6366f1,
          colorMode: 'lerp',
          pointSize: 3.0,
          pointOpacity: 1.0,
        })

        setVantaEffect(vantaInstance)

        const animateVanta = () => {
          if (vantaInstance && vantaInstance.setOptions) {
            const time = Date.now() * 0.001
            const pointSize = 2.5 + Math.sin(time * 0.8) * 1.5
            const pointOpacity = 0.8 + Math.sin(time * 0.6) * 0.3

            vantaInstance.setOptions({
              pointSize: pointSize,
              pointOpacity: pointOpacity
            })
          }
          animationId = requestAnimationFrame(animateVanta)
        }

        animateVanta()

      } catch (error) {
        console.log('Vanta rings failed, trying cells:', error)

        try {
          // @ts-ignore
          const VANTA_CELLS = await import('vanta/dist/vanta.cells.min')

          vantaInstance = (VANTA_CELLS as any).default({
            el: vantaRef.current,
            THREE: await import('three'),
            mouseControls: true,
            touchControls: true,
            color1: 0x6366f1,
            color2: 0x8b5cf6,
            size: 2.0,
            speed: 1.2,
            scale: 1.0
          })

          setVantaEffect(vantaInstance)

        } catch (cellsError) {
          console.log('All Vanta effects failed:', cellsError)
        }
      }
    }

    if (!vantaEffect && vantaRef.current) {
      loadVanta()
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      console.log("Current task status:", taskStatus)
      if (vantaInstance) {
        try {
          vantaInstance.destroy()
        } catch (error) {
          console.log('Error destroying Vanta:', error)
        }
      }
    }
  }, [mounted, taskStatus])

  useEffect(() => {
    if (!mounted || !router.isReady) return
    if (!id || typeof id !== 'string' || id === 'undefined') return

    console.log('Setting up auto-redirect for ID:', id)
    
    const timeout = setTimeout(() => {
      console.log('Auto-redirecting to chat after 3 seconds...')
      router.push(`/task/${id}/chat`)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [mounted, router.isReady, id, router])

  useEffect(() => {
    if (!mounted || !router.isReady) return
    const taskStatus: 'accepted' | 'submitted' | 'open' | string | undefined = (task as Task)?.status
    if (typeof id === 'string' && id !== 'undefined' && taskStatus === 'accepted') {
      console.log('Task accepted, redirecting to chat immediately...')
      router.push(`/task/${id}/chat`)
    }
  }, [mounted, router.isReady, id, taskStatus, router, task])

  useEffect(() => {
    if (!mounted) return

    const handleResize = () => {
      if (vantaEffect && vantaEffect.resize) {
        vantaEffect.resize()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [vantaEffect, mounted])

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 2
        return newProgress > 95 ? 95 : newProgress
      })
    }, 2000)

    return () => clearInterval(progressTimer)
  }, [])

  const formatTime = (date: Date) => {
    if (!mounted || !date) return '--:--:--'
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (!mounted || !router.isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Waiting for Approval — Workly</title>
      </Head>

      <div ref={vantaRef} className="min-h-screen text-white relative overflow-hidden">

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Orbiting elements */}
          <div className="absolute top-20 left-20 w-4 h-4 bg-purple-400 rounded-full opacity-60 animate-orbit-1"></div>
          <div className="absolute top-40 right-32 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-orbit-2"></div>
          <div className="absolute bottom-40 left-40 w-5 h-5 bg-cyan-400 rounded-full opacity-40 animate-orbit-3"></div>
          <div className="absolute bottom-20 right-20 w-3 h-3 bg-pink-400 rounded-full opacity-55 animate-orbit-4"></div>

          {/* Glowing rings */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-purple-500/20 rounded-full animate-pulse-ring-1"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-blue-500/20 rounded-full animate-pulse-ring-2"></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 border border-cyan-500/15 rounded-full animate-pulse-ring-3"></div>
        </div>

        {/* Navigation */}
        <div className="absolute top-6 left-6 z-50">
          <Link href="/tasks" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tasks
          </Link>
        </div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center space-y-8 max-w-2xl mx-auto">

            {/* Main Icon with Animation */}
            <div className="relative">
              <div className="mb-4">
                <img src="/workly.png" alt="Workly Logo" className="w-28 h-28 mx-auto animate-pulse" />
              </div>

              {/* Rotating ring around icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-transparent border-t-purple-500 border-r-blue-500 rounded-full animate-spin-slow"></div>
              </div>

              {/* Progress ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="68"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="68"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 68}`}
                    strokeDashoffset={`${2 * Math.PI * 68 * (1 - progress / 100)}`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Waiting for Approval
              </h1>

              <div className="space-y-3">
                <p className="text-xl text-gray-300 leading-relaxed">
                  You've successfully applied to task{' '}
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-purple-300 font-bold">
                    #{id}
                  </span>
                </p>

                <p className="text-lg text-gray-400">
                  Once the client accepts your application, a private chat will open and you can start working!
                </p>
              </div>
            </div>
            
            {/* Status Cards */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-8">
              {/* Application Status */}
              <div className="bg-white/5 p-6 rounded-2xl w-72 text-center shadow-md">
                <div className="text-sm text-gray-400 mb-2 flex items-center justify-center gap-1">
                  <span className="text-green-400 text-base">●</span> Application Status
                </div>
                <div className="text-green-400 text-xl font-semibold">
                  {taskStatus === 'accepted' ? 'Accepted' : 'Submitted'}
                </div>
                <div className="text-xs text-gray-500">
                  {taskStatus === 'accepted' ? 'Redirecting to chat...' : 'Waiting for review'}
                </div>
              </div>

              {/* Processing */}
              <div className="bg-white/5 p-6 rounded-2xl w-72 text-center shadow-md">
                <div className="text-sm text-gray-400 mb-2 flex items-center justify-center gap-1">
                  <span className="text-blue-400">📊</span> Processing
                </div>
                <div className="text-blue-400 text-xl font-semibold">
                  {Math.round(progress)}%
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-blue-400 h-2 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Link href="/tasks" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-semibold text-lg hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30">
                Browse More Tasks
              </Link>

              <Link href="/profile" className="px-8 py-4 rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-xl hover:bg-white/10 font-semibold text-lg hover:scale-105 transition-all duration-300">
                View My Profile
              </Link>
            </div>

            {/* Tips Section */}
            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="text-2xl">💡</div>
                <div className="text-left">
                  <h3 className="font-bold text-yellow-300 mb-2">Pro Tip</h3>
                  <p className="text-sm text-gray-300">
                    While you wait, you can browse other available tasks or update your profile to showcase your skills!
                  </p>
                </div>
              </div>
            </div>

            {/* Debug info (можно убрать в продакшене) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 bg-black/20 p-2 rounded mt-4">
                Debug: ID = {id} | Task Status = {taskStatus || 'undefined'} | Task ID = {taskId || 'undefined'} | Router Ready = {router.isReady ? 'true' : 'false'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Styles */}
      <style jsx>{`
        @keyframes orbit-1 {
          0% { transform: rotate(0deg) translateX(100px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
        }

        @keyframes orbit-2 {
          0% { transform: rotate(0deg) translateX(80px) rotate(0deg); }
          100% { transform: rotate(-360deg) translateX(80px) rotate(360deg); }
        }

        @keyframes orbit-3 {
          0% { transform: rotate(0deg) translateX(120px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }

        @keyframes orbit-4 {
          0% { transform: rotate(0deg) translateX(90px) rotate(0deg); }
          100% { transform: rotate(-360deg) translateX(90px) rotate(360deg); }
        }

        @keyframes pulse-ring-1 {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 0.3; 
          }
          50% { 
            transform: scale(1.1) rotate(180deg); 
            opacity: 0.6; 
          }
        }

        @keyframes pulse-ring-2 {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 0.2; 
          }
          50% { 
            transform: scale(1.2) rotate(-180deg); 
            opacity: 0.5; 
          }
        }

        @keyframes pulse-ring-3 {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 0.1; 
          }
          50% { 
            transform: scale(1.15) rotate(180deg); 
            opacity: 0.4; 
          }
        }

        @keyframes pulse-slow {
          0%, 100% { 
            transform: scale(1); 
            filter: brightness(1);
          }
          50% { 
            transform: scale(1.05); 
            filter: brightness(1.2);
          }
        }

        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }

        .animate-orbit-1 { animation: orbit-1 20s linear infinite; }
        .animate-orbit-2 { animation: orbit-2 25s linear infinite; }
        .animate-orbit-3 { animation: orbit-3 30s linear infinite; }
        .animate-orbit-4 { animation: orbit-4 22s linear infinite; }

        .animate-pulse-ring-1 { animation: pulse-ring-1 4s ease-in-out infinite; }
        .animate-pulse-ring-2 { animation: pulse-ring-2 6s ease-in-out infinite; }
        .animate-pulse-ring-3 { animation: pulse-ring-3 8s ease-in-out infinite; }

        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }

        /* Responsive */
        @media (max-width: 768px) {
          .animate-orbit-1,
          .animate-orbit-2,
          .animate-orbit-3,
          .animate-orbit-4,
          .animate-pulse-ring-1,
          .animate-pulse-ring-2,
          .animate-pulse-ring-3 {
            animation: none;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  )
}