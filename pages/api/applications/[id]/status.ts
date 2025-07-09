// pages/api/applications/[id]/status.ts
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

const saveApplications = (applications: any[]) => {
  const filePath = getApplicationsFilePath()
  const dir = path.dirname(filePath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filePath, JSON.stringify(applications, null, 2))
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

const saveTasks = (tasks: any[]) => {
  const filePath = getTasksFilePath()
  const dir = path.dirname(filePath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2))
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
      message: 'Application ID is required'
    })
  }

  if (method === 'PATCH') {
    try {
      const user = getUserFromToken(req.headers.authorization)

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        })
      }

      const { status } = req.body

      if (!status || !['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Valid status is required (accepted or rejected)'
        })
      }

      const applications = loadApplications()
      const applicationIndex = applications.findIndex((app: any) => app.id === id)

      if (applicationIndex === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Application not found'
        })
      }

      const application = applications[applicationIndex]

      const tasks = loadTasks()
      const task = tasks.find((t: any) => t.id === application.taskId)

      if (!task) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Task not found'
        })
      }

      if (task.createdBy !== user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only task creator can update application status'
        })
      }

      if (application.status !== 'pending') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Can only update pending applications'
        })
      }

      applications[applicationIndex] = {
        ...application,
        status,
        updatedAt: new Date().toISOString()
      }

      if (status === 'accepted') {
        const taskIndex = tasks.findIndex((t: any) => t.id === task.id)
        if (taskIndex !== -1) {
          tasks[taskIndex] = {
            ...task,
            status: 'in_progress',
            assignedTo: application.applicantId,
            assignedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          saveTasks(tasks)

          for (let i = 0; i < applications.length; i++) {
            if (applications[i].taskId === task.id &&
              applications[i].id !== id &&
              applications[i].status === 'pending') {
              applications[i] = {
                ...applications[i],
                status: 'rejected',
                updatedAt: new Date().toISOString()
              }
            }
          }
        }
      }

      saveApplications(applications)

      res.status(200).json({
        success: true,
        message: `Application ${status} successfully`,
        application: applications[applicationIndex],
        task: status === 'accepted' ? tasks.find((t: { id: string }) => t.id === task.id) : null
      })

    } catch (error) {
      console.error('Update application status error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update application status'
      })
    }

  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}