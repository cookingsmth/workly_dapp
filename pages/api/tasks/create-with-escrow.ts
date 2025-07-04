// pages/api/tasks/create-with-escrow.ts - API для создания задач с escrow
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { walletService } from '../../../lib/wallet/walletService'

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

  const user = getUserFromToken(req.headers.authorization)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { title, description, reward, deadline, requirements, tags, isUrgent } = req.body

    // Валидация
    if (!title || !description || !reward || !deadline) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, description, reward, deadline' 
      })
    }

    if (!reward.amount || !reward.token || reward.amount <= 0) {
      return res.status(400).json({ error: 'Invalid reward amount or token' })
    }

    if (!['SOL', 'USDT', 'USDC'].includes(reward.token)) {
      return res.status(400).json({ error: 'Unsupported token' })
    }

    // Создаем задачу
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Создаем escrow адрес для задачи
    const escrow = await walletService.createTaskEscrowAddress(
      taskId,
      user.userId,
      reward.amount,
      reward.token
    )

    const newTask = {
      id: taskId,
      title: title.trim(),
      description: description.trim(),
      reward,
      deadline,
      createdBy: user.userId,
      status: 'pending_payment', // Статус "ожидает оплаты"
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      applicants: [],
      requirements: requirements || [],
      tags: tags || [],
      isUrgent: isUrgent || false,
      viewCount: 0,
      // Escrow данные
      escrowAddress: escrow.escrowAddress,
      escrowId: escrow.taskId,
      platformFee: escrow.platformFee,
      netAmount: escrow.netAmount
    }

    // Сохраняем задачу в файл
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
    
    tasks.unshift(newTask) // Добавляем в начало массива
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2))

    res.status(201).json({
      success: true,
      message: 'Task created with escrow address',
      task: newTask,
      escrow: {
        address: escrow.escrowAddress,
        amount: escrow.amount,
        token: escrow.token,
        platformFee: escrow.platformFee,
        netAmount: escrow.netAmount
      },
      paymentInstructions: {
        message: `Send ${reward.amount} ${reward.token} to the escrow address to activate the task`,
        address: escrow.escrowAddress,
        amount: reward.amount,
        token: reward.token,
        explorerUrl: `https://explorer.solana.com/address/${escrow.escrowAddress}?cluster=devnet`
      }
    })

  } catch (error) {
    console.error('Create task with escrow error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}