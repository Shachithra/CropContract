import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import StarRating from './StarRating.jsx'
import api from '../../lib/api.js'

export default function ReviewList({ userId }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', userId],
    queryFn: async () => (await api.get(`/reviews/user/${userId}`)).data,
    enabled: !!userId,
  })

  const { data: stats } = useQuery({
    queryKey: ['reviewStats', userId],
    queryFn: async () => (await api.get(`/reviews/stats/${userId}`)).data,
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-paddy/20 border-t-paddy rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      {stats && stats.total_reviews > 0 && (
        <div className="flex items-center gap-3 py-3">
          <span className="font-display text-3xl font-bold text-paddy">{stats.avg_rating}</span>
          <div>
            <StarRating value={Math.round(stats.avg_rating)} readonly size={16} />
            <p className="text-xs text-text-muted mt-0.5">
              {t('review.basedOn', { count: stats.total_reviews })}
            </p>
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <p className="text-text-muted text-sm py-4 text-center">{t('review.noReviews')}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-surface-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate(`/user/${r.reviewer_id}`)}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-paddy/10 grid place-items-center">
                    <span className="text-paddy font-display font-bold text-xs">{r.reviewer_name?.[0] || '?'}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-paddy">{r.reviewer_name}</p>
                    <p className="text-[10px] text-text-muted uppercase">{t(`common.${r.reviewer_role}`)}</p>
                  </div>
                </button>
                <StarRating value={r.rating} readonly size={14} />
              </div>
              <p className="text-sm text-text leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
