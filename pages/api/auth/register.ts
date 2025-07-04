// pages/api/auth/register.ts
import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// Валидация входящих данных
const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Временная "база данных" в файле (позже заменим на настоящую БД)
const fs = require('fs')
const path = require('path')

const getUsersFilePath = () => path.join(process.cwd(), 'data', 'users.json')

// Создаем папку data если её нет
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
  }
}

// Загрузка пользователей
const loadUsers = () => {
  ensureDataDir()
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

// Сохранение пользователей
const saveUsers = (users: any[]) => {
  ensureDataDir()
  const filePath = getUsersFilePath()
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Error saving users:', error)
    throw new Error('Failed to save user data')
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
    const validation = registerSchema.safeParse(req.body)
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      })
    }

    const { username, email, password } = validation.data

    // Загружаем существующих пользователей
    const users = loadUsers()

    // Проверяем уникальность username
    const existingUser = users.find((user: any) => 
      user.username.toLowerCase() === username.toLowerCase()
    )
    
    if (existingUser) {
      return res.status(400).json({
        error: 'Username already exists',
        field: 'username'
      })
    }

    // Проверяем уникальность email
    const existingEmail = users.find((user: any) => 
      user.email.toLowerCase() === email.toLowerCase()
    )
    
    if (existingEmail) {
      return res.status(400).json({
        error: 'Email already registered',
        field: 'email'
      })
    }

    // Хешируем пароль
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Создаем нового пользователя
    const newUser = {
      id: Date.now().toString(),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      walletAddress: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEmailVerified: false,
      profile: {
        bio: '',
        avatar: null,
        skills: [],
        completedTasks: 0,
        rating: 0,
        totalEarned: 0
      }
    }

    // Сохраняем в "базе данных"
    users.push(newUser)
    saveUsers(users)

    // Генерируем JWT токен
    const token = generateToken(newUser.id)

    // Возвращаем данные пользователя (без пароля)
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      walletAddress: newUser.walletAddress,
      createdAt: newUser.createdAt,
      isEmailVerified: newUser.isEmailVerified,
      profile: newUser.profile
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse,
      token
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user'
    })
  }
}