// pages/api/chat/[taskId]/[userId].ts
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'

// Структура чата
interface ChatMessage {
  id: string
  senderId: string
  text: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read'
  fileUrl?: string
  fileName?: string 
  fileType?: string 
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

const saveChats = (chats: Chat[]) => {
  const filePath = getChatsFilePath()
  const dir = path.dirname(filePath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filePath, JSON.stringify(chats, null, 2))
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

// Создание ID чата
const createChatId = (taskId: string, clientId: string, freelancerId: string) => {
  return `chat_${taskId}_${clientId}_${freelancerId}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { taskId, userId } = req.query
  const { message, fileUrl, fileName, fileType } = req.body

  if (!taskId || !userId || typeof taskId !== 'string' || typeof userId !== 'string') {
    console.log('❌ Validation failed - returning 400')
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Task ID and User ID are required'
    })
  }

  // Проверяем аутентификацию
  const currentUser = getUserFromToken(req.headers.authorization || '')

  if (!currentUser) {
    console.log('❌ Authentication failed - returning 401')
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    })
  }

  console.log('✅ Validation passed, user:', currentUser.id)

  if (method === 'GET') {
    try {
      // Загружаем задачу для получения информации
      const tasks = loadTasks()
      const task = tasks.find((t: any) => t.id === taskId)

      if (!task) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Task not found'
        })
      }

      // Определяем участников чата
      let clientId = task.createdBy
      let freelancerId = userId

      // Если текущий пользователь - создатель задачи, то userId - это фрилансер
      if (currentUser.id === task.createdBy) {
        clientId = task.createdBy
        freelancerId = userId
      } else {
        // Если текущий пользователь - фрилансер, то userId должен быть создателем задачи
        clientId = userId
        freelancerId = currentUser.id
      }

      // Проверяем права доступа
      if (currentUser.id !== clientId && currentUser.id !== freelancerId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not authorized to access this chat'
        })
      }

      // Загружаем чаты
      const chats = loadChats()
      const chatId = createChatId(taskId, clientId, freelancerId)

      let chat = chats.find(c => c.id === chatId)

      // Если чат не существует, создаем новый
      if (!chat) {
        chat = {
          id: chatId,
          taskId,
          clientId,
          freelancerId,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          messages: []
        }

        chats.push(chat)
        saveChats(chats)
      }

      // Получаем информацию о пользователях
      const users = loadUsers()
      const clientUser = users.find((u: any) => u.id === clientId)
      const freelancerUser = users.find((u: any) => u.id === freelancerId)

      res.status(200).json({
        success: true,
        chat,
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          workerConfirmed: task.workerConfirmed || false,
          clientConfirmed: task.clientConfirmed || false,
          assignedTo: task.assignedTo || null,
          createdBy: task.createdBy || null,
          reward: task.reward || 0
        },
        participants: {
          client: clientUser ? {
            id: clientUser.id,
            username: clientUser.username,
            email: clientUser.email
          } : null,
          freelancer: freelancerUser ? {
            id: freelancerUser.id,
            username: freelancerUser.username,
            email: freelancerUser.email
          } : null
        },
        currentUserId: currentUser.id
      })

    } catch (error) {
      console.error('Get chat error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get chat'
      })
    }

  } else if (method === 'POST') {
    try {
      const { message } = req.body

      if (!message || !message.trim()) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Message text is required'
        })
      }

      // Загружаем задачу
      const tasks = loadTasks()
      const task = tasks.find((t: any) => t.id === taskId)

      if (!task) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Task not found'
        })
      }

      // Определяем участников чата
      let clientId = task.createdBy
      let freelancerId = userId

      if (currentUser.id === task.createdBy) {
        clientId = task.createdBy
        freelancerId = userId
      } else {
        clientId = userId
        freelancerId = currentUser.id
      }

      // Проверяем права доступа
      if (currentUser.id !== clientId && currentUser.id !== freelancerId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not authorized to send messages in this chat'
        })
      }

      // Загружаем чаты
      const chats = loadChats()
      const chatId = createChatId(taskId, clientId, freelancerId)

      let chat = chats.find(c => c.id === chatId)
      const chatIndex = chats.findIndex(c => c.id === chatId)

      // Если чат не существует, создаем его
      if (!chat) {
        chat = {
          id: chatId,
          taskId,
          clientId,
          freelancerId,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          messages: []
        }
        chats.push(chat)
      }

      // Создаем новое сообщение
      const newMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: currentUser.id,
        text: message,
        timestamp: new Date().toISOString(),
        status: 'sent',
        // Добавляем поддержку файлов
        ...(fileUrl && {
          fileUrl,
          fileName,
          fileType
        })
      }

      // Добавляем сообщение в чат
      if (chatIndex >= 0) {
        chats[chatIndex].messages.push(newMessage)
        chats[chatIndex].lastMessageAt = newMessage.timestamp
      } else {
        chat.messages.push(newMessage)
        chat.lastMessageAt = newMessage.timestamp
        chats.push(chat)
      }

      // Сохраняем изменения
      saveChats(chats)

      res.status(201).json({
        success: true,
        message: newMessage,
        chat: chats[chatIndex >= 0 ? chatIndex : chats.length - 1]
      })

    } catch (error) {
      console.error('Send message error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to send message'
      })
    }

  } else {
    res.status(405).json({
      error: 'Method not allowed',
      message: `Method ${method} is not supported`
    })
  }
}