
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'

const getApplicationsFilePath = () => path.join(process.cwd(), 'data', 'applications.json')
const getTasksFilePath = () => path.join(process.cwd(), 'data', 'tasks.json')

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
    const usersFilePath = path.join(process.cwd(), 'data', 'users.json')
    if (!fs.existsSync(usersFilePath)) return null

    const usersData = fs.readFileSync(usersFilePath, 'utf8')
    const users = JSON.parse(usersData)
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
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Task ID is required'
    })
  }

  if (method === 'GET') {
    try {
      const user = getUserFromToken(req.headers.authorization)
      
      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        })
      }

      const tasks = loadTasks()
      const task = tasks.find((t: any) => t.id === id)
      
      if (!task) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Task not found'
        })
      }

      if (task.createdBy !== user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only task creator can view applications'
        })
      }

      const applications = loadApplications()
      const taskApplications = applications.filter((app: any) => app.taskId === id)

      taskApplications.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      res.status(200).json({
        success: true,
        applications: taskApplications,
        total: taskApplications.length,
        task: {
          id: task.id,
          title: task.title,
          status: task.status
        }
      })

    } catch (error) {
      console.error('Get task applications error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get applications'
      })
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}