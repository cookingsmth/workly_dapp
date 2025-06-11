// types/task.ts
export type TokenType = 'SOL' | 'USDT' | 'USDC'

export interface TaskReward {
  amount: number
  token: TokenType
}

export interface Task {
  id: string
  title: string
  description: string
  reward: TaskReward
  deadline: string
  escrowAddress: string
  escrowSecret?: string
  createdBy?: string
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
  createdAt?: string
  updatedAt?: string
}

export interface CreateTaskData {
  title: string
  description: string
  reward: TaskReward
  deadline: string
}