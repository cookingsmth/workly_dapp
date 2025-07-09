// pages/api/profile.ts - Переписанный API для профиля и настроек
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'

interface UserProfile {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  bio?: string
  skills: string[]
  hourlyRate?: number
  location?: string
  website?: string
  github?: string
  linkedin?: string
  twitter?: string
  avatar?: string
  rating: number
  completedProjects: number
  totalEarnings: number
  joinedAt: string
  verifiedEmail: boolean
  verifiedPhone: boolean
  notifications: {
    email: boolean
    push: boolean
    newTasks: boolean
    taskUpdates: boolean
    messages: boolean
    marketing: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private'
    showEmail: boolean
    showStats: boolean
    showCompletedTasks: boolean
  }
  preferences: {
    theme: 'light' | 'dark'
    language: string
    timezone: string
    currency: string
  }
  createdAt: string
  updatedAt?: string
}

// Пути к файлам
const getUsersFilePath = () => path.join(process.cwd(), 'data', 'users.json')
const getProfilesFilePath = () => path.join(process.cwd(), 'data', 'profiles.json')
const getSettingsFilePath = () => path.join(process.cwd(), 'data', 'settings.json')

// Функции загрузки данных
const loadUsers = () => {
  const filePath = getUsersFilePath()
  if (!fs.existsSync(filePath)) return []
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}

const loadProfiles = (): UserProfile[] => {
  const filePath = getProfilesFilePath()
  if (!fs.existsSync(filePath)) return []
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading profiles:', error)
    return []
  }
}

const loadSettings = () => {
  const filePath = getSettingsFilePath()
  if (!fs.existsSync(filePath)) return []
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading settings:', error)
    return []
  }
}

// Функции сохранения данных
const saveProfiles = (profiles: UserProfile[]) => {
  const filePath = getProfilesFilePath()
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(profiles, null, 2))
}

const saveSettings = (settings: any[]) => {
  const filePath = getSettingsFilePath()
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2))
}

const saveUsers = (users: any[]) => {
  const filePath = getUsersFilePath()
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2))
}

// Функции аутентификации
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

const getUserFromToken = (authHeader: string | undefined) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  
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
      email: user.email,
      createdAt: user.createdAt
    }
  } catch (error) {
    return null
  }
}

// Создание дефолтного профиля
const createDefaultProfile = (user: any): UserProfile => {
  const now = new Date().toISOString()
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.username,
    firstName: '',
    lastName: '',
    bio: '',
    skills: [],
    hourlyRate: 0,
    location: '',
    website: '',
    github: '',
    linkedin: '',
    twitter: '',
    avatar: '',
    rating: 4.5,
    completedProjects: 0,
    totalEarnings: 0,
    joinedAt: user.createdAt || now,
    verifiedEmail: false,
    verifiedPhone: false,
    notifications: {
      email: true,
      push: true,
      newTasks: true,
      taskUpdates: true,
      messages: true,
      marketing: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showStats: true,
      showCompletedTasks: true
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      currency: 'USD'
    },
    createdAt: user.createdAt || now,
    updatedAt: now
  }
}

// Объединение данных из разных источников
const mergeProfileData = (profile: UserProfile | null, settings: any | null, user: any): UserProfile => {
  const defaultProfile = createDefaultProfile(user)
  
  if (!profile && !settings) {
    return defaultProfile
  }
  
  // Объединяем данные с приоритетом: settings > profile > default
  const merged: UserProfile = {
    ...defaultProfile,
    ...profile,
    ...settings,
    // Гарантируем обязательные поля
    id: user.id,
    username: user.username,
    email: user.email,
    skills: profile?.skills || settings?.skills || [],
    rating: profile?.rating || settings?.rating || 4.5,
    completedProjects: profile?.completedProjects || 0,
    totalEarnings: profile?.totalEarnings || 0,
    verifiedEmail: profile?.verifiedEmail || false,
    verifiedPhone: profile?.verifiedPhone || false,
    notifications: {
      ...defaultProfile.notifications,
      ...(profile?.notifications || {}),
      ...(settings?.notifications || {})
    },
    privacy: {
      ...defaultProfile.privacy,
      ...(profile?.privacy || {}),
      ...(settings?.privacy || {})
    },
    preferences: {
      ...defaultProfile.preferences,
      ...(profile?.preferences || {}),
      ...(settings?.preferences || {})
    }
  }
  
  return merged
}

