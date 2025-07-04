// pages/api/wallet/withdraw.ts
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
    const { amount, toAddress, token = 'SOL' } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    if (!toAddress || typeof toAddress !== 'string') {
      return res.status(400).json({ error: 'Invalid destination address' })
    }

    // Используем walletService!
    const result = await walletService.processWithdrawal(
      user.userId,
      parseFloat(amount),
      toAddress.trim()
    )

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Withdrawal processed successfully',
        txHash: result.txHash,
        explorerUrl: `https://explorer.solana.com/tx/${result.txHash}?cluster=devnet`
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      })
    }

  } catch (error) {
    console.error('Withdraw API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}