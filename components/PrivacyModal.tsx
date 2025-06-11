import React from 'react'
import { Modal } from './Modal'

interface PrivacyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy" size="lg">
      <div className="text-sm text-gray-300 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <p>
          We respect your privacy. Any data collected is only used to operate the platform. We do not share your data with third parties, except where required by law.
        </p>
        <p>
          When you register or log in, your username is stored in local storage to personalize your experience. No passwords or sensitive information are stored on-chain or shared externally.
        </p>
        <p>
          All blockchain interactions are handled client-side. You can remove your data at any time by logging out or clearing your local storage.
        </p>
        <p>
          By using Workly, you agree to this policy.
        </p>
      </div>
    </Modal>
  )
}