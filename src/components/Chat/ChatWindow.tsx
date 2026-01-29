import React, { useEffect, useRef } from 'react'
import { Phone, Video, MoreVertical, Users, ArrowLeft } from 'lucide-react'
import { Avatar } from '@/components/Common/Avatar'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import type { Chat, Message, User } from '@/types'

interface ChatWindowProps {
  chat: Chat
  messages: Message[]
  currentUser: User
  typingUsers: string[]
  onSendMessage: (content: string, file?: File) => void
  onTyping: () => void
  onVideoCall: () => void
  onAudioCall: () => void
  onBack?: () => void
  showBackButton?: boolean
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  messages,
  currentUser,
  typingUsers,
  onSendMessage,
  onTyping,
  onVideoCall,
  onAudioCall,
  onBack,
  showBackButton = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getChatName = () => {
    if (chat.type === 'group') {
      return chat.group?.name || 'Group'
    }
    return chat.participant?.displayName || 'User'
  }

  const getChatSubtitle = () => {
    if (chat.type === 'group') {
      const memberCount = chat.group?.members.length || 0
      return `${memberCount} members`
    }
    return chat.participant?.status || 'offline'
  }

  const getChatAvatar = () => {
    if (chat.type === 'group') {
      return chat.group?.avatarUrl
    }
    return chat.participant?.avatarUrl
  }

  const getChatStatus = () => {
    if (chat.type === 'direct') {
      return chat.participant?.status
    }
    return undefined
  }

  const getSenderForMessage = (message: Message): User | undefined => {
    if (message.senderId === currentUser.id) return currentUser
    if (chat.type === 'direct') return chat.participant
    return chat.group?.members.find((m) => m.userId === message.senderId)?.user
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="h-16 px-4 md:px-6 bg-bg-secondary border-b border-border-color flex items-center justify-between safe-area-top">
        <div className="flex items-center space-x-2 md:space-x-3">
          {showBackButton && (
            <button
              onClick={onBack}
              className="md:hidden p-2 -ml-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={22} />
            </button>
          )}
          <Avatar
            src={getChatAvatar()}
            status={getChatStatus()}
            size="md"
          />
          <div>
            <h2 className="font-semibold text-text-primary">{getChatName()}</h2>
            <p className="text-sm text-text-secondary capitalize">
              {typingUsers.length > 0 ? (
                <span className="text-accent-primary">
                  {typingUsers.length === 1
                    ? 'typing...'
                    : `${typingUsers.length} people typing...`}
                </span>
              ) : (
                getChatSubtitle()
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onAudioCall}
            className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-accent-primary transition-colors"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={onVideoCall}
            className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-accent-primary transition-colors"
          >
            <Video size={20} />
          </button>
          {chat.type === 'group' && (
            <button className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
              <Users size={20} />
            </button>
          )}
          <button className="p-2 rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-bg-primary scroll-touch">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
              <Avatar src={getChatAvatar()} size="lg" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              {getChatName()}
            </h3>
            <p className="text-text-secondary">
              Start a conversation by sending a message
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === currentUser.id
            const sender = getSenderForMessage(message)
            const prevMessage = messages[index - 1]
            const showAvatar =
              !prevMessage || prevMessage.senderId !== message.senderId

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                sender={sender}
                showAvatar={showAvatar}
              />
            )
          })
        )}

        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2">
            <Avatar size="sm" />
            <div className="bg-bg-tertiary rounded-xl px-4 py-2">
              <div className="flex space-x-1">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={onTyping}
      />
    </div>
  )
}
