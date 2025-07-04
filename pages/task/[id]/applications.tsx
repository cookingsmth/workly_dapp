// pages/task/[id]/applications.tsx
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../hooks/useAuth'

interface Application {
  id: string
  taskId: string
  applicantId: string
  applicantName: string
  message: string
  proposedPrice?: number
  estimatedDays?: number
  portfolio?: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  updatedAt: string
}

interface TaskInfo {
  id: string
  title: string
  status: string
}

export default function TaskApplicationsPage() {
  const router = useRouter()
  const { id } = router.query
  const { user, isAuthenticated } = useAuth()
  
  const [applications, setApplications] = useState<Application[]>([])
  const [task, setTask] = useState<TaskInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
  if (id && typeof id === 'string' && isAuthenticated === true) {
    loadApplications(id)
  }
}, [id, isAuthenticated])


  const loadApplications = async (taskId: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch(`/api/tasks/${taskId}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setApplications(data.applications)
        setTask(data.task)
      } else {
        setError(data.message || 'Failed to load applications')
        if (response.status === 403) {
          router.push(`/task/${taskId}`)
        }
      }
    } catch (err) {
      setError('Failed to load applications')
      console.error('Load applications error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-300',
      accepted: 'bg-green-500/20 text-green-300',
      rejected: 'bg-red-500/20 text-red-300'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300'
  }

 // if (!isAuthenticated) {
 //   router.push('/')
 //   return null
 // }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <span className="text-gray-400">Loading applications...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">❌</div>
          <h1 className="text-2xl font-bold text-red-400">Error</h1>
          <p className="text-gray-300">{error}</p>
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

  return (
    <>
      <Head>
        <title>Applications for {task?.title} — Workly</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link 
              href={`/task/${id}`}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Task
            </Link>
            
            <div className="text-right">
              <h1 className="text-lg font-semibold text-white">Applications</h1>
              <p className="text-sm text-gray-400">{applications.length} total</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Task Info */}
          {task && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">{task.title}</h2>
              <div className="flex items-center gap-4">
                <span className="text-gray-400">Task Status:</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                  {task.status}
                </span>
              </div>
            </div>
          )}

          {/* Applications List */}
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="text-6xl mb-4 opacity-50">📝</div>
                <p className="text-xl mb-2">No applications yet</p>
                <p className="text-sm">When freelancers apply for your task, they'll appear here.</p>
              </div>
            ) : (
              applications.map((application) => (
                <div
                  key={application.id}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-colors"
                >
                  {/* Application Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {application.applicantName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Applied on {formatDate(application.createdAt)}
                      </p>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                  </div>

                  {/* Application Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {application.proposedPrice && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Proposed Price</div>
                        <div className="text-lg font-semibold text-green-400">
                          {application.proposedPrice} USDT
                        </div>
                      </div>
                    )}
                    
                    {application.estimatedDays && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Estimated Time</div>
                        <div className="text-lg font-semibold text-blue-400">
                          {application.estimatedDays} days
                        </div>
                      </div>
                    )}
                    
                    {application.portfolio && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Portfolio</div>
                        <a
                          href={application.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                        >
                          View Portfolio →
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Application Message */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2">Message:</div>
                    <div className="text-gray-300 leading-relaxed bg-white/5 rounded-lg p-4">
                      {application.message}
                    </div>
                  </div>

                  {/* Actions */}
                  {application.status === 'pending' && (
                    <div className="flex gap-3">
                      <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                        ✅ Accept Application
                      </button>
                      <button className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                        ❌ Reject Application
                      </button>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                        💬 Message
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}