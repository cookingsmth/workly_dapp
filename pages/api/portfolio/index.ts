// pages/api/portfolio/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Временное хранилище (замените на базу данных)
let portfolioProjects: any[] = []

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getPortfolioProjects(req, res)
  } else if (req.method === 'POST') {
    return createPortfolioProject(req, res)
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: 'Method not allowed' })
  }
}

async function getPortfolioProjects(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    // Фильтруем проекты пользователя
    const userProjects = portfolioProjects.filter(project => project.userId === userId)

    res.status(200).json({ projects: userProjects })
  } catch (error) {
    console.error('Get portfolio error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function createPortfolioProject(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    const { title, description, category, technologies, image, liveUrl, githubUrl } = req.body

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' })
    }

    const newProject = {
      id: Date.now().toString(), // В реальном проекте используйте UUID
      userId,
      title,
      description,
      category,
      technologies: technologies || [],
      image: image || null,
      liveUrl: liveUrl || null,
      githubUrl: githubUrl || null,
      createdAt: new Date().toISOString()
    }

    portfolioProjects.push(newProject)

    res.status(201).json({ project: newProject })
  } catch (error) {
    console.error('Create portfolio project error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}