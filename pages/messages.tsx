import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import ProfileWidget from '../components/ProfileWidget'
import Link from 'next/link'
import { Search, MessageCircle, User, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import Head from 'next/head'

interface ChatPreview {
  id: string
  taskId: string
  taskTitle: string
  participantId: string
  participantName: string
  participantEmail: string
  lastMessage: {
    text: string
    timestamp: string
    senderId: string
  } | null
  unreadCount: number
  lastActivity: string
}

interface User {
  id: string
  username: string
  email?: string
}

export default function MessagesPage() {
  const { user, isLoading } = useAuth()
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingChats, setLoadingChats] = useState(true)

  useEffect(() => {
    if (user) {
      loadChats()
    }
  }, [user])

  const loadChats = async () => {
    try {
      setLoadingChats(true)
      const response = await fetch('/api/chats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setChats(data.chats || [])
      }
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setLoadingChats(false)
    }
  }

  const filteredChats = chats.filter((chat: ChatPreview) =>
    chat.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.lastMessage?.text || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const truncateMessage = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26]">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26]">
        <div className="text-white">Please log in to view messages</div>
      </div>
    )
  }

  return (
        
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] flex flex-col">
      <Head>
        <title>Workly - Messages</title>
        <link rel="icon" href="/workly.png" sizes="64x64" type="image/png" />
        <meta name="description" content="Web3 platform for tasks with payment in Solana. Post simple tasks and get them done quickly, with payments guaranteed by smart contracts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <ProfileWidget />
      <div className="flex-1 container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
            <p className="text-white/60">Your conversations and project discussions</p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Chats List */}
          <div className="space-y-3">
            {loadingChats ? (
              <div className="text-center py-12">
                <div className="text-white/60">Loading conversations...</div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </h3>
                <p className="text-white/60 mb-6">
                  {searchQuery 
                    ? 'Try adjusting your search terms.'
                    : 'Start working on tasks to begin conversations with clients and freelancers.'
                  }
                </p>
                {!searchQuery && (
                  <Link
                    href="/tasks"
                    className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Browse Tasks
                  </Link>
                )}
              </div>
            ) : (
              filteredChats.map((chat: ChatPreview, index: number) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={`/chat/${chat.taskId}/${chat.participantId}`}
                    className="block p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center font-bold text-white text-lg">
                          {chat.participantName[0].toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white truncate">
                                {chat.participantName}
                              </h3>
                              {chat.unreadCount > 0 && (
                                <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-white/60 text-sm mb-1 truncate">
                              Task: {chat.taskTitle}
                            </p>
                            
                            {chat.lastMessage ? (
                              <p className="text-white/40 text-sm truncate">
                                {chat.lastMessage.senderId === (user as User).id ? 'You: ' : ''}
                                {truncateMessage(chat.lastMessage.text)}
                              </p>
                            ) : (
                              <p className="text-white/40 text-sm italic">
                                No messages yet
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 ml-4">
                            {chat.lastMessage && (
                              <span className="text-white/40 text-xs">
                                {formatTimestamp(chat.lastMessage.timestamp)}
                              </span>
                            )}
                            
                            <div className="flex items-center gap-1 text-white/30">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">
                                {formatTimestamp(chat.lastActivity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          {!loadingChats && chats.length > 0 && (
            <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl">
              <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/tasks"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                >
                  Browse New Tasks
                </Link>
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                >
                  Update Profile
                </Link>
                <button
                  onClick={loadChats}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}