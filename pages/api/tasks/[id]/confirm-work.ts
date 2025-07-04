// pages/api/tasks/[id]/confirm-work.ts
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

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
    // Читаем задачи
    const tasksFile = path.join(process.cwd(), 'data', 'tasks.json')
    
    if (!fs.existsSync(tasksFile)) {
      return res.status(404).json({ error: 'Tasks file not found' })
    }

    const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'))
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId)
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const task = tasks[taskIndex]

    // Проверяем что пользователь - исполнитель
    if (task.assignedTo !== user.userId) {
      return res.status(403).json({ error: 'Only assigned worker can confirm work' })
    }

    // Обновляем подтверждение работы
    tasks[taskIndex].workerConfirmed = true
    tasks[taskIndex].workerConfirmedAt = new Date().toISOString()
    tasks[taskIndex].updatedAt = new Date().toISOString()

    // Проверяем если оба подтвердили - запускаем перевод денег
    if (tasks[taskIndex].clientConfirmed && tasks[taskIndex].workerConfirmed) {
      // Импортируем функцию перевода денег
      const { walletService } = require('../../../../lib/wallet/walletService')
      
      const result = await walletService.completeTask(taskId as string, user.userId)
      
      if (result.success) {
        tasks[taskIndex].status = 'completed'
        tasks[taskIndex].completedAt = new Date().toISOString()
        tasks[taskIndex].completionTxHash = result.txHash
      }
    }

    // Сохраняем изменения
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2))

    res.status(200).json({
      success: true,
      message: 'Work confirmed successfully',
      task: tasks[taskIndex]
    })

  } catch (error) {
    console.error('Confirm work error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}