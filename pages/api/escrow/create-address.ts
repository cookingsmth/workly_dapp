// pages/api/escrow/create-address.ts - Создание только escrow адреса
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

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

// Временное хранение escrow данных (до создания задачи)
interface PendingEscrow {
  escrowId: string
  escrowAddress: string
  escrowPrivateKey: string // зашифрованный
  clientId: string
  amount: number
  token: 'SOL' | 'USDT' | 'USDC'
  status: 'pending_payment'
  createdAt: string
  platformFee: number
  netAmount: number
  taskData: any // данные для создания задачи после оплаты
}

const savePendingEscrow = (escrow: PendingEscrow) => {
  const fs = require('fs')
  const path = require('path')
  
  const filePath = path.join(process.cwd(), 'data', 'pending_escrows.json')
  const dir = path.dirname(filePath)
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  let escrows = []
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8')
      escrows = JSON.parse(data)
    } catch (error) {
      escrows = []
    }
  }
  
  escrows.push(escrow)
  fs.writeFileSync(filePath, JSON.stringify(escrows, null, 2))
}

const encryptPrivateKey = (privateKey: string): string => {
  // В продакшене использовать реальное шифрование
  return Buffer.from(privateKey).toString('base64')
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
    const { amount, token, taskData } = req.body

    // Валидация
    if (!amount || !token || !taskData) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, token, taskData' 
      })
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' })
    }

    if (!['SOL', 'USDT', 'USDC'].includes(token)) {
      return res.status(400).json({ error: 'Unsupported token' })
    }

    // Валидация taskData
    if (!taskData.title || !taskData.description || !taskData.deadline) {
      return res.status(400).json({ 
        error: 'Invalid task data: title, description, and deadline are required' 
      })
    }

    // Создаем escrow адрес
    const escrowKeypair = Keypair.generate()
    const platformFee = amount * 0.025 // 2.5%
    const netAmount = amount - platformFee
    const escrowId = `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const pendingEscrow: PendingEscrow = {
      escrowId,
      escrowAddress: escrowKeypair.publicKey.toString(),
      escrowPrivateKey: encryptPrivateKey(bs58.encode(escrowKeypair.secretKey)),
      clientId: user.userId,
      amount,
      token,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      platformFee,
      netAmount,
      taskData: {
        ...taskData,
        createdBy: user.userId,
        reward: { amount, token }
      }
    }

    // Сохраняем pending escrow
    savePendingEscrow(pendingEscrow)

    console.log(`✅ Created escrow address: ${escrowKeypair.publicKey.toString()}`)

    res.status(201).json({
      success: true,
      message: 'Escrow address created. Send payment to activate.',
      escrowId,
      escrowAddress: escrowKeypair.publicKey.toString(),
      amount,
      token,
      platformFee,
      netAmount,
      paymentInstructions: {
        message: `Send exactly ${amount} ${token} to the escrow address`,
        address: escrowKeypair.publicKey.toString(),
        amount,
        token,
        explorerUrl: `https://explorer.solana.com/address/${escrowKeypair.publicKey.toString()}?cluster=devnet`
      }
    })

  } catch (error) {
    console.error('Create escrow address error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}