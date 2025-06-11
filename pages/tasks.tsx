// pages/tasks.tsx
import Head from 'next/head'
import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import TaskCard from '../components/TaskCard'
import ApplyModal from '../components/ApplyModal'
import CreateTaskModal from '../components/BeautifulCreateTaskModal'
import BackButton from '../components/BackButton'
import { Button, Input } from '../components/ui'


const STATUS_META = {
  open: { label: 'Open', icon: '🟢', color: 'from-green-500 to-emerald-500' },
  in_progress: { label: 'In Progress', icon: '⚡', color: 'from-blue-500 to-cyan-500' },
  completed: { label: 'Completed', icon: '✅', color: 'from-purple-500 to-pink-500' },
  waiting_payment: { label: 'Waiting Payment', icon: '⏳', color: 'from-yellow-500 to-yellow-300' },
  funded: { label: 'Funded', icon: '💰', color: 'from-amber-400 to-yellow-500' }
}

export default function TasksPage() {
  const router = useRouter()


  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Create viral meme for Workly',
      description: 'Design a funny and engaging meme about Workly platform. Post it on Twitter with #Workly hashtag.',
      reward: { amount: 5, token: 'USDC' },
      deadline: '2025-06-10',
      escrowAddress: '0x123abc',
      status: 'open',
      createdAt: '2025-06-01',
      applicants: 12
    }
  ])

  const [selectedTokens, setSelectedTokens] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'reward_high' | 'reward_low' | 'deadline'>('newest')
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'funded' | 'in_progress' | 'completed' | 'waiting_payment'>('all')

  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks]
    if (activeFilter !== 'all') filtered = filtered.filter(task => task.status === activeFilter)
    if (selectedTokens.length) filtered = filtered.filter(task => selectedTokens.includes(task.reward.token))

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'reward_high': return b.reward.amount - a.reward.amount
        case 'reward_low': return a.reward.amount - b.reward.amount
        case 'deadline': return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        default: return 0
      }
    })
    return filtered
  }, [tasks, selectedTokens, sortBy, activeFilter])

  const handleApply = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setIsApplyOpen(true)
    }
  }

  const handleCreateTask = (task: any) => {
    const newTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      applicants: 0
    }
    setTasks(prev => [newTask, ...prev])
    setIsCreateOpen(false)
  }

  return (
    <>
      <Head>
        <title>Workly — Tasks</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white">
        <BackButton />
        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-gradient">🎯 Task Marketplace</h1>
            <div className="flex gap-4">
              <Link href="/profile">
                <Button variant="secondary">👤 Profile</Button>
              </Link>
              <Button variant="gradient" onClick={() => setIsCreateOpen(true)}>➕ Create Task</Button>
            </div>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
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

          <div className="grid gap-4">
            {filteredAndSortedTasks.length === 0 ? (
              <div className="text-center text-gray-400">No tasks found</div>
            ) : (
              filteredAndSortedTasks.map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <TaskCard
                    task={task}
                    onApply={handleApply}
                    onViewDetails={() => { }}
                  />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {isApplyOpen && selectedTask && (
        <ApplyModal
          isOpen={isApplyOpen}
          onClose={() => {
            setIsApplyOpen(false)
            setSelectedTask(null)
          }}
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
