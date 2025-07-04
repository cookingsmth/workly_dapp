import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Phone, Video, Clock, CheckCheck } from 'lucide-react'
import { useTaskStore } from '../../../../stores/taskStore'

interface Message {
  id: number
  text: string
  sender: 'freelancer' | 'client'
  timestamp: Date
  status: 'sent' | 'delivered' | 'read'
}

export default function ChatPage() {
  const router = useRouter()
  const { id } = router.query
  const { tasks } = useTaskStore()
  const task = tasks.find(t => t.id === id)

  const [mounted, setMounted] = useState<boolean>(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState<string>('')
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [lastSeen, setLastSeen] = useState<Date>(new Date(Date.now() - 300000))
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Исправляем hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (mounted) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, mounted])

  // Simulate typing indicator
  useEffect(() => {
    if (isTyping && mounted) {
      const timer = setTimeout(() => setIsTyping(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isTyping, mounted])

  // Умные ответы от клиента (улучшенные на основе диалога)
  const getClientResponse = (userMessage: string) => {
    const msg = userMessage.toLowerCase()

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('excited')) {
      return "Hi! Great to meet you. I'm really excited about this viral meme project. Do you have any initial ideas for how to make it shareable?"
    }

    if (msg.includes('idea') || msg.includes('concept') || msg.includes('meme') || msg.includes('freelance') || msg.includes('hustle')) {
      return "I love that direction! For Workly, I think we need something that really captures the freelance hustle. Maybe something about finding the perfect gig? What's your take?"
    }

    if (msg.includes('image') || msg.includes('format') || msg.includes('video') || msg.includes('picture') || msg.includes('template')) {
      return "Better as a picture — maybe in classic meme format. Main thing is to have a recognizable style and Workly subtitle clearly visible."
    }

    if (msg.includes('guy') || msg.includes('caption') || msg.includes('how') || msg.includes('bed') || msg.includes('past')) {
      return "😂 Excellent! Add some crypto element there too — like Doge or something, so it's immediately obvious. And we put it everywhere."
    }

    if (msg.includes('send') || msg.includes('30 minutes') || msg.includes('send variant')) {
      return "Perfect! Take your time to make it amazing. Looking forward to seeing what you create! 🎨"
    }

    if (msg.includes('time') || msg.includes('deadline') || msg.includes('when') || msg.includes('timeline')) {
      return "We're hoping to launch this within the next week to coincide with our marketing push. Think that's doable? Quality is key though!"
    }

    if (msg.includes('workly') || msg.includes('brand') || msg.includes('company')) {
      return "Workly is all about connecting talented freelancers with great opportunities. The meme should feel authentic to that experience - not too corporate, you know?"
    }

    // Дефолтные ответы
    const defaultResponses = [
      "That sounds interesting! Tell me more about your approach.",
      "I like where you're going with this. How do you plan to execute it?",
      "Great point! Let's brainstorm some more ideas around that.",
      "Perfect! I'm confident this is going to be amazing.",
      "Exactly what I was thinking! You really get our brand.",
      "This is why I chose you for this project. Looking forward to seeing what you create!"
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  // Автоматический ответ от клиента на сообщения
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]

      // Если последнее сообщение от фрилансера, клиент отвечает
      if (lastMessage.sender === 'freelancer' && !isTyping) {
        setIsTyping(true)

        const timeout = setTimeout(() => {
          const response = getClientResponse(lastMessage.text)

          setMessages(prev => [...prev, {
            id: Date.now() + Math.random(), // Уникальный ID
            text: response,
            sender: 'client',
            timestamp: new Date(),
            status: 'read'
          }])
          setIsTyping(false)
        }, 1500 + Math.random() * 2000) // 1.5-3.5 секунд задержки

        return () => clearTimeout(timeout)
      }
    }
  }, [messages.length]) // Изменили dependency

  // Убираем случайные ответы
  // useEffect(() => {
  //   if (!mounted) return

  //   const interval = setInterval(() => {
  //     if (Math.random() > 0.85) { // 15% chance every 15 seconds
  //       setIsTyping(true)
  //       setTimeout(() => {
  //         const responses = [
  //           "Sounds good to me!",
  //           "Let me check my calendar and get back to you.",
  //           "I'll send over the additional requirements shortly.",
  //           "Thanks for the update!",
  //           "Looking forward to seeing the progress."
  //         ]
  //         const randomResponse = responses[Math.floor(Math.random() * responses.length)]

  //         setMessages(prev => [...prev, {
  //           id: Date.now(),
  //           text: randomResponse,
  //           sender: 'client',
  //           timestamp: new Date(),
  //           status: 'read'
  //         }])
  //         setIsTyping(false)
  //       }, 2000)
  //     }
  //   }, 15000)

  //   return () => clearInterval(interval)
  // }, [mounted])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'freelancer',
      timestamp: new Date(),
      status: 'sent'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Simulate message status updates
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === message.id ? { ...msg, status: 'delivered' } : msg
      ))
    }, 1000)

    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === message.id ? { ...msg, status: 'read' } : msg
      ))
    }, 3000)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date): string => {
    if (!mounted || !date) return ''
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatLastSeen = (date: Date): string => {
    if (!mounted || !date) return ''
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCheck className="w-4 h-4 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-300" />
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-400" />
      default:
        return null
    }
  }

  // Loading state пока роутер не готов
  if (!mounted || !id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading chat...</p>
        </div>
      </div>
    )
  }

  // Показываем ошибку если task не найден - УБИРАЕМ ЭТО
  // if (!task) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
  //       <div className="text-center space-y-4">
  //         <div className="text-6xl">❌</div>
  //         <h1 className="text-2xl font-bold text-red-400">Task Not Found</h1>
  //         <p className="text-gray-300">Task with ID "{id}" does not exist.</p>
  //         <Link 
  //           href="/tasks" 
  //           className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
  //         >
  //           Back to Tasks
  //         </Link>
  //       </div>
  //     </div>
  //   )
  // }

  // Получаем имя клиента или используем дефолтное (ДАЖЕ ЕСЛИ TASK НЕ НАЙДЕН)
  const getTaskInfo = (taskId: string | string[] | undefined) => {
    // Проверяем ID и возвращаем соответствующие данные
    const foundTask = tasks.find(t => t.id === taskId)

    if (foundTask) {
      return {
        clientName: foundTask.client || foundTask.clientName || 'Sarah Wilson',
        title: foundTask.title
      }
    }

    if (taskId === '1') {
      return {
        clientName: 'Sarah Wilson',
        title: 'Create viral meme for Workly'
      }
    }
    // Дефолтные данные для других ID
    return {
      clientName: task?.client || task?.clientName || 'John Doe',
      title: task?.title || task?.name || 'Modern E-commerce Website Development'
    }
  }

  const taskInfo = getTaskInfo(id)
  const clientName = taskInfo.clientName
  const clientInitials = clientName.split(' ').map(n => n[0]).join('').toUpperCase()
  const taskTitle = taskInfo.title

  return (
    <>
      <Head>
        <title>Chat for Task #{id} — Workly</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">

        {/* Header */}
        <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Link href={`/task/${id}/waiting`}>
              <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-lg font-bold">
                  {clientInitials}
                </div>
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-slate-900 rounded-full"></div>
                )}
              </div>

              <div>
                <h2 className="font-semibold text-lg">{clientName}</h2>
                <p className="text-sm text-gray-400">
                  {isOnline ? (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last seen {formatLastSeen(lastSeen)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-3 hover:bg-white/10 rounded-xl transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-3 hover:bg-white/10 rounded-xl transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-3 hover:bg-white/10 rounded-xl transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Task Info Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-purple-500/20 p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-black font-bold">
              #
            </div>
            <div>
              <h3 className="font-semibold text-purple-300">Task #{id}</h3>
              <p className="text-sm text-gray-400">{taskTitle}</p>
            </div>
            <div className="ml-auto">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                {task?.status === 'accepted' ? 'In Progress' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139, 92, 246, 0.5) rgba(255, 255, 255, 0.1)' }}>
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Date Separator */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-xs text-gray-500 bg-black/20 px-3 py-1 rounded-full">
                Today
              </span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {messages.map((message, index) => {
              const isFreelancer = message.sender === 'freelancer'
              const showAvatar = index === 0 || messages[index - 1].sender !== message.sender

              return (
                <div key={message.id} className={`flex gap-3 ${isFreelancer ? 'flex-row-reverse' : ''} group`}>

                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                    {isFreelancer ? (
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                        ME
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                        {clientInitials}
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-md flex flex-col ${isFreelancer ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl ${isFreelancer
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                      : 'bg-white/10 backdrop-blur-sm text-white'
                      } ${showAvatar ? '' : isFreelancer ? 'rounded-tr-lg' : 'rounded-tl-lg'
                      } hover:scale-105 transition-transform cursor-pointer group-hover:shadow-lg`}>
                      <p className="text-sm leading-relaxed">{message.text}</p>
                    </div>

                    {/* Message Info */}
                    <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isFreelancer ? 'flex-row-reverse' : ''
                      }`}>
                      <span>{formatTime(message.timestamp)}</span>
                      {isFreelancer && (
                        <div className="flex items-center">
                          {getStatusIcon(message.status)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {clientInitials}
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-black/20 backdrop-blur-xl border-t border-white/10 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3">

              {/* Attachment Button */}
              <div className="flex-shrink-0">
                <button
                  type="button"
                  className="h-12 w-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-gray-400 hover:text-white"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>

              {/* Message Input Container */}
              <div className="flex-1 relative">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type your message... (Press Enter to send)"
                    className="w-full h-12 px-4 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />

                  {/* Emoji Button */}
                  <button
                    type="button"
                    className="absolute right-3 h-6 w-6 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Send Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className={`h-12 w-12 flex items-center justify-center rounded-xl transition-all ${newMessage.trim()
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </>
  )
}