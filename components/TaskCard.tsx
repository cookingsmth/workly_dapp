import { memo, useCallback, useState } from 'react'
import { formatDate, formatReward, getTokenColor } from '../utils/formatters'
import { Button, TaskStatusBadge } from './ui'
import clsx from 'clsx'

interface TaskCardProps {
  task: any
  onApply: (taskId: string) => void
  onViewDetails?: (taskId: string) => void
  className?: string
}

export const TaskCard = memo<TaskCardProps>(({ task, onApply, onViewDetails, className }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const handleApply = useCallback(() => {
    onApply(task.id)
  }, [task.id, onApply])

  const handleViewDetails = useCallback(() => {
    onViewDetails?.(task.id)
  }, [task.id, onViewDetails])

  const tokenColorClass = getTokenColor(task.reward.token)
  const canApply = task.status === 'open' || task.status === 'funded'
  const isWaitingPayment = task.status === 'waiting_payment'

  return (
    <div className={clsx(
      'glass-morphism rounded-2xl shadow-lg transition-all duration-300 overflow-hidden',
      'hover:shadow-purple-500/20 hover:scale-[1.02]',
      isWaitingPayment && 'opacity-75',
      className
    )}>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              {task.title}
            </h3>
            <div className="flex items-center gap-3">
              <TaskStatusBadge status={task.status} size="sm" />
              <span className="text-xs text-gray-400">
                📅 Due {formatDate(task.deadline)}
              </span>
            </div>
          </div>
          
          <div className="text-right ml-4">
            <div className={clsx('text-xl font-bold', tokenColorClass)}>
              {formatReward(task.reward)}
            </div>
            <div className="text-xs text-gray-400">
              ≈ ${(task.reward.amount * (task.reward.token === 'SOL' ? 180 : 1)).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className={clsx(
          'text-sm text-gray-300 mb-4 transition-all duration-300',
          isExpanded ? 'line-clamp-none' : 'line-clamp-2'
        )}>
          {task.description}
        </p>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mb-4 p-4 bg-white/5 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Created:</span>
              <span className="text-white">{formatDate(task.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Escrow:</span>
              <code className="text-purple-300 text-xs">{task.escrowAddress?.slice(0, 12)}...{task.escrowAddress?.slice(-8)}</code>
            </div>
            {task.applicants !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Applicants:</span>
                <span className="text-cyan-300">{task.applicants} applied</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-400 hover:text-purple-400 transition-colors"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
            
            {onViewDetails && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleViewDetails}
                icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>}
              >
                Details
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isWaitingPayment ? (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                Waiting for payment
              </div>
            ) : canApply ? (
              <Button
                variant="success"
                onClick={handleApply}
                icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>}
                iconPosition="right"
              >
                Apply Now
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                {task.status === 'completed' ? 'Completed' : 
                 task.status === 'cancelled' ? 'Cancelled' : 
                 task.status === 'in_progress' ? 'In Progress' : 'Unavailable'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

TaskCard.displayName = 'TaskCard'

export default TaskCard