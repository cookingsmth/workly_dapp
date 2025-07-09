// pages/tasks.tsx
import Head from 'next/head'
import { motion } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import TaskCard from '../components/TaskCard'
import ApplyModal from '../components/ApplyModal'
import CreateTaskModal from '../components/BeautifulCreateTaskModal'
import BackButton from '../components/BackButton'
import { Button, Input } from '../components/ui'
import { useTaskStore } from '../stores/taskStore'
import { useAuth } from '../hooks/useAuth'
import { TaskStatus } from '../types/task'

const STATUS_META = {
    open: { label: 'Open', icon: '🟢', color: 'from-green-500 to-emerald-500' },
    in_progress: { label: 'In Progress', icon: '⚡', color: 'from-blue-500 to-cyan-500' },
    completed: { label: 'Completed', icon: '✅', color: 'from-purple-500 to-pink-500' },
    waiting_payment: { label: 'Waiting Payment', icon: '⏳', color: 'from-yellow-500 to-yellow-300' },
    funded: { label: 'Funded', icon: '💰', color: 'from-amber-400 to-yellow-500' }
}

export default function TasksPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()

    const {
        tasks,
        loading,
        error,
        filters,
        fetchTasks,
        createTask,
        setFilters,
        getFilteredTasks,
        clearError
    } = useTaskStore()

    const [activeFilter, setActiveFilter] = useState<'all' | TaskStatus>('all')
    const [isApplyOpen, setIsApplyOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    useEffect(() => {
        setFilters({ search: searchQuery })
    }, [searchQuery, setFilters])

    useEffect(() => {
        if (activeFilter === 'all') {
            setFilters({ status: undefined })
        } else {
            setFilters({ status: activeFilter })
        }
    }, [activeFilter, setFilters])

    const filteredTasks = useMemo(() => {
        return getFilteredTasks()
    }, [getFilteredTasks, tasks, filters])

    const handleApply = (taskId: string) => {
        if (!isAuthenticated) {
            router.push('/')
            return
        }

        const task = tasks.find(t => t.id === taskId)
        if (task) {
            setSelectedTask(task)
            setIsApplyOpen(true)
        }
    }

    const handleCreateTask = async (taskData: any) => {
        if (!isAuthenticated) {
            router.push('/')
            return
        }

        const newTask = await createTask(taskData)
        if (newTask) {
            setIsCreateOpen(false)
        }
    }

    const handleCreateTaskClick = () => {
        if (!isAuthenticated) {
            router.push('/')
            return
        }
        setIsCreateOpen(true)
    }

    return (
        <>
            <Head>
                <title>Workly - Tasks</title>
                <link rel="icon" href="/workly.png" sizes="64x64" type="image/png" />
                <meta name="description" content="Web3 platform for tasks with payment in Solana. Post simple tasks and get them done quickly, with payments guaranteed by smart contracts." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white">
                <BackButton />

                <div className="p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="max-w-6xl mx-auto px-6 py-6">
                        {/* Centered Title */}
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="w-20 h-20 rounded-xl flex items-center justify-center p-2">
                                    <img
                                        src="/workly.png"
                                        alt="Workly"
                                        className="w-full h-full object-contain" />
                                </div>
                                <h1 className="text-5xl font-bold text-white">Task Marketplace</h1>
                            </div>

                            {/* Create Task Button */}
                            <button
                                onClick={handleCreateTaskClick}
                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg transition-all">
                                ➕ Create Task
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 mb-6 flex-wrap">
                        {(['all', 'open', 'in_progress', 'completed', 'funded', 'waiting_payment'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setActiveFilter(status)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeFilter === status
                                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                    }`}
                            >
                                {status === 'all' ? 'All' : `${STATUS_META[status].icon} ${STATUS_META[status].label}`}
                            </button>
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
                            <div className="flex justify-between items-center">
                                <span>❌ {error}</span>
                                <button
                                    onClick={clearError}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                <span className="text-gray-400">Loading tasks...</span>
                            </div>
                        </div>
                    )}

                    {/* Tasks Grid */}
                    {!loading && (
                        <div className="grid gap-4">
                            {filteredTasks.length === 0 ? (
                                <div className="text-center text-gray-400 py-12">
                                    <div className="text-6xl mb-4 opacity-50">📋</div>
                                    {tasks.length === 0 ? (
                                        <>
                                            <p className="text-xl mb-2">No tasks yet</p>
                                            <p className="text-sm">Be the first to create a task!</p>
                                            {isAuthenticated && (
                                                <Button
                                                    variant="gradient"
                                                    onClick={handleCreateTaskClick}
                                                    className="mt-4"
                                                >
                                                    ➕ Create First Task
                                                </Button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xl mb-2">No tasks found</p>
                                            <p className="text-sm">Try adjusting your filters or search query</p>
                                            <button
                                                onClick={() => {
                                                    setActiveFilter('all')
                                                    setSearchQuery('')
                                                }}
                                                className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                            >
                                                Clear Filters
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                filteredTasks.map((task, index) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1, ease: 'easeOut' }}
                                    >
                                        <TaskCard
                                            task={task}
                                            onApply={handleApply}
                                            onViewDetails={() => router.push(`/task/${task.id}`)}
                                            hasApplied={
                                                isAuthenticated &&
                                                Array.isArray(task.applicants) &&
                                                task.applicants.includes(user?.id || '')
                                            }
                                            user={user || undefined}
                                        />
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Stats */}
                    {!loading && filteredTasks.length > 0 && (
                        <div className="mt-8 text-center text-gray-400 text-sm">
                            Showing {filteredTasks.length} of {tasks.length} tasks
                            {filters.search && ` matching "${filters.search}"`}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isApplyOpen && selectedTask && (
                <ApplyModal
                    isOpen={isApplyOpen}
                    onClose={() => {
                        setIsApplyOpen(false)
                        setSelectedTask(null)
                    }}
                    taskId={selectedTask.id}
                    taskTitle={selectedTask.title}
                />
            )}

            {isCreateOpen && (
                <CreateTaskModal
                    onClose={() => setIsCreateOpen(false)}
                    onCreate={handleCreateTask}
                />
            )}
        </>
    )
}