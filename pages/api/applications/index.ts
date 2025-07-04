// pages/api/applications/index.ts - Production-ready версия
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

// Environment check
const isDev = process.env.NODE_ENV === 'development'

// Utility function for development logging
const devLog = (message: string, data?: any) => {
  if (isDev) {
    console.log(message, data || '')
  }
}

// File paths
const getApplicationsPath = () => path.join(process.cwd(), 'data', 'applications.json')
const getTasksPath = () => path.join(process.cwd(), 'data', 'tasks.json')
const getUsersPath = () => path.join(process.cwd(), 'data', 'users.json')

// Safe JSON operations
const loadJSON = (filePath: string) => {
  if (!fs.existsSync(filePath)) return []
  try {
    const data = fs.readFileSync(filePath, 'utf8').trim()
    return data ? JSON.parse(data) : []
  } catch (error) {
    if (isDev) {
      console.error(`Error parsing JSON file ${filePath}:`, error)
    }
    return []
  }
}

const saveJSON = (filePath: string, data: any) => {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    if (isDev) {
      console.error(`Error saving JSON file ${filePath}:`, error)
    }
    throw new Error('Failed to save data')
  }
}

// Authentication
const getUserFromToken = (authHeader?: string) => {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'workly-local-secret-key-2025') as { userId: string }
    const users = loadJSON(getUsersPath())
    return users.find((u: any) => u.id === decoded.userId)
  } catch (error) {
    devLog('❌ Token verification error:', error)
    return null
  }
}

// Validation schema
const applicationSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  message: z.string().min(5, 'Message must be at least 5 characters').max(2000, 'Message too long'),
  proposedPrice: z.number().positive().optional(),
  estimatedDays: z.number().positive().max(365).optional(),
  portfolio: z.string().url().optional().or(z.literal(''))
})

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST method is supported'
    })
  }

  try {
    devLog('📝 Applications API called')

    // Authentication
    const user = getUserFromToken(req.headers.authorization)
    if (!user) {
      devLog('❌ Authentication failed')
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required to submit applications'
      })
    }

    devLog('👤 Authenticated user:', user.username)

    // Input validation
    const validation = applicationSchema.safeParse(req.body)
    if (!validation.success) {
      devLog('❌ Validation failed:', validation.error.errors)
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    }

    const { taskId, message, proposedPrice, estimatedDays, portfolio } = validation.data
    devLog('📋 Valid application data received')

    // Load data
    const tasks = loadJSON(getTasksPath())
    const applications = loadJSON(getApplicationsPath())

    // Find task
    const task = tasks.find((t: any) => t.id === taskId)
    if (!task) {
      devLog('❌ Task not found:', taskId)
      return res.status(404).json({ 
        error: 'Task not found',
        message: `Task with ID ${taskId} does not exist`
      })
    }

    // Check task status
    if (task.status !== 'open') {
      return res.status(400).json({ 
        error: 'Task not available',
        message: `Cannot apply to task with status: ${task.status}`
      })
    }

    // Check if task is expired
    if (new Date(task.deadline) <= new Date()) {
      return res.status(400).json({ 
        error: 'Task expired',
        message: 'Cannot apply to expired tasks'
      })
    }

    // Check if user is task creator
    if (task.createdBy === user.id) {
      return res.status(400).json({ 
        error: 'Invalid application',
        message: 'You cannot apply to your own tasks'
      })
    }

    // Check for duplicate application
    const alreadyApplied = applications.some((app: any) => 
      app.taskId === taskId && app.applicantId === user.id
    )
    if (alreadyApplied) {
      devLog('⚠️ Duplicate application attempt')
      return res.status(400).json({ 
        error: 'Duplicate application',
        message: 'You have already applied to this task'
      })
    }

    // Create application
    const newApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      applicantId: user.id,
      applicantName: user.username,
      applicantEmail: user.email,
      message: message.trim(),
      proposedPrice,
      estimatedDays,
      portfolio: portfolio || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Update data
    applications.push(newApplication)

    // Update task
    if (!Array.isArray(task.applicants)) task.applicants = []
    task.applicants.push(user.id)
    task.applicationCount = (task.applicationCount || 0) + 1
    task.updatedAt = new Date().toISOString()

    // Save data
    saveJSON(getApplicationsPath(), applications)
    saveJSON(getTasksPath(), tasks)

    devLog('✅ Application created successfully')

    // Success response
    return res.status(201).json({ 
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: newApplication.id,
        taskId: newApplication.taskId,
        status: newApplication.status,
        createdAt: newApplication.createdAt
      }
    })

  } catch (error) {
    // Error logging (only in development)
    if (isDev) {
      console.error('❌ Applications API error:', error)
    }

    // Generic error response for production
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to submit application. Please try again later.'
    })
  }
}