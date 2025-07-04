// pages/api/portfolio/[id].ts
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Импортируем массив из index.ts (в реальном проекте используйте базу данных)
// Временное хранилище - в реальном проекте замените на базу данных
let portfolioProjects: any[] = []

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    return updatePortfolioProject(req, res)
  } else if (req.method === 'DELETE') {
    return deletePortfolioProject(req, res)
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}

async function updatePortfolioProject(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId
    const projectId = req.query.id as string

    const { title, description, category, technologies, image, liveUrl, githubUrl } = req.body

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' })
    }

    // Найти проект
    const projectIndex = portfolioProjects.findIndex(
      project => project.id === projectId && project.userId === userId
    )

    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Обновить проект
    portfolioProjects[projectIndex] = {
      ...portfolioProjects[projectIndex],
      title,
      description,
      category,
      technologies: technologies || [],
      image: image || null,
      liveUrl: liveUrl || null,
      githubUrl: githubUrl || null,
      updatedAt: new Date().toISOString()
    }

    res.status(200).json({ project: portfolioProjects[projectIndex] })
  } catch (error) {
    console.error('Update portfolio project error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function deletePortfolioProject(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId
    const projectId = req.query.id as string

    // Найти проект
    const projectIndex = portfolioProjects.findIndex(
      project => project.id === projectId && project.userId === userId
    )

    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Удалить проект
    portfolioProjects.splice(projectIndex, 1)

    res.status(200).json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Delete portfolio project error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}