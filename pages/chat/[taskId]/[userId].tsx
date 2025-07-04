// pages/chat/[taskId]/[userId].tsx
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { ArrowLeft, Send, Paperclip, Check, CheckCheck, Sparkles, Zap } from 'lucide-react'
import { showWorklyToast } from '../../../components/WorklyToast'

interface ChatMessage {
  id: string
  senderId: string
  text: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read'
}

interface Chat {
  id: string
  taskId: string
  clientId: string
  freelancerId: string
  createdAt: string
  lastMessageAt: string
  messages: ChatMessage[]
}

interface User {
  id: string
  username: string
  email: string
}

interface ChatData {
  chat: Chat
  task: {
    id: string
    title: string
    status: string
    workerConfirmed?: boolean
    clientConfirmed?: boolean
    assignedTo?: string
    createdBy?: string
  }
  participants: {
    client: User | null
    freelancer: User | null
  }
  currentUserId: string
}

export default function ChatPage() {
  const router = useRouter()
  const { taskId, userId } = router.query

  const [mounted, setMounted] = useState(false)
  const [chatData, setChatData] = useState<ChatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmWork = async (taskId: string) => {
    try {
      console.log('Worker confirming work for task:', taskId)

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tasks/${taskId}/confirm-work`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      if (response.ok) {
        showWorklyToast('✅ Work confirmed successfully!')
        if (taskId && userId) {
          await loadChat(taskId as string, userId as string)
        }
      } else {
        showWorklyToast(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Confirm work error:', error)
      showWorklyToast('Failed to confirm work')
    }
  }

  const confirmPayment = async (taskId: string) => {
    try {
      console.log('Client confirming payment for task:', taskId)

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tasks/${taskId}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      if (response.ok) {
        showWorklyToast('💰 Payment approved and sent!')
        if (taskId && userId) {
          await loadChat(taskId as string, userId as string)
        }
      } else {
        showWorklyToast(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Confirm payment error:', error)
      showWorklyToast('Failed to confirm payment')
    }
  }

  const markTaskCompleted = async (taskId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to mark task as completed')
      }

      const result = await response.json()

      // ИСПРАВЛЕННАЯ СТРОКА: используем setChatData вместо setTask
      setChatData(prevChatData => {
        if (!prevChatData) return prevChatData;

        return {
          ...prevChatData,
          task: {
            ...prevChatData.task,
            status: 'completed',
            completedAt: new Date().toISOString()
          }
        };
      });

      console.log('Task marked as completed successfully!')

    } catch (error) {
      console.error('Error marking task as completed:', error)
      showWorklyToast(`Failed to mark task as completed: ${error.message}`)
    }
  };

  // Добавить эти функции в компонент чата после существующих функций

  // Функция для обработки выбора файла
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Проверка размера файла (максимум 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showWorklyToast('File size must be less than 10MB')
      return
    }

    // Проверка типа файла
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      showWorklyToast('File type not supported. Please use images, PDF, or document files.')
      return
    }

    setSelectedFile(file)
    uploadFile(file)
  }

  // Функция для загрузки файла
  const uploadFile = async (file: File) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Безопасное получение параметров
      const currentTaskId = typeof taskId === 'string' ? taskId : String(taskId)
      const currentChatId = chatData?.chat?.id || ''

      formData.append('taskId', currentTaskId)
      formData.append('chatId', currentChatId)

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload file')
      }

      const result = await response.json()

      // Отправить сообщение с файлом
      await sendFileMessage(result.fileUrl, result.fileName, file.type)

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
      showWorklyToast(errorMessage)
    } finally {
      setUploading(false)
      setSelectedFile(null)

      // Очистить input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Функция для отправки сообщения с файлом
  const sendFileMessage = async (fileUrl: string, fileName: string, fileType: string) => {
    if (!chatData) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Безопасное получение параметров из router
      const currentTaskId = typeof taskId === 'string' ? taskId : String(taskId)
      const currentUserId = typeof userId === 'string' ? userId : String(userId)

      const response = await fetch(`/api/chat/${currentTaskId}/${currentUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `📎 ${fileName}`,
          fileUrl: fileUrl,
          fileName: fileName,
          fileType: fileType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to send file message')
      }

      const data = await response.json()

      // Обновляем состояние чата
      setChatData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          chat: data.chat
        }
      })

      console.log('File message sent successfully!')

    } catch (error) {
      console.error('Send file message error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send file message'
      showWorklyToast(errorMessage)
    }
  }


  // Исправляем hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Загрузка чата
  useEffect(() => {
    if (mounted && router.isReady && taskId && userId && typeof taskId === 'string' && typeof userId === 'string') {
      loadChat(taskId, userId)
    }
  }, [mounted, router.isReady, taskId, userId])

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (mounted) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatData?.chat.messages, mounted])

  // Периодическое обновление чата (каждые 3 секунды)
  /*useEffect(() => {
    if (!mounted || !chatData || !router.isReady) return

    const interval = setInterval(() => {
      if (router.isReady && taskId && userId && typeof taskId === 'string' && typeof userId === 'string') {
        loadChat(taskId, userId, true) // silent update
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [mounted, chatData, router.isReady, taskId, userId])
*/
  const loadChat = async (taskId: string, userId: string, silent = false) => {
    try {
      if (!silent) setLoading(true)

      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch(`/api/chat/${taskId}/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setChatData(data)
        setError(null)
      } else {
        setError(data.message || 'Failed to load chat')
      }
    } catch (err) {
      console.error('Load chat error:', err)
      setError('Failed to load chat')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatData || sending) return

    setSending(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch(`/api/chat/${taskId}/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Обновляем чат с новым сообщением
        setChatData(prev => prev ? {
          ...prev,
          chat: data.chat
        } : null)

        setNewMessage('')
        inputRef.current?.focus()
      } else {
        throw new Error(data.message || 'Failed to send message')
      }
    } catch (err) {
      console.error('Send message error:', err)
      showNotification('Failed to send message', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (typeof window === 'undefined') return

    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white transition-all duration-300 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.opacity = '0'
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 3000)
  }

  const formatTime = (timestamp: string) => {
    if (!mounted) return ''
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (timestamp: string) => {
    if (!mounted) return ''
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-300" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-400" />
      default:
        return null
    }
  }

  // Loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1b3a] to-[#2d1b69] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-pink-400 rounded-full animate-spin animate-reverse"></div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Loading Chat</h3>
            <p className="text-gray-400 mt-2">Connecting to workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1b3a] to-[#2d1b69] text-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="text-8xl animate-bounce">💫</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">Oops!</h1>
          <p className="text-gray-300 text-lg">{error}</p>
          <Link
            href="/tasks"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl transition-all duration-300 hover:scale-105 font-semibold shadow-2xl"
          >
            ← Return to Tasks
          </Link>
        </div>
      </div>
    )
  }

  if (!chatData) {
    return null
  }

  const { chat, task, participants, currentUserId } = chatData
  const otherUser = currentUserId === participants.client?.id ? participants.freelancer : participants.client
  const otherUserInitials = otherUser?.username.split(' ').map(n => n[0]).join('').toUpperCase() || '??'

  // Группируем сообщения по дням
  const groupedMessages = chat.messages.reduce((groups: { [key: string]: ChatMessage[] }, message) => {
    const date = formatDate(message.timestamp)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})

  return (
    <>
      <Head>
        <title>Chat - {task.title} — Workly</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1b3a] to-[#2d1b69] text-white">

        {/* Top Header */}
        <div className="flex justify-center pt-8 pb-4 px-4">
          <div className="w-full max-w-7xl">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-gray-900/80 via-purple-900/20 to-blue-900/30 backdrop-blur-2xl border border-purple-500/20 rounded-3xl shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <Link href={`/applications/${taskId}`}>
                        <button className="group/btn relative p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/40 hover:to-pink-500/40 rounded-2xl transition-all duration-300 hover:scale-110 hover:rotate-3 border border-purple-400/30">
                          <ArrowLeft className="w-6 h-6 group-hover/btn:text-purple-300 transition-colors" />
                        </button>
                      </Link>

                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <div className="relative p-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl animate-pulse">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-pink-500 to-blue-500 rounded-3xl flex items-center justify-center text-lg font-bold shadow-xl">
                              {otherUserInitials}
                            </div>
                          </div>
                          <div className="absolute -bottom-1 -right-1">
                            <div className="relative">
                              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 border-4 border-gray-900 rounded-full"></div>
                              <div className="absolute inset-0 w-6 h-6 bg-green-400 rounded-full animate-ping opacity-75"></div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h2 className="text-2xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                            {otherUser?.username || 'Unknown User'}
                          </h2>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-400/30">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-sm font-semibold text-green-400">Online</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-400 font-medium">Active now</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-4">
                      <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-400/30">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-bold text-blue-400">Live Chat</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl border border-emerald-400/30">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex h-[calc(100vh-200px)]">

          {/* Left Sidebar - Task Info */}
          <div className="w-96 border-r border-white/10 bg-black/20 p-6 overflow-y-auto">

            {/* Task Header */}
            <div className="mb-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-gradient-to-br from-gray-900/70 via-orange-900/10 to-red-900/20 backdrop-blur-xl border border-orange-500/20 rounded-2xl shadow-xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <span className="text-black font-black text-lg">#</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold bg-gradient-to-r from-orange-400 via-yellow-400 to-red-400 bg-clip-text text-transparent">
                        Task #{task.id}
                      </h3>
                      <p className="text-gray-200 font-medium text-sm truncate">{task.title}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Confirmation Section */}
            <div className="bg-gradient-to-br from-teal-900/40 to-green-900/40 backdrop-blur-sm rounded-xl p-5 border border-teal-500/30 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">💰</span>
                </div>
                <h4 className="font-semibold text-teal-300 text-sm">Payment Status</h4>
              </div>

              {/* Worker Confirmation */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">W</span>
                  </div>
                  <span className="text-gray-300 text-xs">Worker</span>
                </div>

                {currentUserId === participants.freelancer?.id ? (
                  <button
                    onClick={() => confirmWork(task.id)}
                    disabled={task.workerConfirmed}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all ${task.workerConfirmed
                      ? 'bg-green-500/30 text-green-300 border border-green-400/40 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                  >
                    {task.workerConfirmed ? '✅ Work Confirmed' : '🚀 Confirm Work'}
                  </button>
                ) : (
                  <div className={`w-full py-2 px-3 rounded-lg text-center text-xs font-medium ${task.workerConfirmed
                    ? 'bg-green-500/30 text-green-300 border border-green-400/40'
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                    }`}>
                    {task.workerConfirmed ? '✅ Worker confirmed' : '⏳ Waiting...'}
                  </div>
                )}
              </div>

              {/* Client Confirmation */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <span className="text-gray-300 text-xs">Client</span>
                </div>

                {currentUserId === participants.client?.id ? (
                  <button
                    onClick={() => confirmPayment(task.id)}
                    disabled={task.clientConfirmed}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all ${task.clientConfirmed
                      ? 'bg-green-500/30 text-green-300 border border-green-400/40 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                  >
                    {task.clientConfirmed ? '✅ Payment Approved' : '💰 Approve Payment'}
                  </button>
                ) : (
                  <div className={`w-full py-2 px-3 rounded-lg text-center text-xs font-medium ${task.clientConfirmed
                    ? 'bg-green-500/30 text-green-300 border border-green-400/40'
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                    }`}>
                    {task.clientConfirmed ? '✅ Client approved' : '⏳ Waiting...'}
                  </div>
                )}
              </div>

              {/* Status & Complete Button */}
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Status:</span>
                  <div className="flex items-center gap-2">
                    {task.workerConfirmed && task.clientConfirmed ? (
                      <>
                        <span className="text-green-400 font-medium">🎉 Released!</span>

                        {task.status !== 'completed' && currentUserId === participants.client?.id && (
                          <button
                            onClick={() => markTaskCompleted(task.id)}
                            className="ml-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                          >
                            ✨ Complete
                          </button>
                        )}

                        {task.status === 'completed' && (
                          <span className="text-purple-400 font-medium ml-1">✅ Done</span>
                        )}
                      </>
                    ) : (
                      <span className="text-yellow-400 font-medium">⏳ Pending</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h5 className="font-medium text-white text-sm mb-3">Task Details</h5>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{new Date(task.createdAt || '').toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-blue-400">{task.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Chat Area */}
          <div className="flex-1 flex flex-col">



            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {Object.entries(groupedMessages).map(([date, messages]) => (
                  <div key={date}>
                    {/* Date Separator */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
                      <div className="px-4 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-400/30 backdrop-blur-xl">
                        <span className="text-xs font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                          {date}
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"></div>
                    </div>

                    {/* Messages */}
                    {messages.map((message, index) => {
                      const isCurrentUser = message.senderId === currentUserId
                      const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId

                      return (
                        <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''} group mb-4`}>

                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-2xl flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                            {isCurrentUser ? (
                              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center font-bold shadow-lg">
                                <span className="text-xs">ME</span>
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-600 rounded-2xl flex items-center justify-center font-bold shadow-lg">
                                <span className="text-xs">{otherUserInitials}</span>
                              </div>
                            )}
                          </div>

                          {/* Message Bubble */}
                          <div className={`max-w-md flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-3 rounded-2xl break-words shadow-lg ${isCurrentUser
                              ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 text-white'
                              : 'bg-gradient-to-br from-gray-800/90 via-gray-700/80 to-gray-800/90 backdrop-blur-xl text-gray-100 border border-gray-600/30'
                              } ${showAvatar ? '' : isCurrentUser ? 'rounded-tr-lg' : 'rounded-tl-lg'
                              }`}>

                              {/* Если сообщение содержит файл */}
                              {(message as any).fileUrl ? (
                                <div className="space-y-2">
                                  {/* Превью файла */}
                                  {(message as any).fileType?.startsWith('image/') ? (
                                    <div className="relative">
                                      <img
                                        src={(message as any).fileUrl}
                                        alt={(message as any).fileName}
                                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open((message as any).fileUrl, '_blank')}
                                      />
                                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                        {(message as any).fileName}
                                      </div>
                                    </div>
                                  ) : (
                                    // Для других типов файлов
                                    <div
                                      className="flex items-center gap-3 p-3 bg-black/20 rounded-lg cursor-pointer hover:bg-black/30 transition-colors border border-white/10"
                                      onClick={() => window.open((message as any).fileUrl, '_blank')}
                                    >
                                      <div className="p-2 bg-blue-500/20 rounded-lg">
                                        {(message as any).fileType?.includes('pdf') ? (
                                          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 18h12V6l-4-4H4v16z M13 7V4l3 3h-3z" />
                                          </svg>
                                        ) : (message as any).fileType?.includes('document') || (message as any).fileType?.includes('word') ? (
                                          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 18h12V6l-4-4H4v16z M13 7V4l3 3h-3z" />
                                          </svg>
                                        ) : (
                                          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 18h12V6l-4-4H4v16z M13 7V4l3 3h-3z" />
                                          </svg>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{(message as any).fileName}</div>
                                        <div className="text-xs opacity-70">Click to download</div>
                                      </div>
                                      <div className="text-xs opacity-50">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                        </svg>
                                      </div>
                                    </div>
                                  )}

                                  {/* Текст сообщения, если есть */}
                                  {message.text && message.text !== `📎 ${(message as any).fileName}` && (
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                                  )}
                                </div>
                              ) : (
                                // Обычное текстовое сообщение
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                              )}
                            </div>

                            {/* Message Info */}
                            <div className={`flex items-center gap-2 mt-2 text-xs ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                              <span className="text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
                                {formatTime(message.timestamp)}
                              </span>
                              {isCurrentUser && (
                                <div className="flex items-center">
                                  {getStatusIcon(message.status)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}

                {chat.messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl">💬</span>
                    </div>
                    <h3 className="text-xl font-semibold text-purple-300 mb-2">Start the conversation!</h3>
                    <p className="text-gray-400">Send your first message to begin collaborating</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 bg-black/10">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-3">
                  <div className="flex items-center gap-3">

                    {/* ДОБАВЛЕНО - Скрытый input для файлов */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />

                    {/* ИЗМЕНЕНО - Кнопка прикрепления файлов */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || sending}
                      className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Paperclip size={18} />
                    </button>

                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message and press Enter to send..."
                      disabled={sending}
                      className="flex-1 bg-transparent border-none text-white placeholder-gray-400 focus:outline-none disabled:opacity-50 text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className={`p-2 rounded-xl transition-all ${newMessage.trim() && !sending
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      {sending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}