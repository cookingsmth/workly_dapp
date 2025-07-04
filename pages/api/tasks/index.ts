// pages/api/tasks/index.ts - С автоматическим возвратом денег и удалением просроченных задач
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

// Валидация для создания задачи
const createTaskSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
    reward: z.object({
        amount: z.number().positive('Reward amount must be positive'),
        token: z.string().min(1, 'Token is required')
    }),
    deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid deadline format'
    }),
    tags: z.array(z.string()).optional(),
    isUrgent: z.boolean().optional(),
    requirements: z.array(z.string()).optional()
})

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
                    type: 'task_refund',
                    userId: clientId,
                    taskId: taskId,
                    escrowAddress: escrowToRemove.escrowAddress,
                    amount: refundAmount,
                    token: refundToken,
                    timestamp: new Date().toISOString(),
                    description: `Refund for expired/deleted task ${taskId}`
                }

                transactions.push(refundTransaction)
                saveWalletTransactions(transactions)

                console.log(`✅ Successfully refunded ${refundAmount} ${refundToken} to user ${clientId}`)
                return true
            } else {
                console.error(`❌ Wallet not found for user ${clientId}`)
                return false
            }
        } else {
            console.log(`ℹ️ No escrow found for task ${taskId} - no refund needed`)
            return true // Не ошибка, просто нет escrow для возврата
        }

    } catch (error) {
        console.error('❌ Error during refund process:', error)
        return false
    }
}

// 🎯 АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ И УДАЛЕНИЕ ПРОСРОЧЕННЫХ ЗАДАЧ С ВОЗВРАТОМ ДЕНЕГ
const updateAndCleanupExpiredTasks = async (tasks: any[]) => {
    const now = new Date()
    let hasChanges = false
    let deletedCount = 0
    let refundedCount = 0

    const tasksToKeep = []

    for (const task of tasks) {
        // Если задача открыта, но дедлайн прошел
        if (task.status === 'open' && new Date(task.deadline) <= now) {
            console.log(`🕒 Task ${task.id} expired, processing refund and deletion...`)

            // Пытаемся вернуть деньги
            const refundSuccess = await refundMoneyFromEscrow(task.id, task.createdBy)

            if (refundSuccess) {
                refundedCount++
                console.log(`✅ Refund completed for task ${task.id}`)
            } else {
                console.warn(`⚠️ Refund failed for task ${task.id}`)
            }

            // Удаляем задачу (не сохраняем в tasksToKeep)
            deletedCount++
            hasChanges = true

            console.log(`🗑️ Task ${task.id} deleted`)
        } else {
            // Задача остается
            tasksToKeep.push(task)
        }
    }

    if (hasChanges) {
        console.log(`🧹 Cleanup complete: ${deletedCount} tasks deleted, ${refundedCount} refunds processed`)
    }

    return {
        updatedTasks: tasksToKeep,
        hasChanges,
        deletedCount,
        refundedCount
    }
}

// 🎯 ФИЛЬТРАЦИЯ ТОЛЬКО АКТУАЛЬНЫХ ЗАДАЧ ДЛЯ ПУБЛИЧНОГО ПРОСМОТРА
const getPublicTasks = (tasks: any[], currentUserId?: string) => {
    return tasks
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req

    if (method === 'GET') {
        // Получение списка задач
        try {
            // Загружаем все задачи
            let tasks = loadTasks()

            // 🎯 АВТОМАТИЧЕСКИ ОБНОВЛЯЕМ И УДАЛЯЕМ ПРОСРОЧЕННЫЕ ЗАДАЧИ С ВОЗВРАТОМ ДЕНЕГ
            const { updatedTasks, hasChanges, deletedCount, refundedCount } = await updateAndCleanupExpiredTasks(tasks)
            tasks = updatedTasks

            // Сохраняем изменения если есть обновления
            if (hasChanges) {
                saveTasks(tasks)
                console.log(`✅ Cleanup completed: ${deletedCount} expired tasks deleted, ${refundedCount} refunds processed`)
            }

            // 🎯 ФИЛЬТРУЕМ ТОЛЬКО АКТУАЛЬНЫЕ ЗАДАЧИ ДЛЯ ПУБЛИЧНОГО ПРОСМОТРА
            const publicTasks = getPublicTasks(tasks)

            // Сортируем по дате создания (новые первыми)
            publicTasks.sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            res.status(200).json({
                success: true,
                tasks: publicTasks,
                total: publicTasks.length,
                totalAll: tasks.length,
                cleanup: {
                    deletedTasks: deletedCount,
                    refundsProcessed: refundedCount
                }
            })

        } catch (error) {
            console.error('Get tasks error:', error)
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to get tasks'
            })
        }

    } else if (method === 'POST') {
        // Создание новой задачи
        try {
            // Проверяем аутентификацию
            const user = getUserFromToken(req.headers.authorization)

            if (!user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required to create tasks'
                })
            }

            console.log('🔥 req.body =', req.body)
            // Валидация данных
            const validation = createTaskSchema.safeParse(req.body)

            if (!validation.success) {
                console.error('❌ Zod validation error:', validation.error.errors)
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.error.errors
                })
            }

            const taskData = validation.data

            // Проверяем что deadline в будущем
            const deadlineDate = new Date(taskData.deadline)
            if (deadlineDate <= new Date()) {
                return res.status(400).json({
                    error: 'Invalid deadline',
                    message: 'Deadline must be in the future'
                })
            }

            // Создаем новую задачу
            const newTask = {
                id: Date.now().toString(),
                title: taskData.title.trim(),
                description: taskData.description.trim(),
                reward: taskData.reward,
                deadline: taskData.deadline,
                tags: taskData.tags || [],
                isUrgent: taskData.isUrgent || false,
                requirements: Array.isArray(taskData.requirements) ? taskData.requirements : [],
                status: 'open',
                createdBy: user.id,
                createdByUsername: user.username,
                assignedTo: null,
                applicants: [],
                applicationCount: 0,
                viewCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            // Загружаем существующие задачи и добавляем новую
            const tasks = loadTasks()
            tasks.push(newTask)
            saveTasks(tasks)

            res.status(201).json({
                success: true,
                message: 'Task created successfully',
                task: newTask
            })

        } catch (error) {
            console.error('Create task error:', error)
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to create task'
            })
        }

    } else {
        // Метод не поддерживается
        res.status(405).json({
            error: 'Method not allowed',
            message: `Method ${method} is not supported on this endpoint`
        })
    }
}