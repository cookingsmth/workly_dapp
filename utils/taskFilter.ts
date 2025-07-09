

export interface Task {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'completed' | 'expired' | 'pending_payment'
  deadline: string
  createdBy: string
  assignedTo?: string
  createdAt: string
  reward: {
    amount: number
    token: string
  }
}


export const getPublicVisibleTasks = (tasks: Task[]): Task[] => {
  const now = new Date()
  
  return tasks.filter(task => {
    if (task.status !== 'open') return false
    
    if (new Date(task.deadline) <= now) return false
    
    if (task.assignedTo) return false
    
    return true
  })
}

export const getAuthorTasks = (tasks: Task[], authorId: string): Task[] => {
  return tasks.filter(task => task.createdBy === authorId)
}

export const getFreelancerTasks = (tasks: Task[], freelancerId: string): Task[] => {
  return tasks.filter(task => task.assignedTo === freelancerId)
}

export const updateExpiredTasks = (tasks: Task[]): Task[] => {
  const now = new Date()
  
  return tasks.map(task => {
    if (task.status === 'open' && new Date(task.deadline) <= now) {
      return {
        ...task,
        status: 'expired' as const
      }
    }
    return task
  })
}

export const getTaskStats = (tasks: Task[], userId?: string) => {
  const userTasks = userId ? tasks.filter(t => t.createdBy === userId) : tasks
  
  return {
    total: userTasks.length,
    open: userTasks.filter(t => t.status === 'open').length,
    inProgress: userTasks.filter(t => t.status === 'in_progress').length,
    completed: userTasks.filter(t => t.status === 'completed').length,
    expired: userTasks.filter(t => t.status === 'expired').length,
    pendingPayment: userTasks.filter(t => t.status === 'pending_payment').length
  }
}