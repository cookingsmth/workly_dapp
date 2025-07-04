// pages/api/auth/me.ts
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

// Простая версия без middleware для начала
const fs = require('fs')
const path = require('path')

const getUsersFilePath = () => path.join(process.cwd(), 'data', 'users.json')

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Получаем токен из заголовка
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid authorization token provided'
      })
    }

    const token = authHeader.split(' ')[1]
    
    // Проверяем токен
    let decoded
    try {
      decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'workly-local-secret-key-2025'
      ) as { userId: string }
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      })
    }

    // Загружаем пользователей
    const users = loadUsers()
    const user = users.find((u: any) => u.id === decoded.userId)
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      })
    }

    // Возвращаем пользователя без пароля
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
      isEmailVerified: user.isEmailVerified || false,
      profile: user.profile || {
        bio: '',
        avatar: null,
        skills: [],
        completedTasks: 0,
        rating: 0,
        totalEarned: 0
      }
    }

    res.status(200).json({
      success: true,
      user: userResponse
    })

  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user data'
    })
  }
}