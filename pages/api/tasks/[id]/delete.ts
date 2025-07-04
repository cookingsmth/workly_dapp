// pages/api/tasks/[taskId]/delete.ts - Удаление задачи с возвратом денег
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

// Пути к файлам данных
const getTasksFilePath = () => path.join(process.cwd(), 'data', 'tasks.json')
const getUsersFilePath = () => path.join(process.cwd(), 'data', 'users.json')
const getEscrowAccountsFilePath = () => path.join(process.cwd(), 'data', 'escrow_accounts.json')
const getPendingEscrowsFilePath = () => path.join(process.cwd(), 'data', 'pending_escrows.json')
const getWalletTransactionsFilePath = () => path.join(process.cwd(), 'data', 'wallet_transactions.json')
const getWalletsFilePath = () => path.join(process.cwd(), 'data', 'wallets.json')

// Создаем папку data если её нет
const ensureDataDir = () => {
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
    }
}

// Функции для работы с файлами
const loadTasks = () => {
    ensureDataDir()
    const filePath = getTasksFilePath()
    if (!fs.existsSync(filePath)) return []
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Error loading tasks:', error)
        return []
    }
}

const saveTasks = (tasks: any[]) => {
    ensureDataDir()
    const filePath = getTasksFilePath()
    try {
        fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2))
    } catch (error) {
        console.error('Error saving tasks:', error)
        throw new Error('Failed to save task data')
    }
}

const loadEscrowAccounts = () => {
    ensureDataDir()
    const filePath = getEscrowAccountsFilePath()
    if (!fs.existsSync(filePath)) return []
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Error loading escrow accounts:', error)
        return []
    }
}

const saveEscrowAccounts = (escrows: any[]) => {
    ensureDataDir()
    const filePath = getEscrowAccountsFilePath()
    try {
        fs.writeFileSync(filePath, JSON.stringify(escrows, null, 2))
    } catch (error) {
        console.error('Error saving escrow accounts:', error)
        throw new Error('Failed to save escrow data')
    }
}

const loadPendingEscrows = () => {
    ensureDataDir()
    const filePath = getPendingEscrowsFilePath()
    if (!fs.existsSync(filePath)) return []
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Error loading pending escrows:', error)
        return []
    }
}

const savePendingEscrows = (escrows: any[]) => {
    ensureDataDir()
    const filePath = getPendingEscrowsFilePath()
    try {
        fs.writeFileSync(filePath, JSON.stringify(escrows, null, 2))
    } catch (error) {
        console.error('Error saving pending escrows:', error)
        throw new Error('Failed to save pending escrow data')
    }
}

const loadWallets = () => {
    ensureDataDir()
    const filePath = getWalletsFilePath()
    if (!fs.existsSync(filePath)) return []
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Error loading wallets:', error)
        return []
    }
}

const saveWallets = (wallets: any[]) => {
    ensureDataDir()
    const filePath = getWalletsFilePath()
    try {
        fs.writeFileSync(filePath, JSON.stringify(wallets, null, 2))
    } catch (error) {
        console.error('Error saving wallets:', error)
        throw new Error('Failed to save wallet data')
    }
}

const loadWalletTransactions = () => {
    ensureDataDir()
    const filePath = getWalletTransactionsFilePath()
    if (!fs.existsSync(filePath)) return []
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Error loading wallet transactions:', error)
        return []
    }
}

const saveWalletTransactions = (transactions: any[]) => {
    ensureDataDir()
    const filePath = getWalletTransactionsFilePath()
    try {
        fs.writeFileSync(filePath, JSON.stringify(transactions, null, 2))
    } catch (error) {
        console.error('Error saving wallet transactions:', error)
        throw new Error('Failed to save transaction data')
    }
}

const loadUsers = () => {
    const filePath = getUsersFilePath()
    if (!fs.existsSync(filePath)) return []
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Error loading users:', error)
        return []
    }
}

// Проверка токена и получение пользователя
const getUserFromToken = (authHeader: string | undefined) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'workly-local-secret-key-2025'
        ) as { userId: string }

        const users = loadUsers()
        const user = users.find((u: any) => u.id === decoded.userId)

        if (!user) return null

        return {
            id: user.id,
            username: user.username,
            email: user.email
        }
    } catch (error) {
        return null
    }
}

