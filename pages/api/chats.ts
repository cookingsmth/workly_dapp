// pages/api/chats.ts
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'

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

// Пути к файлам
const getChatsFilePath = () => path.join(process.cwd(), 'data', 'chats.json')
const getTasksFilePath = () => path.join(process.cwd(), 'data', 'tasks.json')
const getUsersFilePath = () => path.join(process.cwd(), 'data', 'users.json')

// Функции для работы с файлами
const loadChats = (): Chat[] => {
  const filePath = getChatsFilePath()
  
  if (!fs.existsSync(filePath)) {
    return []
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading chats:', error)
    return []
  }
}

const loadTasks = () => {
  const filePath = getTasksFilePath()
  
  if (!fs.existsSync(filePath)) {
    return []
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading tasks:', error)
    return []
  }
}

const loadUsers = () => {
  const filePath = getUsersFilePath()
  
  if (!fs.existsSync(filePath)) {
    return []
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}

// Проверка токена
const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'workly-local-secret-key-2025'
    ) as { userId: string }
    return decoded
  } catch (error) {
    return null
  }
}

const getUserFromToken = (authHeader: string) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)
  
  if (!decoded) return null

  try {
    const users = loadUsers()
    const user = users.find((u: any) => u.id === decoded.userId)
    
    if (!user) return null

    return {
      id: user.id,
      username: user.username,
      email: user.email
    }
  } catch (error) {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  // Проверяем аутентификацию
  const currentUser = getUserFromToken(req.headers.authorization)
  
  if (!currentUser) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    })
  }

  if (method === 'GET') {
    try {
      // Загружаем данные
      const chats = loadChats()
      const tasks = loadTasks()
      const users = loadUsers()

      // Фильтруем чаты для текущего пользователя
      const userChats = chats.filter(chat => 
        chat.clientId === currentUser.id || chat.freelancerId === currentUser.id
      )

      // Создаем превью чатов
      const chatPreviews: ChatPreview[] = userChats.map(chat => {
        // Определяем участника (не текущего пользователя)
        const participantId = chat.clientId === currentUser.id 
          ? chat.freelancerId 
          : chat.clientId
        
        const participant = users.find((u: any) => u.id === participantId)
        const task = tasks.find((t: any) => t.id === chat.taskId)
        
        // Последнее сообщение
        const lastMessage = chat.messages.length > 0 
          ? chat.messages[chat.messages.length - 1]
          : null

        // Подсчет непрочитанных сообщений
        const unreadCount = chat.messages.filter(msg => 
          msg.senderId !== currentUser.id && msg.status !== 'read'
        ).length

        return {
          id: chat.id,
          taskId: chat.taskId,
          taskTitle: task?.title || 'Unknown Task',
          participantId,
          participantName: participant?.username || 'Unknown User',
          participantEmail: participant?.email || '',
          lastMessage: lastMessage ? {
            text: lastMessage.text,
            timestamp: lastMessage.timestamp,
            senderId: lastMessage.senderId
          } : null,
          unreadCount,
          lastActivity: chat.lastMessageAt
        }
      })

      // Сортируем по последней активности
      chatPreviews.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      )

      res.status(200).json({
        success: true,
        chats: chatPreviews
      })

    } catch (error) {
      console.error('Get chats error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get chats'
      })
    }

  } else {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: `Method ${method} is not supported`
    })
  }
}