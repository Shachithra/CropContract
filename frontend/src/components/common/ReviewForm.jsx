import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import StarRating from './StarRating.jsx'
import Button from './Button.jsx'
import api from '../../lib/api.js'
import { showToast } from './Toast.jsx'

export default function ReviewForm({ revieweeId, revieweeName, contractId, onSuccess }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) {
      showToast(t('review.selectRating'), 'error')
      return
    }
    if (comment.trim().length < 3) {
      showToast(t('review.commentTooShort'), 'error')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/reviews', {
        reviewee_id: revieweeId,
        contract_id: contractId || null,
        rating,
        comment: comment.trim(),
      })
      queryClient.invalidateQueries({ queryKey: ['reviews', revieweeId] })
      queryClient.invalidateQueries({ queryKey: ['reviewStats', revieweeId] })
      showToast(t('review.submitted'), 'success')
      onSuccess?.()
    } catch (err) {
      if (err.response?.status === 409) {
        showToast(t('review.alreadyReviewed'), 'error')
      } else {
        showToast(t('common.error'), 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">
          {t('review.rate')} {revieweeName}
        </p>
        <StarRating value={rating} onChange={setRating} size={28} />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">
          {t('review.yourReview')}
        </label>
        <textarea
          className="input-field mt-1 min-h-[100px] resize-none"
          placeholder={t('review.placeholder')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
        />
        <p className="text-[10px] text-text-muted mt-1 text-right">{comment.length}/500</p>
      </div>

      <Button type="submit" loading={submitting} className="w-full">
        {t('review.submit')}
      </Button>
    </form>
  )
}
