import { Modal } from './Modal'
interface HowItWorksModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const steps = [
    { step: 1, text: "Post a task with crypto reward" },
    { step: 2, text: "Worker completes task and submits proof" },
    { step: 3, text: "You approve and payment is released" }
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          How It Works
        </h2>
      </div>
      
      <div className="space-y-4">
        {steps.map((item, index) => (
          <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {item.step}
            </div>
            <span className="text-gray-200">{item.text}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}