// pages/api/tasks/[id]/check-funding.ts - API для проверки поступления средств
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { walletService } from '../../../../lib/wallet/walletService'

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
    // Проверяем финансирование задачи
    const isFunded = await walletService.checkTaskFunding(taskId as string)

    if (isFunded) {
      // Обновляем статус задачи на "открыта"
      const fs = require('fs')
      const path = require('path')
      
      const tasksFile = path.join(process.cwd(), 'data', 'tasks.json')
      
      if (!fs.existsSync(tasksFile)) {
        return res.status(404).json({ error: 'Tasks file not found' })
      }

      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'))
      
      const taskIndex = tasks.findIndex((t: any) => t.id === taskId)
      if (taskIndex !== -1) {
        // Проверяем права доступа (только создатель может проверять)
        if (tasks[taskIndex].createdBy !== user.userId) {
          return res.status(403).json({ error: 'Only task creator can check funding' })
        }

        tasks[taskIndex].status = 'open'
        tasks[taskIndex].fundedAt = new Date().toISOString()
        tasks[taskIndex].updatedAt = new Date().toISOString()
        
        fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2))

        res.status(200).json({
          success: true,
          message: 'Task is now funded and active',
          task: tasks[taskIndex]
        })
      } else {
        res.status(404).json({ error: 'Task not found' })
      }
    } else {
      res.status(200).json({
        success: false,
        message: 'Task is not yet funded',
        funded: false
      })
    }

  } catch (error) {
    console.error('Check funding error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}