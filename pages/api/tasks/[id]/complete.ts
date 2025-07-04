// pages/api/tasks/[id]/complete.ts - API для завершения задач
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

const getUserFromToken = (authHeader: string | undefined) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  
  const token = authHeader.split(' ')[1]
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: taskId } = req.query
  const user = getUserFromToken(req.headers.authorization)
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Проверяем права доступа (только создатель задачи может завершить)
    const fs = require('fs')
    const path = require('path')
    
    const tasksFile = path.join(process.cwd(), 'data', 'tasks.json')
    
    if (!fs.existsSync(tasksFile)) {
      return res.status(404).json({ error: 'Tasks file not found' })
    }

    const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'))
    
    const task = tasks.find((t: any) => t.id === taskId)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    if (task.createdBy !== user.userId) {
      return res.status(403).json({ error: 'Only task creator can complete the task' })
    }

    // НОВАЯ ПРОВЕРКА: убеждаемся что обе стороны подтвердили платеж
    if (!task.workerConfirmed || !task.clientConfirmed) {
      return res.status(400).json({ 
        error: 'Both worker and client must confirm payment before task can be completed' 
      })
    }

    if (task.status === 'completed') {
      return res.status(400).json({ error: 'Task is already completed' })
    }

    // Обновляем статус задачи на completed
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId)
    if (taskIndex !== -1) {
      tasks[taskIndex].status = 'completed'
      tasks[taskIndex].completedAt = new Date().toISOString()
      tasks[taskIndex].updatedAt = new Date().toISOString()
      
      fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2))
    }

    res.status(200).json({
      success: true,
      message: 'Task marked as completed successfully',
      task: tasks[taskIndex]
    })

  } catch (error) {
    console.error('Complete task error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}