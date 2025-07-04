// pages/api/wallet/refresh.ts
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
    const wallet = await walletService.forceRefreshWallet(user.userId)
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    res.status(200).json({
      success: true,
      wallet: {
        ...wallet,
        privateKey: undefined
      }
    })

  } catch (error) {
    console.error('Refresh wallet error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}