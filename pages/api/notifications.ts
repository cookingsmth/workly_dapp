// pages/api/notifications.ts
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'

interface Notification {
  id: string
  userId: string
  type: 'message' | 'task' | 'application' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

// Пути к файлам
const getNotificationsFilePath = () => path.join(process.cwd(), 'data', 'notifications.json')
const getUsersFilePath = () => path.join(process.cwd(), 'data', 'users.json')

// Функции для работы с файлами
const loadNotifications = (): Notification[] => {
  const filePath = getNotificationsFilePath()
  
  if (!fs.existsSync(filePath)) {
    return []
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading notifications:', error)
    return []
  }
}

const saveNotifications = (notifications: Notification[]) => {
  const filePath = getNotificationsFilePath()
  const dir = path.dirname(filePath)
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2))
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
      // Загружаем уведомления для текущего пользователя
      const allNotifications = loadNotifications()
      const userNotifications = allNotifications
        .filter(notif => notif.userId === currentUser.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      res.status(200).json({
        success: true,
        notifications: userNotifications
      })

    } catch (error) {
      console.error('Get notifications error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get notifications'
      })
    }

  } else if (method === 'POST') {
    try {
      // Создание нового уведомления
      const { type, title, message, actionUrl, targetUserId } = req.body

      if (!type || !title || !message) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Type, title, and message are required'
        })
      }

      const newNotification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: targetUserId || currentUser.id,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl
      }

      const notifications = loadNotifications()
      notifications.push(newNotification)
      saveNotifications(notifications)

      res.status(201).json({
        success: true,
        notification: newNotification
      })

    } catch (error) {
      console.error('Create notification error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create notification'
      })
    }

  } else {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: `Method ${method} is not supported`
    })
  }
}