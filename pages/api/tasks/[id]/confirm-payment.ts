// pages/api/tasks/[id]/confirm-payment.ts
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { walletService } from '../../../../lib/wallet/walletService'

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
    console.log('🔥 CONFIRM PAYMENT API START')
    console.log('🔥 taskId:', req.query.id)
    console.log('🔥 method:', req.method)
    console.log('🔥 body:', req.body)

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { id: taskId } = req.query
    console.log('🔥 extracted taskId:', taskId)

    const user = getUserFromToken(req.headers.authorization)
    console.log('🔥 user:', user ? user.userId : 'NOT FOUND')

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        console.log('🔥 reading tasks file...')

        // Читаем задачи
        const tasksFile = path.join(process.cwd(), 'data', 'tasks.json')
        console.log('🔥 tasks file path:', tasksFile)

        if (!fs.existsSync(tasksFile)) {
            console.log('❌ tasks file not found')
            return res.status(404).json({ error: 'Tasks file not found' })
        }

        const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'))
        console.log('🔥 total tasks:', tasks.length)

        const taskIndex = tasks.findIndex((t: any) => t.id === taskId)

        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' })
        }

        const task = tasks[taskIndex]

        console.log('🔥 task found:', task ? 'YES' : 'NO')
        console.log('🔥 task details:', task)
        // Проверяем что пользователь - заказчик
        if (task.createdBy !== user.userId) {
            return res.status(403).json({ error: 'Only task creator can approve payment' })
        }

        // Обновляем подтверждение оплаты
        tasks[taskIndex].clientConfirmed = true
        tasks[taskIndex].clientConfirmedAt = new Date().toISOString()
        tasks[taskIndex].updatedAt = new Date().toISOString()

        // Проверяем если оба подтвердили - запускаем перевод денег
        if (tasks[taskIndex].clientConfirmed && tasks[taskIndex].workerConfirmed) {
            // Импортируем функцию перевода денег

            const result = await walletService.completeTask(taskId as string, task.assignedTo)

            if (result.success) {
                tasks[taskIndex].status = 'completed'
                tasks[taskIndex].completedAt = new Date().toISOString()
                tasks[taskIndex].completionTxHash = result.txHash
            }
        }

        // Сохраняем изменения
        fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2))

        res.status(200).json({
            success: true,
            message: 'Payment approved successfully',
            task: tasks[taskIndex]
        })

    } catch (error: any) {
        console.error('❌ CONFIRM PAYMENT ERROR:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            stack: error.stack
        });
    }
    }