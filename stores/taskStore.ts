import { create } from 'zustand'
import { Task, TaskApplication, TaskFilter, TaskSort, CreateTaskData, TaskStatus } from '../types/task'

interface TaskStore {
  tasks: Task[]
  applications: TaskApplication[]
  loading: boolean
  error: string | null
  
  filters: TaskFilter
  sort: TaskSort
  
  fetchTasks: () => Promise<void>
  createTask: (data: CreateTaskData) => Promise<Task | null>
  fetchTaskById: (id: string) => Promise<Task | null>
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>
  deleteTask: (id: string) => Promise<boolean>
  
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTaskLocal: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
  
  applyToTask: (taskId: string, application: Omit<TaskApplication, 'id' | 'createdAt'>) => void
  getTaskApplications: (taskId: string) => TaskApplication[]
  
  setFilters: (filters: Partial<TaskFilter>) => void
  setSort: (sort: TaskSort) => void
  getFilteredTasks: () => Task[]
  
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem('token')
}

const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = getToken()
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })
  
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    console.error('API returned non-JSON response:', text.substring(0, 200))
    throw new Error(`API endpoint returned HTML instead of JSON. Check if ${url} exists.`)
  }
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'API request failed')
  }
  
  return data
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  applications: [],
  loading: false,
  error: null,
  
  filters: {},
  sort: { field: 'createdAt', direction: 'desc' },
  
  fetchTasks: async () => {
    if (typeof window === 'undefined') return
    
    set({ loading: true, error: null })
    
    try {
      const data = await apiRequest('/api/tasks')
      set({ tasks: data.tasks, loading: false })
    } catch (error) {
      console.error('Fetch tasks error:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        loading: false 
      })
    }
  },
  
  createTask: async (taskData: CreateTaskData) => {
    if (typeof window === 'undefined') return null
    
    set({ loading: true, error: null })
    
    try {
      const data = await apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      })
      
      const newTask = data.task
      
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        loading: false
      }))
      
      return newTask
    } catch (error) {
      console.error('Create task error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task'
      set({ error: errorMessage, loading: false })
      return null
    }
  },
  
  fetchTaskById: async (id: string) => {
    if (typeof window === 'undefined') return null
    
    set({ loading: true, error: null })
    
    try {
      const data = await apiRequest(`/api/tasks/${id}`)
      const task = data.task
      
      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? task : t),
        loading: false
      }))
      
      return task
    } catch (error) {
      console.error('Fetch task error:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch task',
        loading: false 
      })
      return null
    }
  },
  
  updateTask: async (id: string, updates: Partial<Task>) => {
    if (typeof window === 'undefined') return false
    
    set({ loading: true, error: null })
    
    try {
      const data = await apiRequest(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      
      const updatedTask = data.task
      
      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
        loading: false
      }))
      
      return true
    } catch (error) {
      console.error('Update task error:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update task',
        loading: false 
      })
      return false
    }
  },
  
  deleteTask: async (id: string) => {
    if (typeof window === 'undefined') return false
    
    set({ loading: true, error: null })
    
    try {
      await apiRequest(`/api/tasks/${id}`, {
        method: 'DELETE',
      })
      
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id),
        loading: false
      }))
      
      return true
    } catch (error) {
      console.error('Delete task error:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete task',
        loading: false 
      })
      return false
    }
  },
  
  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({ 
    tasks: [task, ...state.tasks] 
  })),
  
  updateTaskLocal: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === id 
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    )
  })),
  
  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  })),
  
  applyToTask: (taskId, applicationData) => {
    const application: TaskApplication = {
      ...applicationData,
      id: Date.now().toString(),
      taskId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    }
    
    set((state) => ({
      applications: [...state.applications, application],
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              applicants: [...task.applicants, applicationData.applicantId],
              applicationCount: (task.applicationCount || 0) + 1
            }
          : task
      )
    }))
  },
  
  getTaskApplications: (taskId) => {
    return get().applications.filter(app => app.taskId === taskId)
  },
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  setSort: (sort) => set({ sort }),
  
  getFilteredTasks: () => {
    const { tasks, filters, sort } = get()
    let filtered = [...tasks]
    
    if (filters.status) {
      const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status]
      filtered = filtered.filter(task => statusArray.includes(task.status))
    }
    
    if (filters.tokens?.length) {
      filtered = filtered.filter(task => filters.tokens!.includes(task.reward.token))
    }
    
    if (filters.minReward !== undefined) {
      filtered = filtered.filter(task => task.reward.amount >= filters.minReward!)
    }
    
    if (filters.maxReward !== undefined) {
      filtered = filtered.filter(task => task.reward.amount <= filters.maxReward!)
    }
    
    if (filters.tags?.length) {
      filtered = filtered.filter(task =>
        task.tags?.some(tag => filters.tags!.includes(tag))
      )
    }
    
    if (filters.isUrgent !== undefined) {
      filtered = filtered.filter(task => task.isUrgent === filters.isUrgent)
    }
    
    if (filters.createdBy) {
      filtered = filtered.filter(task => task.createdBy === filters.createdBy)
    }
    
    if (filters.search) {
      const query = filters.search.toLowerCase()
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sort.field) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'deadline':
          aValue = new Date(a.deadline).getTime()
          bValue = new Date(b.deadline).getTime()
          break
        case 'reward':
          aValue = a.reward.amount
          bValue = b.reward.amount
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'viewCount':
          aValue = a.viewCount || 0
          bValue = b.viewCount || 0
          break
        default:
          return 0
      }
      
      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })
    
    return filtered
  },
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))

export const taskHelpers = {
  canApplyToTask: (task: Task, userId: string): boolean => {
    return (
      task.status === 'open' &&
      task.createdBy !== userId &&
      !task.applicants.includes(userId)
    )
  },
  
  isTaskCreator: (task: Task, userId: string): boolean => {
    return task.createdBy === userId
  },
  
  isTaskAssignee: (task: Task, userId: string): boolean => {
    return task.assignedTo === userId
  },
  
  getStatusColor: (status: TaskStatus): string => {
    const colors = {
      open: 'text-green-400',
      in_progress: 'text-blue-400',
      completed: 'text-purple-400',
      cancelled: 'text-red-400',
      waiting_payment: 'text-yellow-400',
      funded: 'text-amber-400'
    }
    return colors[status] || 'text-gray-400'
  },
  
  getTimeUntilDeadline: (deadline: string): string => {
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
}