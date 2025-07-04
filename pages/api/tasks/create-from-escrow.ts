// pages/api/tasks/create-from-escrow.ts - Создание задачи после подтверждения оплаты
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

const loadPendingEscrows = () => {
  const fs = require('fs')
  const path = require('path')
  
  const filePath = path.join(process.cwd(), 'data', 'pending_escrows.json')
  if (!fs.existsSync(filePath)) return []
  
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

const removePendingEscrow = (escrowId: string) => {
  const escrows = loadPendingEscrows()
  const filteredEscrows = escrows.filter((e: any) => e.escrowId !== escrowId)
  
  const fs = require('fs')
  const path = require('path')
  const filePath = path.join(process.cwd(), 'data', 'pending_escrows.json')
  fs.writeFileSync(filePath, JSON.stringify(filteredEscrows, null, 2))
  
  return escrows.find((e: any) => e.escrowId === escrowId)
}

const saveTask = (task: any) => {
  const fs = require('fs')
  const path = require('path')
  
  const tasksFile = path.join(process.cwd(), 'data', 'tasks.json')
  const dir = path.dirname(tasksFile)
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  let tasks = []
  if (fs.existsSync(tasksFile)) {
    try {
      const data = fs.readFileSync(tasksFile, 'utf8')
      tasks = JSON.parse(data)
    } catch (error) {
      tasks = []
    }
  }
  
  tasks.unshift(task) // Добавляем в начало массива
  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2))
}

const saveEscrowRecord = (escrow: any) => {
  const fs = require('fs')
  const path = require('path')
  
  const escrowsFile = path.join(process.cwd(), 'data', 'escrow_accounts.json')
  const dir = path.dirname(escrowsFile)
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  let escrows = []
  if (fs.existsSync(escrowsFile)) {
    try {
      const data = fs.readFileSync(escrowsFile, 'utf8')
      escrows = JSON.parse(data)
    } catch (error) {
      escrows = []
    }
  }
  
  escrows.push(escrow)
  fs.writeFileSync(escrowsFile, JSON.stringify(escrows, null, 2))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = getUserFromToken(req.headers.authorization)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { escrowId } = req.body

    if (!escrowId) {
      return res.status(400).json({ error: 'Escrow ID is required' })
    }

    // Найдем funded escrow
    const pendingEscrows = loadPendingEscrows()
    const escrow = pendingEscrows.find((e: any) => e.escrowId === escrowId)
    
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' })
    }

    // Проверяем права доступа
    if (escrow.clientId !== user.userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Проверяем, что escrow funded
    if (escrow.status !== 'funded') {
      return res.status(400).json({ 
        error: 'Escrow is not funded yet. Please send payment first.' 
      })
    }

    // Создаем задачу
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newTask = {
      id: taskId,
      title: escrow.taskData.title.trim(),
      description: escrow.taskData.description.trim(),
      reward: escrow.taskData.reward,
      deadline: escrow.taskData.deadline,
      createdBy: user.userId,
      status: 'open', // Сразу открытая, так как оплачена
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fundedAt: escrow.fundedAt,
      applicants: [],
      requirements: escrow.taskData.requirements || [],
      tags: escrow.taskData.tags || [],
      isUrgent: escrow.taskData.isUrgent || false,
      viewCount: 0,
      // Escrow данные
      escrowAddress: escrow.escrowAddress,
      escrowId: escrow.escrowId,
      platformFee: escrow.platformFee,
      netAmount: escrow.netAmount
    }

    // Сохраняем задачу
    saveTask(newTask)

    // Переносим escrow в основную базу
    const escrowRecord = {
      taskId,
      escrowAddress: escrow.escrowAddress,
      escrowPrivateKey: escrow.escrowPrivateKey,
      clientId: escrow.clientId,
      amount: escrow.amount,
      token: escrow.token,
      status: 'funded',
      createdAt: escrow.createdAt,
      fundedAt: escrow.fundedAt,
      platformFee: escrow.platformFee,
      netAmount: escrow.netAmount
    }
    
    saveEscrowRecord(escrowRecord)

    // Удаляем из pending escrows
    removePendingEscrow(escrowId)

    console.log(`✅ Task created from escrow: ${taskId}`)

    res.status(201).json({
      success: true,
      message: 'Task created successfully from funded escrow',
      task: newTask,
      escrow: escrowRecord
    })

  } catch (error) {
    console.error('Create task from escrow error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}