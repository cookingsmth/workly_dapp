import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Link from 'next/link'

// Импорты компонентов
import { RegisterModal } from '../components/RegisterModal'
import { LoginModal } from '../components/LoginModal'
import { PrivacyModal } from '../components/PrivacyModal'
import { TermsModal } from '../components/TermsModal'
import { HowItWorksModal } from '../components/HowItWorksModal'
import ApplyModal from '../components/ApplyModal'
import TrendingTasks from '../components/TrendingTasks'

// Импорт хука
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const router = useRouter()
  
  // Используем useAuth вместо локального состояния
  const { user, isLoading, logout } = useAuth()

  // Состояние модалов
  const [modals, setModals] = useState({
    register: false,
    login: false,
    privacy: false,
    terms: false,
    howItWorks: false,
    apply: false
  })

  const [currentTask, setCurrentTask] = useState("")

  // Функции для управления модалами
  const openModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: true }))
  }

  const closeModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }))
  }

  const handleLogout = () => {
    logout()
    // Можно добавить уведомление об успешном выходе
  }

  // Показываем загрузку пока проверяем авторизацию
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Loading Workly...
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Workly — Web3 Task Platform</title>
        <link rel="icon" href="/workly.png" sizes='64x64' type='image/png' />
      </Head>

      <div className="relative min-h-[110vh] bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white overflow-hidden">
        {/* Блоб-фон */}
        <div className="absolute top-[-120px] left-[-100px] w-[300px] h-[300px] bg-purple-500 opacity-30 rounded-full blur-3xl animate-float z-0"></div>
        <div className="absolute top-[200px] right-[-120px] w-[250px] h-[250px] bg-blue-500 opacity-20 rounded-full blur-2xl animate-float-slow z-0"></div>
        <div className="absolute bottom-[-140px] left-[50%] translate-x-[-50%] w-[400px] h-[400px] bg-pink-600 opacity-20 rounded-full blur-3xl animate-float z-0"></div>

        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center w-[95%] max-w-[1200px] px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <img src="/workly.png" alt="Logo" className="w-10 h-10 animate-pulse" />
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-purple-700 bg-clip-text text-transparent">
              WORKLY
            </h1>
          </div>

          <nav className="hidden md:flex space-x-4 items-center text-sm text-gray-300 font-medium">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-purple-300">
                  👋 Hi, <span className="font-bold">{user.username}</span>
                </span>
                <Link href="/profile">
                  <button className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition">
                    Profile
                  </button>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl border border-red-400/40 text-red-300 hover:bg-red-500/10 hover:scale-105 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => openModal('howItWorks')}
                  className="px-4 py-2 rounded-xl border border-purple-500/40 bg-black/30 text-white font-semibold backdrop-blur-sm hover:border-purple-400/80 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
                >
                  How It Works
                </button>

                <button
                  onClick={() => openModal('register')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-blue-500 text-white font-semibold shadow-md hover:scale-105 transition"
                >
                  Register
                </button>

                <button
                  onClick={() => openModal('login')}
                  className="px-4 py-2 rounded-xl border border-purple-400/40 text-white hover:scale-105 transition"
                >
                  Login
                </button>
              </>
            )}
          </nav>
        </header>

        <main className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-10 mt-40 mb-28 animate-fade-in">
          <div>
            <h2 className="text-4xl sm:text-5xl font-extrabold my-6 py-2 mb-6 bg-gradient-to-r from-blue-300 via-cyan-300 to-purple-400 bg-clip-text text-transparent animate-gradient overflow-visible">
              Web3 platform for tasks with payment in crypto
            </h2>
            <p className="text-lg text-gray-300 mb-10 max-w-xl">
              Post simple tasks and get them done quickly, with payments guaranteed by a smart contract.
            </p>
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => router.push('/tasks')}
                className="group px-8 py-4 rounded-2xl font-bold text-white text-lg shadow-xl bg-gradient-to-r from-[#a259ff] via-[#4d66ff] to-[#23c6e0] hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 animate-gradient-shift"
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Get Started
                </span>
              </button>
              <button className="group px-8 py-4 rounded-2xl font-bold text-white text-lg border-2 border-purple-500/50 bg-transparent hover:bg-purple-500/10 hover:scale-105 hover:shadow-xl transition-all duration-300 cyber-border">
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Watch Demo
                </span>
              </button>
            </div>
            <p className="text-sm text-gray-400">
              All payments in <span className="text-blue-300 font-semibold">SOL</span>, <span className="text-green-300 font-semibold">USDT</span>, or <span className="text-cyan-300 font-semibold">USDC</span>
            </p>
          </div>

          {/* Hero card - остается без изменений */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
            <div className="relative glass-morphism p-8 rounded-3xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 max-w-md mx-auto">
              <div className="absolute top-7 right-0 -translate-y-1 translate-x-4 rotate-[45deg] text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] pointer-events-none select-none">
                Example
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="inline-block text-xs uppercase font-bold px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-600 to-blue-400 text-white animate-pulse">
                  🔥 New Task Posted
                </span>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
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
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
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
                  <div className="text-2xl font-bold text-cyan-300">12.5 USDT</div>
                  <div className="text-xs text-gray-400">≈ $12.50</div>
                </div>
                <button
                  onClick={() => {
                    setCurrentTask("Translate article from English to Spanish")
                    openModal('apply')
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 hover:shadow-lg"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Остальные секции */}
        <section className="max-w-6xl mx-auto mt-24 px-4">
          <h3 className="text-2xl font-bold mb-8 text-white text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "🎯", title: "Post a Task", desc: "Describe your task and assign payment in crypto." },
              { icon: "🔒", title: "Smart Contract", desc: "Funds are held securely until task is approved." },
              { icon: "✅", title: "Get Results", desc: "Worker completes task, you approve & pay." }
            ].map((item, i) => (
              <div key={i} className="group flex flex-col items-center text-center p-6 bg-gradient-to-br from-[#1f2937] to-[#111827] rounded-2xl shadow-md min-h-[140px] transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h4 className="text-base font-semibold text-white">{item.title}</h4>
                <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <TrendingTasks />

        <footer className="text-center py-12 text-sm text-gray-400">
          © 2025 Workly. Built with ❤️ on Solana.
          <div className="relative text-center mb-8">
            <div className="flex items-center justify-center gap-6 mb-6">
              {[
                { name: 'Twitter', icon: '🐦', href: '#' },
                { name: 'Discord', icon: '💬', href: '#' },
                { name: 'Telegram', icon: '✈️', href: '#' },
                { name: 'GitHub', icon: '🐙', href: '#' }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-12 h-12 rounded-full glass-morphism flex items-center justify-center text-xl hover:scale-110 hover:bg-white/10 transition-all duration-300"
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 text-sm">
              <button 
                onClick={() => openModal('privacy')} 
                className="hover:text-purple-400 transition-colors duration-300"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => openModal('terms')} 
                className="hover:text-purple-400 transition-colors duration-300"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Модальные окна */}
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

      {/* Старый ApplyModal пока оставляем */}
      {modals.apply && (
        <ApplyModal
          isOpen={modals.apply}
          onClose={() => closeModal('apply')}
          taskTitle={currentTask}
        />
      )}
    </>
  )
}