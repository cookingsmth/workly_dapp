import { memo } from 'react'
import { TaskReward } from '../types/task'
import { formatReward, getTokenColor } from '../utils/formatters'

interface RewardBadgeProps {
  reward: TaskReward
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const RewardBadge = memo<RewardBadgeProps>(({ reward, size = 'md', className }) => {
  const tokenColorClass = getTokenColor(reward.token)
  
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2'
  }

  return (
    <span className={`font-bold rounded-lg bg-white/5 ${tokenColorClass} ${sizeClasses[size]} ${className || ''}`}>
      {formatReward(reward)}
    </span>
  )
})

RewardBadge.displayName = 'RewardBadge'