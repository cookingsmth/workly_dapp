// pages/api/wallet/create.ts - API для создания кошелька
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
    // Проверяем, есть ли уже кошелек у пользователя
    const existingWallet = await walletService.getWalletInfo(user.userId)
    if (existingWallet) {
      return res.status(200).json({
        success: true,
        message: 'Wallet already exists',
        wallet: {
          ...existingWallet,
          privateKey: undefined // Не отправляем приватный ключ
        }
      })
    }

    // Создаем новый кошелек
    const wallet = await walletService.createWalletForUser(user.userId)

    res.status(201).json({
      success: true,
      message: 'Wallet created successfully',
      wallet: {
        ...wallet,
        privateKey: undefined // Не отправляем приватный ключ
      }
    })

  } catch (error) {
    console.error('Create wallet error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}