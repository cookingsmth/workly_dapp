import { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm } from 'formidable'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'

// Отключаем парсинг body для multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
}

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
    // Создаем папку для загрузок если не существует
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Парсим form data
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    })

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const extension = path.extname(file.originalFilename || '')
    const fileName = `${user.userId}_${timestamp}${extension}`
    const newPath = path.join(uploadDir, fileName)

    // Перемещаем файл
    fs.renameSync(file.filepath, newPath)

    // Возвращаем URL файла
    const fileUrl = `/uploads/chat/${fileName}`

    res.status(200).json({
      success: true,
      fileUrl,
      fileName: file.originalFilename,
      fileSize: file.size,
      fileType: file.mimetype
    })

  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed' })
  }
}