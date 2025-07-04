// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// Валидация входящих данных
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

// Импортируем функции для работы с пользователями
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

// Генерация JWT токена
const generateToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Валидация входящих данных
    const validation = loginSchema.safeParse(req.body)
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      })
    }

    const { username, password } = validation.data

    // Загружаем пользователей
    const users = loadUsers()

    // Ищем пользователя по username или email
    const user = users.find((u: any) => 
      u.username.toLowerCase() === username.toLowerCase() ||
      u.email.toLowerCase() === username.toLowerCase()
    )

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      })
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      })
    }

    // Генерируем токен
    const token = generateToken(user.id)

    // Обновляем последний вход (опционально)
    user.lastLoginAt = new Date().toISOString()
    
    // Сохраняем обновление (если нужно отслеживать последний вход)
    const userIndex = users.findIndex((u: any) => u.id === user.id)
    if (userIndex !== -1) {
      users[userIndex] = user
      try {
        fs.writeFileSync(getUsersFilePath(), JSON.stringify(users, null, 2))
      } catch (error) {
        console.error('Error updating last login:', error)
        // Не критично, продолжаем
      }
    }

    // Возвращаем данные пользователя (без пароля)
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isEmailVerified: user.isEmailVerified,
      profile: user.profile
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Login failed'
    })
  }
}