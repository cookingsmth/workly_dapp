// pages/task/[id].tsx - ВЕРСИЯ С ESCROW СЕКЦИЕЙ
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import ApplyModal from '../../components/ApplyModal'
import { Task } from '../../types/task'
import { releasePayment } from '../../utils/releasePayment'
import { useSolPrice } from '../../hooks/useSolPrice'
import { showWorklyToast } from '../../components/WorklyToast'

export default function TaskDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const { user, isAuthenticated } = useAuth()

    const [task, setTask] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
    const { price: solPrice, isLoading: priceLoading } = useSolPrice()

    useEffect(() => {
        const loadTask = async (taskId: string) => {
            try {
                setLoading(true)
                const response = await fetch(`/api/tasks/${taskId}`)

                const contentType = response.headers.get('content-type')
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('API returned non-JSON response')
                }

                const data = await response.json()

                if (response.ok) {
                    setTask(data.task)
                } else {
                    setError(data.message || 'Failed to load task')
                }
            } catch (err) {
                setError('Failed to load task')
                console.error('Load task error:', err)
            } finally {
                setLoading(false)
            }
        }

        if (id && typeof id === 'string') {
            loadTask(id)
        }
    }, [id])

    const handleApply = () => {
        if (!isAuthenticated) {
            router.push('/')
            return
        }
        setIsApplyModalOpen(true)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getTimeLeft = (deadline: string) => {
        const now = new Date()
        const deadlineDate = new Date(deadline)
        const timeDiff = deadlineDate.getTime() - now.getTime()

        if (timeDiff < 0) return 'Expired'

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

        if (days > 0) return `${days}d ${hours}h left`
        if (hours > 0) return `${hours}h left`

        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
        return `${minutes}m left`
    }

    const parseRequirements = (requirements: string | string[] | undefined) => {
        if (!requirements) return []
        if (Array.isArray(requirements)) return requirements
        if (typeof requirements === 'string') {
            return requirements.split(/\n|\./).filter(req => req.trim().length > 0)
        }
        return []
    }

    // Функции для работы с escrow
    const copyEscrowAddress = async () => {
        if (task?.escrowAddress) {
            try {
                await navigator.clipboard.writeText(task.escrowAddress)
                showWorklyToast('Escrow address copied to clipboard!')
            } catch (err) {
                console.error('Failed to copy:', err)
                // Fallback для старых браузеров
                const textArea = document.createElement('textarea')
                textArea.value = task.escrowAddress
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
                showWorklyToast('Escrow address copied to clipboard!')
            }
        }
    }

    const openEscrowExplorer = () => {
        if (task?.escrowAddress) {
            window.open(`https://explorer.solana.com/address/${task.escrowAddress}?cluster=devnet`, '_blank')
        }
    }

    const getEscrowStatus = () => {
        if (!task?.escrowAddress) return null

        // Если есть fundedAt - значит escrow профинансирован
        if (task.fundedAt || task.status === 'open') {
            return { status: 'funded', color: 'text-green-400', icon: '✅' }
        }

        // Если статус pending_payment - ожидает оплаты
        if (task.status === 'pending_payment') {
            return { status: 'pending', color: 'text-yellow-400', icon: '⏳' }
        }

        return { status: 'unknown', color: 'text-gray-400', icon: '❓' }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <span className="text-gray-400">Loading task details...</span>
                </div>
            </div>
        )
    }

    if (error || !task) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-6xl">❌</div>
                    <h1 className="text-2xl font-bold text-red-400">Task Not Found</h1>
                    <p className="text-gray-300">{error || "Failed to load task"}</p>
                    <Link
                        href="/tasks"
                        className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                        ← Back to Tasks
                    </Link>
                </div>
            </div>
        )
    }

    const canApply = task.status === 'open' &&
        task.createdBy !== user?.id &&
        !task.applicants?.includes(user?.id || '')
    const isCreator = task.createdBy === user?.id
    const timeLeft = getTimeLeft(task.deadline)
    const requirements = parseRequirements(task.requirements)
    const escrowStatus = getEscrowStatus()

    return (
        <>
            <Head>
                <title>{task.title} — Workly</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white">
                {/* Header */}
                <div className="backdrop-blur-xl sticky top-4 z-40 mx-6">
                    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Link
                            href="/tasks"
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            ← Back to Tasks
                        </Link>
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-400/10 text-green-400">
                                {task.status?.replace('_', ' ') || 'Open'}
                            </span>

                            {task.isUrgent && (
                                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-medium">
                                    🔥 Urgent
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Task Header */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                                <h1 className="text-3xl font-bold text-white mb-4">{task.title}</h1>

                                <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
                                    <span>👤 by {task.createdByUsername || task.creatorInfo?.username || 'Unknown'}</span>
                                    <span>📅 {formatDate(task.createdAt)}</span>
                                    <span>⏰ {timeLeft}</span>
                                    <span>👁️ {task.viewCount || 0} views</span>
                                </div>

                                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {task.description}
                                </div>
                            </div>

                            {/* Requirements */}
                            {requirements.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                                    <h2 className="text-xl font-semibold text-white mb-4">
                                        ✅ Requirements
                                    </h2>
                                    <ul className="space-y-3">
                                        {requirements.map((req, index) => (
                                            <li key={index} className="flex items-start gap-3 text-gray-300">
                                                <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                <span>{req.trim()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                                    <h2 className="text-xl font-semibold text-white mb-4">
                                        🏷️ Tags
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {task.tags.map((tag: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Applications */}
                            {isCreator && task.applications && task.applications.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                                    <h2 className="text-xl font-semibold text-white mb-4">
                                        📄 Recent Applications
                                    </h2>
                                    <div className="space-y-4">
                                        {task.applications.slice(0, 3).map((app: any) => (
                                            <div key={app.id} className="bg-white/5 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-medium text-white">{app.applicantName}</span>
                                                    <span className="text-sm text-gray-400">{formatDate(app.createdAt)}</span>
                                                </div>
                                                <p className="text-gray-300 text-sm line-clamp-2">{app.message}</p>
                                                {app.proposedPrice && (
                                                    <div className="mt-2 text-green-400 font-medium">
                                                        {app.proposedPrice} {task.reward.token}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {task.applications.length > 3 && (
                                            <Link
                                                href={`/applications/${task.id}`}
                                                className="block text-center py-2 text-purple-400 hover:text-purple-300 transition-colors"
                                            >
                                                View all {task.applications.length} applications →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">

                            {/* Reward Card */}
                            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
                                <div className="text-purple-300 mb-2 font-medium">💰 Reward</div>
                                <div className="text-3xl font-bold text-white mb-1">
                                    {task.reward?.amount || 0} {task.reward?.token || 'USDT'}
                                </div>
                                <div className="text-sm text-gray-400">
                                    ≈ ${((task.reward?.amount || 0) * (task.reward?.token === 'SOL' ? solPrice : 1)).toFixed(2)}
                                </div>

                                {/* Platform Fee Info */}
                                {task.platformFee && (
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>Platform fee (2.5%)</span>
                                            <span>{task.platformFee.toFixed(4)} {task.reward?.token}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-green-400 font-medium">
                                            <span>Worker receives</span>
                                            <span>{task.netAmount?.toFixed(4) || (task.reward?.amount * 0.975).toFixed(4)} {task.reward?.token}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* NEW: Escrow Card - показываем только если есть escrow данные */}
                            {task.escrowAddress && (
                                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="text-blue-300 font-medium">🏦 Escrow</div>
                                        {escrowStatus && (
                                            <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${escrowStatus.color}`}>
                                                {escrowStatus.icon} {escrowStatus.status}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {/* Escrow Address */}
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">Address</label>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 p-2 bg-black/30 rounded-lg text-blue-400 text-xs font-mono break-all">
                                                    {task.escrowAddress.slice(0, 8)}...{task.escrowAddress.slice(-8)}
                                                </code>
                                                <button
                                                    onClick={copyEscrowAddress}
                                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-all"
                                                    title="Copy address"
                                                >
                                                    📋
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={copyEscrowAddress}
                                                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-gray-300 transition-all"
                                            >
                                                Copy Full
                                            </button>
                                            <button
                                                onClick={openEscrowExplorer}
                                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs text-white transition-all"
                                            >
                                                Explorer
                                            </button>
                                        </div>

                                        {/* Funding Info */}
                                        {task.fundedAt && (
                                            <div className="pt-2 border-t border-white/10">
                                                <div className="text-xs text-gray-400">
                                                    Funded on {formatDate(task.fundedAt)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment Instructions for pending tasks */}
                                        {task.status === 'pending_payment' && isCreator && (
                                            <div className="pt-2 border-t border-white/10">
                                                <div className="text-xs text-yellow-400 mb-1">
                                                    ⚠️ Payment Required
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Send {task.reward?.amount} {task.reward?.token} to activate this task
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Deadline Card */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                                <div className="text-orange-300 mb-2 font-medium">⏰ Deadline</div>
                                <div className="text-lg font-semibold text-white mb-1">
                                    {formatDateTime(task.deadline)}
                                </div>
                                <div className={`text-sm ${timeLeft === 'Expired' ? 'text-red-400' : 'text-gray-400'}`}>
                                    {timeLeft}
                                </div>
                            </div>

                            {/* Stats Card */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                                <h3 className="font-semibold text-white mb-4">📊 Task Stats</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Views</span>
                                        <span className="text-white">{task.viewCount || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Applications</span>
                                        <span className="text-white">{task.applicationCount || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Created</span>
                                        <span className="text-white">{formatDate(task.createdAt)}</span>
                                    </div>
                                    {task.updatedAt !== task.createdAt && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Updated</span>
                                            <span className="text-white">{formatDate(task.updatedAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {canApply && (
                                    <button
                                        onClick={handleApply}
                                        className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:scale-105 rounded-xl font-semibold transition-all shadow-lg hover:shadow-green-500/25"
                                    >
                                        🚀 Apply for this Task
                                    </button>
                                )}

                                {isCreator && (
                                    <div className="space-y-2">
                                        <Link
                                            href={`/applications/${task.id}`}
                                            className="block w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors text-center"
                                        >
                                            👀 View Applications ({task.applicationCount || 0})
                                        </Link>
                                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                                            ✏️ Edit Task
                                        </button>
                                        <button className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors">
                                            🗑️ Delete Task
                                        </button>
                                    </div>
                                )}

                                {!isAuthenticated && (
                                    <div className="text-center">
                                        <p className="text-gray-400 text-sm mb-3">
                                            Login to apply for this task
                                        </p>
                                        <Link
                                            href="/"
                                            className="inline-block w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-colors text-center"
                                        >
                                            Login / Register
                                        </Link>
                                    </div>
                                )}

                                {task.applicants?.includes(user?.id || '') && (
                                    <button
                                        disabled
                                        className="w-full py-4 bg-yellow-500/20 text-yellow-300 rounded-xl font-semibold cursor-not-allowed"
                                    >
                                        ✅ Application Submitted
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Apply Modal */}
            {isApplyModalOpen && task && (
                <ApplyModal
                    isOpen={isApplyModalOpen}
                    onClose={() => setIsApplyModalOpen(false)}
                    taskId={task.id}
                    taskTitle={task.title}
                    taskReward={task.reward}
                />
            )}
        </>
    )
}