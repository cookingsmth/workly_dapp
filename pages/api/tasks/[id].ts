// pages/api/tasks/[id].ts
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

// Пути к файлам данных
const getTasksFilePath = () => path.join(process.cwd(), 'data', 'tasks.json')
const getApplicationsFilePath = () => path.join(process.cwd(), 'data', 'applications.json')

const loadTasks = () => {
  const filePath = getTasksFilePath()
  
  if (!fs.existsSync(filePath)) {
    return []
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading tasks:', error)
    return []
  }
}

const saveTasks = (tasks: any[]) => {
  const filePath = getTasksFilePath()
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2))
  } catch (error) {
    console.error('Error saving tasks:', error)
    throw new Error('Failed to save task data')
  }
}

const loadApplications = () => {
  const filePath = getApplicationsFilePath()
  
  if (!fs.existsSync(filePath)) {
    return []
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading applications:', error)
    return []
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Task ID is required'
    })
  }

  if (method === 'GET') {
    try {
      // Загружаем задачи
      const tasks = loadTasks()
      const taskIndex = tasks.findIndex((t: any) => t.id === id)
      
      if (taskIndex === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Task not found'
        })
      }

      const task = tasks[taskIndex]

      // Увеличиваем счетчик просмотров
      task.viewCount = (task.viewCount || 0) + 1
      task.updatedAt = new Date().toISOString()
      
      // Сохраняем обновленную задачу
      tasks[taskIndex] = task
      saveTasks(tasks)

      // Загружаем заявки для этой задачи
      const applications = loadApplications()
      const taskApplications = applications.filter((app: any) => app.taskId === id)

      // Формируем ответ с дополнительной информацией
      const taskWithDetails = {
        ...task,
        applicationCount: taskApplications.length,
        applications: taskApplications // Включаем заявки для создателя
      }

      res.status(200).json({
        success: true,
        task: taskWithDetails
      })

    } catch (error) {
      console.error('Get task details error:', error)
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get task details'
      })
    }

  } else {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: `Method ${method} is not supported`
    })
  }
}