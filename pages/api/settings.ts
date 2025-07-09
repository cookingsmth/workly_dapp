// pages/api/settings.ts
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'

interface UserSettings {
  id: string
  email: string
  name: string
  username: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  github?: string
  twitter?: string
  linkedin?: string
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

const getUsersFilePath = () => path.join(process.cwd(), 'data', 'users.json')
const getSettingsFilePath = () => path.join(process.cwd(), 'data', 'settings.json')

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

const loadSettings = (): UserSettings[] => {
  const filePath = getSettingsFilePath()
  
  if (!fs.existsSync(filePath)) {
    return []
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading settings:', error)
    return []
  }
}

const saveSettings = (settings: UserSettings[]) => {
  const filePath = getSettingsFilePath()
  const dir = path.dirname(filePath)
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2))
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

const getUserFromToken = (authHeader: string | undefined) => {
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
      email: user.email,
      createdAt: user.createdAt
    }
  } catch (error) {
    return null
  }
}

const createDefaultSettings = (user: any): UserSettings => {
  return {
    id: user.id,
    email: user.email,
    name: user.username || user.name || '',
    username: user.username,
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
    createdAt: user.createdAt || new Date().toISOString()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  const currentUser = getUserFromToken(req.headers.authorization)
  
  if (!currentUser) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    })
  }

  if (method === 'GET') {
    try {
      const allSettings = loadSettings()
      let userSettings = allSettings.find(settings => settings.id === currentUser.id)

      if (!userSettings) {
        userSettings = createDefaultSettings(currentUser)
        allSettings.push(userSettings)
        saveSettings(allSettings)
      }

      res.status(200).json(userSettings)

    } catch (error) {
      console.error('Get settings error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get settings'
      })
    }

  } else if (method === 'PUT') {
    try {
      const updates = req.body
      const allSettings = loadSettings()
      const settingsIndex = allSettings.findIndex(settings => settings.id === currentUser.id)

      if (updates.username) {
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

      if (settingsIndex === -1) {
        const newSettings = {
          ...createDefaultSettings(currentUser),
          ...updates,
          id: currentUser.id, 
          email: currentUser.email,
          updatedAt: new Date().toISOString()
        }
        allSettings.push(newSettings)
        saveSettings(allSettings)

        return res.status(201).json(newSettings)
      } else {
        allSettings[settingsIndex] = {
          ...allSettings[settingsIndex],
          ...updates,
          id: currentUser.id,
          email: currentUser.email, 
          updatedAt: new Date().toISOString()
        }

        saveSettings(allSettings)

        if (updates.username && updates.username !== currentUser.username) {
          const users = loadUsers()
          const userIndex = users.findIndex((u: any) => u.id === currentUser.id)
          if (userIndex !== -1) {
            users[userIndex].username = updates.username.toLowerCase()
            const usersFilePath = getUsersFilePath()
            fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2))
          }
        }

        res.status(200).json(allSettings[settingsIndex])
      }

    } catch (error) {
      console.error('Update settings error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update settings'
      })
    }

  } else if (method === 'DELETE') {
    try {
      const { confirmPassword } = req.body

      if (!confirmPassword || confirmPassword !== 'DELETE_MY_ACCOUNT') {
        return res.status(400).json({ 
          error: 'Please type "DELETE_MY_ACCOUNT" to confirm account deletion' 
        })
      }

      const userId = currentUser.id

      const users = loadUsers()
      const filteredUsers = users.filter((u: any) => u.id !== userId)
      fs.writeFileSync(getUsersFilePath(), JSON.stringify(filteredUsers, null, 2))

      const allSettings = loadSettings()
      const filteredSettings = allSettings.filter(s => s.id !== userId)
      saveSettings(filteredSettings)

      const dataDir = path.join(process.cwd(), 'data')
      const filesToCheck = [
        'profiles.json',
        'tasks.json',
        'applications.json',
        'messages.json',
        'notifications.json'
      ]

      filesToCheck.forEach(fileName => {
        const filePath = path.join(dataDir, fileName)
        if (fs.existsSync(filePath)) {
          try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
            let filteredData

            switch (fileName) {
              case 'tasks.json':
                filteredData = data.filter((item: any) => item.createdBy !== userId)
                break
              case 'applications.json':
                filteredData = data.filter((item: any) => item.userId !== userId)
                break
              case 'messages.json':
                filteredData = data.filter((item: any) => 
                  item.senderId !== userId && item.receiverId !== userId
                )
                break
              case 'notifications.json':
                filteredData = data.filter((item: any) => item.userId !== userId)
                break
              default:
                filteredData = data.filter((item: any) => item.id !== userId)
            }

            fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2))
          } catch (error) {
            console.error(`Error cleaning ${fileName}:`, error)
          }
        }
      })

      res.status(200).json({ 
        success: true,
        message: 'Account deleted successfully' 
      })

    } catch (error) {
      console.error('Delete account error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete account'
      })
    }

  } else {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: `Method ${method} is not supported`
    })
  }
}