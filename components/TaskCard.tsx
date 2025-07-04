// components/TaskCard.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ с правильной ценой SOL
import { Task } from '../types/task'
import Link from 'next/link'
import { useAuth } from '../hooks/useAuth'
import { useSolPriceContext } from '../hooks/useSolPrice' // Добавили импорт

interface TaskCardProps {
  task: Task
  onApply: (taskId: string) => void
  onViewDetails: () => void
  hasApplied: boolean
  user?: { id: string }
}

export default function TaskCard({ task, onApply, onViewDetails, hasApplied, user }: TaskCardProps) {
  const { formatToUSD, isLoading: isPriceLoading } = useSolPriceContext() // Добавили хук

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getTimeLeft = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const timeDiff = deadlineDate.getTime() - now.getTime()

    if (timeDiff < 0) return 'Expired'

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d left`
    if (hours > 0) return `${hours}h left`

    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    return `${minutes}m left`
  }

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'text-green-400 bg-green-400/10',
      in_progress: 'text-blue-400 bg-blue-400/10',
      completed: 'text-purple-400 bg-purple-400/10',
      cancelled: 'text-red-400 bg-red-400/10',
      waiting_payment: 'text-yellow-400 bg-yellow-400/10',
      funded: 'text-amber-400 bg-amber-400/10'
    }
    return colors[status as keyof typeof colors] || 'text-gray-400 bg-gray-400/10'
  }

  // Функция для расчета USD стоимости с fallback
  const getUSDValue = () => {
    if (task.reward.token === 'SOL') {
      if (isPriceLoading) {
        return 'Loading...'
      }
      return formatToUSD(task.reward.amount)
    } else {
      // Для других токенов оставляем старую логику
      return `$${(task.reward.amount * 1).toFixed(2)}`
    }
  }

  const timeLeft = getTimeLeft(task.deadline)
  const isExpired = timeLeft === 'Expired'
  const { user: currentUser } = useAuth()
  const isTaskCreator = task.createdBy === currentUser?.id

  return (
    <div className="bg-gradient-to-br from-[#1a1d2e]/80 to-[#111322]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02] group">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link
            href={`/task/${task.id}`}
            className="block hover:text-purple-300 transition-colors"
          >
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
              {task.title}
            </h3>
          </Link>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>by {task.client}</span>
            <span>•</span>
            <span>{formatDate(task.createdAt)}</span>
            {task.viewCount && (
              <>
                <span>•</span>
                <span>{task.viewCount} views</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>

          {task.isUrgent && (
            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-medium">
              🔥
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
        {task.description}
      </p>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
              +{task.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Requirements Preview */}
      {task.requirements && task.requirements.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-1">Requirements:</div>
          <div className="text-sm text-gray-300">
            • {task.requirements[0]}
            {task.requirements.length > 1 && (
              <span className="text-gray-500"> +{task.requirements.length - 1} more</span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          {/* Reward */}
          <div className="text-right">
            <div className="text-lg font-bold text-green-400">
              {task.reward.amount} {task.reward.token}
            </div>
            <div className="text-xs text-gray-500">
              {/* ИСПРАВЛЕННАЯ СТРОКА - теперь использует реальную цену SOL */}
              ≈ {getUSDValue()}
            </div>
          </div>

          {/* Deadline */}
          <div className="text-right">
            <div className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-orange-400'}`}>
              {timeLeft}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(task.deadline)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasApplied && user?.id !== task.createdBy && (
            <Link
              href={`/chat/${task.id}/${task.createdBy}`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              💬 Chat
            </Link>
          )}

          <Link
            href={`/task/${task.id}`}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            Details
          </Link>

          {task.status === 'open' && !hasApplied && !isExpired && !isTaskCreator && (
            <button
              onClick={() => onApply(task.id)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:scale-105 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-green-500/25"
            >
              Apply
            </button>
          )}

          {hasApplied && (
            <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm font-medium">
              Applied
            </span>
          )}

          {isExpired && (
            <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm font-medium">
              Expired
            </span>
          )}
        </div>
      </div>

      {/* Application Count */}
      {task.applicationCount && task.applicationCount > 0 && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          {task.applicationCount} application{task.applicationCount !== 1 ? 's' : ''} received
        </div>
      )}
    </div>
  )
}