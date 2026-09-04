import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, readonly = false, size = 20 }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = readonly ? star <= value : star <= (hovered || value)
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition`}
          >
            <Star
              size={size}
              className={filled ? 'fill-turmeric text-turmeric' : 'text-surface-border'}
            />
          </button>
        )
      })}
    </div>
  )
}
