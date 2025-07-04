// pages/api/notifications/[notificationId]/read.ts
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

const getNotificationsFilePath = () => path.join(process.cwd(), 'data', 'notifications.json')
const getUsersFilePath = () => path.join(process.cwd(), 'data', 'users.json')

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
  const { notificationId } = req.query

  if (!notificationId || typeof notificationId !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Notification ID is required'
    })
  }

  // Проверяем аутентификацию
  const currentUser = getUserFromToken(req.headers.authorization)
  
  if (!currentUser) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    })
  }

  if (method === 'POST') {
    try {
      // Отмечаем уведомление как прочитанное
      const notifications = loadNotifications()
      const notificationIndex = notifications.findIndex(
        notif => notif.id === notificationId && notif.userId === currentUser.id
      )

      if (notificationIndex === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Notification not found'
        })
      }

      notifications[notificationIndex].read = true
      saveNotifications(notifications)

      res.status(200).json({
        success: true,
        notification: notifications[notificationIndex]
      })

    } catch (error) {
      console.error('Mark notification as read error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to mark notification as read'
      })
    }

  } else {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: `Method ${method} is not supported`
    })
  }
}