
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'

interface ProjectStats {
  total: number
  completed: number
  inProgress: number
  rating: number
  totalEarnings: number
}

const getTasksFilePath = () => path.join(process.cwd(), 'data', 'tasks.json')
const getApplicationsFilePath = () => path.join(process.cwd(), 'data', 'applications.json')
const getUsersFilePath = () => path.join(process.cwd(), 'data', 'users.json')

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

const loadApplications = () => {
  const filePath = getApplicationsFilePath()
  
  if (!fs.existsSync(filePath)) {
    return []
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading applications:', error)
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
      email: user.email
    }
  } catch (error) {
    return null
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
      const tasks = loadTasks()
      const applications = loadApplications()

      const createdTasks = tasks.filter((task: any) => task.createdBy === currentUser.id)
      
      const assignedTasks = tasks.filter((task: any) => task.assignedTo === currentUser.id)
      
      const userApplications = applications.filter((app: any) => app.applicantId === currentUser.id)
      
      const acceptedApplications = userApplications.filter((app: any) => app.status === 'accepted')

      const freelancerStats = {
        total: acceptedApplications.length,
        completed: assignedTasks.filter((task: any) => task.status === 'completed').length,
        inProgress: assignedTasks.filter((task: any) => task.status === 'in_progress').length,
        rating: 4.8,
        totalEarnings: assignedTasks
          .filter((task: any) => task.status === 'completed')
          .reduce((sum: number, task: any) => sum + (task.reward?.amount || 0), 0)
      }

      const clientStats = {
        total: createdTasks.length,
        completed: createdTasks.filter((task: any) => task.status === 'completed').length,
        inProgress: createdTasks.filter((task: any) => task.status === 'in_progress').length,
        rating: 4.9,
        totalEarnings: 0
      }

      const stats = acceptedApplications.length >= createdTasks.length ? freelancerStats : clientStats

      res.status(200).json({
        success: true,
        stats: stats
      })

    } catch (error) {
      console.error('Get profile stats error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get profile stats'
      })
    }

  } else {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: `Method ${method} is not supported`
    })
  }
}