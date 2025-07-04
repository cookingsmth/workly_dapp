// pages/profile.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import ProfileWidget from '../components/ProfileWidget'
import Link from 'next/link'
import { Camera, Edit3, Save, X, Star, Briefcase, Clock, DollarSign, Award, MapPin, Globe, Github, Linkedin, Twitter, TrendingUp, Shield, Plus, MessageCircle, Users, CheckCircle, AlertCircle, Eye, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { showWorklyToast } from '../components/WorklyToast'
import Head from 'next/head'

interface PortfolioProject {
  id: string
  title: string
  description: string
  category: string
  technologies: string[]
  image?: string
  liveUrl?: string
  githubUrl?: string
  createdAt: string
}

interface UserProfile {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  bio?: string
  skills: string[]
  hourlyRate?: number
  location?: string
  website?: string
  github?: string
  linkedin?: string
  twitter?: string
  avatar?: string
  rating: number
  completedProjects: number
  totalEarnings: number
  joinedAt: string
  verifiedEmail: boolean
  verifiedPhone: boolean
}

interface ProjectStats {
  total: number
  completed: number
  inProgress: number
  rating: number
  totalEarnings: number
}

interface Task {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  reward: {
    amount: number
    token: string
  }
  deadline: string
  createdAt: string
  applicationCount?: number
  isUrgent?: boolean
  tags?: string[]
}

interface AcceptedTask {
  id: string
  title: string
  description: string
  status: 'accepted' | 'in_progress' | 'completed'
  reward: {
    amount: number
    token: string
  }
  deadline: string
  createdAt: string
  clientName: string
  clientId: string
  taskId: string
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [createdTasks, setCreatedTasks] = useState<Task[]>([])
  const [acceptedTasks, setAcceptedTasks] = useState<AcceptedTask[]>([])
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({})
  const [newSkill, setNewSkill] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'created-tasks' | 'accepted-tasks' | 'portfolio'>('overview')
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([])
  const [showAddProject, setShowAddProject] = useState(false)
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null)
  const [savingProject, setSavingProject] = useState(false)
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    category: '',
    technologies: [] as string[],
    image: '',
    liveUrl: '',
    githubUrl: ''
  })
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  const categories = [
    'Web Development',
    'Mobile App',
    'UI/UX Design',
    'Graphic Design',
    'Content Writing',
    'Data Analysis',
    'Marketing',
    'Blockchain',
    'AI/Machine Learning',
    'DevOps',
    'Other'
  ]

  const [newTechnology, setNewTechnology] = useState('')

  useEffect(() => {
    if (user) {
      loadProfile()
      loadStats()
      loadCreatedTasks()
      loadAcceptedTasks()
      loadPortfolioProjects()
    }
  }, [user])

  useEffect(() => {
    if (editingProject) {
      setProjectForm({
        title: editingProject.title,
        description: editingProject.description,
        category: editingProject.category,
        technologies: editingProject.technologies,
        image: editingProject.image || '',
        liveUrl: editingProject.liveUrl || '',
        githubUrl: editingProject.githubUrl || ''
      })
      setShowAddProject(true)
    }
  }, [editingProject])


  const loadProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setEditForm(data.profile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadStats = async () => {
    try {
      // Используем существующий API tasks для подсчета статистики
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const userTasks = data.tasks.filter(task => task.createdBy === user?.id)
        const acceptedTasks = data.tasks.filter(task =>
          task.assignedTo === user?.id ||
          task.applications?.some(app => app.applicantId === user?.id && app.status === 'accepted')
        )

        // Подсчитываем статистику
        const stats = {
          total: acceptedTasks.length,
          completed: acceptedTasks.filter(task => task.status === 'completed').length,
          inProgress: acceptedTasks.filter(task => task.status === 'in_progress').length,
          rating: profile?.rating || 0,
          totalEarnings: acceptedTasks
            .filter(task => task.status === 'completed')
            .reduce((sum, task) => sum + (task.reward?.amount || 0), 0)
        }

        setStats(stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadCreatedTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Фильтруем только задания текущего пользователя
        const userTasks = data.tasks.filter(task => task.createdBy === user?.id)
        setCreatedTasks(userTasks)
      }
    } catch (error) {
      console.error('Error loading created tasks:', error)
    }
  }

  const loadAcceptedTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Фильтруем задания где пользователь исполнитель
        const acceptedTasks = data.tasks.filter(task =>
          task.assignedTo === user?.id ||
          task.applications?.some(app => app.applicantId === user?.id && app.status === 'accepted')
        )
        setAcceptedTasks(acceptedTasks)
      }
    } catch (error) {
      console.error('Error loading accepted tasks:', error)
    }
  }
  const loadPortfolioProjects = async () => {
    try {
      const response = await fetch('/api/portfolio', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPortfolioProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error loading portfolio projects:', error)
    }
  }

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProject(true)

    try {
      const url = editingProject ? `/api/portfolio/${editingProject.id}` : '/api/portfolio'
      const method = editingProject ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectForm)
      })

      if (response.ok) {
        await loadPortfolioProjects()
        setShowAddProject(false)
        setEditingProject(null)
        setProjectForm({
          title: '',
          description: '',
          category: '',
          technologies: [],
          image: '',
          liveUrl: '',
          githubUrl: ''
        })
      } else {
        showWorklyToast('Failed to save project')
      }
    } catch (error) {
      console.error('Error saving project:', error)
      showWorklyToast('Failed to save project')
    } finally {
      setSavingProject(false)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const response = await fetch(`/api/portfolio/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        await loadPortfolioProjects()
      } else {
        showWorklyToast('Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      showWorklyToast('Failed to delete project')
    }
  }

  const addTechnology = () => {
    if (newTechnology.trim() && !projectForm.technologies.includes(newTechnology.trim())) {
      setProjectForm(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTechnology.trim()]
      }))
      setNewTechnology('')
    }
  }

  const removeTechnology = (techToRemove: string) => {
    setProjectForm(prev => ({
      ...prev,
      technologies: prev.technologies.filter(tech => tech !== techToRemove)
    }))
  }
  const saveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setEditing(false)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && editForm.skills && !editForm.skills.includes(newSkill.trim())) {
      setEditForm(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove) || []
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-green-500/20 text-green-400 border-green-500/30',
      in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
      accepted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
    return colors[status as keyof typeof colors] || colors.open
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <span className="text-white">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26]">
        <div className="text-white">Please log in to view your profile</div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26]">
      <Head>
        <title>Workly - Profile</title>
        <link rel="icon" href="/workly.png" sizes="64x64" type="image/png" />
        <meta name="description" content="Web3 platform for tasks with payment in Solana. Post simple tasks and get them done quickly, with payments guaranteed by smart contracts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ProfileWidget />

      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">

          {/* Enhanced Header with Cover */}
          <div className="relative mb-8">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-t-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

              {/* Cover Edit Button */}
              <button className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-lg backdrop-blur-sm transition-colors">
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Profile Card */}
            <div className="bg-gradient-to-br from-[#1a1d2e] to-[#16192a] rounded-b-2xl border border-white/10 p-8 relative">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">

                {/* Avatar and Basic Info */}
                <div className="flex items-end gap-6">
                  {/* Large Avatar */}
                  <div className="relative -mt-20 group">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl border-4 border-[#1a1d2e]">
                      {profile.firstName?.[0] || profile.username[0]}
                    </div>
                    <button className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </button>

                    {/* Online Status */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-[#1a1d2e] flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {/* Name and Rating */}
                  <div className="pb-4">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {profile.firstName && profile.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : profile.username
                      }
                    </h1>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < Math.floor(profile.rating) ? 'text-yellow-400 fill-current' : 'text-gray-500'}`}
                          />
                        ))}
                        <span className="text-white/60 ml-2 font-medium">({profile.rating.toFixed(1)})</span>
                      </div>

                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium border border-green-500/30">
                        Available
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {profile.location || 'Location not set'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Joined {formatDate(profile.joinedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditing(!editing)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium ${editing
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30'
                      }`}
                  >
                    {editing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                    {editing ? 'Cancel' : 'Edit Profile'}
                  </button>

                  <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all font-medium shadow-lg">
                    <Shield className="w-5 h-5" />
                    Verify Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Briefcase },
              { id: 'created-tasks', label: 'My Tasks', icon: Plus, count: createdTasks.length },
              { id: 'accepted-tasks', label: 'Working On', icon: CheckCircle, count: acceptedTasks.length },
              { id: 'portfolio', label: 'Portfolio', icon: Award }
            ].map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all font-medium flex-shrink-0 justify-center ${activeTab === id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {label}
                {count !== undefined && count > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${activeTab === id
                    ? 'bg-white/20 text-white'
                    : 'bg-purple-500/20 text-purple-400'
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              {activeTab === 'overview' && (
                <>
                  {/* Personal Information */}
                  {editing && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
                    >
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Personal Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/60 text-sm mb-2 font-medium">First Name</label>
                          <input
                            type="text"
                            value={editForm.firstName || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="Enter your first name"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-white/60 text-sm mb-2 font-medium">Last Name</label>
                          <input
                            type="text"
                            value={editForm.lastName || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Enter your last name"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-white/60 text-sm mb-2 font-medium">Location</label>
                          <input
                            type="text"
                            value={editForm.location || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="City, Country"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-white/60 text-sm mb-2 font-medium">Hourly Rate (USD)</label>
                          <input
                            type="number"
                            value={editForm.hourlyRate || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                            placeholder="50"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Bio Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: editing ? 0.1 : 0 }}
                    className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
                  >
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      About Me
                    </h3>

                    {editing ? (
                      <textarea
                        value={editForm.bio || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself, your experience, and what makes you unique..."
                        className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 resize-none"
                      />
                    ) : (
                      <p className="text-white/80 leading-relaxed">
                        {profile.bio || 'No bio provided yet. Click "Edit Profile" to add information about yourself.'}
                      </p>
                    )}
                  </motion.div>

                  {/* Skills Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: editing ? 0.2 : 0.1 }}
                    className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
                  >
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Skills & Expertise
                    </h3>

                    {editing && (
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                          placeholder="Add a skill..."
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={addSkill}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl transition-all font-medium hover:shadow-lg"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {(editing ? editForm.skills : profile.skills)?.map((skill, index) => (
                        <motion.span
                          key={skill}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 rounded-xl text-sm border border-purple-500/30 backdrop-blur-sm ${editing ? 'cursor-pointer hover:from-red-500/20 hover:to-red-500/20 hover:text-red-300 hover:border-red-500/30' : ''
                            }`}
                          onClick={() => editing && removeSkill(skill)}
                        >
                          {skill}
                          {editing && <X className="w-3 h-3 ml-2 inline" />}
                        </motion.span>
                      ))}

                      {(!profile.skills || profile.skills.length === 0) && !editing && (
                        <p className="text-white/60 italic">No skills added yet. Add your expertise to attract more clients!</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Contact & Social */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: editing ? 0.3 : 0.2 }}
                    className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
                  >
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Contact & Social
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editing ? (
                        <>
                          <div>
                            <label className="block text-white/60 text-sm mb-2 font-medium">Website</label>
                            <input
                              type="url"
                              value={editForm.website || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                              placeholder="https://yourwebsite.com"
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-white/60 text-sm mb-2 font-medium">GitHub</label>
                            <input
                              type="text"
                              value={editForm.github || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, github: e.target.value }))}
                              placeholder="username"
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-white/60 text-sm mb-2 font-medium">LinkedIn</label>
                            <input
                              type="text"
                              value={editForm.linkedin || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, linkedin: e.target.value }))}
                              placeholder="username"
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="block text-white/60 text-sm mb-2 font-medium">Twitter</label>
                            <input
                              type="text"
                              value={editForm.twitter || ''}
                              onChange={(e) => setEditForm(prev => ({ ...prev, twitter: e.target.value }))}
                              placeholder="username"
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 flex flex-wrap gap-4">
                          {profile.website && (
                            <a
                              href={profile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 hover:text-purple-300 transition-colors rounded-xl border border-purple-500/30"
                            >
                              <Globe className="w-4 h-4" />
                              Website
                            </a>
                          )}

                          {profile.github && (
                            <a
                              href={`https://github.com/${profile.github}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-400 hover:text-gray-300 transition-colors rounded-xl border border-gray-500/30"
                            >
                              <Github className="w-4 h-4" />
                              GitHub
                            </a>
                          )}

                          {profile.linkedin && (
                            <a
                              href={`https://linkedin.com/in/${profile.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors rounded-xl border border-blue-500/30"
                            >
                              <Linkedin className="w-4 h-4" />
                              LinkedIn
                            </a>
                          )}

                          {profile.twitter && (
                            <a
                              href={`https://twitter.com/${profile.twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-400 hover:text-cyan-300 transition-colors rounded-xl border border-cyan-500/30"
                            >
                              <Twitter className="w-4 h-4" />
                              Twitter
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}

              {/* Created Tasks Tab */}
              {activeTab === 'created-tasks' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Plus className="w-8 h-8 text-purple-400" />
                      My Created Tasks
                    </h3>
                    <Link
                      href="/tasks"
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                    >
                      Create New Task
                    </Link>
                  </div>

                  {createdTasks.length === 0 ? (
                    <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-12 border border-white/10 backdrop-blur-sm text-center">
                      <Plus className="w-20 h-20 text-purple-400 mx-auto mb-6 opacity-50" />
                      <h4 className="text-xl font-semibold text-white mb-3">No tasks created yet</h4>
                      <p className="text-white/60 mb-8">Start by creating your first task to get freelancers working on your projects</p>
                      <Link
                        href="/tasks"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                      >
                        Create Your First Task
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {createdTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all group"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">
                                      {task.title}
                                    </h4>
                                    {task.isUrgent && (
                                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/30">
                                        🔥 URGENT
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-white/70 text-sm line-clamp-2 mb-3">{task.description}</p>

                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {task.tags?.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg border border-blue-500/30"
                                      >
                                        #{tag}
                                      </span>
                                    ))}
                                    {task.tags && task.tags.length > 3 && (
                                      <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-lg">
                                        +{task.tags.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <span className={`px-3 py-1 rounded-xl text-sm font-medium border ${getStatusColor(task.status)}`}>
                                  {task.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>

                              <div className="flex items-center gap-6 text-sm text-white/60">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-400" />
                                  <span className="font-semibold text-green-400">
                                    {task.reward.amount} {task.reward.token}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  <span>{task.applicationCount || 0} applications</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{getTimeLeft(task.deadline)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatDateTime(task.createdAt)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Link
                                href={`/task/${task.id}`}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Link>

                              <Link
                                href={`/applications/${task.id}`}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all"
                              >
                                <Users className="w-4 h-4" />
                                Applications ({task.applicationCount || 0})
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Accepted Tasks Tab */}
              {activeTab === 'accepted-tasks' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                      Tasks I'm Working On
                    </h3>
                    <Link
                      href="/tasks"
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                    >
                      Find More Tasks
                    </Link>
                  </div>

                  {acceptedTasks.length === 0 ? (
                    <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-12 border border-white/10 backdrop-blur-sm text-center">
                      <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6 opacity-50" />
                      <h4 className="text-xl font-semibold text-white mb-3">No active projects</h4>
                      <p className="text-white/60 mb-8">Browse available tasks and start earning by completing projects</p>
                      <Link
                        href="/tasks"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                      >
                        Browse Available Tasks
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {acceptedTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm hover:border-green-500/30 transition-all group"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="text-xl font-semibold text-white group-hover:text-green-300 transition-colors mb-2">
                                    {task.title}
                                  </h4>
                                  <p className="text-white/70 text-sm line-clamp-2 mb-3">{task.description}</p>
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm text-white/60">Client:</span>
                                    <span className="text-sm font-medium text-blue-400">{task.clientName}</span>
                                  </div>
                                </div>

                                <span className={`px-3 py-1 rounded-xl text-sm font-medium border ${getStatusColor(task.status)}`}>
                                  {task.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>

                              <div className="flex items-center gap-6 text-sm text-white/60">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-400" />
                                  <span className="font-semibold text-green-400">
                                    {task.reward.amount} {task.reward.token}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{getTimeLeft(task.deadline)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>Started {formatDateTime(task.createdAt)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Link
                                href={`/task/${task.id}`}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                              >
                                <Eye className="w-4 h-4" />
                                View Task
                              </Link>

                              <Link
                                href={`/chat/${task.id}/${task.createdBy}`}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl transition-all"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Chat with Client
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'portfolio' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Portfolio Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Award className="w-8 h-8 text-purple-400" />
                      My Portfolio
                    </h3>
                    <button
                      onClick={() => setShowAddProject(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5" />
                      Add Project
                    </button>
                  </div>

                  {/* Portfolio Grid */}
                  {portfolioProjects.length === 0 ? (
                    <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-12 border border-white/10 backdrop-blur-sm text-center">
                      <Award className="w-20 h-20 text-purple-400 mx-auto mb-6 opacity-50" />
                      <h4 className="text-xl font-semibold text-white mb-3">No projects yet</h4>
                      <p className="text-white/60 mb-8">Showcase your best work and attract more clients with a stunning portfolio</p>
                      <button
                        onClick={() => setShowAddProject(true)}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all"
                      >
                        Add Your First Project
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {portfolioProjects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden hover:border-purple-500/30 transition-all duration-300"
                        >
                          {/* Project Image */}
                          <div className="relative h-48 bg-gradient-to-br from-purple-600/20 to-blue-600/20 overflow-hidden">
                            {project.image ? (
                              <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-16 h-16 bg-purple-500/30 rounded-2xl flex items-center justify-center">
                                  <Briefcase className="w-8 h-8 text-purple-400" />
                                </div>
                              </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Quick Actions */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <button
                                onClick={() => setEditingProject(project)}
                                className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-colors"
                              >
                                <Edit3 className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => deleteProject(project.id)}
                                className="p-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg backdrop-blur-sm transition-colors"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>

                          {/* Project Info */}
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                                {project.title}
                              </h4>
                              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg border border-blue-500/30">
                                {project.category}
                              </span>
                            </div>

                            <p className="text-white/70 text-sm mb-4 line-clamp-2">
                              {project.description}
                            </p>

                            {/* Technologies */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {project.technologies.slice(0, 3).map((tech) => (
                                <span
                                  key={tech}
                                  className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg"
                                >
                                  {tech}
                                </span>
                              ))}
                              {project.technologies.length > 3 && (
                                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-lg">
                                  +{project.technologies.length - 3}
                                </span>
                              )}
                            </div>

                            {/* Links */}
                            <div className="flex gap-3">
                              {project.liveUrl && (
                                <a
                                  href={project.liveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
                                >
                                  <Globe className="w-4 h-4" />
                                  Live
                                </a>
                              )}
                              {project.githubUrl && (
                                <a
                                  href={project.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg text-sm transition-colors"
                                >
                                  <Github className="w-4 h-4" />
                                  Code
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Add/Edit Project Modal */}
                  {(showAddProject || editingProject) && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-[#1a1d2e] to-[#16192a] rounded-2xl p-8 border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-white">
                            {editingProject ? 'Edit Project' : 'Add New Project'}
                          </h3>
                          <button
                            onClick={() => {
                              setShowAddProject(false)
                              setEditingProject(null)
                              setProjectForm({
                                title: '',
                                description: '',
                                category: '',
                                technologies: [],
                                image: '',
                                liveUrl: '',
                                githubUrl: ''
                              })
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <X className="w-6 h-6 text-white" />
                          </button>
                        </div>

                        <form onSubmit={handleProjectSubmit} className="space-y-6">
                          {/* Title */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                              Project Title *
                            </label>
                            <input
                              type="text"
                              value={projectForm.title}
                              onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="E.g., E-commerce Website Redesign"
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                              required
                            />
                          </div>

                          {/* Category */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                              Category *
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 flex items-center justify-between"
                              >
                                <span className={projectForm.category ? 'text-white' : 'text-white/40'}>
                                  {projectForm.category || 'Select a category'}
                                </span>
                                <svg
                                  className={`w-5 h-5 text-white/60 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {showCategoryDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d2e] border border-white/20 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                                  {categories.map((category) => (
                                    <button
                                      key={category}
                                      type="button"
                                      onClick={() => {
                                        setProjectForm(prev => ({ ...prev, category }))
                                        setShowCategoryDropdown(false)
                                      }}
                                      className="w-full text-left px-4 py-3 text-white hover:bg-purple-600/20 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                    >
                                      {category}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                              Description *
                            </label>
                            <textarea
                              value={projectForm.description}
                              onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Describe your project, challenges solved, and results achieved..."
                              className="w-full h-32 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 resize-none"
                              required
                            />
                          </div>

                          {/* Technologies */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                              Technologies Used
                            </label>
                            <div className="flex gap-2 mb-3">
                              <input
                                type="text"
                                value={newTechnology}
                                onChange={(e) => setNewTechnology(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                                placeholder="Add technology (e.g., React, Node.js)"
                                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                              />
                              <button
                                type="button"
                                onClick={addTechnology}
                                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {projectForm.technologies.map((tech, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm border border-purple-500/30 flex items-center gap-2 cursor-pointer hover:bg-red-500/20 hover:text-red-300 transition-colors"
                                  onClick={() => removeTechnology(tech)}
                                >
                                  {tech}
                                  <X className="w-3 h-3" />
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Image URL */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                              Project Image URL
                            </label>
                            <input
                              type="url"
                              value={projectForm.image}
                              onChange={(e) => setProjectForm(prev => ({ ...prev, image: e.target.value }))}
                              placeholder="https://example.com/project-screenshot.jpg"
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          {/* Live URL */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                              Live Demo URL
                            </label>
                            <input
                              type="url"
                              value={projectForm.liveUrl}
                              onChange={(e) => setProjectForm(prev => ({ ...prev, liveUrl: e.target.value }))}
                              placeholder="https://your-project.com"
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          {/* GitHub URL */}
                          <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                              GitHub Repository URL
                            </label>
                            <input
                              type="url"
                              value={projectForm.githubUrl}
                              onChange={(e) => setProjectForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                              placeholder="https://github.com/username/repository"
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          {/* Submit Buttons */}
                          <div className="flex gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddProject(false)
                                setEditingProject(null)
                                setProjectForm({
                                  title: '',
                                  description: '',
                                  category: '',
                                  technologies: [],
                                  image: '',
                                  liveUrl: '',
                                  githubUrl: ''
                                })
                              }}
                              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={savingProject}
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2"
                            >
                              {savingProject && (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              )}
                              {savingProject ? 'Saving...' : (editingProject ? 'Update Project' : 'Add Project')}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Save Button */}
              {editing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-600/50 disabled:to-emerald-600/50 text-white rounded-xl transition-all font-medium shadow-lg"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {saving ? 'Saving Changes...' : 'Save Changes'}
                  </button>

                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditForm(profile)
                    }}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium"
                  >
                    Cancel Changes
                  </button>
                </motion.div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">

              {/* Stats Cards */}
              {stats && (
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Projects</h4>
                        <p className="text-green-400 text-sm">Completed successfully</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-green-400 mb-2">{stats.completed}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/60">{stats.inProgress} in progress</span>
                      <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                      <span className="text-white/60">{stats.total} total</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Earnings</h4>
                        <p className="text-blue-400 text-sm">Total earned</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-400 mb-2">${stats.totalEarnings.toLocaleString()}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">↗ +12%</span>
                      <span className="text-white/60">vs last month</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl p-6 border border-yellow-500/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Rating</h4>
                        <p className="text-yellow-400 text-sm">Client satisfaction</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-3xl font-bold text-yellow-400">{stats.rating.toFixed(1)}</p>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(stats.rating) ? 'text-yellow-400 fill-current' : 'text-gray-500'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-white/60 text-sm">Based on {stats.completed} reviews</p>
                  </motion.div>
                </div>
              )}

              {/* Quick Stats for Tasks */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
              >
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-400" />
                  Task Overview
                </h4>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Created Tasks</span>
                    <span className="text-purple-400 font-bold">{createdTasks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Working On</span>
                    <span className="text-green-400 font-bold">{acceptedTasks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Open Applications</span>
                    <span className="text-blue-400 font-bold">
                      {createdTasks.filter(t => t.status === 'open').reduce((sum, t) => sum + (t.applicationCount || 0), 0)}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Profile Completion */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm"
              >
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Profile Strength
                </h4>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Completion</span>
                    <span className="text-cyan-400 font-bold">85%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full w-[85%] relative">
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white/60">Profile photo uploaded</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white/60">Bio and skills added</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-white/60">Add portfolio projects</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-white/60">Complete verification</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}