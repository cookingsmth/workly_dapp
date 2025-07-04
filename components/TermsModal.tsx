import React from 'react'
import { Modal } from './Modal'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Terms of Service" size="lg">
      <div className="space-y-4">
        <p className="text-gray-300">Effective Date: June 1, 2025</p>
        <div className="space-y-4 text-sm text-gray-300">
          <p><strong>1. Acceptance of Terms:</strong> By using Workly, you agree to these terms and our Privacy Policy.</p>
          <p><strong>2. Eligibility:</strong> You must be at least 13 years old.</p>
          <p><strong>3. User Accounts:</strong> You are responsible for your account info and credentials.</p>
          <p><strong>4. Tasks and Rewards:</strong> Users can post tasks, approve work, and pay in crypto (SOL).</p>
          <p><strong>5. Prohibited Conduct:</strong> No spam, scams, fraud, or abuse.</p>
          <p><strong>6. No Guarantees:</strong> We are not liable for missed payments or platform issues.</p>
          <p><strong>7. Termination:</strong> We can terminate access for violations.</p>
          <p><strong>8. Limitation of Liability:</strong> We are not responsible for damages or losses.</p>
          <p><strong>9. Changes:</strong> Terms may change. Continued use = acceptance.</p>
          <p><strong>10. Contact:</strong> Questions? Email us at support@workly-dapp.com</p>
        </div>
      </div>
    </Modal>
  )
}