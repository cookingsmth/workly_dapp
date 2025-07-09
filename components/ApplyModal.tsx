// components/ApplyModal.tsx
import { useState } from 'react'
import { Modal } from './Modal'

interface ApplyModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
  taskTitle: string
  taskReward?: {
    amount: number
    token: string
  }
}

interface ApplicationData {
  message: string
  proposedPrice?: number
  estimatedDays?: number
  portfolio?: string
}

export default function ApplyModal({ 
  isOpen, 
  onClose, 
  taskId, 
  taskTitle, 
  taskReward 
}: ApplyModalProps) {
  const [formData, setFormData] = useState<ApplicationData>({
    message: '',
    proposedPrice: taskReward?.amount || 0,
    estimatedDays: 7,
    portfolio: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (field: keyof ApplicationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const validateForm = (): boolean => {
    if (!formData.message.trim()) {
      setError('Message is required')
      return false
    }
    
    if (formData.message.length < 10) {
      setError('Message must be at least 10 characters')
      return false
    }

    if (formData.proposedPrice && formData.proposedPrice <= 0) {
      setError('Proposed price must be positive')
      return false
    }

    if (formData.estimatedDays && formData.estimatedDays <= 0) {
      setError('Estimated days must be positive')
      return false
    }

    if (formData.portfolio && formData.portfolio.trim()) {
      try {
        new URL(formData.portfolio)
      } catch {
        setError('Portfolio must be a valid URL')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('Authentication required')
        return
      }

      const submitData = {
        taskId,
        message: formData.message.trim(),
        ...(formData.proposedPrice && { proposedPrice: formData.proposedPrice }),
        ...(formData.estimatedDays && { estimatedDays: formData.estimatedDays }),
        ...(formData.portfolio?.trim() && { portfolio: formData.portfolio.trim() })
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          window.location.reload()
        }, 2000)
      } else {
        setError(data.message || 'Failed to submit application')
      }

    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Submit application error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Application Submitted!" size="md">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-green-400 mb-2">
            Application Submitted Successfully!
          </h3>
          <p className="text-gray-300 mb-6">
            Your application has been sent to the task creator. 
            You'll be notified when they respond.
          </p>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-300 text-sm">
            ✅ Next steps: Wait for the client to review your application
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={`Apply for: ${taskTitle}`}
      size="lg"
      showCloseButton={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Task Info */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Original Reward:</span>
            <span className="text-green-400 font-semibold">
              {taskReward?.amount || 0} {taskReward?.token || 'USDT'}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Application Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Why should you be chosen for this task? *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="Describe your experience, approach, and why you're the best fit for this task..."
            rows={5}
            className="w-full p-3 bg-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            disabled={isSubmitting}
            maxLength={500}
            required
          />
          <div className="text-xs text-gray-400 mt-1">
            {formData.message.length}/500 characters
          </div>
        </div>

        {/* Proposed Price */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Proposed Price (Optional)
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              value={formData.proposedPrice || ''}
              onChange={(e) => handleInputChange('proposedPrice', parseFloat(e.target.value) || undefined)}
              placeholder={(taskReward?.amount || 0).toString()}
              min="0"
              step="0.01"
              className="flex-1 p-3 bg-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              disabled={isSubmitting}
            />
            <div className="px-4 py-3 bg-white/5 rounded-xl text-gray-400">
              {taskReward?.token || 'USDT'}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Leave empty to accept the original reward
          </div>
        </div>

        {/* Estimated Days */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Estimated Completion Time (Days)
          </label>
          <input
            type="number"
            value={formData.estimatedDays || ''}
            onChange={(e) => handleInputChange('estimatedDays', parseInt(e.target.value) || undefined)}
            placeholder="7"
            min="1"
            max="365"
            className="w-full p-3 bg-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            disabled={isSubmitting}
          />
        </div>

        {/* Portfolio Link */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Portfolio/Previous Work (Optional)
          </label>
          <input
            type="url"
            value={formData.portfolio || ''}
            onChange={(e) => handleInputChange('portfolio', e.target.value)}
            placeholder="https://yourportfolio.com"
            className="w-full p-3 bg-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || !formData.message.trim()}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-blue-500 hover:scale-105 rounded-xl transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {isSubmitting ? 'Submitting...' : '🚀 Submit Application'}
          </button>
        </div>

        {/* Terms */}
        <div className="text-xs text-gray-500 text-center">
          By submitting this application, you agree to our terms of service 
          and commit to delivering quality work within the estimated timeframe.
        </div>
      </form>
    </Modal>
  )
}