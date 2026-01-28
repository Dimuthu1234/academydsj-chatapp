import { useCallback, useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { socketService } from '@/services/socket'
import { uploadFile } from '@/services/api'
import type { Message } from '@/types'

export function useChat() {
  const {
    chats,
    activeChat,
    messages,
    typingUsers,
    isLoading,
    setChats,
    addChat,
    setActiveChat,
    addMessage,
    setTyping,
    fetchChats,
    fetchMessages,
    sendMessage,
    createGroup,
    searchUsers,
  } = useChatStore()

  const { user } = useAuthStore()
  const { addNotification, settings } = useNotificationStore()
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const unsubMessage = socketService.onMessage((message: Message) => {
      const chatId = message.groupId || message.senderId
      addMessage(chatId, message)

      // Show notification for messages from others
      if (message.senderId !== user?.id && settings.messageNotifications) {
        const isGroup = !!message.groupId
        addNotification({
          type: isGroup ? 'group' : 'message',
          title: isGroup ? 'New group message' : 'New message',
          body: message.content || 'Sent an attachment',
          data: {
            chatId,
            senderId: message.senderId,
            groupId: message.groupId,
          },
        })
      }
    })

    const unsubTyping = socketService.onTyping(
      (data: { chatId: string; userId: string; isTyping: boolean }) => {
        if (data.userId !== user?.id) {
          setTyping(data.chatId, data.userId, data.isTyping)
        }
      }
    )

    return () => {
      unsubMessage()
      unsubTyping()
    }
  }, [user?.id, addMessage, setTyping])

  useEffect(() => {
    if (activeChat) {
      socketService.joinChat(activeChat.id)
      if (!messages[activeChat.id]) {
        fetchMessages(activeChat.id)
      }
    }

    return () => {
      if (activeChat) {
        socketService.leaveChat(activeChat.id)
      }
    }
  }, [activeChat, messages, fetchMessages])

  const handleSendMessage = useCallback(
    async (content: string, file?: File) => {
      if (!activeChat) return

      let fileUrl: string | undefined
      let fileName: string | undefined
      let messageType: Message['messageType'] = 'text'

      if (file) {
        const result = await uploadFile(file)
        fileUrl = result.url
        fileName = result.fileName

        if (file.type.startsWith('image/')) {
          messageType = 'image'
        } else if (file.type.startsWith('video/')) {
          messageType = 'video'
        } else if (file.type.startsWith('audio/')) {
          messageType = 'audio'
        } else {
          messageType = 'file'
        }
      }

      await sendMessage(activeChat.id, content, messageType, fileUrl, fileName)
    },
    [activeChat, sendMessage]
  )

  const handleTyping = useCallback(() => {
    if (!activeChat) return

    socketService.sendTyping(activeChat.id, true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(activeChat.id, false)
    }, 2000)
  }, [activeChat])

  const currentMessages = activeChat ? messages[activeChat.id] || [] : []
  const currentTypingUsers = activeChat
    ? typingUsers[activeChat.id] || []
    : []

  return {
    chats,
    activeChat,
    messages: currentMessages,
    typingUsers: currentTypingUsers,
    isLoading,
    setChats,
    addChat,
    setActiveChat,
    fetchChats,
    sendMessage: handleSendMessage,
    onTyping: handleTyping,
    createGroup,
    searchUsers,
  }
}
