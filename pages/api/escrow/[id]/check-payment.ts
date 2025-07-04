// pages/api/escrow/[id]/check-payment.ts - Проверка поступления средств
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

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

const savePendingEscrows = (escrows: any[]) => {
  const fs = require('fs')
  const path = require('path')
  
  const filePath = path.join(process.cwd(), 'data', 'pending_escrows.json')
  fs.writeFileSync(filePath, JSON.stringify(escrows, null, 2))
}

const markEscrowAsFunded = (escrowId: string) => {
  const escrows = loadPendingEscrows()
  const escrowIndex = escrows.findIndex((e: any) => e.escrowId === escrowId)
  
  if (escrowIndex !== -1) {
    escrows[escrowIndex].status = 'funded'
    escrows[escrowIndex].fundedAt = new Date().toISOString()
    savePendingEscrows(escrows)
    return escrows[escrowIndex]
  }
  
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: escrowId } = req.query
  const user = getUserFromToken(req.headers.authorization)
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Найдем pending escrow
    const pendingEscrows = loadPendingEscrows()
    const escrow = pendingEscrows.find((e: any) => e.escrowId === escrowId)
    
    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' })
    }

    // Проверяем права доступа
    if (escrow.clientId !== user.userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (escrow.status === 'funded') {
      return res.status(200).json({
        success: true,
        funded: true,
        message: 'Payment already confirmed'
      })
    }

    // Подключаемся к Solana для проверки баланса
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    
    let balance = 0
    
    if (escrow.token === 'SOL') {
      // Проверяем баланс SOL
      try {
        const solBalance = await connection.getBalance(new PublicKey(escrow.escrowAddress))
        balance = solBalance / LAMPORTS_PER_SOL
        
        console.log(`💰 Checking SOL balance for ${escrow.escrowAddress}:`, balance)
      } catch (error) {
        console.error('Error checking SOL balance:', error)
        return res.status(500).json({ error: 'Failed to check SOL balance' })
      }
    } else {
      // TODO: Проверка SPL токенов (USDT/USDC)
      console.log(`⚠️ SPL token checking not implemented yet for ${escrow.token}`)
      return res.status(400).json({ 
        error: `${escrow.token} payment checking not implemented yet. Please use SOL for now.` 
      })
    }

    // Проверяем, достаточно ли средств (с погрешностью 1% на комиссии сети)
    const expectedAmount = escrow.amount
    const tolerance = expectedAmount * 0.01 // 1% погрешность
    
    console.log(`🔍 Expected: ${expectedAmount}, Found: ${balance}, Tolerance: ${tolerance}`)
    
    if (balance >= (expectedAmount - tolerance)) {
      // Платеж подтвержден!
      const fundedEscrow = markEscrowAsFunded(escrowId as string)
      
      console.log(`✅ Payment confirmed for escrow ${escrowId}`)
      
      return res.status(200).json({
        success: true,
        funded: true,
        message: 'Payment confirmed! You can now create the task.',
        escrow: fundedEscrow,
        paymentDetails: {
          expectedAmount,
          receivedAmount: balance,
          token: escrow.token,
          confirmationTime: new Date().toISOString()
        }
      })
    } else {
      // Платеж еще не поступил
      console.log(`⏳ Payment not detected yet for escrow ${escrowId}`)
      
      return res.status(200).json({
        success: false,
        funded: false,
        message: 'Payment not detected yet. Please wait a few moments after sending.',
        paymentDetails: {
          expectedAmount,
          currentBalance: balance,
          token: escrow.token,
          shortfall: expectedAmount - balance
        }
      })
    }

  } catch (error) {
    console.error('Check payment error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}