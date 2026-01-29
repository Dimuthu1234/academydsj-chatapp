import React from 'react'
import { format } from 'date-fns'
import { Check, CheckCheck, FileIcon, Download } from 'lucide-react'
import { Avatar } from '@/components/Common/Avatar'
import type { Message, User } from '@/types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  sender?: User
  showAvatar?: boolean
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  sender,
  showAvatar = true,
}) => {
  const renderContent = () => {
    switch (message.messageType) {
      case 'image':
        return (
          <div className="max-w-sm">
            <img
              src={message.fileUrl}
              alt="Shared image"
              className="rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        )

      case 'video':
        return (
          <div className="max-w-sm">
            <video
              src={message.fileUrl}
              controls
              className="rounded-lg max-h-64"
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        )

      case 'audio':
        return (
          <div className="min-w-[200px]">
            <audio src={message.fileUrl} controls className="w-full" />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        )

      case 'file':
        return (
          <a
            href={message.fileUrl}
            download={message.fileName}
            className={`flex items-center space-x-3 p-3 rounded-lg ${
              isOwn ? 'bg-accent-secondary/30' : 'bg-bg-secondary'
            } hover:opacity-80 transition-opacity`}
          >
            <FileIcon size={24} className="text-accent-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.fileName || 'File'}
              </p>
              <p className="text-xs text-text-secondary">Click to download</p>
            </div>
            <Download size={18} className="text-text-secondary" />
          </a>
        )

      default:
        return <p className="break-words">{message.content}</p>
    }
  }

  return (
    <div
      className={`flex items-end space-x-2 ${
        isOwn ? 'flex-row-reverse space-x-reverse' : ''
      }`}
    >
      {showAvatar && !isOwn && (
        <Avatar src={sender?.avatarUrl} size="sm" />
      )}
      {showAvatar && isOwn && <div className="w-8" />}

      <div
        className={`max-w-[70%] ${
          isOwn ? 'message-bubble-sent' : 'message-bubble-received'
        } px-4 py-2`}
      >
        {!isOwn && sender && (
          <p className="text-xs text-accent-primary font-medium mb-1">
            {sender.displayName}
          </p>
        )}
        {renderContent()}
        <div
          className={`flex items-center space-x-1 mt-1 ${
            isOwn ? 'justify-end' : 'justify-start'
          }`}
        >
          <span
            className={`text-xs ${
              isOwn ? 'text-bg-primary/70' : 'text-text-secondary'
            }`}
          >
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {isOwn && (
            <span className="text-bg-primary/70">
              {message.readAt ? (
                <CheckCheck size={14} />
              ) : (
                <Check size={14} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
