// lib/wallet/walletService.ts - Основной сервис кошельков
import { Keypair, PublicKey, Connection, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js'
import bs58 from 'bs58'

// Типы
interface UserWallet {
  userId: string
  publicKey: string
  privateKey: string // зашифрованный
  solBalance: number
  usdtBalance: number
  usdcBalance: number
  worklyBalance: number
  totalEarned: number
  totalSpent: number
  createdAt: string
  lastUpdated: string
}

interface EscrowAccount {
  taskId: string
  escrowAddress: string
  escrowPrivateKey: string // зашифрованный
  clientId: string
  workerId?: string
  amount: number
  token: 'SOL' | 'USDT' | 'USDC'
  status: 'pending_payment' | 'funded' | 'completed' | 'cancelled'
  createdAt: string
  fundedAt?: string
  completedAt?: string
  platformFee: number
  netAmount: number // amount - platformFee
}

export class WalletService {
  private connection: Connection
  private walletsFile = 'data/wallets.json'
  private escrowsFile = 'data/escrow_accounts.json'
  private transactionsFile = 'data/wallet_transactions.json'

  constructor(rpcUrl: string = 'https://api.devnet.solana.com') {
    this.connection = new Connection(rpcUrl, 'confirmed')
  }

  // Создание кошелька для нового пользователя
  async createUserWallet(userId: string): Promise<UserWallet> {
    const keypair = Keypair.generate()

    const wallet: UserWallet = {
      userId,
      publicKey: keypair.publicKey.toString(),
      privateKey: this.encryptPrivateKey(bs58.encode(keypair.secretKey)),
      solBalance: 0,
      usdtBalance: 0,
      usdcBalance: 0,
      worklyBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    await this.saveWallet(wallet)

    // Логируем создание
    await this.logTransaction({
      type: 'wallet_created',
      userId,
      walletAddress: wallet.publicKey,
      timestamp: new Date().toISOString()
    })

    return wallet
  }

  // Создание escrow адреса для задачи
  async createTaskEscrow(taskId: string, clientId: string, amount: number, token: 'SOL' | 'USDT' | 'USDC'): Promise<EscrowAccount> {
    const escrowKeypair = Keypair.generate()
    const platformFee = this.calculatePlatformFee(amount)
    const netAmount = amount - platformFee

    const escrow: EscrowAccount = {
      taskId,
      escrowAddress: escrowKeypair.publicKey.toString(),
      escrowPrivateKey: this.encryptPrivateKey(bs58.encode(escrowKeypair.secretKey)),
      clientId,
      amount,
      token,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      platformFee,
      netAmount
    }

    await this.saveEscrow(escrow)

    // Логируем создание escrow
    await this.logTransaction({
      type: 'escrow_created',
      userId: clientId,
      taskId,
      escrowAddress: escrow.escrowAddress,
      amount,
      token,
      timestamp: new Date().toISOString()
    })

    return escrow
  }

  // Проверка поступления средств на escrow
  async checkEscrowFunding(escrowAddress: string): Promise<boolean> {
    try {
      const escrow = await this.getEscrowByAddress(escrowAddress)
      if (!escrow || escrow.status !== 'pending_payment') {
        return false
      }

      let balance = 0
      if (escrow.token === 'SOL') {
        balance = await this.connection.getBalance(new PublicKey(escrowAddress))
        balance = balance / LAMPORTS_PER_SOL
      }
      // TODO: Добавить проверку для SPL токенов

      // Проверяем, достаточно ли средств (с небольшой погрешностью)
      if (balance >= escrow.amount * 0.99) { // 1% погрешность на комиссии сети
        await this.markEscrowAsFunded(escrowAddress)
        return true
      }

      return false
    } catch (error) {
      console.error('Error checking escrow funding:', error)
      return false
    }
  }

  // Завершение задачи и перевод средств
  async completeTaskAndTransfer(taskId: string, workerId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const escrow = await this.getEscrowByTaskId(taskId)
      if (!escrow || escrow.status !== 'funded') {
        return { success: false, error: 'Escrow not found or not funded' }
      }

      const workerWallet = await this.getUserWallet(workerId)
      if (!workerWallet) {
        return { success: false, error: 'Worker wallet not found' }
      }

      // Создаем транзакцию для перевода (только для SOL пока)
      if (escrow.token === 'SOL') {
        const escrowKeypair = this.decryptPrivateKey(escrow.escrowPrivateKey)
        const transaction = new Transaction()

        // Перевод SOL исполнителю
        const workerTransfer = SystemProgram.transfer({
          fromPubkey: new PublicKey(escrow.escrowAddress),
          toPubkey: new PublicKey(workerWallet.publicKey),
          lamports: Math.floor(escrow.netAmount * LAMPORTS_PER_SOL)
        })
        transaction.add(workerTransfer)

        const WORKLY_TREASURY_WALLET = "25ZX5Cfc8Pxy7EnsvJ6JNbjbq4c8E9eFuPrzwjUabF4e"
        const platformTransfer = SystemProgram.transfer({
          fromPubkey: new PublicKey(escrow.escrowAddress),
          toPubkey: new PublicKey(WORKLY_TREASURY_WALLET),
          lamports: Math.floor(escrow.platformFee * LAMPORTS_PER_SOL)
        })
        transaction.add(platformTransfer)

        const txHash = await sendAndConfirmTransaction(
          this.connection,
          transaction,
          [escrowKeypair],
          { commitment: 'confirmed' }
        )

        // Обновляем статус escrow
        await this.markEscrowAsCompleted(escrow.escrowAddress, txHash)

        // Обновляем балансы пользователей
        await this.updateUserBalance(workerId, escrow.netAmount, escrow.token, 'earned')
        await this.updateUserBalance(escrow.clientId, escrow.amount, escrow.token, 'spent')

        // Начисляем WORKLY токены за завершение задачи
        await this.rewardWorklyTokens(workerId, escrow.netAmount)

        // Логируем транзакцию
        await this.logTransaction({
          type: 'task_completed',
          userId: workerId,
          taskId,
          amount: escrow.netAmount,
          token: escrow.token,
          txHash,
          timestamp: new Date().toISOString()
        })

        return { success: true, txHash }
      }

      return { success: false, error: 'Only SOL transfers supported currently' }

    } catch (error) {
      console.error('Error completing task transfer:', error)
      return { success: false, error: 'Failed to transfer funds' }
    }
  }

  // Начисление WORKLY токенов за активность
  async rewardWorklyTokens(userId: string, earnedAmount: number): Promise<void> {
    try {
      // Формула: 1% от заработанной суммы в WORKLY токенах
      const worklyReward = earnedAmount * 0.01

      const userWallet = await this.getUserWallet(userId)
      if (userWallet) {
        userWallet.worklyBalance += worklyReward
        userWallet.lastUpdated = new Date().toISOString()
        await this.saveWallet(userWallet)

        await this.logTransaction({
          type: 'workly_reward',
          userId,
          amount: worklyReward,
          token: 'WORKLY',
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error rewarding WORKLY tokens:', error)
    }
  }

  // Применение скидки WORKLY токена на комиссии
  calculateDiscountedFee(amount: number, worklyBalance: number): number {
    const baseFee = this.calculatePlatformFee(amount)

    if (worklyBalance >= 1000) {
      return baseFee * 0.5 // 50% скидка
    } else if (worklyBalance >= 500) {
      return baseFee * 0.7 // 30% скидка
    } else if (worklyBalance >= 100) {
      return baseFee * 0.85 // 15% скидка
    }

    return baseFee
  }

  // Вспомогательные методы
  private calculatePlatformFee(amount: number): number {
    return amount * 0.025 // 2.5%
  }

  private encryptPrivateKey(privateKey: string): string {
    // В продакшене использовать реальное шифрование
    return Buffer.from(privateKey).toString('base64')
  }

  private decryptPrivateKey(encryptedKey: string): Keypair {
    // В продакшене использовать реальное расшифрование
    const privateKey = Buffer.from(encryptedKey, 'base64').toString()
    return Keypair.fromSecretKey(bs58.decode(privateKey))
  }

  // Методы работы с файлами (заменить на БД в продакшене)
  private async saveWallet(wallet: UserWallet): Promise<void> {
    const fs = require('fs')
    const path = require('path')

    const filePath = path.join(process.cwd(), this.walletsFile)
    const dir = path.dirname(filePath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    let wallets = []
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8')
        wallets = JSON.parse(data)
      } catch (error) {
        wallets = []
      }
    }

    const existingIndex = wallets.findIndex((w: UserWallet) => w.userId === wallet.userId)
    if (existingIndex >= 0) {
      wallets[existingIndex] = wallet
    } else {
      wallets.push(wallet)
    }

    fs.writeFileSync(filePath, JSON.stringify(wallets, null, 2))
  }

  private async getUserWallet(userId: string): Promise<UserWallet | null> {
    const fs = require('fs')
    const path = require('path')

    const filePath = path.join(process.cwd(), this.walletsFile)
    if (!fs.existsSync(filePath)) return null

    try {
      const data = fs.readFileSync(filePath, 'utf8')
      const wallets = JSON.parse(data)
      return wallets.find((w: UserWallet) => w.userId === userId) || null
    } catch (error) {
      return null
    }
  }

  private async saveEscrow(escrow: EscrowAccount): Promise<void> {
    const fs = require('fs')
    const path = require('path')

    const filePath = path.join(process.cwd(), this.escrowsFile)
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

    const existingIndex = escrows.findIndex((e: EscrowAccount) => e.taskId === escrow.taskId)
    if (existingIndex >= 0) {
      escrows[existingIndex] = escrow
    } else {
      escrows.push(escrow)
    }

    fs.writeFileSync(filePath, JSON.stringify(escrows, null, 2))
  }

  private async getEscrowByAddress(escrowAddress: string): Promise<EscrowAccount | null> {
    const fs = require('fs')
    const path = require('path')

    const filePath = path.join(process.cwd(), this.escrowsFile)
    if (!fs.existsSync(filePath)) return null

    try {
      const data = fs.readFileSync(filePath, 'utf8')
      const escrows = JSON.parse(data)
      return escrows.find((e: EscrowAccount) => e.escrowAddress === escrowAddress) || null
    } catch (error) {
      return null
    }
  }

  private async getEscrowByTaskId(taskId: string): Promise<EscrowAccount | null> {
    const fs = require('fs')
    const path = require('path')

    const filePath = path.join(process.cwd(), this.escrowsFile)
    if (!fs.existsSync(filePath)) return null

    try {
      const data = fs.readFileSync(filePath, 'utf8')
      const escrows = JSON.parse(data)
      return escrows.find((e: EscrowAccount) => e.taskId === taskId) || null
    } catch (error) {
      return null
    }
  }

  private async markEscrowAsFunded(escrowAddress: string): Promise<void> {
    const escrow = await this.getEscrowByAddress(escrowAddress)
    if (escrow) {
      escrow.status = 'funded'
      escrow.fundedAt = new Date().toISOString()
      await this.saveEscrow(escrow)
    }
  }

  private async markEscrowAsCompleted(escrowAddress: string, txHash: string): Promise<void> {
    const escrow = await this.getEscrowByAddress(escrowAddress)
    if (escrow) {
      escrow.status = 'completed'
      escrow.completedAt = new Date().toISOString()
      await this.saveEscrow(escrow)
    }
  }

  private async updateUserBalance(userId: string, amount: number, token: string, type: 'earned' | 'spent' | 'withdrawn'): Promise<void> {
    const wallet = await this.getUserWallet(userId)
    if (!wallet) return

    if (type === 'earned') {
      switch (token) {
        case 'SOL': wallet.solBalance += amount; break
        case 'USDT': wallet.usdtBalance += amount; break
        case 'USDC': wallet.usdcBalance += amount; break
      }
      wallet.totalEarned += amount
    } else if (type === 'spent') {
      wallet.totalSpent += amount
    } else if (type === 'withdrawn') {
      switch (token) {
        case 'SOL': wallet.solBalance -= amount; break
        case 'USDT': wallet.usdtBalance -= amount; break
        case 'USDC': wallet.usdcBalance -= amount; break
      }
    }

    wallet.lastUpdated = new Date().toISOString()
    await this.saveWallet(wallet)
  }

  private async logTransaction(transaction: any): Promise<void> {
    const fs = require('fs')
    const path = require('path')

    const filePath = path.join(process.cwd(), this.transactionsFile)
    const dir = path.dirname(filePath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    let transactions = []
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8')
        transactions = JSON.parse(data)
      } catch (error) {
        transactions = []
      }
    }

    transactions.push({
      id: Date.now().toString(),
      ...transaction
    })

    fs.writeFileSync(filePath, JSON.stringify(transactions, null, 2))
  }

  async syncWalletBalance(userId: string): Promise<UserWallet | null> {
    try {
      const wallet = await this.getUserWallet(userId)
      if (!wallet) return null

      // Получаем реальный баланс SOL с блокчейна
      const publicKey = new PublicKey(wallet.publicKey)
      const balance = await this.connection.getBalance(publicKey)
      const solBalance = balance / LAMPORTS_PER_SOL

      // Обновляем баланс в локальных данных
      wallet.solBalance = solBalance
      wallet.lastUpdated = new Date().toISOString()

      // Сохраняем обновленный кошелек
      await this.saveWallet(wallet)

      console.log(`Updated balance for ${userId}: ${solBalance} SOL`)
      return wallet

    } catch (error) {
      console.error('Error syncing wallet balance:', error)
      return null
    }
  }

  // Публичные методы для API
  async createWalletForUser(userId: string): Promise<UserWallet> {
    return await this.createUserWallet(userId)
  }

  async getWalletInfo(userId: string): Promise<UserWallet | null> {
    try {
      // Сначала получаем кошелек из файла
      let wallet = await this.getUserWallet(userId)
      if (!wallet) return null

      // Синхронизируем баланс с блокчейном
      wallet = await this.syncWalletBalance(userId)

      return wallet
    } catch (error) {
      console.error('Error getting wallet info:', error)
      return null
    }
  }

  async createTaskEscrowAddress(taskId: string, clientId: string, amount: number, token: 'SOL' | 'USDT' | 'USDC'): Promise<EscrowAccount> {
    return await this.createTaskEscrow(taskId, clientId, amount, token)
  }

  async checkTaskFunding(taskId: string): Promise<boolean> {
    const escrow = await this.getEscrowByTaskId(taskId)
    if (!escrow) return false
    return await this.checkEscrowFunding(escrow.escrowAddress)
  }

  async completeTask(taskId: string, workerId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    return await this.completeTaskAndTransfer(taskId, workerId)
  }

  // Метод для вывода средств
  async withdrawFunds(userId: string, amount: number, toAddress: string, token: 'SOL' = 'SOL'): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const userWallet = await this.getUserWallet(userId)
      if (!userWallet) {
        return { success: false, error: 'User wallet not found' }
      }

      const currentBalance = userWallet.solBalance
      if (amount > currentBalance) {
        return { success: false, error: 'Insufficient balance' }
      }

      try {
        new PublicKey(toAddress)
      } catch (e) {
        return { success: false, error: 'Invalid Solana address' }
      }

      if (amount < 0.001) {
        return { success: false, error: 'Minimum withdrawal amount is 0.001 SOL' }
      }

      const userKeypair = this.decryptPrivateKey(userWallet.privateKey)
      const transaction = new Transaction()

      const transfer = SystemProgram.transfer({
        fromPubkey: userKeypair.publicKey,
        toPubkey: new PublicKey(toAddress),
        lamports: Math.floor(amount * LAMPORTS_PER_SOL)
      })
      transaction.add(transfer)

      const txHash = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [userKeypair],
        { commitment: 'confirmed' }
      )

      await this.updateUserBalance(userId, amount, token, 'withdrawn')

      await this.logTransaction({
        type: 'withdrawal',
        userId,
        amount,
        token,
        toAddress,
        txHash,
        timestamp: new Date().toISOString()
      })

      return { success: true, txHash }

    } catch (error: any) {
      console.error('Error withdrawing funds:', error)
      return { success: false, error: 'Failed to process withdrawal' }
    }
  } 

  async forceRefreshWallet(userId: string): Promise<UserWallet | null> {
  console.log(`Force refreshing wallet for user: ${userId}`)
  return await this.syncWalletBalance(userId)
}

  // Публичный метод для API
  async processWithdrawal(userId: string, amount: number, toAddress: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    return await this.withdrawFunds(userId, amount, toAddress, 'SOL')
  }
}
// Экспортируем синглтон
export const walletService = new WalletService()