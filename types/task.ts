
export type TokenType = 'SOL' | 'USDT' | 'USDC'

export interface TaskReward {
  amount: number
  token: TokenType
}

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'waiting_payment' | 'funded'

export interface Task {
  id: string
  title: string
  description: string
  reward: TaskReward
  deadline: string
  escrowAddress: string
  escrowSecret?: string
  
  
  createdBy: string        
  assignedTo?: string     
  client?: string          
  clientName?: string 
  
  
  status: TaskStatus
  createdAt: string
  updatedAt: string
  

  applicants: string[]     
  applicationCount?: number 
  
 
  tags?: string[]
  attachments?: string[]   
  requirements?: string[] 
  isUrgent?: boolean  
  viewCount?: number  
}

export interface CreateTaskData {
  title: string
  description: string
  reward: TaskReward
  deadline: string
  requirements?: string[]
  tags?: string[]
  isUrgent?: boolean
}

export interface TaskApplication {
  id: string
  taskId: string
  applicantId: string
  applicantName: string
  message: string
  proposedPrice?: TaskReward
  estimatedTime?: string 
  portfolio?: string[]  
  createdAt: string
  status: 'pending' | 'accepted' | 'rejected'
}

export interface TaskFilter {
  status?: TaskStatus | TaskStatus[]
  tokens?: TokenType[]
  minReward?: number
  maxReward?: number
  tags?: string[]
  isUrgent?: boolean
  createdBy?: string
  search?: string
}

export interface TaskSort {
  field: 'createdAt' | 'deadline' | 'reward' | 'title' | 'viewCount'
  direction: 'asc' | 'desc'
}


export interface UserTaskStats {
  created: number
  completed: number
  inProgress: number
  totalEarned: number
  averageRating: number
  completionRate: number
}


export interface TaskEvent {
  id: string
  taskId: string
  type: 'created' | 'applied' | 'assigned' | 'completed' | 'paid' | 'cancelled'
  userId: string
  userName: string
  message: string
  timestamp: string
  metadata?: Record<string, any>
}


export const TASK_STATUSES: Record<TaskStatus, { label: string; color: string; icon: string }> = {
  open: { label: 'Open', color: 'green', icon: '🟢' },
  in_progress: { label: 'In Progress', color: 'blue', icon: '⚡' },
  completed: { label: 'Completed', color: 'purple', icon: '✅' },
  cancelled: { label: 'Cancelled', color: 'red', icon: '❌' },
  waiting_payment: { label: 'Waiting Payment', color: 'yellow', icon: '⏳' },
  funded: { label: 'Funded', color: 'amber', icon: '💰' }
}

export const TOKENS: Record<TokenType, { symbol: string; name: string; decimals: number; color: string }> = {
  SOL: { symbol: 'SOL', name: 'Solana', decimals: 9, color: 'from-purple-500 to-purple-600' },
  USDT: { symbol: 'USDT', name: 'Tether USD', decimals: 6, color: 'from-green-500 to-green-600' },
  USDC: { symbol: 'USDC', name: 'USD Coin', decimals: 6, color: 'from-blue-500 to-blue-600' }
}