// Фильтрация обновлений
const filterUpdates = (updates: any) => {
  const filtered: any = {}
  
  // Профильные поля
  const profileFields = [
    'firstName', 'lastName', 'bio', 'skills', 'hourlyRate', 
    'location', 'website', 'github', 'linkedin', 'twitter', 
    'avatar', 'rating', 'completedProjects', 'totalEarnings',
    'verifiedEmail', 'verifiedPhone'
  ]
  
  // Настроечные поля
  const settingsFields = [
    'name', 'username', 'notifications', 'privacy', 'preferences'
  ]
  
  // Копируем только валидные поля
  const allFields = [...profileFields, ...settingsFields]
  allFields.forEach(field => {
    if (updates[field] !== undefined) {
      filtered[field] = updates[field]
    }
  })
  
  return filtered
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  // Аутентификация
  const currentUser = getUserFromToken(req.headers.authorization)
  
  if (!currentUser) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    })
  }

  if (method === 'GET') {
    try {
      const allProfiles = loadProfiles()
      const allSettings = loadSettings()
      
      const userProfile = allProfiles.find((p: UserProfile) => p.id === currentUser.id) || null
      const userSettings = allSettings.find((s: any) => s.id === currentUser.id) || null
      
      const mergedProfile = mergeProfileData(userProfile, userSettings, currentUser)
      
    
      if (!userProfile) {
        allProfiles.push(mergedProfile)
        saveProfiles(allProfiles)
      }
      
      if (!userSettings) {
        allSettings.push(mergedProfile)
        saveSettings(allSettings)
      }

      res.status(200).json({
        success: true,
        profile: mergedProfile
      })

    } catch (error) {
      console.error('Get profile error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get profile'
      })
    }

  } else if (method === 'PUT') {
    try {
      const rawUpdates = req.body
      const updates = filterUpdates(rawUpdates)
      
      // Валидация username
      if (updates.username && updates.username !== currentUser.username) {
        const users = loadUsers()
        const existingUser = users.find((u: any) => 
          u.username === updates.username.toLowerCase() && u.id !== currentUser.id
        )
        
        if (existingUser) {
          return res.status(400).json({ 
            error: 'Username already taken',
            message: 'This username is already in use by another user'
          })
        }
      }

      const allProfiles = loadProfiles()
      const allSettings = loadSettings()
      
      const profileIndex = allProfiles.findIndex((p: UserProfile) => p.id === currentUser.id)
      const settingsIndex = allSettings.findIndex((s: any) => s.id === currentUser.id)
      
      const now = new Date().toISOString()
      
      const currentProfile = allProfiles[profileIndex] || null
      const currentSettings = allSettings[settingsIndex] || null
      
      const updatedProfile = mergeProfileData(currentProfile, currentSettings, currentUser)
      
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          ;(updatedProfile as any)[key] = updates[key]
        }
      })
      
      updatedProfile.updatedAt = now
      
      if (profileIndex === -1) {
        allProfiles.push(updatedProfile)
      } else {
        allProfiles[profileIndex] = updatedProfile
      }
      
      if (settingsIndex === -1) {
        allSettings.push(updatedProfile)
      } else {
        allSettings[settingsIndex] = updatedProfile
      }
      
      saveProfiles(allProfiles)
      saveSettings(allSettings)
      
      if (updates.username && updates.username !== currentUser.username) {
        const users = loadUsers()
        const userIndex = users.findIndex((u: any) => u.id === currentUser.id)
        if (userIndex !== -1) {
          users[userIndex].username = updates.username.toLowerCase()
          saveUsers(users)
        }
      }

      res.status(200).json({
        success: true,
        profile: updatedProfile
      })

    } catch (error) {
      console.error('Update profile error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update profile'
      })
    }

  } else {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: `Method ${method} is not supported`
    })
  }
}