// 🎯 ФУНКЦИЯ ВОЗВРАТА ДЕНЕГ С ESCROW
const refundMoneyFromEscrow = async (taskId: string, clientId: string) => {
    try {
        console.log(`💰 Starting refund process for task ${taskId}`)
        
        // Ищем escrow в активных аккаунтах
        let escrowAccounts = loadEscrowAccounts()
        let pendingEscrows = loadPendingEscrows()
        let wallets = loadWallets()
        let transactions = loadWalletTransactions()
        
        // Найти escrow для данной задачи
        const escrowIndex = escrowAccounts.findIndex(escrow => 
            escrow.taskId === taskId && escrow.status === 'funded'
        )
        
        const pendingIndex = pendingEscrows.findIndex(escrow => 
            escrow.taskId === taskId || (escrow.taskData && escrow.taskData.createdBy === clientId)
        )
        
        let refundAmount = 0
        let refundToken = ''
        let escrowToRemove = null
        
        // Обработка активного escrow (со статусом 'funded')
        if (escrowIndex !== -1) {
            const escrow = escrowAccounts[escrowIndex]
            refundAmount = escrow.amount // Возвращаем полную сумму заказчику
            refundToken = escrow.token
            escrowToRemove = escrow
            
            console.log(`💸 Found funded escrow: ${refundAmount} ${refundToken}`)
            
            // Удаляем escrow из активных
            escrowAccounts.splice(escrowIndex, 1)
            saveEscrowAccounts(escrowAccounts)
        }
        // Обработка ожидающего escrow (pending_payment)
        else if (pendingIndex !== -1) {
            const pendingEscrow = pendingEscrows[pendingIndex]
            refundAmount = pendingEscrow.amount || pendingEscrow.taskData?.reward?.amount || 0
            refundToken = pendingEscrow.token || pendingEscrow.taskData?.reward?.token || 'SOL'
            escrowToRemove = pendingEscrow
            
            console.log(`⏳ Found pending escrow: ${refundAmount} ${refundToken}`)
            
            // Удаляем из pending (деньги еще не были списаны)
            pendingEscrows.splice(pendingIndex, 1)
            savePendingEscrows(pendingEscrows)
        }
        
        // Если найден escrow для возврата
        if (escrowToRemove && refundAmount > 0) {
            // Находим кошелек пользователя
            const walletIndex = wallets.findIndex(wallet => wallet.userId === clientId)
            
            if (walletIndex !== -1) {
                const wallet = wallets[walletIndex]
                
                // Возвращаем деньги на баланс пользователя
                switch (refundToken.toUpperCase()) {
                    case 'SOL':
                        wallet.solBalance += refundAmount
                        break
                    case 'USDT':
                        wallet.usdtBalance += refundAmount
                        break
                    case 'USDC':
                        wallet.usdcBalance += refundAmount
                        break
                    case 'WORKLY':
                        wallet.worklyBalance += refundAmount
                        break
                    default:
                        console.warn(`Unknown token type: ${refundToken}`)
                        return false
                }
                
                wallet.lastUpdated = new Date().toISOString()
                
                // Сохраняем обновленный кошелек
                saveWallets(wallets)
                
                // Записываем транзакцию возврата
                const refundTransaction = {
                    id: Date.now().toString(),
                    type: 'task_refund_manual',
                    userId: clientId,
                    taskId: taskId,
                    escrowAddress: escrowToRemove.escrowAddress,
                    amount: refundAmount,
                    token: refundToken,
                    timestamp: new Date().toISOString(),
                    description: `Manual refund for deleted task ${taskId}`
                }
                
                transactions.push(refundTransaction)
                saveWalletTransactions(transactions)
                
                console.log(`✅ Successfully refunded ${refundAmount} ${refundToken} to user ${clientId}`)
                return {
                    success: true,
                    refundAmount,
                    refundToken,
                    escrowAddress: escrowToRemove.escrowAddress
                }
            } else {
                console.error(`❌ Wallet not found for user ${clientId}`)
                return { success: false, error: 'Wallet not found' }
            }
        } else {
            console.log(`ℹ️ No escrow found for task ${taskId} - no refund needed`)
            return { success: true, refundAmount: 0, refundToken: 'NONE' }
        }
        
    } catch (error) {
        console.error('❌ Error during refund process:', error)
        return { success: false, error: error.message }
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method, query } = req
    const { taskId } = query

    if (method !== 'DELETE') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: `Method ${method} is not supported on this endpoint`
        })
    }

    try {
        // Проверяем аутентификацию
        const user = getUserFromToken(req.headers.authorization)

        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required to delete tasks'
            })
        }

        // Загружаем задачи
        const tasks = loadTasks()
        const taskIndex = tasks.findIndex(task => task.id === taskId)

        if (taskIndex === -1) {
            return res.status(404).json({
                error: 'Task not found',
                message: `Task with ID ${taskId} does not exist`
            })
        }

        const task = tasks[taskIndex]

        // Проверяем права: только создатель может удалить задачу
        if (task.createdBy !== user.id) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only delete tasks you created'
            })
        }

        // Проверяем статус задачи: можно удалить только открытые задачи
        if (task.status !== 'open') {
            return res.status(400).json({
                error: 'Invalid task status',
                message: `Cannot delete task with status: ${task.status}. Only open tasks can be deleted.`
            })
        }

        // Проверяем что задача не назначена исполнителю
        if (task.assignedTo) {
            return res.status(400).json({
                error: 'Task already assigned',
                message: 'Cannot delete task that is already assigned to a worker'
            })
        }

        console.log(`🗑️ Deleting task ${taskId} by user ${user.id}`)

        // 🎯 ВОЗВРАЩАЕМ ДЕНЬГИ С ESCROW
        const refundResult = await refundMoneyFromEscrow(taskId, user.id)

        if (!refundResult.success) {
            return res.status(500).json({
                error: 'Refund failed',
                message: `Failed to process refund: ${refundResult.error}`,
                taskDeleted: false
            })
        }

        // Удаляем задачу
        tasks.splice(taskIndex, 1)
        saveTasks(tasks)

        console.log(`✅ Task ${taskId} successfully deleted with refund`)

        // Формируем ответ
        const response = {
            success: true,
            message: 'Task deleted successfully',
            taskId: taskId,
            refund: {
                processed: refundResult.refundAmount > 0,
                amount: refundResult.refundAmount,
                token: refundResult.refundToken,
                escrowAddress: refundResult.escrowAddress
            }
        }

        res.status(200).json(response)

    } catch (error) {
        console.error('Delete task error:', error)
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete task'
        })
    }
}