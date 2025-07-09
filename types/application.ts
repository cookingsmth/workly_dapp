export interface TaskApplication {
  id: string
  taskId: string
  applicantId: string
  applicantName: string
  message: string
  proposedPrice?: number
  estimatedDays?: number
  portfolio?: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface CreateApplicationData {
  taskId: string
  message: string
  proposedPrice?: number
  estimatedDays?: number
  portfolio?: string
}