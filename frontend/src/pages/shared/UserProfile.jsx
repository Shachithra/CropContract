import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, MessageSquarePlus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'
import ReviewList from '../../components/common/ReviewList.jsx'
import ReviewForm from '../../components/common/ReviewForm.jsx'
import Sheet from '../../components/common/Sheet.jsx'
import api from '../../lib/api.js'

export default function UserProfile() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [showReviewForm, setShowReviewForm] = useState(false)

  const { data: profileUser, isLoading } = useQuery({
    queryKey: ['userProfile', id],
    queryFn: async () => {
      const { data } = await api.get(`/auth/users/${id}`)
      return data
    },
    enabled: !!id,
  })

  const { data: stats } = useQuery({
    queryKey: ['reviewStats', id],
    queryFn: async () => (await api.get(`/reviews/stats/${id}`)).data,
    enabled: !!id,
  })

  const canReview = currentUser && profileUser &&
    currentUser.role !== profileUser.role &&
    (currentUser.id || currentUser._id) !== id

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-paddy/20 border-t-paddy rounded-full animate-spin" />
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="text-center py-10 space-y-3">
        <p className="text-text-muted text-sm">{t('common.error')}</p>
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-paddy underline">
          {t('common.back')}
        </button>
      </div>
    )
  }

  const cropTypes = profileUser.crop_types
    ? typeof profileUser.crop_types === 'string'
      ? profileUser.crop_types.split(',').map((c) => c.trim()).filter(Boolean)
      : Array.isArray(profileUser.crop_types) ? profileUser.crop_types : []
    : []

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-text-muted hover:text-paddy">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      {/* Profile header */}
      <div className="flex flex-col items-center py-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-3"
        >
          {profileUser.profile_picture ? (
            <img
              src={profileUser.profile_picture}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-4 border-paddy/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-paddy/10 border-4 border-paddy/20 grid place-items-center">
              <span className="text-paddy font-display font-bold text-2xl">{profileUser.name?.[0] || '?'}</span>
            </div>
          )}
        </motion.div>

        <h2 className="font-display text-xl font-bold text-paddy">{profileUser.name}</h2>
        <span className="mt-1.5 inline-block px-3 py-0.5 rounded-full bg-paddy text-white text-xs font-bold tracking-wider">
          {t(`common.${profileUser.role}`) || profileUser.role?.toUpperCase()}
        </span>
        {profileUser.user_id && (
          <p className="mt-1 text-xs text-text-muted font-mono">{profileUser.user_id}</p>
        )}

        {/* Rating summary */}
        {stats && stats.total_reviews > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <Star size={14} className="fill-turmeric text-turmeric" />
            <span className="text-sm font-semibold text-paddy">{stats.avg_rating}</span>
            <span className="text-xs text-text-muted">({stats.total_reviews} {t('review.reviews')})</span>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 space-y-3">
        {profileUser.role === 'farmer' && profileUser.farm_location && (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.farmLocationLabel')}</p>
            <p className="text-sm font-medium text-paddy mt-0.5">{profileUser.farm_location}</p>
          </div>
        )}
        {profileUser.role === 'farmer' && cropTypes.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.cropTypesLabel')}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {cropTypes.map((crop) => (
                <span key={crop} className="px-2.5 py-0.5 rounded-full bg-paddy text-white text-xs font-semibold">{crop}</span>
              ))}
            </div>
          </div>
        )}
        {profileUser.role === 'buyer' && profileUser.company_name && (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('auth.companyName')}</p>
            <p className="text-sm font-medium text-paddy mt-0.5">{profileUser.company_name}</p>
          </div>
        )}
        {profileUser.role === 'buyer' && profileUser.delivery_address && (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.deliveryAddress')}</p>
            <p className="text-sm font-medium text-paddy mt-0.5">{profileUser.delivery_address}</p>
          </div>
        )}
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">{t('common.regionLabel')}</p>
          <p className="text-sm font-medium text-paddy mt-0.5">{t(`regions.${profileUser.region}`, { defaultValue: profileUser.region || '—' })}</p>
        </div>
      </div>

      {/* Review button */}
      {canReview && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-turmeric text-turmeric font-display font-bold text-sm hover:bg-turmeric/5 active:scale-[0.98] transition"
        >
          <MessageSquarePlus size={16} />
          {t('review.leaveReview')}
        </button>
      )}

      {/* Reviews section */}
      <div>
        <h3 className="font-display font-bold text-sm text-paddy mb-3">{t('review.reviews')}</h3>
        <ReviewList userId={id} />
      </div>

      {/* Review form sheet */}
      <Sheet open={showReviewForm} onClose={() => setShowReviewForm(false)} title={t('review.leaveReview')}>
        <ReviewForm
          revieweeId={id}
          revieweeName={profileUser.name}
          onSuccess={() => setShowReviewForm(false)}
        />
      </Sheet>
    </div>
  )
}
