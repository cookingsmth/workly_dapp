import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui'
import clsx from 'clsx'
import type { Task } from '../types/task'
import AchievementsSection from '../components/AchievementsSection'

export default function ProfilePage() {
    const router = useRouter()
    const { user, isLoading, logout } = useAuth()
    const [activeTab, setActiveTab] = useState<'created' | 'completed' | 'settings' | 'achievements'>('created')
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

    const [createdTasks] = useState<Task[]>([
        {
            id: '1',
            title: 'Design a meme',
            description: 'Create a funny meme for our social media',
            reward: { amount: 5, token: 'USDC' },
            deadline: '2025-06-10',
            escrowAddress: 'A1B2...Y5Z6',
            status: 'open',
            createdBy: user?.username
        }
    ])

    const [completedTasks] = useState<Task[]>([
        {
            id: '2',
            title: 'Translate document',
            description: 'Translate our whitepaper to Spanish',
            reward: { amount: 10, token: 'USDT' },
            deadline: '2025-06-01',
            escrowAddress: 'B2C3...Z6A1',
            status: 'completed',
            createdBy: user?.username
        }
    ])

    useEffect(() => {
        if (!isLoading && !user) router.push('/')
    }, [user, isLoading])

    const handleLogout = () => {
        logout()
        router.push('/')
    }

    const toggleTask = (id: string) => {
        setExpandedTaskId(prev => (prev === id ? null : id))
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] to-[#111827] flex items-center justify-center">
                <span className="text-white text-xl">Loading profile...</span>
            </div>
        )
    }

    if (!user) return null

    return (
        <>
            <Head>
                <title>Workly — Profile</title>
            </Head>
            <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white px-4 py-8">
                <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                    <header className="flex justify-between items-center p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                Welcome, @{user.username}
                            </h1>
                            <p className="text-sm text-gray-400">Solana user since 2025</p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition">🏠 Home</Link>
                            <Link href="/tasks" className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition">🎯 Tasks</Link>
                            <button onClick={handleLogout} className="px-5 py-2 rounded-xl bg-red-500/30 hover:bg-red-500/50 text-red-200 transition">🚪 Logout</button>
                        </div>
                    </header>

                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatBox label="Created Tasks" value={createdTasks.length} color="purple" />
                        <StatBox label="Completed Tasks" value={completedTasks.length} color="green" />
                        <StatBox label="Total Earned" value={createdTasks.concat(completedTasks).reduce((sum, t) => sum + t.reward.amount, 0) + ' USDC'} color="blue" />
                    </section>

                    <nav className="flex flex-wrap gap-3 bg-white/5 p-3 rounded-2xl shadow-inner border border-white/10 mb-8">
                        {([
                            { key: 'created', label: 'Created', icon: '📝' },
                            { key: 'completed', label: 'Completed', icon: '✅' },
                            { key: 'achievements', label: 'Achievements', icon: '🏅' },
                            { key: 'settings', label: 'Settings', icon: '⚙️' }
                        ] as const).map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={clsx(
                                    'flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm relative transition-all duration-300',
                                    activeTab === tab.key
                                        ? 'text-white bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg scale-105 animate-glow'
                                        : 'text-gray-300 bg-white/10 hover:bg-white/20'
                                )}
                            >
                                <span className="text-lg">{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.key && (
                                    <span className="absolute inset-0 rounded-full blur-md opacity-30 bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse -z-10" />
                                )}
                            </button>
                        ))}
                    </nav>

                    <div>
                        {activeTab === 'created' && (
                            <TaskList tasks={createdTasks} expandedId={expandedTaskId} toggle={toggleTask} />
                        )}
                        {activeTab === 'completed' && (
                            <TaskList tasks={completedTasks} expandedId={expandedTaskId} toggle={toggleTask} completed />
                        )}
                        {activeTab === 'achievements' && (
                            <AchievementsSection />
                        )}

                    </div>
                </div>
            </div>
        </>
    )
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
    const colorMap: Record<string, string> = {
        purple: 'text-purple-400',
        green: 'text-green-400',
        blue: 'text-blue-400'
    }

    return (
        <div className="glass-morphism p-6 rounded-2xl text-center">
            <div className={`text-3xl font-bold mb-2 ${colorMap[color]}`}>{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
        </div>
    )
}

function TaskList({ tasks, expandedId, toggle, completed = false }: {
    tasks: Task[],
    expandedId: string | null,
    toggle: (id: string) => void,
    completed?: boolean
}) {
    if (!tasks.length) {
        return (
            <div className="text-center text-gray-400 py-12">
                {completed ? 'No completed tasks yet.' : 'No tasks created yet.'}
            </div>
        )
    }

    return (
        <div className="grid gap-4">
            {tasks.map(task => (
                <div
                    key={task.id}
                    onClick={() => toggle(task.id)}
                    className={clsx(
                        'cursor-pointer p-5 rounded-2xl transition-all duration-300 group relative overflow-hidden border',
                        'bg-gradient-to-br from-[#1a1d2e] to-[#111322] hover:scale-[1.015]',
                        expandedId === task.id
                            ? 'border-purple-500 shadow-purple-500/30 shadow-md'
                            : 'border-white/10'
                    )}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                📝 {task.title}
                            </h3>
                            <p className="text-sm text-gray-400">
                                {task.reward.amount} {task.reward.token} •{' '}
                                {new Date(task.deadline).toLocaleDateString()}
                            </p>
                        </div>
                        <span className="text-xl text-gray-400 group-hover:scale-110 transition-transform">
                            {expandedId === task.id ? '▲' : '▼'}
                        </span>
                    </div>

                    {expandedId === task.id && (
                        <div className="mt-4 text-sm text-gray-300 border-t border-white/10 pt-4 animate-fade-in">
                            <p className="mb-3">{task.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>🔒 Escrow: {task.escrowAddress}</span>
                                <span className="bg-purple-600/20 px-3 py-1 rounded-full text-purple-300 font-medium uppercase tracking-wide text-[11px]">
                                    {task.status}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

            ))}
        </div>
    )
}
