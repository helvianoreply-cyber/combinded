import React from 'react'
import { ReviewSessionCard } from './ReviewSessionCard'
import { type DbUser } from '../lib/database.types'

interface ReviewSessionModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
  userId?: string
  currentProfile?: DbUser | null
  onBonusClaimed?: (updatedProfile: DbUser) => void
}

export const ReviewSessionModal: React.FC<ReviewSessionModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userId,
  currentProfile,
  onBonusClaimed,
}) => {
  if (!isOpen) return null

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="review-modal-close"
          onClick={onClose}
          aria-label="Close review modal"
        >
          ✕
        </button>
        <ReviewSessionCard
          userEmail={userEmail}
          userId={userId}
          currentProfile={currentProfile}
          onBonusClaimed={(profile) => {
            onBonusClaimed?.(profile)
          }}
        />
      </div>
    </div>
  )
}
