import React from 'react'
import { format } from 'date-fns'
import { Avatar } from '@/components/Common/Avatar'
import type { Chat } from '@/types'

interface ChatListProps {
  chats: Chat[]
  activeChat: Chat | null
  onSelectChat: (chat: Chat) => void
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChat,
  onSelectChat,
}) => {
  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.group?.name || 'Group'
    }
    return chat.participant?.displayName || 'User'
  }

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.group?.avatarUrl
    }
    return chat.participant?.avatarUrl
  }

  const getChatStatus = (chat: Chat) => {
    if (chat.type === 'direct') {
      return chat.participant?.status
    }
    return undefined
  }

  const getLastMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return 'No messages yet'
    const { content, messageType } = chat.lastMessage
    if (messageType === 'image') return 'Sent an image'
    if (messageType === 'file') return 'Sent a file'
    if (messageType === 'video') return 'Sent a video'
    if (messageType === 'audio') return 'Sent an audio'
    return content.length > 40 ? `${content.slice(0, 40)}...` : content
  }

  const getLastMessageTime = (chat: Chat) => {
    if (!chat.lastMessage) return ''
    const date = new Date(chat.lastMessage.createdAt)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    return isToday ? format(date, 'HH:mm') : format(date, 'MMM d')
  }

  return (
    <div className="w-full md:w-80 bg-bg-secondary border-r border-border-color h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-4 hidden md:block">
          Messages
        </h2>
        <div className="space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={`
                w-full p-3 rounded-xl flex items-start space-x-3
                transition-all duration-200 text-left
                ${
                  activeChat?.id === chat.id
                    ? 'bg-accent-primary/10 border border-accent-primary/30'
                    : 'hover:bg-bg-tertiary'
                }
              `}
            >
              <Avatar
                src={getChatAvatar(chat)}
                status={getChatStatus(chat)}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-medium truncate ${
                      activeChat?.id === chat.id
                        ? 'text-accent-primary'
                        : 'text-text-primary'
                    }`}
                  >
                    {getChatName(chat)}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {getLastMessageTime(chat)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-secondary truncate">
                    {getLastMessagePreview(chat)}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-accent-primary text-bg-primary text-xs font-medium rounded-full">
                      {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {chats.length === 0 && (
            <div className="text-center py-8 text-text-secondary">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">
                Start chatting by searching for users
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
