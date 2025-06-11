// utils/formatters.ts
import { TaskReward, TokenType } from '../types/task'

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric', 
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

export const formatReward = (reward: TaskReward): string => {
  return `${reward.amount} ${reward.token}`
}

export const getTokenColor = (token: TokenType): string => {
  switch (token) {
    case 'SOL':
      return 'text-purple-300'
    case 'USDT':
      return 'text-green-300'
    case 'USDC':
      return 'text-blue-300'
    default:
      return 'text-gray-300'
  }
}