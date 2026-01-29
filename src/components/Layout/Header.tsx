import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, MoreVertical, MessageSquare, Phone, Users, X } from 'lucide-react'
import { Input } from '@/components/Common/Input'
import { useNotificationStore } from '@/stores/notificationStore'
import { formatDistanceToNow } from 'date-fns'

interface HeaderProps {
  title: string
  subtitle?: string
  showSearch?: boolean
  onSearch?: (query: string) => void
  actions?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showSearch = false,
  onSearch,
  actions,
}) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} className="text-accent-primary" />
      case 'call':
      case 'meeting':
        return <Phone size={16} className="text-blue-400" />
      case 'group':
        return <Users size={16} className="text-purple-400" />
      default:
        return <Bell size={16} className="text-text-secondary" />
    }
  }

  return (
    <header className="h-16 bg-bg-secondary border-b border-border-color px-6 flex items-center justify-between drag-region">
      <div className="no-drag">
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-text-secondary">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center space-x-4 no-drag">
        {showSearch && (
          <div className="w-64">
            <Input
              type="text"
              placeholder="Search..."
              leftIcon={<Search size={18} />}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        )}

        {actions}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-border-color rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-border-color flex items-center justify-between">
                <h3 className="font-semibold text-text-primary">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-accent-primary hover:underline"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={clearNotifications}
                        className="text-text-secondary hover:text-red-400"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={32} className="text-text-secondary mx-auto mb-2" />
                    <p className="text-text-secondary text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-3 border-b border-border-color hover:bg-bg-tertiary cursor-pointer transition-colors ${
                        !notification.read ? 'bg-accent-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-bg-tertiary rounded-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary text-sm truncate">
                            {notification.title}
                          </p>
                          <p className="text-text-secondary text-xs truncate">
                            {notification.body}
                          </p>
                          <p className="text-text-secondary text-xs mt-1">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-accent-primary rounded-full flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>
    </header>
  )
}
