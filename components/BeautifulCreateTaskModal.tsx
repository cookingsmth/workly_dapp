// components/BeautifulCreateTaskModal.tsx - ЧАСТЬ 1
import { useState } from 'react'
import { Modal } from './Modal'
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ClockIcon,
  TagIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon as CheckCircleIconSolid,
  FireIcon,
  GlobeAltIcon
} from '@heroicons/react/24/solid'

import { useSolPrice } from '../hooks/useSolPrice'
import { showWorklyToast } from '../components/WorklyToast'

interface CreateTaskData {
  title: string
  description: string | string
  reward: {
    amount: number
    token: 'SOL'
  }
  deadline: string
  requirements?: string[]
  tags?: string[]
  isUrgent?: boolean
}

interface CreateTaskModalProps {
  onClose: () => void
  onCreate: (task: CreateTaskData) => Promise<void>
}

export default function CreateTaskModal({ onClose, onCreate }: CreateTaskModalProps) {
  const [step, setStep] = useState<'basic' | 'details' | 'review' | 'payment' | 'success'>('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [escrowData, setEscrowData] = useState<any>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const { price: solPrice, isLoading: priceLoading } = useSolPrice()
  const [inputValue, setInputValue] = useState('')



  // Form data
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    reward: { amount: 0, token: 'SOL' },
    deadline: '',
    requirements: [],
    tags: [],
    isUrgent: false
  })

  // ДОБАВИТЬ ПОСЛЕ useState:
  const getNumericAmount = (): number => {
    const amount = typeof formData.reward.amount === 'string' ?
      parseFloat(formData.reward.amount) : formData.reward.amount
    return isNaN(amount) ? 0 : amount
  }
  const [newRequirement, setNewRequirement] = useState('')
  const [newTag, setNewTag] = useState('')

  const handleInputChange = (field: keyof CreateTaskData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleRewardChange = (field: 'amount' | 'token', value: number | 'SOL') => {
    setFormData(prev => ({
      ...prev,
      reward: { ...prev.reward, [field]: value }
    }))
    setError(null)
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements?.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...(prev.requirements || []), newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements?.filter((_, i) => i !== index)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index)
    }))
  }

  const validateStep = (currentStep: string): boolean => {
    switch (currentStep) {
      case 'basic':
        if (!formData.title.trim()) {
          setError('Task title is required')
          return false
        }
        if (formData.title.length < 5) {
          setError('Title must be at least 5 characters long')
          return false
        }
        if (!formData.description.trim()) {
          setError('Task description is required')
          return false
        }
        if (formData.description.length < 20) {
          setError('Description must be at least 20 characters long')
          return false
        }
        return true

      case 'details':
        if (!formData.reward.amount || formData.reward.amount < 0.01) {
          setError('Minimum reward is 0.01 SOL')
          return false
        }
        if (!formData.deadline) {
          setError('Deadline is required')
          return false
        }
        const deadlineDate = new Date(formData.deadline)
        const now = new Date()
        if (deadlineDate <= now) {
          setError('Deadline must be in the future')
          return false
        }
        return true

      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateStep(step)) return
    if (step === 'basic') setStep('details')
    else if (step === 'details') setStep('review')
    setError(null)
  }

  const handleBack = () => {
    if (step === 'details') setStep('basic')
    else if (step === 'review') setStep('details')
    else if (step === 'payment') setStep('review')
    setError(null)
  }

  const handleCreateEscrow = async () => {
    if (!validateStep('details')) return
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/escrow/create-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: formData.reward.amount,
          token: 'SOL',
          taskData: {
            title: formData.title,
            description: formData.description,
            deadline: new Date(formData.deadline).toISOString(),
            requirements: formData.requirements?.filter(r => r.trim()) || [],
            tags: formData.tags?.filter(t => t.trim()) || [],
            isUrgent: formData.isUrgent
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create escrow address')
      }

      const result = await response.json()
      setEscrowData(result)
      setStep('payment')

    } catch (err) {
      console.error('Create escrow error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create escrow address')
    } finally {
      setIsSubmitting(false)
    }
  }

  const checkPayment = async () => {
    if (!escrowData?.escrowId) return
    setCheckingPayment(true)
    setError(null)

    try {
      const response = await fetch(`/api/escrow/${escrowData.escrowId}/check-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check payment')
      }

      const result = await response.json()
      if (result.funded) {
        await createTaskAfterPayment()
      } else {
        setError('Payment not detected yet. Please wait a few moments after sending.')
      }
    } catch (err) {
      console.error('Check payment error:', err)
      setError(err instanceof Error ? err.message : 'Failed to check payment')
    } finally {
      setCheckingPayment(false)
    }
  }

  const createTaskAfterPayment = async () => {
    try {
      const response = await fetch('/api/tasks/create-from-escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ escrowId: escrowData.escrowId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const result = await response.json()
      setEscrowData((prev: any)=> ({ ...prev, task: result.task }))
      setStep('success')
    } catch (err) {
      console.error('Create task error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create task')
    }
  }

  const copyEscrowAddress = async () => {
    if (escrowData?.escrowAddress) {
      try {
        await navigator.clipboard.writeText(escrowData.escrowAddress)
        showWorklyToast('🎉 Escrow address copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const handleFinish = () => {
    onClose()
  }


  const handleClose = () => {
    if (isSubmitting || checkingPayment) return
    onClose()
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toISOString().slice(0, 16)
  }

  const getPlatformFee = () => formData.reward.amount * 0.025
  const getNetAmount = () => formData.reward.amount - getPlatformFee()

  const getStepInfo = () => {
    switch (step) {
      case 'basic':
        return {
          title: 'Task Details',
          subtitle: 'Tell us about your project',
          icon: DocumentTextIcon,
          color: 'from-blue-500 to-purple-600'
        }
      case 'details':
        return {
          title: 'Reward & Timeline',
          subtitle: 'Set budget and deadline',
          icon: CurrencyDollarIcon,
          color: 'from-emerald-500 to-blue-600'
        }
      case 'review':
        return {
          title: 'Review & Confirm',
          subtitle: 'Double-check everything',
          icon: EyeIcon,
          color: 'from-purple-500 to-pink-600'
        }
      case 'payment':
        return {
          title: 'Secure Payment',
          subtitle: 'Fund via blockchain escrow',
          icon: CreditCardIcon,
          color: 'from-blue-500 to-cyan-600'
        }
      case 'success':
        return {
          title: 'Task Created!',
          subtitle: 'Your project is now live',
          icon: CheckCircleIconSolid,
          color: 'from-green-500 to-emerald-600'
        }
      default:
        return {
          title: 'Create Task',
          subtitle: '',
          icon: DocumentTextIcon,
          color: 'from-blue-500 to-purple-600'
        }
    }
  }

  const stepInfo = getStepInfo()
  const IconComponent = stepInfo.icon
  const svgBackground =
    "bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%239C92AC&quot; fill-opacity=&quot;0.1&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]";


  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title=""
      size="xl"
      showCloseButton={false}
    >
      <div className="relative min-h-[700px]">
        {/* Custom Header */}
        <div className="relative overflow-hidden">
          {/* Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stepInfo.color} opacity-10`}></div>
          <div className={`absolute inset-0 ${svgBackground} opacity-20`} />

          {/* Header Content */}
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 bg-gradient-to-br ${stepInfo.color} rounded-xl shadow-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{stepInfo.title}</h2>
                  <p className="text-gray-400 text-sm">{stepInfo.subtitle}</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                disabled={isSubmitting || checkingPayment}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {!['payment', 'success'].includes(step) && (
          <div className="px-8 py-8 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/50 to-gray-800/30 backdrop-blur-xl">
            <div className="max-w-2xl mx-auto">
              {/* Step Labels */}
              <div className="flex justify-between items-center mb-8">
                {['basic', 'details', 'review'].map((stepName, index) => {
                  const stepLabels = ['Project Details', 'Budget & Timeline', 'Final Review']
                  const stepDescriptions = ['What & Why', 'How Much & When', 'Double Check']
                  const isActive = step === stepName
                  const isCompleted = ['basic', 'details', 'review'].indexOf(step) > index

                  return (
                    <div key={stepName} className="flex flex-col items-center text-center flex-1">
                      <div className={`text-sm font-semibold mb-1 transition-all duration-500 ${isActive ? 'text-white' :
                        isCompleted ? 'text-emerald-400' : 'text-gray-500'
                        }`}>
                        {stepLabels[index]}
                      </div>
                      <div className={`text-xs transition-all duration-500 ${isActive ? 'text-blue-300' :
                        isCompleted ? 'text-emerald-300' : 'text-gray-600'
                        }`}>
                        {stepDescriptions[index]}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Enhanced Progress Circles & Connectors */}
              <div className="relative flex items-center justify-between">
                {/* Background Line */}
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-1 bg-gray-800 rounded-full">
                    {/* Animated Progress Fill */}
                    <div
                      className={`h-full bg-gradient-to-r transition-all duration-1000 ease-out rounded-full ${step === 'basic' ? 'w-0 from-blue-500 to-purple-500' :
                        step === 'details' ? 'w-1/2 from-blue-500 to-purple-500' :
                          'w-full from-emerald-500 to-blue-500'
                        }`}
                      style={{
                        boxShadow: step !== 'basic' ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Step Circles */}
                {['basic', 'details', 'review'].map((stepName, index) => {
                  const isActive = step === stepName
                  const isCompleted = ['basic', 'details', 'review'].indexOf(step) > index
                  const stepIcons = [
                    // Project Icon
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>,
                    // Money Icon  
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>,
                    // Eye Icon
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ]

                  return (
                    <div key={stepName} className="relative z-10">
                      {/* Outer Glow Ring */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-30 animate-ping"
                          style={{ width: '60px', height: '60px', left: '-6px', top: '-6px' }} />
                      )}

                      {/* Main Circle */}
                      <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-500 transform ${isActive ?
                        'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent text-white shadow-2xl scale-110' :
                        isCompleted ?
                          'bg-gradient-to-br from-emerald-500 to-emerald-600 border-transparent text-white shadow-xl' :
                          'bg-gray-800/80 border-gray-600 text-gray-400 hover:border-gray-500 hover:bg-gray-700/80'
                        }`}>
                        {isCompleted ? (
                          // Checkmark with animation
                          <svg className="w-6 h-6 animate-[checkmark_0.5s_ease-in-out]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          stepIcons[index]
                        )}

                        {/* Active Step Pulse */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse" />
                        )}
                      </div>

                      {/* Step Number Badge */}
                      <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs font-bold transition-all duration-500 ${isActive ?
                        'bg-white text-blue-600' :
                        isCompleted ?
                          'bg-emerald-400 text-emerald-900' :
                          'bg-gray-700 text-gray-400'
                        }`}>
                        {index + 1}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Progress Percentage */}
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 border border-gray-700/50 rounded-full backdrop-blur">
                  <div className={`w-2 h-2 rounded-full transition-all duration-500 ${step === 'basic' ? 'bg-blue-500 animate-pulse' :
                    step === 'details' ? 'bg-purple-500 animate-pulse' :
                      'bg-emerald-500 animate-pulse'
                    }`} />
                  <span className="text-sm font-medium text-gray-300">
                    Step {['basic', 'details', 'review'].indexOf(step) + 1} of 3
                  </span>
                  <span className="text-xs text-gray-500">
                    ({Math.round((((['basic', 'details', 'review'].indexOf(step) + 1) / 3) * 100))}% complete)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-6">
            <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-300 font-medium text-sm">Error</h4>
                <p className="text-red-200 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="px-8 py-8">
          {step === 'basic' && (
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                    <SparklesIcon className="h-4 w-4 text-blue-400" />
                    What's your task about? *
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Design a modern logo for my tech startup"
                      className="w-full p-4 pl-12 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all group-hover:border-gray-600"
                      disabled={isSubmitting}
                      maxLength={100}
                    />
                    <DocumentTextIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">Make it clear and specific to attract the right talent</div>
                    <div className={`text-xs font-mono ${formData.title.length > 90 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {formData.title.length}/100
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                    <AdjustmentsHorizontalIcon className="h-4 w-4 text-purple-400" />
                    Describe your task in detail *
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Explain what you need, your expectations, deliverables, and any specific requirements..."
                      rows={6}
                      className="w-full p-4 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                      disabled={isSubmitting}
                      maxLength={1000}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">Be detailed to attract quality freelancers</div>
                    <div className={`text-xs font-mono ${formData.description.length > 900 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {formData.description.length}/1000
                    </div>
                  </div>
                </div>

                {/* Urgent Toggle */}
                <div className="relative">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl backdrop-blur hover:from-red-500/15 hover:to-orange-500/15 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <FireIcon className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">Mark as Urgent</div>
                        <div className="text-sm text-gray-400">Get priority visibility and faster responses</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInputChange('isUrgent', !formData.isUrgent)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${formData.isUrgent ? 'bg-gradient-to-r from-red-500 to-orange-500 shadow-lg' : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      aria-label="Toggle urgent status"
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${formData.isUrgent ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-8">
              {/* Reward Section */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                    <BanknotesIcon className="h-4 w-4 text-green-400" />
                    How much will you pay? *
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputValue}
                      onChange={(e) => {
                        const val = e.target.value

                        if (/^\d*\.?\d*$/.test(val)) {
                          setInputValue(val)
                          const num = parseFloat(val)
                          handleRewardChange('amount', isNaN(num) ? 0 : num)
                        }
                      }}
                      placeholder="0.00"
                      className="w-full p-4 pl-12 pr-24 bg-gray-900/50 border border-gray-700 rounded-xl text-white text-xl font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all group-hover:border-gray-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [-moz-appearance:textfield]"
                      disabled={isSubmitting}
                    />


                    <CurrencyDollarIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-green-400 transition-colors" />

                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-lg border border-purple-500/30">
                      <img src="/solana.png" alt="SOL" className="h-4 w-4" />
                      <span className="text-purple-300 font-bold text-sm">SOL</span>
                    </div>
                  </div>
                  {formData.reward.amount > 0 && formData.reward.amount < 0.01 && (
                    <div className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      Minimum amount is 0.01 SOL
                    </div>
                  )}
                  {/* Payment Breakdown */}
                  {formData.reward.amount >= 0.01 && (
                    <div className="bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-xl p-6 backdrop-blur">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1 bg-blue-500/20 rounded">
                          <CurrencyDollarIcon className="h-4 w-4 text-blue-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-blue-300">Payment Breakdown</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Total amount:</span>
                          <span className="font-mono font-bold text-white">{formData.reward.amount.toFixed(4)} SOL</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Platform fee (2.5%):</span>
                          <span className="font-mono text-gray-400">-{getPlatformFee().toFixed(4)} SOL</span>
                        </div>
                        <div className="border-t border-gray-600 pt-3 flex justify-between items-center">
                          <span className="text-green-400 font-semibold">Freelancer receives:</span>
                          <span className="font-mono font-bold text-green-400">{getNetAmount().toFixed(4)} SOL</span>
                        </div>
                        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
                          {priceLoading ? (
                            '≈ Loading USD rate...'
                          ) : (
                            `≈ $${(formData.reward.amount * solPrice).toFixed(2)} USD`
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deadline */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                    <CalendarDaysIcon className="h-4 w-4 text-orange-400" />
                    When do you need this completed? *
                  </label>
                  <div className="relative group">
                    <input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                      min={getMinDateTime()}
                      className="w-full p-4 pl-12 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all group-hover:border-gray-600"
                      disabled={isSubmitting}
                    />
                    <ClockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
                  </div>
                  <div className="text-xs text-gray-500">Set a realistic deadline to attract quality freelancers</div>
                </div>

                {/* Requirements */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                    <CheckCircleIcon className="h-4 w-4 text-purple-400" />
                    Requirements (optional)
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newRequirement}
                        onChange={(e) => setNewRequirement(e.target.value)}
                        placeholder="e.g., Must have portfolio in design"
                        className="w-full p-3 pl-10 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                        disabled={isSubmitting}
                      />
                      <CheckCircleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={addRequirement}
                      disabled={isSubmitting || !newRequirement.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-700 disabled:to-gray-800 disabled:opacity-50 rounded-lg text-white font-medium transition-all shadow-lg disabled:shadow-none"
                    >
                      Add
                    </button>
                  </div>
                  {formData.requirements && formData.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.requirements.map((req, index) => (
                        <span key={index} className="inline-flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm border border-purple-500/30 backdrop-blur">
                          <CheckCircleIconSolid className="h-3 w-3" />
                          {req}
                          <button
                            type="button"
                            onClick={() => removeRequirement(index)}
                            className="text-purple-400 hover:text-red-400 transition-colors ml-1"
                            disabled={isSubmitting}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">Add specific skills or experience requirements</div>
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                    <TagIcon className="h-4 w-4 text-blue-400" />
                    Tags (optional)
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="e.g., design, logo, branding"
                        className="w-full p-3 pl-10 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        disabled={isSubmitting}
                      />
                      <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={addTag}
                      disabled={isSubmitting || !newTag.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-700 disabled:to-gray-800 disabled:opacity-50 rounded-lg text-white font-medium transition-all shadow-lg disabled:shadow-none"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30 backdrop-blur">
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="text-blue-400 hover:text-red-400 transition-colors ml-1"
                            disabled={isSubmitting}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">Help freelancers find your task with relevant tags</div>
                </div>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700 rounded-2xl p-8 backdrop-blur">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 pr-6">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-white">{formData.title}</h3>
                      {formData.isUrgent && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-medium shadow-lg">
                          <FireIcon className="h-3 w-3" />
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                      {formData.reward.amount} SOL
                    </div>
                    <div className="text-sm text-gray-400">≈ ${(formData.reward.amount * solPrice).toFixed(2)} USD</div>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-6 mb-6">
                  <p className="text-gray-300 leading-relaxed">{formData.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-700 pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <CalendarDaysIcon className="h-4 w-4" />
                      Deadline
                    </div>
                    <div className="text-white font-semibold">
                      {new Date(formData.deadline).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-400">
                      at {new Date(formData.deadline).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      Payment
                    </div>
                    <div className="text-green-400 font-bold text-lg">{formData.reward.amount} SOL</div>
                    <div className="text-xs text-gray-500">
                      Freelancer receives {getNetAmount().toFixed(4)} SOL after fees
                    </div>
                  </div>
                </div>

                {formData.requirements && formData.requirements.length > 0 && (
                  <div className="border-t border-gray-700 pt-6 mt-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                      <CheckCircleIcon className="h-4 w-4" />
                      Requirements
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.requirements.map((req, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm border border-purple-500/30">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {formData.tags && formData.tags.length > 0 && (
                  <div className="border-t border-gray-700 pt-6 mt-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                      <TagIcon className="h-4 w-4" />
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'payment' && escrowData && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="text-6xl mb-4">💳</div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 blur-3xl opacity-20 animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Secure Blockchain Payment</h3>
                <p className="text-gray-400">Send payment to our smart contract escrow</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-8 backdrop-blur">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                    <CreditCardIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Escrow Payment</h4>
                    <p className="text-gray-400">Your funds are protected until task completion</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-black/30 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                      <ClipboardDocumentIcon className="h-4 w-4" />
                      Escrow Address
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 p-4 bg-gray-900 border border-gray-600 rounded-lg text-blue-400 text-sm font-mono break-all">
                        {escrowData.escrowAddress}
                      </code>
                      <button
                        onClick={copyEscrowAddress}
                        className="flex items-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-lg"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/20 border border-gray-700 rounded-xl p-6 text-center">
                      <div className="text-sm text-gray-400 mb-2">Amount to Send</div>
                      <div className="text-3xl font-bold text-green-400 mb-1">
                        {escrowData.amount} SOL
                      </div>
                      <div className="text-xs text-gray-500">
                        ≈ ${(escrowData.amount * solPrice).toFixed(2)} USD
                      </div>
                    </div>
                    <div className="bg-black/20 border border-gray-700 rounded-xl p-6 text-center">
                      <div className="text-sm text-gray-400 mb-2">Network</div>
                      <div className="text-2xl font-bold text-purple-400 mb-1">
                        Solana
                      </div>
                      <div className="text-xs text-gray-500">Devnet Environment</div>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border-l-4 border-yellow-500 rounded-lg p-6">
                    <div className="flex items-center gap-2 text-yellow-400 mb-3">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="font-semibold">Important Instructions</span>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                        Send exactly <strong>{escrowData.amount} SOL</strong> (no more, no less)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                        Use <strong>Solana Devnet</strong> (not Mainnet)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                        Wait 30-60 seconds after sending
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                        Click "Check Payment" to verify
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 text-blue-300 mb-3">
                      <span className="text-lg">📱</span>
                      <span className="font-semibold">How to send from your wallet:</span>
                    </div>
                    <ol className="text-sm text-gray-300 space-y-2">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        Open your Solana wallet (Phantom, Solflare, etc.)
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        Switch to <strong>Devnet</strong> in wallet settings
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        Send exactly {escrowData.amount} SOL to the address above
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        Return here and click "Check Payment"
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
          {step === 'success' && (
            <div className="space-y-8 text-center relative overflow-hidden">
              {/* Animated Background Effects */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Gradient Orbs */}
                <div className="absolute top-10 left-1/4 w-32 h-32 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-20 blur-3xl animate-pulse" />
                <div className="absolute top-20 right-1/4 w-40 h-40 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-15 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-20 left-1/3 w-28 h-28 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Floating Particles */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-40 animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`,
                      animationDuration: `${3 + Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>

              {/* Main Success Icon with Advanced Animation */}
              <div className="relative z-10">
                <div className="relative inline-block">
                  {/* Outer Ring Animation */}
                  <div className="absolute inset-0 w-32 h-32 border-4 border-green-400/30 rounded-full animate-spin-slow" />
                  <div className="absolute inset-2 w-28 h-28 border-2 border-blue-400/20 rounded-full animate-reverse-spin" />

                  {/* Main Icon Container */}
                  <div className="relative w-32 h-32 bg-gradient-to-br from-green-500 via-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-1000 hover:scale-110">
                    {/* Inner Glow */}
                    <div className="absolute inset-4 bg-gradient-to-br from-white/30 to-transparent rounded-full" />

                    {/* Success Icon */}
                    <svg className="w-16 h-16 text-white relative z-10 animate-[checkmark-success_1s_ease-out_0.5s_both]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>

                    {/* Pulse Rings */}
                    <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full bg-green-400/10 animate-ping" style={{ animationDelay: '0.5s' }} />
                  </div>

                  {/* Celebration Effects */}
                  <div className="absolute -top-8 -left-8 text-4xl animate-bounce" style={{ animationDelay: '1s' }}>🎉</div>
                  <div className="absolute -top-6 -right-8 text-3xl animate-bounce" style={{ animationDelay: '1.5s' }}>✨</div>
                  <div className="absolute -bottom-4 -left-6 text-2xl animate-bounce" style={{ animationDelay: '2s' }}>🚀</div>
                  <div className="absolute -bottom-6 -right-4 text-3xl animate-bounce" style={{ animationDelay: '2.5s' }}>🎊</div>
                </div>
              </div>

              {/* Success Message with Typewriter Effect */}
              <div className="space-y-6 relative z-10">
                <div className="space-y-4">
                  <h3 className="text-5xl font-black bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-[fadeInUp_1s_ease-out_0.3s_both]">
                    Task Created Successfully!
                  </h3>
                  <div className="relative">
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed animate-[fadeInUp_1s_ease-out_0.6s_both]">
                      Your project is now live on the blockchain and accepting applications from
                      <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent font-semibold"> talented freelancers worldwide</span>! 🌍
                    </p>

                    {/* Decorative Underline */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-[expandWidth_1s_ease-out_1s_both]" />
                  </div>
                </div>
              </div>

              {/* Enhanced Task Info Card */}
              {escrowData?.task && (
                <div className="relative z-10 animate-[fadeInUp_1s_ease-out_0.9s_both]">
                  <div className="bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 border border-green-500/30 rounded-3xl p-8 max-w-2xl mx-auto backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    {/* Card Background Effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600" />

                    <div className="relative z-10 space-y-8">
                      {/* Task Header */}
                      <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-2xl backdrop-blur">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="text-green-400 font-semibold">Project Details</span>
                        </div>

                        <h4 className="text-3xl font-bold text-white leading-tight">{escrowData.task.title}</h4>
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                          <span>Task ID:</span>
                          <code className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-mono text-sm border border-blue-500/30">
                            {escrowData.task.id.slice(0, 8)}...{escrowData.task.id.slice(-4)}
                          </code>
                        </div>
                      </div>

                      {/* Status Indicators with Enhanced Design */}
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Funded', icon: '💰', color: 'green', status: 'Secured' },
                          { label: 'Live', icon: '📡', color: 'blue', status: 'Broadcasting' },
                          { label: 'Open', icon: '🚀', color: 'purple', status: 'Accepting' }
                        ].map((item, index) => (
                          <div key={item.label} className={`relative group cursor-pointer animate-[statusPulse_2s_ease-in-out_infinite_${index * 0.5}s]`}>
                            <div className={`bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-600/20 border border-${item.color}-500/30 rounded-2xl p-4 text-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-${item.color}-500/25`}>
                              <div className="text-2xl mb-2">{item.icon}</div>
                              <div className={`text-${item.color}-400 font-bold mb-1`}>{item.label}</div>
                              <div className="text-xs text-gray-400">{item.status}</div>

                              {/* Animated Dot */}
                              <div className={`absolute top-3 right-3 w-3 h-3 bg-${item.color}-400 rounded-full animate-pulse shadow-lg`} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action Status */}
                      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-6 text-center relative overflow-hidden">
                        {/* Background Animation */}
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-blue-400/5 animate-pulse" />

                        <div className="relative z-10 flex items-center justify-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-green-400 font-semibold">Ready for Applications</span>
                          </div>
                          <div className="text-gray-400">•</div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                            <span className="text-blue-400 font-medium">Live on Blockchain</span>
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm mt-3">
                          🎯 Freelancers can now discover and apply to your project!
                        </p>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700/50">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{formData.reward.amount} SOL</div>
                          <div className="text-sm text-gray-400">Project Budget</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {Math.ceil((new Date(formData.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                          </div>
                          <div className="text-sm text-gray-400">Time to Deadline</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced CTA Button */}
              <div className="relative z-10 animate-[fadeInUp_1s_ease-out_1.2s_both]">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="group relative overflow-hidden bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 hover:from-green-600 hover:via-blue-600 hover:to-purple-700 text-white font-bold py-6 px-12 rounded-2xl text-xl transition-all duration-300 shadow-2xl hover:shadow-green-500/25 transform hover:scale-105 hover:-translate-y-1"
                >
                  {/* Button Background Animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <div className="relative flex items-center gap-3">
                    <svg className="w-6 h-6 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View My Task</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>

                {/* Button Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-purple-600 opacity-20 blur-xl rounded-2xl group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>
          )}


          {/* Navigation Buttons */}
          <div className="relative">
            {/* Размытая граница сверху */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent" />

            <div className="relative px-8 py-8">
              <div className="flex gap-4 max-w-2xl mx-auto">
                {step === 'payment' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={checkingPayment}
                      className="flex-1 group relative overflow-hidden flex items-center justify-center gap-2 py-4 px-6 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50 hover:border-gray-500/50 rounded-2xl transition-all duration-300 disabled:opacity-50 font-medium backdrop-blur-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 to-gray-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                      <ArrowLeftIcon className="h-4 w-4 text-gray-300 group-hover:text-white transition-colors relative z-10" />
                      <span className="text-gray-300 group-hover:text-white transition-colors relative z-10">Back to Review</span>
                    </button>

                    <button
                      type="button"
                      onClick={checkPayment}
                      disabled={checkingPayment}
                      className="flex-1 group relative overflow-hidden flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 rounded-2xl transition-all duration-300 disabled:opacity-50 font-semibold shadow-xl hover:shadow-2xl hover:shadow-green-500/25 text-white"
                    >
                      {/* Блик при hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                      <div className="relative z-10 flex items-center gap-2">
                        {checkingPayment ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Checking Payment...
                          </>
                        ) : (
                          <>
                            <CreditCardIcon className="h-4 w-4" />
                            Check Payment
                          </>
                        )}
                      </div>
                    </button>
                  </>
                ) : step === 'success' ? (
                  null
                ) : (
                  <>
                    {step !== 'basic' && (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="flex-1 group relative overflow-hidden flex items-center justify-center gap-2 py-4 px-6 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50 hover:border-gray-500/50 rounded-2xl transition-all duration-300 disabled:opacity-50 font-medium backdrop-blur-sm"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 to-gray-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                        <ArrowLeftIcon className="h-4 w-4 text-gray-300 group-hover:text-white transition-colors relative z-10" />
                        <span className="text-gray-300 group-hover:text-white transition-colors relative z-10">Back</span>
                      </button>
                    )}

                    {step !== 'review' ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="flex-1 group relative overflow-hidden flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 rounded-2xl transition-all duration-300 disabled:opacity-50 font-semibold shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 text-white"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                        <div className="relative z-10 flex items-center gap-2">
                          <span>Continue</span>
                          <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCreateEscrow}
                        disabled={isSubmitting}
                        className="flex-1 group relative overflow-hidden flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 rounded-2xl transition-all duration-300 disabled:opacity-50 font-semibold shadow-xl hover:shadow-2xl hover:shadow-green-500/25 text-white"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

                        <div className="relative z-10 flex items-center gap-2">
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating Escrow...
                            </>
                          ) : (
                            <>
                              <CreditCardIcon className="h-4 w-4" />
                              Create & Fund Task
                            </>
                          )}
                        </div>
                      </button>
                    )}
                  </>
                )}
                
              </div>
            </div>
          </div> 
        </div> 
      </div>
    </Modal>
  )
}