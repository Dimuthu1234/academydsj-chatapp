import React from 'react'
import { User as UserIcon } from 'lucide-react'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'away' | 'busy'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User',
  size = 'md',
  status,
  className = '',
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  }

  const statusSizes = {
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0 right-0',
    lg: 'w-3 h-3 bottom-0.5 right-0.5',
    xl: 'w-4 h-4 bottom-0.5 right-0.5',
  }

  const statusColors = {
    online: 'bg-accent-primary',
    offline: 'bg-text-secondary',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizes[size]}
          rounded-full overflow-hidden bg-bg-tertiary
          flex items-center justify-center
          ring-2 ring-border-color
        `}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserIcon
            size={iconSizes[size]}
            className="text-text-secondary"
          />
        )}
      </div>
      {status && (
        <span
          className={`
            absolute ${statusSizes[size]} ${statusColors[status]}
            rounded-full ring-2 ring-bg-secondary
          `}
        />
      )}
    </div>
  )
}
