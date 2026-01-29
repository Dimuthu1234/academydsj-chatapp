import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationSettings {
  messageNotifications: boolean
  callNotifications: boolean
  groupNotifications: boolean
  soundEnabled: boolean
  desktopNotifications: boolean
}

interface NotificationState {
  settings: NotificationSettings
  unreadCount: number
  notifications: AppNotification[]
}

export interface AppNotification {
  id: string
  type: 'message' | 'call' | 'group' | 'meeting'
  title: string
  body: string
  timestamp: string
  read: boolean
  data?: {
    chatId?: string
    callId?: string
    groupId?: string
    senderId?: string
  }
}

interface NotificationStore extends NotificationState {
  updateSettings: (settings: Partial<NotificationSettings>) => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  incrementUnread: () => void
  resetUnread: () => void
}

const defaultSettings: NotificationSettings = {
  messageNotifications: true,
  callNotifications: true,
  groupNotifications: true,
  soundEnabled: true,
  desktopNotifications: true,
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      unreadCount: 0,
      notifications: [],

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },

      addNotification: (notification) => {
        const newNotification: AppNotification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
        }

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        }))

        // Show desktop notification if enabled
        const { settings } = get()
        if (settings.desktopNotifications && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/logo.svg',
          })
        }

        // Play sound if enabled
        if (settings.soundEnabled) {
          const audio = new Audio('/notification.mp3')
          audio.volume = 0.5
          audio.play().catch(() => {})
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }))
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 })
      },

      incrementUnread: () => {
        set((state) => ({ unreadCount: state.unreadCount + 1 }))
      },

      resetUnread: () => {
        set({ unreadCount: 0 })
      },
    }),
    {
      name: 'notification-settings',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
)

// Request notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}
